const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function migrateData() {
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

    // Baca dan eksekusi file SQL perbaikan data
    const sqlFile = path.join(__dirname, '../database/migrations/fix_jumlah_penduduk_umurjk_data.sql');
    const sql = await fs.readFile(sqlFile, 'utf8');
    
    await connection.query(sql);
    console.log('✓ Data diperbaiki successfully');

    // Verifikasi data per tahun
    const [rows] = await connection.execute(`
      SELECT 
        j.tahun,
        COUNT(*) as kelompok,
        SUM(j.laki_laki) as laki_laki,
        SUM(j.perempuan) as perempuan,
        SUM(j.jumlah) as total
      FROM jumlah_penduduk_umurjk j
      GROUP BY j.tahun
      ORDER BY j.tahun
    `);

    console.log('\n📊 Verifikasi Data:');
    console.table(rows);

    // Tampilkan beberapa data sample untuk tahun 2022 dan 2023
    console.log('\n📋 Sample Data Tahun 2022:');
    const [sample2022] = await connection.execute(`
      SELECT ku.nama as kelompok_umur, j.laki_laki, j.perempuan, j.jumlah
      FROM jumlah_penduduk_umurjk j
      JOIN kelompok_umur ku ON j.id_kelompokumur = ku.id
      WHERE j.tahun = 2022
      ORDER BY ku.urutan
      LIMIT 5
    `);
    console.table(sample2022);

    console.log('\n📋 Sample Data Tahun 2023:');
    const [sample2023] = await connection.execute(`
      SELECT ku.nama as kelompok_umur, j.laki_laki, j.perempuan, j.jumlah
      FROM jumlah_penduduk_umurjk j
      JOIN kelompok_umur ku ON j.id_kelompokumur = ku.id
      WHERE j.tahun = 2023
      ORDER BY ku.urutan
      LIMIT 5
    `);
    console.table(sample2023);

    console.log('\n✅ Perbaikan data selesai!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateData();
