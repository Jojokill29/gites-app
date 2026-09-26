import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Invoice } from '../../types/domain'
import { getInvoiceSignedUrl } from '../../lib/storage'
import { LABELS } from '../../constants/labels'

interface Props {
  invoice: Invoice
  onClick: () => void
  onDelete: () => void
}

function isPdf(filePath: string) {
  return filePath.endsWith('.pdf')
}

export default function InvoiceCard({ invoice, onClick, onDelete }: Props) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const pdf = isPdf(invoice.file_path)

  useEffect(() => {
    if (pdf) return
    let cancelled = false
    getInvoiceSignedUrl(invoice.file_path)
      .then((url) => { if (!cancelled) setThumbUrl(url) })
      .catch(() => { /* thumbnail unavailable — show generic icon */ })
    return () => { cancelled = true }
  }, [invoice.file_path, pdf])

  const formattedDate = format(parseISO(invoice.invoice_date), 'dd/MM/yyyy')

  return (
    // The delete button is a sibling of the card button, not a child:
    // nesting two <button> elements is invalid HTML.
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="bg-surface border border-border rounded-md overflow-hidden flex flex-col hover:border-border-hover hover:bg-surface-alt transition-colors cursor-pointer text-left w-full"
        aria-label={`${invoice.name} — ${formattedDate}`}
      >
        {/* Thumbnail area */}
        <div className="w-full h-32 bg-bg flex items-center justify-center overflow-hidden">
          {pdf ? (
            <PdfIcon />
          ) : thumbUrl ? (
            <img
              src={thumbUrl}
              alt={invoice.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlaceholderIcon />
          )}
        </div>

        {/* Caption */}
        <div className="p-2.5">
          <p className="text-[13px] font-medium text-text truncate">{invoice.name}</p>
          <p className="font-mono text-[11px] text-text-muted mt-0.5">{formattedDate}</p>
        </div>
      </button>

      {/* Always visible (no hover reveal): the app is used mostly on mobile */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1.5 right-1.5 w-8 h-8 flex items-center justify-center rounded-md bg-surface border border-border-hover text-text-tertiary hover:text-danger hover:bg-surface-hover transition-colors"
        aria-label={`${LABELS.invoiceDeleteAria} ${invoice.name}`}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PdfIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-tertiary"
        />
        <path
          d="M14 2v6h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-tertiary"
        />
        <text x="6" y="18" fontSize="5" fontWeight="bold" fill="currentColor" className="text-status-red">
          PDF
        </text>
      </svg>
    </div>
  )
}

function ImagePlaceholderIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" className="text-text-tertiary" />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary" />
    </svg>
  )
}
