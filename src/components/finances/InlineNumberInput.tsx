import { useState, useRef, useEffect } from 'react'

interface InlineNumberInputProps {
  value: number | null
  onSave: (value: number | null) => Promise<boolean>
  /** Format function for display mode (e.g. EUR formatter) */
  format?: (v: number | null) => string
  placeholder?: string
  className?: string
}

/**
 * Inline-editable number field. Displays as text, click to edit.
 * Auto-saves on blur/Enter, restores on Escape or error.
 */
export default function InlineNumberInput({
  value,
  onSave,
  format,
  placeholder = '—',
  className = '',
}: InlineNumberInputProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const displayValue = format
    ? format(value)
    : value != null
      ? String(value)
      : placeholder

  const startEditing = () => {
    setDraft(value != null ? String(value).replace('.', ',') : '')
    setError(false)
    setEditing(true)
  }

  const commit = async () => {
    const trimmed = draft.trim()
    const parsed = trimmed === '' ? null : Number(trimmed.replace(',', '.'))

    if (parsed !== null && Number.isNaN(parsed)) {
      setError(true)
      return
    }

    // Skip save if value unchanged
    if (parsed === value) {
      setEditing(false)
      return
    }

    setSaving(true)
    setError(false)
    const ok = await onSave(parsed)
    setSaving(false)

    if (ok) {
      setEditing(false)
    } else {
      setError(true)
    }
  }

  const cancel = () => {
    setEditing(false)
    setError(false)
  }

  if (editing) {
    return (
      <div className="inline-flex flex-col">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
          disabled={saving}
          className={`w-[80px] px-1.5 py-0.5 text-[12px] border rounded-[6px] text-right bg-surface focus:outline-none focus:ring-1 focus:ring-status-blue ${
            error ? 'border-status-red' : 'border-border'
          } ${className}`}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={`text-[12px] text-text cursor-pointer hover:bg-surface-alt px-1.5 py-0.5 rounded-[6px] transition-colors text-right ${className}`}
    >
      {displayValue}
    </button>
  )
}
