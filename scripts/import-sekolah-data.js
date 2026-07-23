const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');
const path = require('path');

// Configuration
const CSV_FILE = path.join(__dirname, '../output/nama_sd/nama_sd_all_kecamatan_all_tahun.csv');
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ahc1'
};

// Global variables to track progress
let connection;
let kecamatanCache = new Map(); // nama -> id
let sekolahCache = new Map(); // "kecamatan_nama:sekolah_nama" -> id
let rowsProcessed = 0;
let rowsInserted = 0;

// ==============================================================================
// Helper Functions
// ==============================================================================

/**
 * Get or create kecamatan_id
 */
async function getKecamatanId(namaKecamatan) {
  // Check cache first
  if (kecamatanCache.has(namaKecamatan)) {
    return kecamatanCache.get(namaKecamatan);
  }

  // Query database
  try {
    const [rows] = await connection.query(
      'SELECT id FROM kecamatan WHERE nama = ? LIMIT 1',
      [namaKecamatan]
    );
    
    if (rows.length > 0) {
      const id = rows[0].id;
      kecamatanCache.set(namaKecamatan, id);
      return id;
    } else {
      console.warn(`⚠️  Kecamatan not found: ${namaKecamatan}`);
      return null;
    }
  } catch (error) {
    console.error(`Error querying kecamatan: ${error.message}`);
    return null;
  }
}

/**
 * Get or create sekolah_id
 */
async function getOrCreateSekolahId(kecamatanId, namaSekolah, status) {
  const cacheKey = `${kecamatanId}:${namaSekolah}`;
  
  // Check cache first
  if (sekolahCache.has(cacheKey)) {
    return sekolahCache.get(cacheKey);
  }

  // Query database
  try {
    const [rows] = await connection.query(
      'SELECT id FROM sekolah_dasar WHERE kecamatan_id = ? AND nama_sekolah = ? LIMIT 1',
      [kecamatanId, namaSekolah]
    );
    
    if (rows.length > 0) {
      const id = rows[0].id;
      sekolahCache.set(cacheKey, id);
      return id;
    }
    
    // Insert new sekolah if not exists
    const [insertResult] = await connection.query(
      'INSERT INTO sekolah_dasar (kecamatan_id, nama_sekolah, status) VALUES (?, ?, ?)',
      [kecamatanId, namaSekolah, status]
    );
    
    const newId = insertResult.insertId;
    sekolahCache.set(cacheKey, newId);
    return newId;
  } catch (error) {
    console.error(`Error with sekolah: ${error.message}`);
    return null;
  }
}

/**
 * Insert data guru, siswa, rombel
 */
async function insertDataSekolah(sekolahId, kecamatanId, namaSekolah, tahun, jumlahGuru, jumlahSiswa, jumlahRombel) {
  try {
    // Insert guru data
    await connection.query(
      'INSERT INTO data_guru_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_guru) VALUES (?, ?, ?, ?, ?)',
      [sekolahId, kecamatanId, namaSekolah, tahun, jumlahGuru]
    );

    // Insert siswa data
    await connection.query(
      'INSERT INTO data_siswa_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_siswa) VALUES (?, ?, ?, ?, ?)',
      [sekolahId, kecamatanId, namaSekolah, tahun, jumlahSiswa]
    );

    // Insert rombel data
    await connection.query(
      'INSERT INTO data_rombel_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_rombel) VALUES (?, ?, ?, ?, ?)',
      [sekolahId, kecamatanId, namaSekolah, tahun, jumlahRombel]
    );

    rowsInserted++;
  } catch (error) {
    console.error(`Error inserting data: ${error.message}`);
  }
}

/**
 * Parse CSV and import data
 */
