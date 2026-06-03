-- Step 8 v3: Manual finance journal
-- Drop annex_stays (v2 artifact), drop adult_count/tax_amount from reservations (v1 artifact)
-- Create revenue_entries + tax_stays, swap display_order

-- Clean up v1/v2 artifacts
DROP TABLE IF EXISTS annex_stays;
ALTER TABLE reservations DROP COLUMN IF EXISTS adult_count;
ALTER TABLE reservations DROP COLUMN IF EXISTS tax_amount;

-- Swap display_order: Petit gite first
UPDATE gites SET display_order = 1 WHERE name = 'Petit gite';
UPDATE gites SET display_order = 2 WHERE name = 'Grand gite';

-- Revenue entries (CA journal)
CREATE TABLE revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gite_label TEXT NOT NULL CHECK (gite_label IN ('Petit gite', 'Grand gite', 'Annexe')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  entry_date TEXT,
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to revenue_entries"
  ON revenue_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Tax stays (taxes de séjour journal)
CREATE TABLE tax_stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gite_label TEXT NOT NULL CHECK (gite_label IN ('Petit gite', 'Grand gite', 'Annexe')),
  stay_dates TEXT,
  nights_count INTEGER NOT NULL CHECK (nights_count > 0),
  adult_count INTEGER NOT NULL CHECK (adult_count > 0),
  amount NUMERIC(10,2) CHECK (amount IS NULL OR amount >= 0),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tax_stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access to tax_stays"
  ON tax_stays FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
