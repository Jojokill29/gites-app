import Modal from './Modal'
import Button from './Button'
import { LABELS } from '../../constants/labels'

interface ConfirmDialogProps {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  /** Text shown on the confirm button while the action runs. */
  loadingLabel?: string
  /** False for a confirmation that is not a deletion (no danger colour). */
  destructive?: boolean
}

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirmLabel = LABELS.delete,
  cancelLabel = LABELS.cancel,
  loading = false,
  loadingLabel = 'Suppression...',
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <p className="text-[14px] text-text mb-5">{message}</p>
      <div className="flex gap-2 max-sm:flex-col">
        <Button onClick={onCancel} disabled={loading} className="flex-1">
          {cancelLabel}
        </Button>
        {/* Destructive action: charter colour, kept bordered so it still reads as a button */}
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 ${destructive ? 'border border-border-hover' : ''}`}
        >
          {loading ? loadingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
