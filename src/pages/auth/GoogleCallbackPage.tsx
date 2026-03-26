/**
 * Página de callback para OAuth de Google
 * Maneja la redirección después de autenticar con Google
 */

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { useGoogleOAuthCallback } from '../../lib/integrations/google'
import { logger } from '../../lib/logger'

const log = logger.create('GoogleCallback')

const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { handleCallback, isLoading, error } = useGoogleOAuthCallback()
  const { loading: authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const hasHandledCallback = useRef(false)
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing'
  )

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (hasHandledCallback.current) {
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (!isAuthenticated) {
      hasHandledCallback.current = true
      log.warn('No hay sesión de Supabase disponible en callback de Google')
      setStatus('error')
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    if (errorParam) {
      hasHandledCallback.current = true
      log.error('Error en OAuth Google', errorParam)
      setStatus('error')
      setTimeout(() => navigate('/settings'), 3000)
      return
    }

    if (code) {
      hasHandledCallback.current = true
      log.info('Código de autorización recibido')
      handleCallback(code, state)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'))
    } else {
      hasHandledCallback.current = true
      log.warn('No se recibió código de autorización')
      setStatus('error')
      setTimeout(() => navigate('/settings'), 3000)
    }
  }, [authLoading, isAuthenticated, searchParams, handleCallback, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        {authLoading || isLoading || status === 'processing' ? (
          <>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Conectando con Google...
            </h2>
            <p className="text-gray-500">
              Por favor espera mientras completamos la autenticación
            </p>
          </>
        ) : error || status === 'error' ? (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error de autenticación
            </h2>
            <p className="text-gray-500 mb-4">
              {error || 'No se pudo completar la autenticación con Google'}
            </p>
            <p className="text-sm text-gray-400">
              Redirigiendo a configuración...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Autenticación completada!
            </h2>
            <p className="text-gray-500">Google conectado exitosamente</p>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCallbackPage
