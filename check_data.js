const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ahc1'
    });

    // Check tables and data
    const tables = [
      'sekolah_dasar',
      'data_guru_sekolah',
      'data_siswa_sekolah',
      'data_rombel_sekolah',
      'kecamatan'
    ];

    for (const table of tables) {
      try {
        const [result] = await conn.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
        console.log(`${table}: ${result[0].cnt} rows`);
      } catch (e) {
        console.log(`${table}: ERROR - ${e.message.split('\n')[0]}`);
      }
    }

    // Test the view
    try {
      const [rows] = await conn.execute('SELECT * FROM view_guru_per_kecamatan limit 5');
      console.log(`\nview_guru_per_kecamatan: ${rows.length} rows`);
      if (rows.length > 0) {
        console.log('Sample:', rows[0]);
      }
    } catch (e) {
      console.log(`view_guru_per_kecamatan: ERROR - ${e.message}`);
    }

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
