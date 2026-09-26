import { LABELS } from '../../constants/labels'
import { getDisplayName } from '../../utils/displayName'
import Button from '../ui/Button'

interface TopBarProps {
  email: string
  onLogout: () => void
}

export default function TopBar({ email, onLogout }: TopBarProps) {
  const displayName = getDisplayName(email)

  return (
    <header className="bg-header border-b border-border sticky top-0 z-50 h-[52px] flex items-center justify-between gap-4 px-6 max-sm:px-4">
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="font-semibold text-[15px] text-text whitespace-nowrap">
          {LABELS.appTitle}
        </span>
        <span className="text-[13px] text-text-tertiary truncate">
          {displayName}
        </span>
      </div>
      <Button variant="ghost" onClick={onLogout} className="h-8 px-2.5 text-[13px] font-normal">
        {LABELS.logout}
      </Button>
    </header>
  )
}
