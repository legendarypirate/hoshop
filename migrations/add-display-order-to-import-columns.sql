-- Add display_order column to import_column_mappings for drag-and-drop ordering
-- This allows users to manually reorder column mappings in the settings page

ALTER TABLE import_column_mappings 
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create an index for better performance when sorting by display_order
CREATE INDEX IF NOT EXISTS idx_import_column_mappings_display_order 
  ON import_column_mappings(import_type, display_order) 
  WHERE display_order IS NOT NULL;

