import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

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

const MIGRATIONS_ORDER = [
  'create-users-table.sql',
  'add-import-batch-tracking.sql',
  'add-status-column.sql',
  'add-metadata-column.sql',
  'add-display-order-column.sql',
  'add-import-column-mappings.sql',
  'add-display-order-to-import-columns.sql',
  'add-adjustment-movement-type.sql',
];

function runSql(content: string): string[] {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('--') && !line.trim().startsWith('CREATE DATABASE'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function migrate() {
  try {
    console.log('Connecting to database...');

    // 1. Base schema
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Running schema.sql...');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
      for (const statement of runSql(schemaSQL)) {
        await pool.query(statement);
      }
      console.log('✅ schema.sql done');
    }

    // 2. Migrations in order
    const migrationsDir = path.join(process.cwd(), 'migrations');
    for (const name of MIGRATIONS_ORDER) {
      const filePath = path.join(migrationsDir, name);
      if (!fs.existsSync(filePath)) continue;
      console.log(`Running ${name}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      for (const statement of runSql(sql)) {
        if (statement) await pool.query(statement);
      }
      console.log(`✅ ${name} done`);
    }

    console.log('\n✅ All migrations finished.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
