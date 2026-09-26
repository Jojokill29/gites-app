import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LABELS } from '../../constants/labels'

interface MoreSheetProps {
  open: boolean
  displayName: string
  onClose: () => void
  onLogout: () => void
}

const rowClass =
  'h-[52px] w-full flex items-center px-5 text-[14px] text-text text-left border-b border-border cursor-pointer active:bg-surface-alt'

/**
 * Bottom sheet behind the "Plus" slot of the mobile navigation.
 * The only element of the app allowed a shadow besides the modal.
 */
export default function MoreSheet({
  open,
  displayName,
  onClose,
  onLogout,
}: MoreSheetProps) {
  const navigate = useNavigate()

  // Close on Escape, same behaviour as the modal
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-overlay flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="bg-surface border-t border-border rounded-t-xl shadow-modal"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={rowClass} onClick={() => go('/finances')}>
          {LABELS.finances}
        </button>
        <button type="button" className={rowClass} onClick={() => go('/export')}>
          {LABELS.export}
        </button>
        <div className="h-[52px] flex items-center px-5 text-[13px] text-text-muted border-b border-border">
          {displayName}
        </div>
        <button
          type="button"
          className={`${rowClass} border-b-0 text-danger`}
          onClick={() => {
            onClose()
            onLogout()
          }}
        >
          {LABELS.logout}
        </button>
      </div>
    </div>
  )
}
