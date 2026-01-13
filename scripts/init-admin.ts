import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
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

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function initAdmin() {
  try {
    console.log('Connecting to database...');
    
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      ['99009900']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Admin user already exists');
      await pool.end();
      process.exit(0);
    }

    // Create default admin user
    // Default password: admin
    const hashedPassword = await hashPassword('admin');
    
    await pool.query(
      'INSERT INTO users (phone, password, role) VALUES ($1, $2, $3)',
      ['99009900', hashedPassword, 'admin']
    );

    console.log('✅ Default admin user created successfully!');
    console.log('📱 Phone: 99009900');
    console.log('🔑 Password: admin');
    console.log('\n⚠️  Please change the default password after first login!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

initAdmin();

