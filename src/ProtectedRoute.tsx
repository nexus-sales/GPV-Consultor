import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './lib/hooks/useAuth'

/**
 * Protege rutas: si no hay usuario autenticado, redirige a /login
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
