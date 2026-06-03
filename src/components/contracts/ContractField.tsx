import { useRef, useState } from 'react'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { uploadContract, getContractSignedUrl } from '../../lib/storage'
import {
  validateContractFile,
  prepareContractFile,
  ALLOWED_MIME_TYPES,
  type ContractFileError,
} from '../../utils/contractFile'

interface ContractFieldProps {
  currentPath: string | null
  pendingPath: string | null
  onUploaded: (newPath: string) => void
  onRemoveRequested: () => void
}

const L = LABELS.contracts

const ERROR_MESSAGES: Record<ContractFileError, string> = {
  invalid_type: L.errors.invalidType,
  file_too_large: L.errors.fileTooLarge,
}

export default function ContractField({
  currentPath,
  pendingPath,
  onUploaded,
  onRemoveRequested,
}: ContractFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openFilePicker = () => {
    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate
    const validationError = validateContractFile(file)
    if (validationError) {
      setError(ERROR_MESSAGES[validationError])
      return
    }

    // Compress if image, then upload
    setUploading(true)
    try {
      const prepared = await prepareContractFile(file)
      const path = await uploadContract(prepared)
      onUploaded(path)
    } catch {
      setError(L.errors.uploadFailed)
    } finally {
      setUploading(false)
    }
  }

  const handleView = async () => {
    if (!currentPath) return
    try {
      const url = await getContractSignedUrl(currentPath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError(L.errors.signedUrlFailed)
    }
  }

  // Hidden file input shared by all states
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={ALLOWED_MIME_TYPES.join(',')}
      onChange={handleFileChange}
      className="sr-only"
      tabIndex={-1}
    />
  )

  // State: replacement pending (currentPath + pendingPath)
  if (currentPath && pendingPath) {
    return (
      <div>
        <span className="block text-[12px] font-medium text-text-secondary mb-1">
          {L.fieldTitle}
        </span>
        <p className="text-[13px] text-text-secondary mb-2">
          {L.replacementPending}
        </p>
        <Button type="button" onClick={onRemoveRequested}>
          {L.cancelReplacement}
        </Button>
      </div>
    )
  }

  // State: existing contract (currentPath, no pendingPath)
  if (currentPath) {
    return (
      <div>
        <span className="block text-[12px] font-medium text-text-secondary mb-1">
          {L.fieldTitle}
        </span>
        <p className="text-[13px] text-text mb-2">{L.attached}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleView}
            aria-label="Ouvrir le contrat dans un nouvel onglet"
          >
            {L.view}
          </Button>
          <Button type="button" onClick={openFilePicker} disabled={uploading}>
            {uploading ? L.uploading : L.replace}
          </Button>
          <Button type="button" variant="danger" onClick={onRemoveRequested}>
            {L.remove}
          </Button>
        </div>
        {fileInput}
        {error && (
          <p className="mt-2 text-[12px] text-status-red-text">{error}</p>
        )}
      </div>
    )
  }

  // State: no contract (no currentPath, possibly pendingPath from fresh upload)
  if (pendingPath) {
    return (
      <div>
        <span className="block text-[12px] font-medium text-text-secondary mb-1">
          {L.fieldTitle}
        </span>
        <p className="text-[13px] text-text mb-2">{L.attached}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={openFilePicker} disabled={uploading}>
            {uploading ? L.uploading : L.replace}
          </Button>
          <Button type="button" variant="danger" onClick={onRemoveRequested}>
            {L.remove}
          </Button>
        </div>
        {fileInput}
        {error && (
          <p className="mt-2 text-[12px] text-status-red-text">{error}</p>
        )}
      </div>
    )
  }

  // State: no contract at all
  return (
    <div>
      <span className="block text-[12px] font-medium text-text-secondary mb-1">
        {L.fieldTitle}
      </span>
      <Button type="button" onClick={openFilePicker} disabled={uploading}>
        {uploading ? L.uploading : L.upload}
      </Button>
      <p className="mt-1 text-[12px] text-text-secondary">{L.helperText}</p>
      {fileInput}
      {error && (
        <p className="mt-2 text-[12px] text-status-red-text">{error}</p>
      )}
    </div>
  )
}
