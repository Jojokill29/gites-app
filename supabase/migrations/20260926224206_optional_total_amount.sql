-- The total amount is no longer required when creating a reservation: Johan
-- books a stay with only a name and dates, then fills the price in later.
-- The CHECK (total_amount >= 0) is kept: it still applies when a value is set
-- and evaluates to NULL (so it passes) when the column is empty.
ALTER TABLE reservations
  ALTER COLUMN total_amount DROP NOT NULL;
