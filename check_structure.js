const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    // Check jumlah_penduduk structure
    const [pendudukStructure] = await connection.query('DESC ahc1.jumlah_penduduk');
    console.log('=== STRUCTURE jumlah_penduduk ===');
    console.log(pendudukStructure);

    // Show all tables
    const [allTables] = await connection.query('SHOW TABLES FROM ahc1');
    console.log('\n=== ALL TABLES IN ahc1 ===');
    console.log(allTables);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
