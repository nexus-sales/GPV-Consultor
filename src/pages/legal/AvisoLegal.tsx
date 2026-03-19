import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const COMPANY = {
  legalName: 'Ucoip Canarias',
  tradeName: 'Grupo LMB',
  cif: 'B76525567',
  address:
    'Calle La Tierra N11, 38205, San Cristóbal de La Laguna, Santa Cruz de Tenerife',
  phone: '+34 607 892 939',
  email: 'info@ucoipcanarias.com',
  product: 'GPV Canarias'
}

export default function AvisoLegal() {
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
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheckIcon className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Aviso Legal</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de
              la Sociedad de la Información y Comercio Electrónico (LSSICE)
            </p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              1. Datos identificativos del titular
            </h2>
            <div className="bg-slate-900 rounded-xl p-4 space-y-2 text-slate-300">
              <p>
                <span className="text-slate-500">Razón social:</span>{' '}
                <strong className="text-white">{COMPANY.legalName}</strong>
              </p>
              <p>
                <span className="text-slate-500">Nombre comercial:</span>{' '}
                <strong className="text-white">{COMPANY.tradeName}</strong>{' '}
                <span className="text-slate-600 text-xs">
                  (desarrollo de aplicaciones con IA)
                </span>
              </p>
              <p>
                <span className="text-slate-500">CIF:</span> {COMPANY.cif}
              </p>
              <p>
                <span className="text-slate-500">Domicilio social:</span>{' '}
                {COMPANY.address}
              </p>
              <p>
                <span className="text-slate-500">Teléfono:</span>{' '}
                {COMPANY.phone}
              </p>
              <p>
                <span className="text-slate-500">Correo electrónico:</span>{' '}
                {COMPANY.email}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              2. Objeto y ámbito de aplicación
            </h2>
            <p className="text-slate-300">
              <strong className="text-white">{COMPANY.product}</strong> es una
              aplicación web de gestión comercial de puntos de venta,
              desarrollada por{' '}
              <strong className="text-white">{COMPANY.tradeName}</strong> bajo
              la razón social{' '}
              <strong className="text-white">{COMPANY.legalName}</strong>,
              destinada exclusivamente a uso empresarial interno por parte de
              los usuarios autorizados. El acceso está restringido mediante
              credenciales personales e intransferibles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              3. Propiedad intelectual e industrial
            </h2>
            <p className="text-slate-300">
              Todos los contenidos de la aplicación —incluyendo, sin carácter
              limitativo, el software, diseño, logotipos, textos, gráficos y
              base de datos— son propiedad exclusiva de{' '}
              <strong className="text-white">{COMPANY.legalName}</strong> (
              {COMPANY.tradeName}) o disponen de licencia de uso en su favor, y
              están protegidos por la normativa española y europea sobre
              propiedad intelectual e industrial. Queda expresamente prohibida
              su reproducción, distribución, comunicación pública o
              transformación sin autorización escrita del titular.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              4. Condiciones de uso
            </h2>
            <p className="text-slate-300 mb-2">
              El acceso y uso de {COMPANY.product} implica la aceptación plena
              de las presentes condiciones. El usuario se compromete a:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>
                Hacer un uso lícito de la aplicación, conforme a la ley y buena
                fe.
              </li>
              <li>No ceder sus credenciales de acceso a terceros.</li>
              <li>
                No introducir datos falsos, erróneos o de terceros sin su
                consentimiento.
              </li>
              <li>
                No realizar acciones que puedan dañar, inutilizar o sobrecargar
                la aplicación.
              </li>
              <li>
                Notificar de inmediato cualquier acceso no autorizado a su
                cuenta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              5. Responsabilidad
            </h2>
            <p className="text-slate-300">
              {COMPANY.legalName} ({COMPANY.tradeName}) no será responsable de
              los daños derivados del uso indebido de la aplicación, de la
              introducción de datos incorrectos por parte del usuario, ni de
              interrupciones del servicio ajenas a su voluntad (causas de fuerza
              mayor, fallos de terceros proveedores, etc.). La empresa adopta
              las medidas técnicas y organizativas razonables para garantizar la
              disponibilidad y seguridad del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              6. Uso de Inteligencia Artificial — Reglamento (UE) 2024/1689
            </h2>
            <p className="text-slate-300 mb-2">
              {COMPANY.product} incorpora funcionalidades asistidas por
              Inteligencia Artificial (extracción de datos de negocios desde
              Google Places, sugerencias de leads). De conformidad con el{' '}
              <strong className="text-white">
                Reglamento (UE) 2024/1689 sobre Inteligencia Artificial (EU AI
                Act)
              </strong>
              :
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>
                El sistema de IA está clasificado como{' '}
                <strong className="text-white">riesgo bajo</strong> (herramienta
                de apoyo a la decisión comercial, sin automatización de
                decisiones con efectos jurídicos sobre personas).
              </li>
              <li>
                Ninguna decisión relativa a personas físicas se adopta de forma
                exclusivamente automatizada sin supervisión humana.
              </li>
              <li>
                Los datos empleados por los modelos de IA son datos comerciales
                de empresas (no datos personales sensibles).
              </li>
              <li>
                El usuario es siempre informado de qué funcionalidades utilizan
                asistencia de IA.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              7. Legislación aplicable y jurisdicción
            </h2>
            <p className="text-slate-300">
              Las presentes condiciones se rigen por la legislación española.
              Para la resolución de cualquier controversia derivada del uso de
              la aplicación, las partes se someten a los Juzgados y Tribunales
              de <strong className="text-white">Santa Cruz de Tenerife</strong>,
              con renuncia expresa a cualquier otro fuero que pudiera
              corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              8. Modificaciones
            </h2>
            <p className="text-slate-300">
              {COMPANY.legalName} se reserva el derecho de modificar el presente
              Aviso Legal en cualquier momento. Los cambios serán notificados a
              los usuarios a través de la aplicación. El uso continuado de{' '}
              {COMPANY.product} tras la publicación de las modificaciones
              implica su aceptación.
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link
            to="/legal/privacidad"
            className="hover:text-indigo-400 transition-colors"
          >
            Política de Privacidad
          </Link>
          <Link
            to="/legal/cookies"
            className="hover:text-indigo-400 transition-colors"
          >
            Política de Cookies
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
