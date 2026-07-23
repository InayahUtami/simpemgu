const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '../database/migrations/create_sekolah_tables.sql');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ahc1'
};

/**
 * Execute SQL file
 */
async function executeSQLFile() {
  try {
    // Read SQL file
    if (!fs.existsSync(SQL_FILE)) {
      throw new Error(`SQL file not found: ${SQL_FILE}`);
    }

    const sqlContent = fs.readFileSync(SQL_FILE, 'utf-8');
    
    // Connect to database
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected!');

    // Split and execute statements
    let statements = sqlContent.split(';');
    
    // Filter and clean statements
    statements = statements
      .map(stmt => {
        // Remove leading/trailing whitespace and newlines
        stmt = stmt.trim();
        // Remove SQL comments
        stmt = stmt.replace(/^[\s\S]*?^--.*$/gm, ''); // Remove line comments
        stmt = stmt.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
        return stmt.trim();
      })
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n📋 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip empty statements
      if (!stmt || stmt === '') {
        continue;
      }

      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing...`);
        await connection.query(stmt);
        console.log(`✅ Success`);
        successCount++;
      } catch (error) {
        // Some errors are expected (like "table already exists"), continue
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  ${error.message} (skipped)`);
          successCount++;
        } else if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists (skipped)`);
          successCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
          console.error(`   SQL: ${stmt.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`\n✅ Successfully executed: ${successCount}/${statements.length} statements`);

    await connection.end();
    console.log('\n' + '='.repeat(50));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\nNext step: Run import script');
    console.log('  node scripts/import-sekolah-data.js');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Execute
executeSQLFile();
