-- Step 8 v2: Remove Annexe gite, swap display_order, create annex_stays table

-- Remove the Annexe gite (seeded by previous migration, has no reservations)
DELETE FROM gites WHERE name = 'Annexe' AND display_order = 3;

-- Swap display_order: Petit gite first, Grand gite second
UPDATE gites SET display_order = 1 WHERE name = 'Petit gite';
UPDATE gites SET display_order = 2 WHERE name = 'Grand gite';

-- Create annex_stays table for standalone annex operations
CREATE TABLE annex_stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  guest_count INTEGER NULL CHECK (guest_count IS NULL OR guest_count > 0),
  adult_count INTEGER NULL CHECK (adult_count IS NULL OR adult_count >= 0),
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  tax_amount NUMERIC(10,2) NULL CHECK (tax_amount IS NULL OR tax_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: authenticated full access (same pattern as other tables)
ALTER TABLE annex_stays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users have full access to annex_stays"
  ON annex_stays
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
