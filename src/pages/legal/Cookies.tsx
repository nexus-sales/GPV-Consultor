import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline'

const COMPANY = {
  legalName: 'Ucoip Canarias',
  tradeName: 'Grupo LMB',
  email: 'info@ucoipcanarias.com',
  product: 'GPV Canarias',
  updated: '15 de marzo de 2025'
}

const CONSENT_KEY = 'gpv_cookie_consent'

export default function Cookies() {
  const [currentConsent, setCurrentConsent] = useState<string | null>(
    localStorage.getItem(CONSENT_KEY)
  )

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setCurrentConsent('accepted')
  }

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    setCurrentConsent('rejected')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <CursorArrowRaysIcon className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Política de Cookies
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Directiva 2009/136/CE · Ley 34/2002 (LSSICE) Art. 22.2 ·
              Reglamento (UE) 2016/679 (RGPD)
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mb-8">
          Última actualización: {COMPANY.updated}
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              1. ¿Qué es el almacenamiento local?
            </h2>
            <p className="text-slate-300">
              Las cookies y el almacenamiento local son pequeños archivos o
              registros que se guardan en tu dispositivo cuando visitas o usas
              una aplicación web. Permiten que la aplicación recuerde
              información entre sesiones.{' '}
              <strong className="text-white">{COMPANY.product}</strong> no
              utiliza cookies de rastreo ni publicidad. Usamos exclusivamente{' '}
              <strong className="text-white">
                almacenamiento local del navegador (localStorage)
              </strong>{' '}
              y una cookie de sesión segura de Supabase.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              2. Almacenamiento que utilizamos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-left">
                    <th className="px-3 py-2 rounded-tl-lg font-semibold text-slate-400">
                      Nombre
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-400">
                      Tipo
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-400">
                      Finalidad
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-400">
                      Duración
                    </th>
                    <th className="px-3 py-2 rounded-tr-lg font-semibold text-slate-400">
                      Necesario
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    [
                      'sb-*-auth-token',
                      'Cookie sesión',
                      'Autenticación segura de usuario (Supabase)',
                      'Sesión',
                      'Sí'
                    ],
                    [
                      'gpv_cookie_consent',
                      'localStorage',
                      'Guarda tu preferencia de consentimiento',
                      'Permanente',
                      'Sí'
                    ],
                    [
                      'leads',
                      'localStorage',
                      'Caché offline de datos de leads',
                      'Permanente',
                      'Funcional'
                    ],
                    [
                      'distributors',
                      'localStorage',
                      'Caché offline de distribuidores',
                      'Permanente',
                      'Funcional'
                    ],
                    [
                      'candidates',
                      'localStorage',
                      'Caché offline de candidatos',
                      'Permanente',
                      'Funcional'
                    ],
                    [
                      'visits',
                      'localStorage',
                      'Caché offline de visitas',
                      'Permanente',
                      'Funcional'
                    ],
                    [
                      'sales',
                      'localStorage',
                      'Caché offline de ventas',
                      'Permanente',
                      'Funcional'
                    ],
                    [
                      'syncQueue',
                      'localStorage',
                      'Cola de sincronización para modo offline',
                      'Hasta sync',
                      'Funcional'
                    ],
                    [
                      'theme',
                      'localStorage',
                      'Preferencia de tema claro/oscuro',
                      'Permanente',
                      'Funcional'
                    ],
                    [
                      'lastSync',
                      'localStorage',
                      'Marca temporal de última sincronización',
                      'Permanente',
                      'Funcional'
                    ]
                  ].map(([name, type, purpose, duration, necessary]) => (
                    <tr key={name} className="hover:bg-slate-900/50">
                      <td className="px-3 py-2 font-mono text-indigo-400">
                        {name}
                      </td>
                      <td className="px-3 py-2">{type}</td>
                      <td className="px-3 py-2 text-slate-400">{purpose}</td>
                      <td className="px-3 py-2">{duration}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            necessary === 'Sí'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          {necessary}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              * No utilizamos Google Analytics, Meta Pixel, ni ninguna otra
              cookie de publicidad o rastreo de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              3. Base jurídica
            </h2>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>
                <strong className="text-white">
                  Almacenamiento estrictamente necesario
                </strong>{' '}
                (sesión, consentimiento, sincronización): no requiere
                consentimiento previo — art. 22.2 LSSICE y Considerando 25 de la
                Directiva ePrivacy.
              </li>
              <li>
                <strong className="text-white">Almacenamiento funcional</strong>{' '}
                (caché offline, preferencias): basado en tu consentimiento —
                art. 6.1.a RGPD.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              4. Gestión de tu consentimiento
            </h2>
            <p className="text-slate-300 mb-4">
              Puedes modificar tu preferencia en cualquier momento. Ten en
              cuenta que rechazar el almacenamiento funcional puede afectar al
              funcionamiento offline de la aplicación.
            </p>

            <div className="bg-slate-900 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-3">
                Estado actual:{' '}
                {currentConsent === 'accepted' && (
                  <span className="text-emerald-400 font-semibold">
                    Aceptado
                  </span>
                )}
                {currentConsent === 'rejected' && (
                  <span className="text-red-400 font-semibold">Rechazado</span>
                )}
                {!currentConsent && (
                  <span className="text-yellow-400 font-semibold">
                    Sin decidir
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={accept}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Aceptar todo
                </button>
                <button
                  onClick={reject}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 border border-slate-600 hover:border-slate-500 hover:text-slate-300 transition-colors"
                >
                  Solo necesario
                </button>
              </div>
            </div>

            <p className="text-slate-500 text-xs mt-3">
              Para eliminar el almacenamiento local manualmente: abre las
              herramientas de desarrollo de tu navegador (F12) → Aplicación →
              Almacenamiento local → Borrar.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              5. Contacto
            </h2>
            <p className="text-slate-300">
              Para cualquier consulta sobre el uso de cookies o almacenamiento
              local, puedes contactar con nuestro Delegado de Protección de
              Datos en{' '}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                {COMPANY.email}
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link
            to="/legal/aviso"
            className="hover:text-indigo-400 transition-colors"
          >
            Aviso Legal
          </Link>
          <Link
            to="/legal/privacidad"
            className="hover:text-indigo-400 transition-colors"
          >
            Política de Privacidad
          </Link>
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName} ·{' '}
            {COMPANY.tradeName}
          </span>
        </div>
      </div>
    </div>
  )
}
