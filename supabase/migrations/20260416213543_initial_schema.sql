-- Safety net: enable extensions needed for UUID generation and GiST index on UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- Table: gites
-- ============================================================
CREATE TABLE gites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Table: reservations
-- ============================================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  linen_sets INTEGER CHECK (linen_sets >= 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending_contract', 'pending_deposit', 'deposit_paid')),
  notes TEXT,
  contract_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent overlapping reservations on the same gite (rotation day allowed via '[)' range)
ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    gite_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  );

-- Index for fast monthly queries
CREATE INDEX idx_reservations_gite_dates
  ON reservations (gite_id, start_date, end_date);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Table: tax_entries
-- ============================================================
CREATE TABLE tax_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Table: misc_entries
-- ============================================================
CREATE TABLE misc_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Table: invoices
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Seed: initial gites
-- ============================================================
INSERT INTO gites (name, capacity, display_order) VALUES
  ('Grand gîte', 22, 1),
  ('Petit gîte', 15, 2);
