-- Make guest_count nullable and replace its CHECK constraint
ALTER TABLE reservations ALTER COLUMN guest_count DROP NOT NULL;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_guest_count_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_guest_count_check
  CHECK (guest_count IS NULL OR guest_count > 0);

-- Add split linen columns
ALTER TABLE reservations
  ADD COLUMN linen_sets_single INTEGER
    CHECK (linen_sets_single IS NULL OR linen_sets_single >= 0);

ALTER TABLE reservations
  ADD COLUMN linen_sets_double INTEGER
    CHECK (linen_sets_double IS NULL OR linen_sets_double >= 0);

-- Drop old linen_sets column (table is empty, no data to migrate)
ALTER TABLE reservations DROP COLUMN linen_sets;
