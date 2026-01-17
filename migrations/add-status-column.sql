-- Add status column to order_table if it doesn't exist
-- Status values: 1 = шинэ үүссэн, 2 = ирж авсан, 3 = хүргэлтгэнд гаргасан
ALTER TABLE order_table 
  ADD COLUMN IF NOT EXISTS status INTEGER DEFAULT 1;

-- Update existing orders without status to have default status of 1
UPDATE order_table 
  SET status = 1 
  WHERE status IS NULL;

