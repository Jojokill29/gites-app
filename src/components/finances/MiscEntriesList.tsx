import { useState } from 'react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import MiscEntryForm from './MiscEntryForm'
import { LABELS } from '../../constants/labels'
import { formatEUR } from '../../utils/money'
import { supabase } from '../../lib/supabase'
import type { MiscEntry, Quarter } from '../../types/domain'

interface MiscEntriesListProps {
  entries: MiscEntry[]
  year: number
  quarter: Quarter
  onChanged: () => void
}

type EditState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; entry: MiscEntry }

export default function MiscEntriesList({
  entries,
  year,
  quarter,
  onChanged,
}: MiscEntriesListProps) {
  const [editState, setEditState] = useState<EditState>({ type: 'none' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    const { error } = await supabase
      .from('misc_entries')
      .delete()
      .eq('id', deleteTarget)

    setDeleting(false)
    if (error) {
      console.error('Delete misc entry error:', error)
    }
    setDeleteTarget(null)
    onChanged()
  }

  const handleSaved = () => {
    setEditState({ type: 'none' })
    onChanged()
  }

  return (
    <div>
      {entries.length === 0 && editState.type === 'none' ? (
        <p className="text-[13px] text-text-secondary italic py-2">
          {LABELS.noMiscEntries}
        </p>
      ) : (
        <ul className="space-y-1.5 mb-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-2 p-2 rounded-[8px] bg-surface-alt"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[13px] text-text font-medium">
                  {entry.label}
                </span>
                <span className={`text-[13px] ml-2 ${Number(entry.amount) < 0 ? 'text-status-red-text' : 'text-text-secondary'}`}>
                  {formatEUR(Number(entry.amount))}
                </span>
                {entry.notes && (
                  <p className="text-[12px] text-text-secondary mt-0.5 break-words">
                    {entry.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  type="button"
                  className="!px-2 !py-1 !text-[11px]"
                  onClick={() => setEditState({ type: 'edit', entry })}
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="!px-2 !py-1 !text-[11px]"
                  onClick={() => setDeleteTarget(entry.id)}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editState.type === 'add' || editState.type === 'edit' ? (
        <MiscEntryForm
          year={year}
          quarter={quarter}
          entry={editState.type === 'edit' ? editState.entry : undefined}
          onSaved={handleSaved}
          onCancel={() => setEditState({ type: 'none' })}
        />
      ) : (
        <Button type="button" onClick={() => setEditState({ type: 'add' })}>
          {LABELS.addNote}
        </Button>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        message="Confirmer la suppression ?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
