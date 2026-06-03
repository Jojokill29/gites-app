import imageCompression from 'browser-image-compression'

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export type ContractFileError = 'invalid_type' | 'file_too_large'

/**
 * Validate MIME type and file size.
 * Returns null if OK, otherwise the error code.
 */
export function validateContractFile(file: File): ContractFileError | null {
  const allowed: readonly string[] = ALLOWED_MIME_TYPES
  if (!allowed.includes(file.type)) {
    return 'invalid_type'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'file_too_large'
  }
  return null
}

/**
 * If the file is an image, compress it (quality 0.8, max 2000px).
 * If it's a PDF, return the file as-is.
 */
export async function prepareContractFile(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    return file
  }

  // Image compression for JPEG/PNG
  const compressed = await imageCompression(file, {
    maxSizeMB: 10,
    maxWidthOrHeight: 2000,
    initialQuality: 0.8,
    useWebWorker: true,
  })

  // browser-image-compression returns a Blob — convert back to File
  // to preserve .type and give it a consistent name
  return new File([compressed], file.name, { type: file.type })
}
