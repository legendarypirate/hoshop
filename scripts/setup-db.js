const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hos',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read and execute schema.sql
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    
    // Remove comments and CREATE DATABASE statements, then split by semicolons
    const cleanedSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('CREATE DATABASE'))
      .join('\n');
    
    // Split by semicolons and execute each statement
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('✅ All tables created successfully!');
    
    // Verify all tables exist
    const tables = [
      'baraanii_kod', 
      'order_table', 
      'users', 
      'colors', 
      'sizes', 
      'items', 
      'item_movements', 
      'baraanii_kod_options'
    ];
    for (const tableName of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table "${tableName}" verified`);
      } else {
        console.log(`⚠️  Table "${tableName}" not found`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

