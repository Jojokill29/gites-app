-- Rename gite labels in finance tables to match official names

-- Update existing data
UPDATE revenue_entries SET gite_label = 'Le Vallon' WHERE gite_label = 'Petit gite';
UPDATE revenue_entries SET gite_label = 'La Salmonière' WHERE gite_label = 'Grand gite';
UPDATE tax_stays SET gite_label = 'Le Vallon' WHERE gite_label = 'Petit gite';
UPDATE tax_stays SET gite_label = 'La Salmonière' WHERE gite_label = 'Grand gite';

-- Drop old CHECK constraints and recreate with new values
ALTER TABLE revenue_entries DROP CONSTRAINT revenue_entries_gite_label_check;
ALTER TABLE revenue_entries ADD CONSTRAINT revenue_entries_gite_label_check
  CHECK (gite_label IN ('Le Vallon', 'La Salmonière', 'Annexe'));

ALTER TABLE tax_stays DROP CONSTRAINT tax_stays_gite_label_check;
ALTER TABLE tax_stays ADD CONSTRAINT tax_stays_gite_label_check
  CHECK (gite_label IN ('Le Vallon', 'La Salmonière', 'Annexe'));
