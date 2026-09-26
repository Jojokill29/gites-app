import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MobileTopBar from './MobileTopBar'
import MobileTabBar from './MobileTabBar'
import MoreSheet from './MoreSheet'
import CalendarPage from '../../pages/CalendarPage'
import ReservationsPage from '../../pages/ReservationsPage'
import ReservationDetailPage from '../../pages/ReservationDetailPage'
import ReservationFormPage from '../../pages/ReservationFormPage'
import FinancesPage from '../../pages/FinancesPage'
import InvoicesPage from '../../pages/InvoicesPage'
import ExportPage from '../../pages/ExportPage'
import { LABELS } from '../../constants/labels'
import { getDisplayName } from '../../utils/displayName'
import type { Gite } from '../../types/domain'

interface MobileLayoutProps {
  gites: Gite[]
  gitesError: string | null
  email: string
  onLogout: () => void
}

// Header title per screen; the calendar shows the app name and the identifier
const TITLES: Record<string, string> = {
  '/reservations': LABELS.mobile.reservations,
  '/finances': LABELS.finances,
  '/invoices': LABELS.factures,
  '/export': LABELS.export,
}

/**
 * Layout for screens 640px wide or less: 52px header, fixed bottom navigation,
 * and the two full-screen routes (stay detail and reservation form) which carry
 * their own header and hide the navigation.
 */
export default function MobileLayout({
  gites,
  gitesError,
  email,
  onLogout,
}: MobileLayoutProps) {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  // Anything below /reservations/ is a full-screen screen: /reservations/new,
  // /reservations/:id and /reservations/:id/edit
  const fullscreen = /^\/reservations\/.+/.test(pathname)

  const firstGiteId = gites.length > 0 ? gites[0].id : null
  const calendarMatch = pathname.match(/^\/calendar\/([^/]+)/)
  const currentGiteId = calendarMatch ? calendarMatch[1] : firstGiteId

  const title = TITLES[pathname] ?? LABELS.appTitle
  const identifier = TITLES[pathname] ? undefined : getDisplayName(email)

  const routes = (
    <Routes>
      <Route
        path="/"
        element={
          firstGiteId ? (
            <Navigate to={`/calendar/${firstGiteId}`} replace />
          ) : (
            <div />
          )
        }
      />
      <Route path="/calendar/:giteId" element={<CalendarPage gites={gites} />} />
      <Route path="/reservations" element={<ReservationsPage gites={gites} />} />
      <Route
        path="/reservations/new"
        element={<ReservationFormPage gites={gites} mode="create" />}
      />
      <Route
        path="/reservations/:id"
        element={<ReservationDetailPage gites={gites} />}
      />
      <Route
        path="/reservations/:id/edit"
        element={<ReservationFormPage gites={gites} mode="edit" />}
      />
      <Route path="/finances" element={<FinancesPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  if (fullscreen) {
    return <div className="min-h-screen bg-bg">{routes}</div>
  }

  return (
    <div className="min-h-screen bg-bg">
      <MobileTopBar title={title} identifier={identifier} />

      {gitesError && (
        <p className="px-4 py-3 text-[13px] text-status-red-text">
          {LABELS.errorLoadGites}
        </p>
      )}

      {/* Bottom padding so the content never slides under the navigation */}
      <main style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
        {routes}
      </main>

      <MobileTabBar
        currentGiteId={currentGiteId}
        onOpenMore={() => setMoreOpen(true)}
        moreOpen={moreOpen}
      />

      <MoreSheet
        open={moreOpen}
        displayName={getDisplayName(email)}
        onClose={() => setMoreOpen(false)}
        onLogout={onLogout}
      />
    </div>
  )
}
