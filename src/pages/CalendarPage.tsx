import { useState } from 'react'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addDays, addMonths, subMonths, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useReservations } from '../hooks/useReservations'
import { useIsMobile } from '../hooks/useIsMobile'
import CalendarGrid from '../components/calendar/CalendarGrid'
import CalendarLegend from '../components/calendar/CalendarLegend'
import MobileCalendar from '../components/calendar/MobileCalendar'
import UpcomingArrivals from '../components/calendar/UpcomingArrivals'
import ReservationModal from '../components/reservation/ReservationModal'
import Button from '../components/ui/Button'
import { LABELS } from '../constants/labels'
import type { Gite } from '../types/domain'
import type { Reservation } from '../types/domain'

const MAX_UPCOMING_ARRIVALS = 3

interface CalendarPageProps {
  gites: Gite[]
}

type ModalState =
  | null
  | { mode: 'create'; defaults?: { start_date: string; end_date: string } }
  | { mode: 'edit'; reservation: Reservation }

export default function CalendarPage({ gites }: CalendarPageProps) {
  const { giteId } = useParams<{ giteId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modal, setModal] = useState<ModalState>(null)
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  // Read month from URL or default to current month
  const monthParam = searchParams.get('month')
  const currentDate = monthParam ? parseISO(monthParam + '-01') : new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const gite = gites.find((g) => g.id === giteId)
  const giteName = gite ? `${gite.name} (${gite.capacity}p)` : ''
  const { reservations, loading, refetch } = useReservations(giteId, year, month)

  const goToMonth = (date: Date) => {
    setSearchParams({ month: format(date, 'yyyy-MM') })
  }

  const handlePrevMonth = () => goToMonth(subMonths(currentDate, 1))
  const handleNextMonth = () => goToMonth(addMonths(currentDate, 1))
  const handleToday = () => goToMonth(new Date())

  // Capitalize first letter of month name
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: fr })
  const capitalizedMonth =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const handleClickDay = (dateStr: string) => {
    const nextDay = format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd')
    setModal({
      mode: 'create',
      defaults: { start_date: dateStr, end_date: nextDay },
    })
  }

  const handleClickReservation = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    if (reservation) {
      setModal({ mode: 'edit', reservation })
    }
  }

  const handleNewReservation = () => {
    setModal({ mode: 'create' })
  }

  const handleModalClose = () => setModal(null)
  const handleModalSuccess = () => {
    refetch()
    setModal(null)
  }

  if (isMobile) {
    // Tapping a bar opens the stay detail screen instead of the desktop modal
    const openDetail = (reservationId: string) =>
      navigate(`/reservations/${reservationId}`)

    // Tapping a day starts a stay on that night, on the gite of the active tab
    const openCreate = (dateStr: string) => {
      if (!giteId) return
      const nextDay = format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd')
      navigate(
        `/reservations/new?gite=${encodeURIComponent(giteId)}&start=${dateStr}&end=${nextDay}`,
      )
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const upcoming = reservations
      .filter((r) => r.start_date >= todayStr)
      .slice(0, MAX_UPCOMING_ARRIVALS)

    const monthUrl = (giteIdForTab: string) => {
      const monthQuery = searchParams.get('month')
      return monthQuery
        ? `/calendar/${giteIdForTab}?month=${monthQuery}`
        : `/calendar/${giteIdForTab}`
    }

    return (
      <div className="px-3">
        {/* Gite tabs, flush with the header */}
        <div className="-mx-3 px-5 flex gap-6 border-b border-border overflow-x-auto scrollbar-none">
          {gites.map((g) => (
            <NavLink
              key={g.id}
              to={monthUrl(g.id)}
              className={({ isActive }) =>
                `h-11 flex items-center gap-1.5 shrink-0 border-b-2 text-[14px] ${
                  isActive
                    ? 'text-text font-medium border-action'
                    : 'text-text-tertiary border-transparent'
                }`
              }
            >
              {g.name}
              <span className="font-mono text-[11px] text-text-muted">
                {g.capacity}p
              </span>
            </NavLink>
          ))}
        </div>

        {/* Month title and month navigation */}
        <div className="flex justify-between items-center py-3">
          <h1 className="font-heading font-semibold text-[20px] m-0">
            {capitalizedMonth}
          </h1>
          <div className="flex border border-border-hover rounded-md overflow-hidden shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label={LABELS.previousMonth}
              className="w-11 h-10 flex items-center justify-center text-[16px] text-text border-r border-border-hover"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-10 px-3 flex items-center text-[14px] text-text border-r border-border-hover"
            >
              {LABELS.today}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label={LABELS.nextMonth}
              className="w-11 h-10 flex items-center justify-center text-[16px] text-text"
            >
              ›
            </button>
          </div>
        </div>

        <MobileCalendar
          year={year}
          month={month}
          reservations={reservations}
          loading={loading}
          onClickReservation={openDetail}
          onClickDay={openCreate}
          onSwipeNextMonth={handleNextMonth}
          onSwipePreviousMonth={handlePrevMonth}
        />

        {/* No legend on mobile: the status is read on the detail screen */}
        <UpcomingArrivals
          reservations={upcoming}
          onClickReservation={openDetail}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-5 max-sm:px-3 max-sm:pb-20">
      {/* Header: month title, grouped month navigation, new reservation */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="font-heading font-semibold text-[20px] m-0 max-sm:text-[17px]">
            {capitalizedMonth}
          </h1>
          {/* Segmented 32px control, as in the mockup */}
          <div className="flex border border-border-hover rounded-md overflow-hidden">
            <Button onClick={handlePrevMonth} className="!h-8 !px-3 !rounded-none !border-0" title={LABELS.previousMonth}>
              ‹
            </Button>
            <Button onClick={handleToday} className="!h-8 !px-3 !rounded-none !border-0 !border-x !border-border-hover !text-[13px]">
              {LABELS.today}
            </Button>
            <Button onClick={handleNextMonth} className="!h-8 !px-3 !rounded-none !border-0" title={LABELS.nextMonth}>
              ›
            </Button>
          </div>
        </div>
        <Button variant="primary" onClick={handleNewReservation}>
          {LABELS.newReservation}
        </Button>
      </div>

      {/* Calendar grid */}
      <CalendarGrid
        year={year}
        month={month}
        reservations={reservations}
        loading={loading}
        onClickDay={handleClickDay}
        onClickReservation={handleClickReservation}
      />

      {/* Legend */}
      <div className="mt-4">
        <CalendarLegend />
      </div>

      {/* Reservation modal */}
      {modal && giteId && (
        <ReservationModal
          mode={modal.mode}
          reservation={modal.mode === 'edit' ? modal.reservation : undefined}
          giteId={giteId}
          giteName={giteName}
          defaults={
            modal.mode === 'create' ? modal.defaults : undefined
          }
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
