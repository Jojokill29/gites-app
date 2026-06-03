-- Step 8: Finances refactor
-- - Add adult_count and tax_amount columns to reservations
-- - Drop tax_entries table (taxes are now per-reservation)
-- - Seed 3rd gite "Annexe" (capacity 7)

ALTER TABLE reservations
  ADD COLUMN adult_count INTEGER NULL CHECK (adult_count IS NULL OR adult_count >= 0);

ALTER TABLE reservations
  ADD COLUMN tax_amount NUMERIC(10,2) NULL CHECK (tax_amount IS NULL OR tax_amount >= 0);

DROP TABLE tax_entries;

INSERT INTO gites (name, capacity, display_order)
  VALUES ('Annexe', 7, 3);
