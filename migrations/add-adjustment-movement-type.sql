-- Migration: Add 'adjustment' movement type to item_movements table
-- Run this if your database already exists and needs to be updated

-- Drop the existing constraint
ALTER TABLE item_movements 
  DROP CONSTRAINT IF EXISTS item_movements_movement_type_check;

-- Add the new constraint with 'adjustment' included
ALTER TABLE item_movements 
  ADD CONSTRAINT item_movements_movement_type_check 
  CHECK (movement_type IN ('incoming', 'outgoing', 'adjustment'));

