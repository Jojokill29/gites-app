import imageCompression from 'browser-image-compression'

export const ALLOWED_INVOICE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const

export const MAX_INVOICE_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export type InvoiceFileError = 'invalid_type' | 'file_too_large'

/**
 * Validate MIME type and file size.
 * Returns null if valid, otherwise the error code.
 */
export function validateInvoiceFile(file: File): InvoiceFileError | null {
  const allowed: readonly string[] = ALLOWED_INVOICE_MIME_TYPES
  if (!allowed.includes(file.type)) return 'invalid_type'
  if (file.size > MAX_INVOICE_FILE_SIZE_BYTES) return 'file_too_large'
  return null
}

/**
 * Compress images before upload (quality 0.8, max 2000px).
 * PDF files are returned as-is.
 */
export async function prepareInvoiceFile(file: File): Promise<File> {
  if (file.type === 'application/pdf') return file

  const compressed = await imageCompression(file, {
    maxSizeMB: 10,
    maxWidthOrHeight: 2000,
    initialQuality: 0.8,
    useWebWorker: true,
  })

  return new File([compressed], file.name, { type: file.type })
}
