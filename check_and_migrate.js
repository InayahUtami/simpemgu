const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ahc1'
    });

    // Check for missing tables
    const [tables] = await conn.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'ahc1' 
       AND TABLE_NAME IN ('luas_wilayah_kecamatan', 'jumlah_penduduk_disdukcapil')`
    );

    console.log(`Found ${tables.length} of 2 required tables`);
    tables.forEach(t => console.log('  ✓', t.TABLE_NAME));

    if (tables.length < 2) {
      console.log('\nLoading ahc1.sql...');
      const sql = fs.readFileSync('database/ahc1.sql', 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('/*'));
      
      let executed = 0;
      for (const stmt of statements) {
        try {
          await conn.query(stmt);
          executed++;
        } catch (e) {
          if (!e.message.includes('already exists') && !e.message.includes('Duplicate')) {
            console.log('Error:', e.message.substring(0, 80));
          }
        }
      }
      
      console.log(`Executed ${executed} statements`);
      
      // Check again
      const [tables2] = await conn.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = 'ahc1' 
         AND TABLE_NAME IN ('luas_wilayah_kecamatan', 'jumlah_penduduk_disdukcapil')`
      );
      
      console.log(`Now have ${tables2.length} of 2 required tables`);
      tables2.forEach(t => console.log('  ✓', t.TABLE_NAME));
    }

    await conn.end();
    console.log('\n✓ Database check complete');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
