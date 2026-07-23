// Script untuk memperbaiki struktur tabel jumlah_penduduk_umurjk
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixTableStructure() {
  let connection;
  
  try {
    // Koneksi ke database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ahc1',
      multipleStatements: true
    });

    console.log('✓ Connected to database ahc1');

    // Baca file SQL untuk recreate table
    const recreateFile = path.join(__dirname, '../database/migrations/recreate_jumlah_penduduk_umurjk.sql');
    const recreateSql = fs.readFileSync(recreateFile, 'utf8');

    console.log('⏳ Recreating table with correct structure...');
    await connection.query(recreateSql);
    console.log('✓ Table recreated successfully');

    // Baca file SQL untuk insert data
    const dataFile = path.join(__dirname, '../database/migrations/insert_jumlah_penduduk_umurjk_data.sql');
    const dataSql = fs.readFileSync(dataFile, 'utf8');

    console.log('⏳ Inserting data...');
    await connection.query(dataSql);
    console.log('✓ Data inserted successfully');

    // Verifikasi data yang telah dimasukkan
    const [rows] = await connection.query(`
      SELECT 
        tahun,
        COUNT(*) as jumlah_kelompok,
        SUM(laki_laki) as total_laki_laki,
        SUM(perempuan) as total_perempuan,
        SUM(jumlah) as total_penduduk
      FROM jumlah_penduduk_umurjk
      GROUP BY tahun
      ORDER BY tahun
    `);

    console.log('');
    console.log('📈 Verifikasi data per tahun:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('Tahun | Kelompok | Laki-laki   | Perempuan   | Total');
    console.log('─────────────────────────────────────────────────────────────────');
    rows.forEach(row => {
      console.log(
        `${row.tahun}  |    ${row.jumlah_kelompok}     | ${row.total_laki_laki.toLocaleString('id-ID').padStart(11)} | ${row.total_perempuan.toLocaleString('id-ID').padStart(11)} | ${row.total_penduduk.toLocaleString('id-ID').padStart(11)}`
      );
    });
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('🌐 Data tersedia di: http://localhost/phpmyadmin/index.php?route=/sql&pos=0&db=ahc1&table=jumlah_penduduk_umurjk');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('');
    console.error('📝 Error details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('');
      console.log('✓ Database connection closed');
    }
  }
}

console.log('');
console.log('🔧 Fixing table structure and migrating data...');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('');
fixTableStructure();
