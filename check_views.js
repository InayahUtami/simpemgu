const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ahc1'
    });

    // Check for guru views
    const [views] = await conn.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'ahc1' AND TABLE_TYPE = 'VIEW'`
    );

    console.log(`Found ${views.length} total views:`);
    views.forEach(t => console.log('  -', t.TABLE_NAME));

    // Check for required view
    const [guruView] = await conn.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'ahc1' AND TABLE_NAME = 'view_guru_per_kecamatan'`
    );

    if (guruView.length === 0) {
      console.log('\n⚠️  Missing view: view_guru_per_kecamatan');
      
      // Check what tables exist for guru data
      const [tables] = await conn.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = 'ahc1' AND TABLE_NAME LIKE '%guru%'`
      );
      
      console.log('\nGuru-related tables found:');
      tables.forEach(t => console.log('  -', t.TABLE_NAME));
    } else {
      console.log('\n✓ view_guru_per_kecamatan exists');
    }

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
