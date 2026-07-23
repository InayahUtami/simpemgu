const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../output/nama_sd/nama_sd_all_kecamatan_all_tahun.csv');
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ahc1'
};

let connection;
let kecamatanCache = new Map();
let sekolahCache = new Map();
let stats = { processed: 0, inserted: 0, skipped: 0, errors: 0 };

/**
 * Get or cache kecamatan ID
 */
async function getKecamatanId(nama) {
  if (kecamatanCache.has(nama)){
    return kecamatanCache.get(nama);
  }
  
  try {
    const [rows] = await connection.query(
      'SELECT id FROM kecamatan WHERE nama = ? LIMIT 1',
      [nama]
    );
    
    if (rows.length > 0) {
      kecamatanCache.set(nama, rows[0].id);
      return rows[0].id;
    }
    return null;
  } catch (error) {
    console.error(`❌ Error fetching kecamatan "${nama}": ${error.message}`);
    return null;
  }
}

/**
 * Get or create sekolah ID
 */
async function getOrCreateSekolahId(kecamatanId, nama, status) {
  const key = `${kecamatanId}:${nama}`;
  if (sekolahCache.has(key)) {
    return sekolahCache.get(key);
  }
  
  try {
    // Check if exists
    const [existing] = await connection.query(
      'SELECT id FROM sekolah_dasar WHERE kecamatan_id = ? AND nama_sekolah = ? LIMIT 1',
      [kecamatanId, nama]
    );
    
    if (existing.length > 0) {
      sekolahCache.set(key, existing[0].id);
      return existing[0].id;
    }
    
    // Create new
    const [result] = await connection.query(
      'INSERT INTO sekolah_dasar (kecamatan_id, nama_sekolah, status) VALUES (?, ?, ?)',
      [kecamatanId, nama, status]
    );
    
    sekolahCache.set(key, result.insertId);
    return result.insertId;
  } catch (error) {
    console.error(`❌ Error with sekolah "${nama}": ${error.message}`);
    return null;
  }
}

/**
 * Main import
 */
(async () => {
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected');

    console.log('📖 Reading CSV file...');
    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = fileContent
      .split('\n')
      .slice(1) // Skip header
      .filter(line => line.trim().length > 0)
      .map(line => {
        const parts = line.split(',');
        return {
          kecamatan: parts[0].trim(),
          sekolah: parts[1].trim(),
          tahun: parts[2].trim(),
          status: parts[4].trim(),
          siswa: parseInt(parts[5]) || 0,
          guru: parseInt(parts[6]) || 0,
          rombel: parseInt(parts[7]) || 0
        };
      });

    console.log(`📊 Found ${records.length} records to process`);

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      stats.processed++;

      // Get kecamatan_id
      const kecamatanId = await getKecamatanId(rec.kecamatan);
      if (!kecamatanId) {
        stats.skipped++;
        if (stats.skipped <= 5) console.log(`⏭️  Skipped: kecamatan not found - ${rec.kecamatan}`);
        continue;
      }

      // Get or create sekolah
      const sekolahId = await getOrCreateSekolahId(kecamatanId, rec.sekolah, rec.status);
      if (!sekolahId) {
        stats.errors++;
        continue;
      }

      try {
        // Insert data guru, siswa, rombel in parallel
        await Promise.all([
          connection.query(
            'INSERT INTO data_guru_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_guru) VALUES (?, ?, ?, ?, ?)',
            [sekolahId, kecamatanId, rec.sekolah, rec.tahun, rec.guru]
          ),
          connection.query(
            'INSERT INTO data_siswa_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_siswa) VALUES (?, ?, ?, ?, ?)',
            [sekolahId, kecamatanId, rec.sekolah, rec.tahun, rec.siswa]
          ),
          connection.query(
            'INSERT INTO data_rombel_sekolah (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_rombel) VALUES (?, ?, ?, ?, ?)',
            [sekolahId, kecamatanId, rec.sekolah, rec.tahun, rec.rombel]
          )
        ]);

        stats.inserted++;

        // Progress
        if (i % 500 === 0) {
          console.log(`⏳ Progress: ${i + 1}/${records.length} (${Math.round((i / records.length) * 100)}%)`);
        }
      } catch (error) {
        console.error(`❌ Error inserting row ${i + 1}: ${error.message}`);
        stats.errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total processed: ${stats.processed}`);
    console.log(`Total inserted: ${stats.inserted}`);
    console.log(`Total skipped: ${stats.skipped}`);
    console.log(`Total errors: ${stats.errors}`);
    console.log(`Sekolah masters: ${sekolahCache.size}`);

    // Verify
    console.log('\nVerifying data:');
    const [guru] = await connection.query('SELECT COUNT(*) as cnt FROM data_guru_sekolah');
    const [siswa] = await connection.query('SELECT COUNT(*) as cnt FROM data_siswa_sekolah');
    const [rombel] = await connection.query('SELECT COUNT(*) as cnt FROM data_rombel_sekolah');
    const [sekolah] = await connection.query('SELECT COUNT(*) as cnt FROM sekolah_dasar');

    console.log(`  • sekolah_dasar: ${sekolah[0].cnt}`);
    console.log(`  • data_guru_sekolah: ${guru[0].cnt}`);
    console.log(`  • data_siswa_sekolah: ${siswa[0].cnt}`);
    console.log(`  • data_rombel_sekolah: ${rombel[0].cnt}`);

    await connection.end();
    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
})();
