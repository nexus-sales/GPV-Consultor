import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline'

const COMPANY = {
  legalName: 'Ucoip Canarias',
  tradeName: 'Grupo LMB',
  cif: 'B76525567',
  address:
    'Calle La Tierra N11, 38205, San Cristóbal de La Laguna, Santa Cruz de Tenerife',
  phone: '+34 607 892 939',
  email: 'info@ucoipcanarias.com',
  dpd: 'Salvador Muñoz Portillo',
  dpdEmail: 'info@ucoipcanarias.com',
  product: 'GPV Canarias',
  updated: '15 de marzo de 2025'
}

export default function Privacidad() {
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
          <LockClosedIcon className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Política de Privacidad
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Reglamento (UE) 2016/679 (RGPD) · Ley Orgánica 3/2018 (LOPDGDD) ·
              Reglamento (UE) 2024/1689 (EU AI Act)
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mb-8">
          Última actualización: {COMPANY.updated}
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              1. Responsable del tratamiento
            </h2>
            <div className="bg-slate-900 rounded-xl p-4 space-y-2 text-slate-300">
              <p>
                <span className="text-slate-500">Responsable:</span>{' '}
                <strong className="text-white">{COMPANY.legalName}</strong>{' '}
                <span className="text-slate-500 text-xs">
                  (nombre comercial: {COMPANY.tradeName})
                </span>
              </p>
              <p>
                <span className="text-slate-500">CIF:</span> {COMPANY.cif}
              </p>
              <p>
                <span className="text-slate-500">Domicilio:</span>{' '}
                {COMPANY.address}
              </p>
              <p>
                <span className="text-slate-500">Teléfono:</span>{' '}
                {COMPANY.phone}
              </p>
              <p>
                <span className="text-slate-500">Email:</span> {COMPANY.email}
              </p>
              <p>
                <span className="text-slate-500">
                  Delegado de Protección de Datos (DPD):
                </span>{' '}
                <strong className="text-white">{COMPANY.dpd}</strong> —{' '}
                <a
                  href={`mailto:${COMPANY.dpdEmail}`}
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  {COMPANY.dpdEmail}
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              2. Datos que tratamos y finalidades
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl p-4">
                <p className="font-medium text-white mb-1">
                  Datos de usuarios de la plataforma
                </p>
                <p className="text-slate-400 text-xs mb-2">
                  Base jurídica: ejecución de contrato laboral / relación
                  mercantil (art. 6.1.b RGPD)
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>Nombre, correo electrónico, rol y zona asignada</li>
                  <li>
                    Registros de actividad dentro de la aplicación (visitas,
                    ventas, gestiones)
                  </li>
                </ul>
              </div>
              <div className="bg-slate-900 rounded-xl p-4">
                <p className="font-medium text-white mb-1">
                  Datos de contactos comerciales (distribuidores, candidatos,
                  leads)
                </p>
                <p className="text-slate-400 text-xs mb-2">
                  Base jurídica: interés legítimo empresarial (art. 6.1.f RGPD)
                  / ejecución de relación contractual
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>
                    Nombre de empresa, persona de contacto, teléfono, email,
                    dirección, CIF
                  </li>
                  <li>
                    Datos comerciales (ventas, visitas, estado de la relación)
                  </li>
                  <li>
                    Datos obtenidos de fuentes públicas (Google Places,
                    directorios empresariales)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              3. Destinatarios y transferencias internacionales
            </h2>
            <p className="text-slate-300 mb-3">
              Los datos se almacenan en{' '}
              <strong className="text-white">Supabase</strong> (infraestructura
              en la UE — Alemania, Frankfurt). No se realizan transferencias
              internacionales de datos fuera del Espacio Económico Europeo. No
              cedemos datos a terceros salvo obligación legal.
            </p>
            <p className="text-slate-300">
              Las funcionalidades de IA utilizan la API de{' '}
              <strong className="text-white">Google Places</strong> (búsqueda de
              negocios por nombre/localización). Únicamente se transmiten datos
              de empresas (no datos personales de usuarios finales).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              4. Plazo de conservación
            </h2>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>
                <strong className="text-white">Datos de usuarios:</strong>{' '}
                durante la vigencia de la relación laboral/mercantil y hasta 3
                años tras su finalización (prescripción de acciones civiles).
              </li>
              <li>
                <strong className="text-white">Datos comerciales:</strong>{' '}
                mientras sean necesarios para la gestión comercial y hasta 5
                años tras el último tratamiento (obligaciones fiscales y
                mercantiles).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              5. Tus derechos
            </h2>
            <p className="text-slate-300 mb-3">
              Puedes ejercer los siguientes derechos ante el responsable del
              tratamiento, dirigiéndote a{' '}
              <a
                href={`mailto:${COMPANY.dpdEmail}`}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                {COMPANY.dpdEmail}
              </a>{' '}
              o por correo postal a {COMPANY.address}:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ['Acceso', 'Conocer qué datos tuyos tratamos'],
                ['Rectificación', 'Corregir datos inexactos o incompletos'],
                ['Supresión', 'Solicitar la eliminación de tus datos'],
                [
                  'Oposición',
                  'Oponerte al tratamiento en determinados supuestos'
                ],
                ['Limitación', 'Solicitar la suspensión del tratamiento'],
                ['Portabilidad', 'Recibir tus datos en formato estructurado']
              ].map(([title, desc]) => (
                <div key={title} className="bg-slate-900 rounded-lg p-3">
                  <p className="font-medium text-white text-xs">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs mt-3">
              Tienes derecho a presentar una reclamación ante la{' '}
              <strong className="text-white">
                Agencia Española de Protección de Datos (AEPD)
              </strong>{' '}
              —{' '}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                www.aepd.es
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              6. Decisiones automatizadas e Inteligencia Artificial
            </h2>
            <p className="text-slate-300 mb-2">
              De conformidad con el{' '}
              <strong className="text-white">art. 22 RGPD</strong> y el{' '}
              <strong className="text-white">
                Reglamento (UE) 2024/1689 (EU AI Act)
              </strong>
              , informamos que:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>
                {COMPANY.product} utiliza IA de{' '}
                <strong className="text-white">riesgo bajo</strong> para asistir
                en la identificación de leads comerciales (negocios, no personas
                físicas como usuarios finales).
              </li>
              <li>
                <strong className="text-white">
                  No se adoptan decisiones automatizadas
                </strong>{' '}
                con efectos jurídicos o significativos sobre personas físicas.
              </li>
              <li>
                Toda decisión comercial queda bajo supervisión y criterio humano
                del equipo GPV.
              </li>
              <li>
                Los datos procesados por la IA son datos de empresas obtenidos
                de fuentes públicas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3 border-b border-slate-800 pb-2">
              7. Seguridad de los datos
            </h2>
            <p className="text-slate-300">
              {COMPANY.legalName} aplica medidas técnicas y organizativas
              apropiadas para garantizar la seguridad de los datos personales,
              incluyendo: autenticación segura con verificación en dos pasos
              opcional, cifrado en tránsito (TLS 1.3), políticas de acceso
              basadas en roles (RLS), almacenamiento en infraestructura europea
              certificada y auditoría de accesos.
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
