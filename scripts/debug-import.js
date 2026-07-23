const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../output/nama_sd/nama_sd_all_kecamatan_all_tahun.csv');

(async () => {
  try {
    console.log('Step 1: Check CSV file...');
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }
    console.log('✅ CSV file exists');

    console.log('\nStep 2: Connect to database...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ahc1'
    });
    console.log('✅ Connected to database');

    console.log('\nStep 3: Check tables exist...');
    const [tables] = await connection.query('SHOW TABLES LIKE "sekolah%"');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    console.log('\nStep 4: Check kecamatan data...');
    const [kecamatan] = await connection.query('SELECT COUNT(*) as cnt FROM kecamatan');
    console.log(`Total kecamatan: ${kecamatan[0].cnt}`);
    const [kecamatanSample] = await connection.query('SELECT id, nama FROM kecamatan LIMIT 3');
    console.log('Sample:', kecamatanSample);

    console.log('\nStep 5: Read first 5 lines of CSV...');
    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    rl.on('line', (line) => {
      lineCount++;
      if (lineCount <= 5) {
        console.log(`Line ${lineCount}:`, line);
      }
      if (lineCount >= 5) rl.close();
    });

    rl.on('close', async () => {
      console.log('\n✅ All checks passed!');
      await connection.end();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
