import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Props {
  factorId: string
  onSuccess: () => void
  onCancel: () => void
}

export function MFAVerifyStep({ factorId, onSuccess, onCancel }: Props) {
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.mfa.challenge({ factorId }).then(({ data, error }) => {
      if (error || !data) {
        setError('No se pudo iniciar la verificación. Inténtalo de nuevo.')
        return
      }
      setChallengeId(data.id)
    })
  }, [factorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeId) return
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.replace(/\s/g, '')
    })
    setLoading(false)
    if (error) {
      setError('Código incorrecto o expirado. Inténtalo de nuevo.')
      setCode('')
      return
    }
    onSuccess()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 mb-3">
          <ShieldCheckIcon className="w-7 h-7 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white">
          Verificación en dos pasos
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Introduce el código de 6 dígitos de tu app de autenticación
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          disabled={!challengeId}
          className="w-full text-center text-3xl font-mono tracking-widest px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
        />

        <button
          type="submit"
          disabled={loading || code.length < 6 || !challengeId}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>

      <button
        onClick={onCancel}
        className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors"
      >
        Volver al inicio de sesión
      </button>
    </div>
  )
}
