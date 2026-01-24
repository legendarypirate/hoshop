-- Add metadata JSONB column to order_table for storing import metadata
-- This stores temporary/display-only data like toollogo (Тооллого) and numeric with_delivery values

ALTER TABLE order_table 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create an index for better performance when querying metadata
CREATE INDEX IF NOT EXISTS idx_order_table_metadata ON order_table USING GIN (metadata);

