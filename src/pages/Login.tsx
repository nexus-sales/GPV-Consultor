import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { MFAVerifyStep } from '../components/auth/MFAVerifyStep'
import {
  UserIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [useOTP, setUseOTP] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState<string | null>(null)

  const navigate = useNavigate()
  const { signInWithPassword, signInWithOTP, resetPassword, isAuthenticated } =
    useAuth()

  // Leer motivo de denegación dejado por loadUserProfile vía sessionStorage
  useEffect(() => {
    const reason = sessionStorage.getItem('gpv_access_denied')
    if (reason === 'no_profile') {
      setAccessDenied('No tienes acceso a esta aplicación. Contacta con el administrador.')
      sessionStorage.removeItem('gpv_access_denied')
    } else if (reason === 'network_error') {
      setAccessDenied('Error temporal al verificar tu acceso. Inténtalo de nuevo en unos segundos.')
      sessionStorage.removeItem('gpv_access_denied')
    } else if (reason === 'inactivity') {
      setAccessDenied('Sesión cerrada por inactividad. Vuelve a iniciar sesión.')
      sessionStorage.removeItem('gpv_access_denied')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let error

      if (useOTP) {
        ;({ error } = await signInWithOTP(email))
        if (!error) {
          setMessage('Revisa tu correo para el enlace de acceso.')
        }
      } else {
        ;({ error } = await signInWithPassword(email, password))
        if (!error) {
          // Comprobar si el usuario tiene 2FA activo
          const { data: mfaData } = await supabase.auth.mfa.listFactors()
          const verifiedFactor = mfaData?.totp?.find(
            (f: { status: string }) => f.status === 'verified'
          )
          if (verifiedFactor) {
            // Requiere verificación TOTP antes de entrar
            setMfaFactorId(verifiedFactor.id)
            setLoading(false)
            return
          }
          setMessage('Acceso correcto. Redirigiendo...')
          setTimeout(() => {
            navigate('/dashboard')
          }, 800)
        }
      }

      if (error) {
        // Fallback demo SOLO en desarrollo para facilitar pruebas locales/E2E.
        // Importante: no permitir bypass de auth en producción.
        if (
          import.meta.env.DEV &&
          email === 'admin@gpv.local' &&
          password === 'admin'
        ) {
          setMessage('Modo Demo Activado. Entrando...')
          setTimeout(() => navigate('/dashboard'), 1000)
          return
        }
        setMessage('Error: ' + error.message)
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setMessage(`Error inesperado: ${errorMessage}`)
    }

    setLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage(null)

    const { error } = await resetPassword(resetEmail)
    setResetLoading(false)

    if (error) {
      setResetMessage('Error: ' + error.message)
    } else {
      setResetMessage('Revisa tu correo para restablecer la contraseña.')
    }
  }

  // Paso MFA: mostrar verificación TOTP si aplica
  if (mfaFactorId) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative w-full max-w-md px-6 z-10">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 md:p-10">
            <MFAVerifyStep
              factorId={mfaFactorId}
              onSuccess={() => navigate('/dashboard')}
              onCancel={async () => {
                await supabase.auth.signOut()
                setMfaFactorId(null)
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative w-full max-w-md px-6 z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              GPV Canarias
            </h1>
            <p className="text-slate-400 text-sm">
              Gestión Integral de Puntos de Venta
            </p>
          </div>

          {accessDenied && (
            <div className="mb-6 p-3 rounded-xl text-xs text-center font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              {accessDenied}
            </div>
          )}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Login Method Toggle */}
              <div className="flex p-1 bg-slate-800/50 rounded-xl mb-8 border border-white/5">
                <button
                  type="button"
                  onClick={() => setUseOTP(false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    !useOTP
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => setUseOTP(true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    useOTP
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              <div className="space-y-4">
                {/* Email Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo corporativo"
                    className="w-full bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 block pl-11 p-3.5 transition-all outline-none"
                    required
                  />
                </div>

                {/* Password Input */}
                {!useOTP && (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña"
                      className="w-full bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 block pl-11 pr-10 p-3.5 transition-all outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {loading
                    ? 'Procesando...'
                    : useOTP
                      ? 'Enviar enlace mágico'
                      : 'Iniciar Sesión'}
                  {!loading && (
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
              </button>

              {/* Forgot Password Link */}
              {!useOTP && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReset(true)
                      setMessage(null)
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Notifications */}
              {message && (
                <div
                  className={`p-3 rounded-xl text-xs text-center font-medium animate-fade-in ${
                    message.includes('Error')
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {message}
                </div>
              )}
            </form>
          ) : (
            <form
              onSubmit={handleResetPassword}
              className="space-y-6 animate-fade-in"
            >
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-white">
                  Recuperar acceso
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Te enviaremos las instrucciones a tu correo
                </p>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Correo asociado a tu cuenta"
                  className="w-full bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 block pl-11 p-3.5 transition-all outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full relative flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-slate-700 hover:bg-slate-600 border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-all duration-300"
              >
                {resetLoading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReset(false)
                  setResetMessage(null)
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Volver al inicio de sesión
              </button>

              {resetMessage && (
                <div
                  className={`p-3 rounded-xl text-xs text-center font-medium animate-fade-in ${
                    resetMessage.includes('Error')
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {resetMessage}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-600">
            <Link
              to="/legal/aviso"
              className="hover:text-indigo-400 transition-colors"
            >
              Aviso Legal
            </Link>
            <span>·</span>
            <Link
              to="/legal/privacidad"
              className="hover:text-indigo-400 transition-colors"
            >
              Privacidad
            </Link>
            <span>·</span>
            <Link
              to="/legal/cookies"
              className="hover:text-indigo-400 transition-colors"
            >
              Cookies
            </Link>
          </div>
          <p className="text-slate-700 text-[10px]">
            &copy; {new Date().getFullYear()} Grupo LMB. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
