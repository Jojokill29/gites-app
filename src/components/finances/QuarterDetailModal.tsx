import { useState } from 'react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import Button from '../ui/Button'
import TaxEntryForm from './TaxEntryForm'
import MiscEntryForm from './MiscEntryForm'
import { LABELS } from '../../constants/labels'
import { formatEUR } from '../../utils/money'
import { supabase } from '../../lib/supabase'
import type { TaxEntry, MiscEntry, Quarter } from '../../types/domain'

interface QuarterDetailModalProps {
  year: number
  quarter: Quarter
  taxEntries: TaxEntry[]
  miscEntries: MiscEntry[]
  onClose: () => void
}

const QUARTER_PERIODS: Record<Quarter, string> = {
  1: 'jan à mars',
  2: 'avr à juin',
  3: 'juil à sept',
  4: 'oct à déc',
}

type EditingState =
  | { type: 'none' }
  | { type: 'add-tax' }
  | { type: 'edit-tax'; entry: TaxEntry }
  | { type: 'add-misc' }
  | { type: 'edit-misc'; entry: MiscEntry }

export default function QuarterDetailModal({
  year,
  quarter,
  taxEntries,
  miscEntries,
  onClose,
}: QuarterDetailModalProps) {
  const [editing, setEditing] = useState<EditingState>({ type: 'none' })
  const [deleteTarget, setDeleteTarget] = useState<{ table: 'tax' | 'misc'; id: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track local copies so the modal updates without closing
  const [localTaxEntries, setLocalTaxEntries] = useState(taxEntries)
  const [localMiscEntries, setLocalMiscEntries] = useState(miscEntries)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)

    const table = deleteTarget.table === 'tax' ? 'tax_entries' : 'misc_entries'
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', deleteTarget.id)

    setDeleting(false)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      setError(LABELS.errorSaveData)
      setDeleteTarget(null)
      return
    }

    // Update local state
    if (deleteTarget.table === 'tax') {
      setLocalTaxEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    } else {
      setLocalMiscEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleTaxSaved = (entry: TaxEntry, isNew: boolean) => {
    if (isNew) {
      setLocalTaxEntries((prev) => [...prev, entry])
    } else {
      setLocalTaxEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
    }
    setEditing({ type: 'none' })
  }

  const handleMiscSaved = (entry: MiscEntry, isNew: boolean) => {
    if (isNew) {
      setLocalMiscEntries((prev) => [...prev, entry])
    } else {
      setLocalMiscEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
    }
    setEditing({ type: 'none' })
  }

  return (
    <>
      <Modal open onClose={onClose}>
        <div>
          {/* Header */}
          <h2 className="font-heading font-semibold text-[18px] text-text mb-1 pr-8">
            T{quarter} {year} — détail
          </h2>
          <p className="text-[13px] text-text-secondary mb-4">
            {QUARTER_PERIODS[quarter]}
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">
              {error}
            </div>
          )}

          {/* Section: Taxes de séjour */}
          <div className="mb-5">
            <h3 className="text-[14px] font-medium text-text mb-2">{LABELS.taxHeader}</h3>
            {localTaxEntries.length === 0 ? (
              <p className="text-[13px] text-text-secondary italic mb-2">
                Aucune taxe de séjour enregistrée pour ce trimestre.
              </p>
            ) : (
              <ul className="space-y-2 mb-2">
                {localTaxEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-2 p-2 rounded-[8px] bg-surface-alt"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-text font-medium">
                        {formatEUR(Number(entry.amount))}
                      </span>
                      {entry.notes ? (
                        <p className="text-[12px] text-text-secondary mt-0.5 break-words">
                          {entry.notes}
                        </p>
                      ) : (
                        <p className="text-[12px] text-text-secondary italic mt-0.5">
                          Pas de notes
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        className="!px-2 !py-1 !text-[11px]"
                        onClick={() => setEditing({ type: 'edit-tax', entry })}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        className="!px-2 !py-1 !text-[11px]"
                        onClick={() => setDeleteTarget({ table: 'tax', id: entry.id })}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {editing.type === 'add-tax' ? (
              <TaxEntryForm
                year={year}
                quarter={quarter}
                onSaved={handleTaxSaved}
                onCancel={() => setEditing({ type: 'none' })}
              />
            ) : editing.type === 'edit-tax' ? (
              <TaxEntryForm
                year={year}
                quarter={quarter}
                entry={editing.entry}
                onSaved={handleTaxSaved}
                onCancel={() => setEditing({ type: 'none' })}
              />
            ) : (
              <Button type="button" onClick={() => setEditing({ type: 'add-tax' })}>
                {LABELS.addTax}
              </Button>
            )}
          </div>

          {/* Section: Notes diverses */}
          <div className="mb-5">
            <h3 className="text-[14px] font-medium text-text mb-2">{LABELS.notesHeader}</h3>
            {localMiscEntries.length === 0 ? (
              <p className="text-[13px] text-text-secondary italic mb-2">
                Aucune note financière pour ce trimestre.
              </p>
            ) : (
              <ul className="space-y-2 mb-2">
                {localMiscEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-2 p-2 rounded-[8px] bg-surface-alt"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-text font-medium">
                        {entry.label}
                      </span>
                      <span className="text-[13px] text-text-secondary ml-2">
                        {formatEUR(Number(entry.amount))}
                      </span>
                      {entry.notes ? (
                        <p className="text-[12px] text-text-secondary mt-0.5 break-words">
                          {entry.notes}
                        </p>
                      ) : (
                        <p className="text-[12px] text-text-secondary italic mt-0.5">
                          Pas de notes
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        className="!px-2 !py-1 !text-[11px]"
                        onClick={() => setEditing({ type: 'edit-misc', entry })}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        className="!px-2 !py-1 !text-[11px]"
                        onClick={() => setDeleteTarget({ table: 'misc', id: entry.id })}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {editing.type === 'add-misc' ? (
              <MiscEntryForm
                year={year}
                quarter={quarter}
                onSaved={handleMiscSaved}
                onCancel={() => setEditing({ type: 'none' })}
              />
            ) : editing.type === 'edit-misc' ? (
              <MiscEntryForm
                year={year}
                quarter={quarter}
                entry={editing.entry}
                onSaved={handleMiscSaved}
                onCancel={() => setEditing({ type: 'none' })}
              />
            ) : (
              <Button type="button" onClick={() => setEditing({ type: 'add-misc' })}>
                {LABELS.addNote}
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        message="Confirmer la suppression ?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
