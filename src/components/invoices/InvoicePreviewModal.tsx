import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { LABELS } from '../../constants/labels'
import { getInvoiceSignedUrl, deleteInvoice } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import type { Invoice } from '../../types/domain'

interface Props {
  invoice: Invoice
  onClose: () => void
  onDeleted: () => void
}

function getFileType(filePath: string): 'pdf' | 'image' {
  return filePath.endsWith('.pdf') ? 'pdf' : 'image'
}

export default function InvoicePreviewModal({ invoice, onClose, onDeleted }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [urlError, setUrlError] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fileType = getFileType(invoice.file_path)

  useEffect(() => {
    let cancelled = false
    getInvoiceSignedUrl(invoice.file_path)
      .then((url) => { if (!cancelled) { setSignedUrl(url); setLoading(false) } })
      .catch(() => { if (!cancelled) { setUrlError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [invoice.file_path])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const { error: dbError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoice.id)

    if (dbError) {
      console.error('Invoice delete DB error:', dbError)
      setDeleteError(LABELS.invoiceDeleteError)
      setDeleting(false)
      setShowConfirm(false)
      return
    }

    await deleteInvoice(invoice.file_path)
    setDeleting(false)
    setShowConfirm(false)
    onDeleted()
    onClose()
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[190] flex items-center justify-center p-4 max-sm:p-0"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        role="dialog"
        aria-modal="true"
        aria-label={invoice.name}
      >
        <div
          className="bg-surface rounded-[14px] max-sm:rounded-none w-[90vw] h-[90vh] max-sm:w-[100vw] max-sm:h-[100vh] flex flex-col p-4 max-sm:p-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
            <p className="font-medium text-text text-[15px] truncate">{invoice.name}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowConfirm(true)}
                disabled={deleting}
              >
                {LABELS.delete}
              </Button>
              <Button type="button" onClick={onClose}>
                {LABELS.invoicePreviewClose}
              </Button>
            </div>
          </div>

          {deleteError && (
            <p className="mb-2 text-[13px] text-status-red-text flex-shrink-0">{deleteError}</p>
          )}

          {/* Content */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {loading && (
              <p className="text-[14px] text-text-secondary">{LABELS.invoicePreviewLoading}</p>
            )}
            {urlError && (
              <p className="text-[14px] text-status-red-text">{LABELS.invoicePreviewErrorLoad}</p>
            )}
            {!loading && !urlError && signedUrl && fileType === 'pdf' && (
              <iframe
                src={signedUrl}
                title={invoice.name}
                className="w-full h-full border-0 rounded-[8px]"
              />
            )}
            {!loading && !urlError && signedUrl && fileType === 'image' && (
              <img
                src={signedUrl}
                alt={invoice.name}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Footer fallback link */}
          {signedUrl && (
            <div className="mt-3 flex-shrink-0 text-center">
              <button
                type="button"
                onClick={() => window.open(signedUrl, '_blank', 'noopener,noreferrer')}
                className="text-[13px] text-text-secondary underline hover:text-text"
              >
                {LABELS.invoicePreviewOpenInNewTab}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        message={LABELS.confirmDeleteInvoice}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </>
  )
}
