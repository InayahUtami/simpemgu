// Script untuk menjalankan migrasi database
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

    console.log('✓ Connected to database');

    // Baca file SQL
    const sqlFile = path.join(__dirname, '../database/migrations/create_luas_wilayah_kecamatan_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Jalankan SQL
    await connection.query(sql);
    console.log('✓ Migration completed successfully');
    console.log('✓ Tables created:');
    console.log('  - kecamatan');
    console.log('  - luas_wilayah_kecamatan');
    console.log('✓ Sample data inserted (18 kecamatan di Kota Palembang)');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

runMigration();
