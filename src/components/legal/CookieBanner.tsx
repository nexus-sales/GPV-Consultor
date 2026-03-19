import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const CONSENT_KEY = 'gpv_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-fade-in"
    >
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <ShieldCheckIcon className="w-8 h-8 text-indigo-400 flex-shrink-0 mt-0.5 sm:mt-0" />

        <div className="flex-1 text-sm text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">
            Uso de almacenamiento local
          </span>{' '}
          — Esta aplicación usa{' '}
          <strong>almacenamiento local (localStorage)</strong> estrictamente
          necesario para su funcionamiento (sesión, preferencias y datos
          offline) y servicios de backend seguros (Supabase). No utilizamos
          cookies de rastreo ni publicidad. Consulta nuestra{' '}
          <Link
            to="/legal/cookies"
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            Política de Cookies
          </Link>{' '}
          y{' '}
          <Link
            to="/legal/privacidad"
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            Política de Privacidad
          </Link>
          .
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 border border-slate-600 hover:border-slate-500 hover:text-slate-300 transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Aceptar
          </button>
        </div>

        <button
          onClick={reject}
          aria-label="Cerrar aviso de cookies"
          className="absolute top-3 right-3 sm:static text-slate-500 hover:text-slate-300 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
