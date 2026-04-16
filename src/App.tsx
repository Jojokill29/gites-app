import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/layout/ProtectedRoute'

function App() {
  const { user, loading, signIn, signOut } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage onLogin={signIn} />
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <div className="min-h-screen bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl font-bold text-gray-800">
                    Gestion des gîtes
                  </h1>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Se déconnecter
                  </button>
                </div>
                <p className="text-gray-600">
                  Connecté en tant que {user?.email}
                </p>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
