-- Create database (run this manually if needed)
-- CREATE DATABASE hos;

-- Create table for барааны код (product code)
CREATE TABLE IF NOT EXISTS baraanii_kod (
  id SERIAL PRIMARY KEY,
  kod VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for orders
CREATE TABLE IF NOT EXISTS order_table (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(50) NOT NULL,
  baraanii_kod_id INTEGER REFERENCES baraanii_kod(id) ON DELETE SET NULL,
  price DECIMAL(10, 2),
  feature TEXT,
  number INTEGER,
  order_date DATE,
  paid_date DATE,
  with_delivery BOOLEAN DEFAULT FALSE,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for users (admin authentication)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for colors
CREATE TABLE IF NOT EXISTS colors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for sizes
CREATE TABLE IF NOT EXISTS sizes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update order_table to include color, size, and received_date
ALTER TABLE order_table 
  ADD COLUMN IF NOT EXISTS color_id INTEGER REFERENCES colors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS size_id INTEGER REFERENCES sizes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_date DATE;

-- Create table for items (бараа) - tracks inventory balances
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  baraanii_kod_id INTEGER NOT NULL REFERENCES baraanii_kod(id) ON DELETE CASCADE,
  color_id INTEGER REFERENCES colors(id) ON DELETE SET NULL,
  size_id INTEGER REFERENCES sizes(id) ON DELETE SET NULL,
  initial_balance INTEGER DEFAULT 0,
  final_balance INTEGER DEFAULT 0,
  info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(baraanii_kod_id, color_id, size_id)
);

-- Create table for item movements (барааны хөдөлгөөн)
CREATE TABLE IF NOT EXISTS item_movements (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('incoming', 'outgoing', 'adjustment')),
  quantity INTEGER NOT NULL,
  action_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

