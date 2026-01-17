import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

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

async function addTypeColumn() {
  try {
    console.log('Connecting to database...');
    console.log('Adding type column to order_table...');
    
    // Add type column if it doesn't exist
    await pool.query(`
      ALTER TABLE order_table 
      ADD COLUMN IF NOT EXISTS type INTEGER DEFAULT 1
    `);
    
    console.log('✅ Type column added successfully');
    
    // Set all existing data to type = 1 (live menu)
    const updateResult = await pool.query(`
      UPDATE order_table 
      SET type = 1 
      WHERE type IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} existing records to type = 1`);
    console.log('Migration completed successfully!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    await pool.end();
    process.exit(1);
  }
}

addTypeColumn();

