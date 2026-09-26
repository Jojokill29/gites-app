import { useLocation, useNavigate } from 'react-router-dom'
import { LABELS } from '../../constants/labels'

interface MobileTabBarProps {
  /** Gite whose calendar the "Calendrier" slot opens. */
  currentGiteId: string | null
  onOpenMore: () => void
  moreOpen: boolean
}

// truncate + minmax(0,…) on the grid: 5 slots must never widen the viewport
const slotClass =
  'h-[52px] min-w-0 px-0.5 flex items-center justify-center text-[13px] border-t-2 cursor-pointer truncate'
const activeClass = 'text-text font-medium border-action'
const idleClass = 'text-text-tertiary border-transparent'

export default function MobileTabBar({
  currentGiteId,
  onOpenMore,
  moreOpen,
}: MobileTabBarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isCalendar = pathname.startsWith('/calendar')
  const isReservations = pathname.startsWith('/reservations')
  const isInvoices = pathname.startsWith('/invoices')
  // "Plus" stays lit while one of the screens it opens is displayed
  const isMore =
    moreOpen || pathname.startsWith('/finances') || pathname.startsWith('/export')

  const calendarPath = currentGiteId ? `/calendar/${currentGiteId}` : '/'
  const newPath = currentGiteId
    ? `/reservations/new?gite=${currentGiteId}`
    : '/reservations/new'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-header border-t border-border grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_60px_minmax(0,1fr)_minmax(0,1fr)] items-start px-1"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        type="button"
        className={`${slotClass} ${isCalendar ? activeClass : idleClass}`}
        onClick={() => navigate(calendarPath)}
      >
        {LABELS.mobile.calendar}
      </button>
      <button
        type="button"
        className={`${slotClass} ${isReservations ? activeClass : idleClass}`}
        onClick={() => navigate('/reservations')}
      >
        {LABELS.mobile.reservations}
      </button>

      {/* Primary action, 44x44 as required by the mobile touch target rule */}
      <div className="h-[52px] flex items-center justify-center">
        <button
          type="button"
          aria-label={LABELS.mobile.newReservationAria}
          className="w-11 h-11 rounded-md bg-action text-action-text text-[24px] leading-none flex items-center justify-center"
          onClick={() => navigate(newPath)}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className={`${slotClass} ${isInvoices ? activeClass : idleClass}`}
        onClick={() => navigate('/invoices')}
      >
        {LABELS.factures}
      </button>
      <button
        type="button"
        className={`${slotClass} ${isMore ? activeClass : idleClass}`}
        onClick={onOpenMore}
      >
        {LABELS.mobile.more}
      </button>
    </nav>
  )
}
