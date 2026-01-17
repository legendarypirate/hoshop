-- Migration script to add type column to order_table
-- Run this script to add the type column and set all existing data to type = 1

-- Add type column if it doesn't exist
ALTER TABLE order_table 
  ADD COLUMN IF NOT EXISTS type INTEGER DEFAULT 1;

-- Set all existing data to type = 1 (live menu)
UPDATE order_table 
SET type = 1 
WHERE type IS NULL;

