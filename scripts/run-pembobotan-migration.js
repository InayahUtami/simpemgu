const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '../database/migrations/create_pembobotan_ahp.sql');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ahc1'
};

async function executeSQLFile() {
  try {
    if (!fs.existsSync(SQL_FILE)) {
      throw new Error('SQL file not found: ' + SQL_FILE);
    }
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf-8');
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected!');
    let statements = sqlContent.split(';');
    statements = statements
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    console.log('Found ' + statements.length + ' SQL statements to execute');
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log('[' + (i + 1) + '/' + statements.length + '] Executing...');
        await connection.query(stmt);
        console.log('Success');
        successCount++;
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
          console.log('Already exists (skipped)');
          successCount++;
        } else {
          console.error('Error: ' + error.message);
        }
      }
    }
    console.log('Migration completed. ' + successCount + ' statements processed.');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
executeSQLFile();
