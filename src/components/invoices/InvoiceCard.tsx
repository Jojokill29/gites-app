import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Invoice } from '../../types/domain'
import { getInvoiceSignedUrl } from '../../lib/storage'

interface Props {
  invoice: Invoice
  onClick: () => void
}

function isPdf(filePath: string) {
  return filePath.endsWith('.pdf')
}

export default function InvoiceCard({ invoice, onClick }: Props) {
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
    <button
      type="button"
      onClick={onClick}
      className="bg-surface border border-border rounded-[10px] overflow-hidden flex flex-col hover:border-border-hover hover:shadow-sm transition-all cursor-pointer text-left w-full"
      aria-label={`${invoice.name} — ${formattedDate}`}
    >
      {/* Thumbnail area */}
      <div className="w-full h-32 bg-surface-alt flex items-center justify-center overflow-hidden">
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
        <p className="text-[12px] text-text-secondary mt-0.5">{formattedDate}</p>
      </div>
    </button>
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
