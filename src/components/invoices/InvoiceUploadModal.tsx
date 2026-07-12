import { useRef, useState } from 'react'
import { parse, isValid } from 'date-fns'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import DateMaskedInput from '../finances/DateMaskedInput'
import { LABELS } from '../../constants/labels'
import { uploadInvoice } from '../../lib/storage'
import { deleteInvoice } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { validateInvoiceFile, prepareInvoiceFile } from '../../utils/invoiceFile'

const L = LABELS.invoices.errors
const inputClass =
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function InvoiceUploadModal({ onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    setFormError(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    const validationError = validateInvoiceFile(file)
    if (validationError === 'invalid_type') {
      setFileError(L.invalidType)
      setSelectedFile(null)
      return
    }
    if (validationError === 'file_too_large') {
      setFileError(L.fileTooLarge)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    // Pre-fill name with the filename (without extension)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    setName(baseName)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!selectedFile) {
      setFormError(LABELS.invoiceFile)
      return
    }
    if (!name.trim()) {
      setFormError(L.nameRequired)
      return
    }
    // Date is optional — fall back to today if left empty
    let isoDate: string
    if (!date) {
      const today = new Date()
      isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    } else {
      const parsed = parse(date, 'dd/MM/yyyy', new Date())
      if (!isValid(parsed)) {
        setFormError(L.dateInvalid)
        return
      }
      isoDate = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
    }

    setSaving(true)
    let storagePath: string | null = null

    try {
      const prepared = await prepareInvoiceFile(selectedFile)
      storagePath = await uploadInvoice(prepared)

      const { error: dbError } = await supabase.from('invoices').insert({
        name: name.trim(),
        file_path: storagePath,
        invoice_date: isoDate,
        notes: notes.trim() || null,
      })

      if (dbError) {
        console.error('Invoice DB insert error:', dbError)
        // Clean up the orphan file in storage
        await deleteInvoice(storagePath)
        setFormError(L.uploadFailed)
        setSaving(false)
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Invoice upload error:', err)
      // If storage upload succeeded but something else failed, clean up
      if (storagePath) {
        await deleteInvoice(storagePath)
      }
      setFormError(L.uploadFailed)
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="font-semibold text-[18px] text-text mb-4">{LABELS.uploadInvoice}</h2>

        {formError && (
          <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">
            {formError}
          </div>
        )}

        {/* File picker */}
        <div className="mb-3">
          <label className={labelClass}>{LABELS.invoiceFile}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            className="w-full text-[13px] text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border file:border-border file:text-[13px] file:font-medium file:bg-surface file:text-text file:cursor-pointer hover:file:bg-surface-alt"
          />
          {fileError && (
            <p className="mt-1 text-[12px] text-status-red-text">{fileError}</p>
          )}
          {selectedFile && !fileError && (
            <p className="mt-1 text-[12px] text-text-secondary">
              {selectedFile.name}
            </p>
          )}
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className={labelClass}>{LABELS.invoiceName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="ex : EDF janvier 2026"
          />
        </div>

        {/* Date */}
        <div className="mb-3">
          <label className={labelClass}>{LABELS.invoiceDate}</label>
          <DateMaskedInput
            value={date}
            onChange={setDate}
            className={inputClass}
          />
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className={labelClass}>{LABELS.invoiceNotes}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="flex gap-2 max-sm:flex-col">
          <Button type="submit" disabled={saving} variant="primary" className="flex-1">
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi…
              </>
            ) : (
              LABELS.save
            )}
          </Button>
          <Button type="button" onClick={onClose} disabled={saving} className="flex-1">
            {LABELS.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
