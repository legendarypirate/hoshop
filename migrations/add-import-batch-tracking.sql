-- Create table to track Excel import batches
CREATE TABLE IF NOT EXISTS import_batches (
  id SERIAL PRIMARY KEY,
  import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('live', 'order')),
  file_name VARCHAR(255),
  total_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Add import_batch_id column to order_table to track which import batch created each order
ALTER TABLE order_table 
  ADD COLUMN IF NOT EXISTS import_batch_id INTEGER REFERENCES import_batches(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_table_import_batch_id ON order_table(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_at ON import_batches(created_at DESC);

