import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useGites } from './hooks/useGites'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import FinancesPage from './pages/FinancesPage'
import InvoicesPage from './pages/InvoicesPage'
import ExportPage from './pages/ExportPage'
import ProtectedRoute from './components/layout/ProtectedRoute'
import TopBar from './components/layout/TopBar'
import TabBar from './components/layout/TabBar'

function AppLayout() {
  const { user, signOut } = useAuth()
  const { gites, loading: gitesLoading, error: gitesError } = useGites()

  const firstGiteId = gites.length > 0 ? gites[0].id : null

  return (
    <div className="min-h-screen bg-bg">
      <TopBar email={user?.email ?? ''} onLogout={signOut} />
      <TabBar gites={gites} loading={gitesLoading} error={gitesError} />
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
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function AppRoutes() {
  const { user, loading, signIn } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={signIn} />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
