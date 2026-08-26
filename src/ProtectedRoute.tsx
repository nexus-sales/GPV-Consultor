import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './lib/hooks/useAuth'
import { useInactivityTimeout } from './lib/hooks/useInactivityTimeout'
import { appNavigationItems, canAccessNavigationItem } from './lib/navigation'

/**
 * Protege rutas: exige sesión Auth activa Y perfil válido en user_profilesGPV.
 * Sin perfil GPV el acceso queda denegado aunque la sesión Auth sea válida.
 *
 * Además aplica el `minRole` declarado en navigation.ts — la misma regla que
 * usa el Sidebar para ocultar entradas de menú —, de modo que escribir la URL
 * a mano no salte el filtro que el menú sí aplica.
 *
 * El rol proviene de `authUser`, que AuthContext carga desde user_profilesGPV;
 * no de ningún dato manipulable por el cliente.
 *
 * Esto es defensa en profundidad, no la frontera real de autorización: los
 * datos los protege el servidor. Sirve para que un usuario no aterrice en
 * pantallas que no le corresponden.
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, authUser, profileLoaded, signOut } =
    useAuth()
  const location = useLocation()

  useInactivityTimeout({ signOut, enabled: !!authUser })

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

  // Perfil cargado pero el admin marcó cambio de contraseña obligatorio
  if (authUser.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  // Rol insuficiente para una ruta con minRole declarado → al Dashboard.
  // Solo pueden denegar los items que declaran minRole; el resto de rutas
  // (y las que no están en el menú, como /candidates/:id o /profile) pasan.
  const restrictedItem = appNavigationItems.find(
    (item) =>
      item.minRole &&
      (location.pathname === item.href ||
        location.pathname.startsWith(`${item.href}/`))
  )

  if (
    restrictedItem &&
    !canAccessNavigationItem(restrictedItem, authUser.role)
  ) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
