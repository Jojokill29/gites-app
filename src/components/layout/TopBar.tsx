import { LABELS } from '../../constants/labels'
import { getDisplayName, getInitials } from '../../utils/displayName'

interface TopBarProps {
  email: string
  onLogout: () => void
}

export default function TopBar({ email, onLogout }: TopBarProps) {
  const displayName = getDisplayName(email)
  const initials = getInitials(email)

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50 flex items-center justify-between px-5 py-3 max-sm:px-3.5 max-sm:py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-status-blue-bg flex items-center justify-center text-status-blue-text text-[11px] font-semibold shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-[15px] text-text">
            {LABELS.appTitle}
          </div>
          <div className="text-[11px] text-text-secondary">
            {LABELS.connectedAs} {displayName}
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="px-2.5 py-1 text-[12px] font-medium text-text border border-border-hover rounded-[10px] bg-surface hover:bg-surface-alt transition-colors cursor-pointer"
      >
        {LABELS.logout}
      </button>
    </header>
  )
}
