import { useParams, useSearchParams } from 'react-router-dom'
import { addMonths, subMonths, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useReservations } from '../hooks/useReservations'
import CalendarGrid from '../components/calendar/CalendarGrid'
import CalendarLegend from '../components/calendar/CalendarLegend'
import { LABELS } from '../constants/labels'

export default function CalendarPage() {
  const { giteId } = useParams<{ giteId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read month from URL or default to current month
  const monthParam = searchParams.get('month')
  const currentDate = monthParam
    ? parseISO(monthParam + '-01')
    : new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { reservations, loading } = useReservations(giteId, year, month)

  const goToMonth = (date: Date) => {
    setSearchParams({ month: format(date, 'yyyy-MM') })
  }

  const handlePrevMonth = () => goToMonth(subMonths(currentDate, 1))
  const handleNextMonth = () => goToMonth(addMonths(currentDate, 1))
  const handleToday = () => goToMonth(new Date())

  // Capitalize first letter of month name
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: fr })
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const handleClickDay = (dateStr: string) => {
    console.log('Day clicked:', dateStr, '(will open new reservation form in step 6)')
  }

  const handleClickReservation = (reservationId: string) => {
    console.log('Reservation clicked:', reservationId, '(will open reservation modal in step 6)')
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      {/* Header: month navigation + legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrevMonth}
            className="px-2.5 py-1 text-[13px] font-medium border border-border-hover rounded-[10px] bg-surface hover:bg-surface-alt cursor-pointer"
            title={LABELS.previousMonth}
          >
            ‹
          </button>
          <span className="font-heading font-semibold text-[20px] min-w-[160px] text-center max-sm:text-[17px] max-sm:min-w-[130px]">
            {capitalizedMonth}
          </span>
          <button
            onClick={handleNextMonth}
            className="px-2.5 py-1 text-[13px] font-medium border border-border-hover rounded-[10px] bg-surface hover:bg-surface-alt cursor-pointer"
            title={LABELS.nextMonth}
          >
            ›
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-[12px] font-medium border border-border-hover rounded-[10px] bg-surface hover:bg-surface-alt cursor-pointer ml-1"
          >
            {LABELS.today}
          </button>
        </div>
        <CalendarLegend />
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

      {/* New reservation button (placeholder, wired in step 6) */}
      <button
        className="w-full mt-4 py-2 px-3.5 text-[13px] font-medium border border-border-hover rounded-[10px] bg-surface hover:bg-surface-alt cursor-pointer"
        onClick={() => console.log('New reservation (will be wired in step 6)')}
      >
        {LABELS.newReservation}
      </button>
    </div>
  )
}
