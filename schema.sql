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

