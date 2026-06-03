import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { getContractSignedUrl } from '../../lib/storage'

interface ContractPreviewModalProps {
  path: string
  onClose: () => void
}

const L = LABELS.contracts

/**
 * Derive display type from the storage path extension.
 * path format: contracts/{uuid}.{ext}
 */
function getFileType(path: string): 'pdf' | 'image' {
  if (path.endsWith('.pdf')) return 'pdf'
  return 'image'
}

export default function ContractPreviewModal({
  path,
  onClose,
}: ContractPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Fetch signed URL once on mount
  useEffect(() => {
    let cancelled = false

    async function fetchUrl() {
      try {
        const url = await getContractSignedUrl(path)
        if (!cancelled) {
          setSignedUrl(url)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchUrl()
    return () => { cancelled = true }
  }, [path])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Block body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const fileType = getFileType(path)

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 max-sm:p-0"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      aria-labelledby="contract-preview-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface rounded-[14px] max-sm:rounded-none w-[90vw] h-[90vh] max-sm:w-[100vw] max-sm:h-[100vh] flex flex-col p-4 max-sm:p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 id="contract-preview-title" className="sr-only">
            {L.previewTitle}
          </h2>
          <Button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'aperçu du contrat"
            className="ml-auto"
          >
            {L.previewClose}
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {loading && (
            <p className="text-[14px] text-text-secondary">{L.previewLoading}</p>
          )}

          {error && (
            <p className="text-[14px] text-status-red-text">{L.previewErrorLoad}</p>
          )}

          {!loading && !error && signedUrl && fileType === 'pdf' && (
            <iframe
              src={signedUrl}
              title="Aperçu du contrat"
              className="w-full h-full border-0 rounded-[8px]"
            />
          )}

          {!loading && !error && signedUrl && fileType === 'image' && (
            <img
              src={signedUrl}
              alt="Aperçu du contrat"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Footer: fallback link */}
        {signedUrl && (
          <div className="mt-3 flex-shrink-0 text-center">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="text-[13px] text-text-secondary underline hover:text-text"
            >
              {L.previewOpenInNewTab}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