async function importCSV() {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(CSV_FILE, { encoding: 'utf-8' });
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isFirstLine = true;
    const dataToInsert = [];

    rl.on('line', (line) => {
      if (isFirstLine) {
        // Skip header
        isFirstLine = false;
        return;
      }

      // Parse CSV line
      const parts = line.split(',');
      if (parts.length < 8) return; // Skip malformed lines

      const namaKecamatan = parts[0].trim();
      const namaSekolah = parts[1].trim();
      const tahun = parts[2].trim();
      const jumlahPenduduk = parseInt(parts[3].trim()) || 0;
      const status = parts[4].trim();
      const jumlahSiswa = parseInt(parts[5].trim()) || 0;
      const jumlahGuru = parseInt(parts[6].trim()) || 0;
      const jumlahRombel = parseInt(parts[7].trim()) || 0;

      dataToInsert.push({
        namaKecamatan,
        namaSekolah,
        tahun,
        status,
        jumlahGuru,
        jumlahSiswa,
        jumlahRombel
      });
    });

    rl.on('end', async () => {
      console.log(`📖 Read ${dataToInsert.length} records from CSV`);
      
      if (dataToInsert.length === 0) {
        console.log('⚠️  No data to insert!');
        await connection.end();
        process.exit(1);
      }
      
      // Process data sequentially
      for (const data of dataToInsert) {
        rowsProcessed++;
        
        try {
          // Get kecamatan_id
          const kecamatanId = await getKecamatanId(data.namaKecamatan);
          if (!kecamatanId) {
            console.log(`⏭️  Skipping: kecamatan not found - ${data.namaKecamatan}`);
            continue;
          }

          // Get or create sekolah_id
          const sekolahId = await getOrCreateSekolahId(kecamatanId, data.namaSekolah, data.status);
          if (!sekolahId) {
            console.log(`⏭️  Skipping: sekolah creation failed - ${data.namaSekolah}`);
            continue;
          }

          // Insert school data
          await insertDataSekolah(
            sekolahId,
            kecamatanId,
            data.namaSekolah,
            data.tahun,
            data.jumlahGuru,
            data.jumlahSiswa,
            data.jumlahRombel
          );

          // Progress indicator
          if (rowsProcessed % 100 === 0) {
            console.log(`⏳ Processed: ${rowsProcessed} rows, Inserted: ${rowsInserted} records`);
          }
        } catch (error) {
          console.error(`Error processing row ${rowsProcessed}: ${error.message}`);
        }
      }

      resolve();
    });

    rl.on('error', (error) => {
      console.error('Error reading CSV file:', error.message);
      reject(error);
    });
  });
}

/**
 * Main execution
 */
(async () => {
  try {
    // Connect to database
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected!');

    // Check CSV file exists
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }
    console.log(`📄 CSV file found: ${CSV_FILE}`);

    // Run import
    console.log(`📥 Starting import from: ${CSV_FILE}`);
    await importCSV();

    // Show results
    console.log('\n' + '='.repeat(50));
    console.log('✅ IMPORT COMPLETE');
    console.log('='.repeat(50));
    console.log(`Total rows read: ${rowsProcessed}`);
    console.log(`Total rows inserted: ${rowsInserted}`);
    console.log(`Total sekolah masters created/reused: ${sekolahCache.size}`);

    // Show summary
    console.log('\nVerifying data in tables...');
    const queries = [
      { table: 'sekolah_dasar', query: 'SELECT COUNT(*) as count FROM sekolah_dasar' },
      { table: 'data_guru_sekolah', query: 'SELECT COUNT(*) as count FROM data_guru_sekolah' },
      { table: 'data_siswa_sekolah', query: 'SELECT COUNT(*) as count FROM data_siswa_sekolah' },
      { table: 'data_rombel_sekolah', query: 'SELECT COUNT(*) as count FROM data_rombel_sekolah' }
    ];

    for (const item of queries) {
      const [rows] = await connection.query(item.query);
      console.log(`  ${item.table}: ${rows[0].count} records`);
    }

    await connection.end();
    console.log('\n✨ All done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore close errors
      }
    }
    process.exit(1);
  }
})();
