import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartBarIcon,
  MapPinIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

// ── Datos ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BellAlertIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    title: 'Alertas antes de perder al cliente',
    description:
      'El sistema detecta a los distribuidores que llevan 18 días sin visita y te avisa con una notificación en el móvil. Actúas 3 días antes de que el Radar lo marque en rojo. Sin sustos de fin de mes.'
  },
  {
    icon: MapPinIcon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    title: 'Tu ruta en el mapa, siempre optimizada',
    description:
      'Visualiza en un mapa todos tus puntos de venta. El check-in GPS certifica cada visita al instante. Tu jefe ve la actividad en tiempo real, sin llamadas para preguntar dónde estás.'
  },
  {
    icon: ChartBarIcon,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    title: 'Del lead al contrato, medido',
    description:
      'Desde que importas un prospecto de Google Maps hasta que firma el contrato. Cada paso queda registrado con fecha. Al final del trimestre puedes demostrar exactamente cuántos leads se convirtieron en clientes.'
  },
  {
    icon: DocumentChartBarIcon,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    title: 'Informe semanal en un clic',
    description:
      'El PDF sale listo para enviar al director: visitas realizadas, ventas por marca, distribuidores recuperados y tasa de conversión. Sin Excel, sin macros, sin esperas.'
  },
  {
    icon: UsersIcon,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    title: 'Pipeline de candidatos sin fugas',
    description:
      'El embudo de candidatos detecta automáticamente a los perfiles estancados. Nunca más pierdas un futuro distribuidor por falta de seguimiento.'
  },
  {
    icon: ShieldCheckIcon,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    title: 'Control por roles, sin fricciones',
    description:
      'El director comercial ve todo. El GPV en campo ve solo lo suyo. Sin configuraciones complejas, sin riesgo de que alguien toque lo que no debe.'
  }
]

const stats = [
  { value: '18 días', label: 'Umbral de alerta preventiva', icon: ClockIcon },
  { value: '100%', label: 'Visitas certificadas con GPS', icon: MapPinIcon },
  { value: '1 clic', label: 'Para generar el informe semanal', icon: DocumentChartBarIcon },
  { value: 'PWA', label: 'Funciona offline en campo', icon: SparklesIcon }
]

const testimonial = {
  quote:
    'Antes tardaba dos horas los lunes en preparar el informe para dirección. Ahora lo genero en el coche antes de la primera visita. Y cuando llego, ya sé exactamente a quién tengo que ver primero.',
  author: 'GPV senior',
  role: 'Red de distribución energética, Canarias'
}

const pillars = [
  'Agenda con detección de colisiones',
  'Radar de salud de distribuidores',
  'Check-in GPS certificado',
  'Pipeline de candidatos con heatmap',
  'Informe PDF ejecutivo automático',
  'Gestión de tareas priorizada',
  'Control de acceso por roles (RBAC)',
  'Alertas push a 18 días sin visita',
  'Trazabilidad lead → contrato',
  'PWA — funciona sin conexión'
]

// ── Componente ─────────────────────────────────────────────────────────────

