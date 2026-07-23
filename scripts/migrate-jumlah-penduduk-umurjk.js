// Script untuk migrasi data jumlah penduduk menurut kelompok umur dan jenis kelamin
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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

    // Baca file SQL
    const sqlFile = path.join(__dirname, '../database/migrations/insert_jumlah_penduduk_umurjk_clean.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('✓ SQL file loaded');
    console.log('⏳ Executing migration...');

    // Jalankan SQL
    await connection.query(sql);
    
    console.log('✓ Migration completed successfully');
    console.log('');
    console.log('📊 Data summary:');
    console.log('  - Tabel kelompok_umur: 16 kategori umur');
    console.log('  - Tabel jumlah_penduduk_umurjk: Data tahun 2020-2024');
    console.log('  - Total records: 16 kelompok umur × 5 tahun = 80 records');
    console.log('');

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
    console.log('✅ All data migrated successfully!');
    console.log('🌐 Anda dapat melihat data di: http://localhost/phpmyadmin/index.php?route=/sql&pos=0&db=ahc1&table=jumlah_penduduk_umurjk');

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

// Jalankan migrasi
console.log('');
console.log('🚀 Starting migration for Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('');
runMigration();
