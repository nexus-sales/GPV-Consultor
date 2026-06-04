import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './lib/hooks/useAuth'

/**
 * Protege rutas: exige sesión Auth activa Y perfil válido en user_profilesGPV.
 * Sin perfil GPV el acceso queda denegado aunque la sesión Auth sea válida.
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, authUser, profileLoaded } = useAuth()

  // Cargando sesión inicial o esperando que loadUserProfile termine
  if (loading || (isAuthenticated && !profileLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // Sin sesión Auth → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Sesión Auth válida pero sin perfil GPV (denyAccess hizo signOut;
  // este branch actúa como red de seguridad si el redirect no llegó a tiempo)
  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
