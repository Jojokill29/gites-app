import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { addDays, addMonths, subMonths, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useReservations } from '../hooks/useReservations'
import CalendarGrid from '../components/calendar/CalendarGrid'
import CalendarLegend from '../components/calendar/CalendarLegend'
import ReservationModal from '../components/reservation/ReservationModal'
import Button from '../components/ui/Button'
import { LABELS } from '../constants/labels'
import type { Gite } from '../types/domain'
import type { Reservation } from '../types/domain'

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

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      {/* Header: month navigation + legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Button onClick={handlePrevMonth} className="px-2.5 py-1" title={LABELS.previousMonth}>
            ‹
          </Button>
          <span className="font-heading font-semibold text-[20px] min-w-[160px] text-center max-sm:text-[17px] max-sm:min-w-[130px]">
            {capitalizedMonth}
          </span>
          <Button onClick={handleNextMonth} className="px-2.5 py-1" title={LABELS.nextMonth}>
            ›
          </Button>
          <Button onClick={handleToday} className="px-2.5 py-1 text-[12px] ml-1">
            {LABELS.today}
          </Button>
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

      {/* New reservation button */}
      <Button className="w-full mt-4" onClick={handleNewReservation}>
        {LABELS.newReservation}
      </Button>

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
