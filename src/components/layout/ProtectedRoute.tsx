import { Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  user: User | null
  loading: boolean
  children: React.ReactNode
}

export default function ProtectedRoute({ user, loading, children }: ProtectedRouteProps) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-[14px] text-text-tertiary">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
