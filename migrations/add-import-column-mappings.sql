-- Create table for Excel import column mappings
CREATE TABLE IF NOT EXISTS import_column_mappings (
  id SERIAL PRIMARY KEY,
  import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('live', 'order')),
  field_name VARCHAR(100) NOT NULL,
  column_names TEXT NOT NULL, -- JSON array of possible column names
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(import_type, field_name)
);