const Landing: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">GPV Consultor</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#how" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cómo funciona
              </a>
              <a href="#proof" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                Resultados
              </a>
              <Link
                to="/login"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
              >
                Acceder →
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-500"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menú"
            >
              {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-800 px-4 py-4 space-y-3 bg-white dark:bg-slate-950">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm py-2 text-gray-600 dark:text-gray-300">Funcionalidades</a>
            <a href="#how" onClick={() => setMenuOpen(false)} className="block text-sm py-2 text-gray-600 dark:text-gray-300">Cómo funciona</a>
            <a href="#proof" onClick={() => setMenuOpen(false)} className="block text-sm py-2 text-gray-600 dark:text-gray-300">Resultados</a>
            <Link
              to="/login"
              className="block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white text-center"
            >
              Acceder →
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-indigo-950 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1.5 text-sm font-semibold text-indigo-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Producción · GPV Canarias · v4.4
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Tu equipo de GPVs{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              nunca más pierde un cliente
            </span>{' '}
            por falta de seguimiento
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            GPV Consultor es el CRM operativo que avisa a tus comerciales 3 días antes de que un
            distribuidor entre en zona de riesgo — con GPS, informes automáticos y pipeline
            de candidatos en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Ver la demo en directo
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-all"
            >
              Explorar funcionalidades
            </a>
          </div>
        </div>

        {/* Fake dashboard preview */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur p-6 shadow-2xl shadow-black/40">
            {/* Fake header bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <div className="ml-4 h-5 w-64 rounded-full bg-white/5 text-[10px] text-white/30 flex items-center px-3">
                app.gpv-consultor.es · Dashboard
              </div>
            </div>
            {/* Fake KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Visitados esta semana', value: '12', color: 'text-indigo-400' },
                { label: 'Nuevos activos', value: '3', color: 'text-emerald-400' },
                { label: 'Alertas radar', value: '2', color: 'text-rose-400' },
                { label: 'Tasa conversión', value: '68%', color: 'text-amber-400' }
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl bg-white/5 p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
            {/* Fake chart placeholder */}
            <div className="rounded-xl bg-white/5 p-4 h-32 flex items-end gap-1.5">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-indigo-500/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 bg-indigo-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center text-white">
                <stat.icon className="h-7 w-7 mx-auto mb-3 text-indigo-200" />
                <p className="text-3xl font-extrabold mb-1">{stat.value}</p>
                <p className="text-sm text-indigo-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Todo lo que necesita un GPV profesional
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              No es un CRM genérico. Está diseñado específicamente para la realidad del comercial en campo:
              móvil, sin conexión a veces, con presión de resultados semanales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 hover:shadow-lg transition-shadow"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} mb-5`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
              Cómo funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              De lunes a viernes, sin esfuerzo extra
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'El lunes, el sistema ya sabe a quién visitar',
                description:
                  'El Radar de Salud ordena automáticamente tus distribuidores por urgencia. Los que llevan más días sin visita aparecen primero. Sin reuniones de planificación, sin hojas de Excel.'
              },
              {
                step: '02',
                title: 'En campo, el móvil es tu oficina',
                description:
                  'Registras la visita con GPS, añades notas, vinculas una venta. Todo desde el móvil, sin conexión si hace falta. La agenda detecta si intentas agendar dos visitas al mismo tiempo.'
              },
              {
                step: '03',
                title: 'El viernes, el informe se genera solo',
                description:
                  'Un PDF ejecutivo con visitas, ventas por marca, conversión de candidatos y recuperación de cartera. Listo para enviar a dirección. Sin macro, sin copy-paste.'
              }
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-extrabold text-gray-100 dark:text-slate-800 mb-4">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF / PILLARS ── */}
      <section id="proof" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            {/* Checklist */}
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
                Lo que incluye
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-8">
                Todo en una sola app. Sin integraciones raras.
              </h2>
              <ul className="space-y-3">
                {pillars.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="mt-12 lg:mt-0">
              <div className="rounded-2xl bg-indigo-600 p-8 text-white">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  ))}
                </div>
                <blockquote className="text-lg leading-relaxed mb-6 font-medium">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <TrophyIcon className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-indigo-200 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>

              {/* Mini metric */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
                  <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">-2h</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">de trabajo administrativo semanal</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">0</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">distribuidores perdidos por falta de alerta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            ¿Cuántos distribuidores llevan hoy más de 18 días sin visita?
          </h2>
          <p className="text-lg text-indigo-200 mb-10">
            En menos de 5 minutos puedes ver el estado real de tu cartera.
            Sin instalación, sin tarjeta de crédito.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-4 text-base font-extrabold text-indigo-700 hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/30"
          >
            Entrar al dashboard
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">GPV Consultor</span>
            <span className="text-sm text-gray-400">· Grupo LMB · Canarias</span>
          </div>
          <div className="flex gap-6">
            <Link to="/legal/privacidad" className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Privacidad
            </Link>
            <Link to="/legal/cookies" className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Cookies
            </Link>
            <Link to="/legal/aviso" className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Aviso legal
            </Link>
            <Link to="/login" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Acceder →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
