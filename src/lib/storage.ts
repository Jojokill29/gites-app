import { supabase } from './supabase'

const BUCKET = 'contracts'
const SIGNED_URL_EXPIRY_SECONDS = 600 // 10 minutes

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

/**
 * Upload a validated file to the contracts bucket.
 * Returns the storage path to persist in the database.
 */
export async function uploadContract(file: File): Promise<string> {
  const ext = MIME_TO_EXT[file.type]
  if (!ext) {
    throw new Error(`Unsupported MIME type: ${file.type}`)
  }

  const id = crypto.randomUUID()
  const path = `contracts/${id}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error('Upload failed')
  }

  return path
}

/**
 * Generate a signed URL valid for 10 minutes. Never returns a public URL.
 */
export async function getContractSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    console.error('Signed URL error:', error)
    throw new Error('Could not generate signed URL')
  }

  return data.signedUrl
}

/**
 * Delete a file from the contracts bucket.
 * Idempotent: does not throw if the file is already absent.
 */
export async function deleteContract(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) {
    // Log but do not rethrow — an orphan in storage is acceptable,
    // an exception bubbling up to the UI is not.
    console.error('Storage delete error (non-blocking):', error)
  }
}

/**
 * Download a file from the given bucket and return it as a Blob.
 * Throws explicitly if the file is missing or inaccessible.
 * Used by the export ZIP builder; all callers must handle the error.
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error || !data) {
    console.error(`Storage download error (${bucket}/${path}):`, error)
    throw new Error(`Could not download file: ${bucket}/${path}`)
  }
  return data
}
