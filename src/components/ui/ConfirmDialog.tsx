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
        <Button onClick={onCancel} disabled={loading} className="flex-1">
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading} className="flex-1">
          {loading ? 'Suppression...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
