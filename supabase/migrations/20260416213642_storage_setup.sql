-- Create private buckets for contracts and invoices
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('contracts', 'contracts', false),
  ('invoices', 'invoices', false);

-- Storage policies: authenticated users can read/insert/update/delete in both buckets

-- Bucket: contracts
CREATE POLICY "Authenticated read contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contracts');

CREATE POLICY "Authenticated insert contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Authenticated update contracts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contracts');

CREATE POLICY "Authenticated delete contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contracts');

-- Bucket: invoices
CREATE POLICY "Authenticated read invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated insert invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Authenticated update invoices"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated delete invoices"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices');
