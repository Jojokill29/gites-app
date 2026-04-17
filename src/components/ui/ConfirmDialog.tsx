import Modal from './Modal'
import { LABELS } from '../../constants/labels'

interface ConfirmDialogProps {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirmLabel = LABELS.delete,
  cancelLabel = LABELS.cancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <p className="text-sm text-text mb-5">{message}</p>
      <div className="flex gap-2 max-sm:flex-col">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2 px-3.5 text-[13px] font-medium border border-border-hover rounded-[10px] bg-surface hover:bg-surface-alt cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 px-3.5 text-[13px] font-medium border border-status-red rounded-[10px] bg-surface text-status-red-text hover:bg-status-red-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Suppression...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
