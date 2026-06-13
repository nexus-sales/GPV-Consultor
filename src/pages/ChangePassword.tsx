import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('at least') || m.includes('characters') || m.includes('too short'))
    return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('different') || m.includes('same as'))
    return 'La nueva contraseña debe ser distinta a la actual.'
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'Error de red. Comprueba tu conexión e inténtalo de nuevo.'
  return 'Error al cambiar la contraseña. Inténtalo de nuevo.'
}

const ChangePassword: React.FC = () => {
  const { isAuthenticated, authUser, setMustChangePassword } = useAuth()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Guardas de ruta
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (authUser && !authUser.mustChangePassword) return <Navigate to="/" replace />

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
  const isValid = newPassword.length >= 8 && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !authUser) return
    setLoading(true)
    setError(null)

    // 1. Cambiar contraseña en Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({ password: newPassword })
    if (authError) {
      setError(translateError(authError.message))
      setLoading(false)
      return
    }

    // 2. Actualizar el flag en el perfil
    const { error: profileError } = await supabase
      .from('user_profilesGPV')
      .update({ must_change_password: false })
      .eq('id', authUser.id)

    if (profileError) {
      setError('Contraseña cambiada, pero no se pudo actualizar el perfil. Contacta al administrador.')
      setLoading(false)
      return
    }

    // 3. Actualizar estado React y redirigir
    setMustChangePassword(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <LockClosedIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cambia tu contraseña
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            El administrador requiere que establezcas una contraseña personal
            antes de continuar.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 pr-11 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  Mínimo 8 caracteres ({newPassword.length}/8)
                </p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                  Las contraseñas no coinciden.
                </p>
              )}
              {passwordsMatch && (
                <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckIcon className="h-3.5 w-3.5" /> Las contraseñas coinciden.
                </p>
              )}
            </div>

            {/* Error global */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white font-semibold py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <LockClosedIcon className="h-4 w-4" />
              )}
              {loading ? 'Guardando...' : 'Establecer contraseña'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          GPV Canarias · Acceso seguro
        </p>
      </div>
    </div>
  )
}

export default ChangePassword
