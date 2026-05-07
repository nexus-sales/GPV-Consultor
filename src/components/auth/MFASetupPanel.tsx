import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

type Step = 'status' | 'enrolling' | 'verifying_enroll' | 'disabling'

interface TOTPFactor {
  id: string
  status: 'verified' | 'unverified'
}

export function MFASetupPanel() {
  const [step, setStep] = useState<Step>('status')
  const [factors, setFactors] = useState<TOTPFactor[]>([])
  const [qrSvg, setQrSvg] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')
  const [challengeId, setChallengeId] = useState<string>('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const loadFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = (data?.totp ?? []) as TOTPFactor[]
    setFactors(totp)
  }

  useEffect(() => {
    loadFactors()
  }, [])

  const enrolledFactor = factors.find((f) => f.status === 'verified')
  const isEnabled = Boolean(enrolledFactor)
  const safeQrSvg = useMemo(() => {
    if (!qrSvg) return ''
    const trimmed = qrSvg.trim()
    const isSvg = /^<svg[\s\S]*<\/svg>$/.test(trimmed)
    const hasUnsafeTokens = /<script|on\w+=|javascript:/i.test(trimmed)
    return isSvg && !hasUnsafeTokens ? trimmed : ''
  }, [qrSvg])

  const handleStartEnroll = async () => {
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    })
    setLoading(false)
    if (error || !data) {
      setError(error?.message ?? 'Error al iniciar el registro')
      return
    }
    setQrSvg(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
    // Crear challenge inmediatamente
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: data.id
    })
    if (chErr || !ch) {
      setError(chErr?.message ?? 'Error al crear challenge')
      return
    }
    setChallengeId(ch.id)
    setStep('enrolling')
  }

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.replace(/\s/g, '')
    })
    setLoading(false)
    if (error) {
      setError('Código incorrecto. Inténtalo de nuevo.')
      setCode('')
      return
    }
    await loadFactors()
    setStep('status')
    setQrSvg('')
    setSecret('')
    setCode('')
    setSuccess('Autenticación de dos factores activada correctamente.')
    setTimeout(() => setSuccess(null), 4000)
  }

  const handleStartDisable = async () => {
    setError(null)
    if (!enrolledFactor) return
    // Crear challenge para confirmar desactivación
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: enrolledFactor.id
    })
    if (chErr || !ch) {
      setError(chErr?.message ?? 'Error al crear challenge')
      return
    }
    setFactorId(enrolledFactor.id)
    setChallengeId(ch.id)
    setCode('')
    setStep('disabling')
  }

  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // Verificar primero
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.replace(/\s/g, '')
    })
    if (verErr) {
      setLoading(false)
      setError('Código incorrecto. Inténtalo de nuevo.')
      setCode('')
      return
    }
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    await loadFactors()
    setStep('status')
    setCode('')
    setSuccess('Autenticación de dos factores desactivada.')
    setTimeout(() => setSuccess(null), 4000)
  }

  const handleCancel = () => {
    // Si cancelamos durante enrollment, limpiar el factor unverified
    if (step === 'enrolling' && factorId) {
      supabase.auth.mfa.unenroll({ factorId }).catch(() => {})
    }
    setStep('status')
    setCode('')
    setError(null)
    setQrSvg('')
    setSecret('')
  }

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
          isEnabled
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}
      >
        <ShieldCheckIcon className="w-5 h-5 flex-shrink-0" />
        <span>
          2FA: <strong>{isEnabled ? 'Activado' : 'Desactivado'}</strong>
          {isEnabled && ' — Tu cuenta está protegida con TOTP'}
        </span>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm">
          <CheckCircleIcon className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* STATUS STEP */}
      {step === 'status' &&
        (!isEnabled ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Añade una capa extra de seguridad. Al activarlo necesitarás
              introducir un código de 6 dígitos de tu app de autenticación
              (Google Authenticator, Authy, etc.) cada vez que inicies sesión.
            </p>
            <button
              onClick={handleStartEnroll}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <QrCodeIcon className="w-4 h-4" />
              {loading ? 'Iniciando...' : 'Activar autenticación en 2 pasos'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              El 2FA está activo. Para desactivarlo deberás confirmar con tu app
              de autenticación.
            </p>
            <button
              onClick={handleStartDisable}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors"
            >
              Desactivar 2FA
            </button>
          </div>
        ))}

      {/* ENROLL STEP - QR */}
      {step === 'enrolling' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">
              1. Escanea el código QR
            </p>
            <p className="text-xs text-slate-400">
              Abre Google Authenticator, Authy o similar y escanea el código.
            </p>
            {safeQrSvg && (
              <div className="flex justify-center">
                <div
                  className="bg-white p-3 rounded-xl w-44 h-44"
                  dangerouslySetInnerHTML={{ __html: safeQrSvg }}
                />
              </div>
            )}
          </div>

          {secret && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">
                ¿No puedes escanear? Introduce esta clave manualmente:
              </p>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                <KeyIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <code className="text-xs text-indigo-300 font-mono break-all select-all">
                  {secret}
                </code>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyEnroll} className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                2. Introduce el código de verificación
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Activar 2FA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DISABLE STEP */}
      {step === 'disabling' && (
        <form onSubmit={handleConfirmDisable} className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Para desactivar el 2FA introduce el código de tu app de
              autenticación.
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Desactivando...' : 'Confirmar desactivación'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
