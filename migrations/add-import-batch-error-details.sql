-- Store per-row import errors for display in UI (e.g. /imports drawer)
ALTER TABLE import_batches
  ADD COLUMN IF NOT EXISTS error_details JSONB DEFAULT '[]'::jsonb;
