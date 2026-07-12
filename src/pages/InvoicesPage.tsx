import { useEffect, useState } from 'react'
import { getYear, getQuarter } from 'date-fns'
import Button from '../components/ui/Button'
import InvoiceCard from '../components/invoices/InvoiceCard'
import InvoiceUploadModal from '../components/invoices/InvoiceUploadModal'
import InvoicePreviewModal from '../components/invoices/InvoicePreviewModal'
import { LABELS } from '../constants/labels'
import { useInvoices } from '../hooks/useInvoices'
import { getInvoicesTotalSize } from '../lib/storage'
import { buildInvoicesZip, downloadBlob } from '../lib/export'
import type { Invoice, Quarter } from '../types/domain'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function prevQuarter(year: number, quarter: Quarter): { year: number; quarter: Quarter } {
  if (quarter === 1) return { year: year - 1, quarter: 4 }
  return { year, quarter: (quarter - 1) as Quarter }
}

function nextQuarter(year: number, quarter: Quarter): { year: number; quarter: Quarter } {
  if (quarter === 4) return { year: year + 1, quarter: 1 }
  return { year, quarter: (quarter + 1) as Quarter }
}

export default function InvoicesPage() {
  const now = new Date()
  const [year, setYear] = useState<number>(getYear(now))
  const [quarter, setQuarter] = useState<Quarter>(getQuarter(now) as Quarter)
  const [showUpload, setShowUpload] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [totalSize, setTotalSize] = useState<number | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)

  const { invoices, isLoading, error, refetch } = useInvoices(year, quarter)

  // Fetch total size whenever the invoice list changes
  useEffect(() => {
    if (invoices.length === 0) {
      setTotalSize(0)
      return
    }
    const paths = invoices.map((i) => i.file_path)
    getInvoicesTotalSize(paths).then(setTotalSize)
  }, [invoices])

  function goToPrev() {
    const p = prevQuarter(year, quarter)
    setYear(p.year)
    setQuarter(p.quarter)
    setZipError(null)
  }

  function goToNext() {
    const n = nextQuarter(year, quarter)
    setYear(n.year)
    setQuarter(n.quarter)
    setZipError(null)
  }

  async function handleDownloadZip() {
    if (invoices.length === 0) return
    setZipLoading(true)
    setZipError(null)
    try {
      const blob = await buildInvoicesZip(invoices)
      downloadBlob(blob, `factures-${year}-T${quarter}.zip`)
    } catch (err) {
      console.error('Invoice ZIP error:', err)
      setZipError(LABELS.invoiceZipError)
    } finally {
      setZipLoading(false)
    }
  }

  const countLabel = invoices.length === 1 ? '1 facture' : `${invoices.length} factures`
  const sizeLabel = totalSize !== null && totalSize > 0 ? ` — ${formatBytes(totalSize)}` : ''
  const zipCountLabel = `${countLabel}${sizeLabel}`

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      {/* Quarter navigation + ZIP button */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={goToPrev}
            aria-label={LABELS.previousQuarter}
          >
            ‹
          </Button>
          <span className="text-[15px] font-semibold text-text min-w-[90px] text-center">
            T{quarter} {year}
          </span>
          <Button
            variant="ghost"
            onClick={goToNext}
            aria-label={LABELS.nextQuarter}
          >
            ›
          </Button>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button
            variant="secondary"
            onClick={handleDownloadZip}
            disabled={invoices.length === 0 || zipLoading}
          >
            {zipLoading && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {zipLoading ? LABELS.invoiceZipGenerating : LABELS.downloadZip}
          </Button>
          {!isLoading && (
            <span className="text-[12px] text-text-secondary">{zipCountLabel}</span>
          )}
          {zipError && (
            <p className="text-[12px] text-status-red-text">{zipError}</p>
          )}
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <p className="text-sm text-text-secondary">{LABELS.loading}</p>
      )}

      {error && (
        <p className="text-sm text-status-red-text">{error}</p>
      )}

      {!isLoading && !error && (
        <>
          {invoices.length === 0 && (
            <p className="text-sm text-text-secondary mb-4">{LABELS.noInvoicesQuarter}</p>
          )}

          {invoices.length > 0 && (
            <p className="text-[12px] text-text-secondary mb-4">
              {countLabel} ce trimestre. {LABELS.invoiceHelperText}
            </p>
          )}

          {/* Invoice grid + add card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onClick={() => setPreviewInvoice(invoice)}
              />
            ))}

            {/* Add card */}
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="bg-surface border border-dashed border-border rounded-[10px] flex flex-col items-center justify-center gap-2 h-[140px] hover:border-border-hover hover:bg-surface-alt transition-colors cursor-pointer text-text-secondary hover:text-text"
              aria-label={LABELS.invoiceAddCard}
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-[12px] font-medium">{LABELS.invoiceAddCard}</span>
            </button>
          </div>
        </>
      )}

      {/* Upload modal */}
      {showUpload && (
        <InvoiceUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); refetch() }}
        />
      )}

      {/* Preview modal */}
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onDeleted={() => { setPreviewInvoice(null); refetch() }}
        />
      )}
    </div>
  )
}
