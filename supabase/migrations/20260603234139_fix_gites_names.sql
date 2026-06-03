-- Fix: names were swapped onto wrong rows by previous migration.
-- Use UUIDs to target the correct rows.
UPDATE gites SET name = 'Le Vallon', display_order = 1
  WHERE id = '94fbe5c3-7c0f-4d94-b466-d5b1d76dd0a5'; -- capacity 15

UPDATE gites SET name = 'La Salmonière', display_order = 2
  WHERE id = '32408aff-819a-47de-9778-e684329b23c2'; -- capacity 22
