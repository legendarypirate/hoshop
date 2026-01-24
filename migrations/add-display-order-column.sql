-- Add display_order column to order_table for drag-and-drop ordering
-- This allows users to manually reorder orders in the live page

ALTER TABLE order_table 
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create an index for better performance when sorting by display_order
CREATE INDEX IF NOT EXISTS idx_order_table_display_order ON order_table(display_order) WHERE display_order IS NOT NULL;

