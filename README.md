# GPV Consultor · El Santo Grial CRM (v4.1.0)

> **Más que gestión, Inteligencia Operativa.** Transformamos datos comerciales en decisiones de alto impacto para el Archipiélago Canario.

[![Estado del Proyecto](https://img.shields.io/badge/Estado-Santo_Grial_V4-indigo.svg?style=for-the-badge&logo=rocket)](/)
[![Tech Stack](https://img.shields.io/badge/Stack-React_18_|_Supabase_|_Leaflet-blue.svg?style=for-the-badge)](/)

---

## 💎 Los Pilares del Santo Grial

Nuestra arquitectura no solo guarda registros, **proyecta el éxito comercial** mediante inteligencia algorítmica:

### 1. 🛡️ Agenda Blindada & Colisiones

Se acabó el solapamiento. Nuestra agenda detecta conflictos de tiempo en tiempo real y permite una reprogramación fluida mediante **Drag & Drop** táctil. Gestión de tiempo de nivel suizo.

### 2. 📡 Radar de Salud Inteligente (**Smart Health Radar**)

El sistema monitoriza el "pulso" de cada distribuidor y candidato. Si un punto de venta supera los **21 días sin visita**, el Radar lo marca en rojo crítico. **Inteligencia añadida:** El radar ahora descuenta alertas si detecta tareas pendientes o visitas agendadas para el futuro, evitando falsos positivos y enfocándose solo en lo que requiere acción inmediata.

### 3. 🗺️ Logística 360° & Check-in GPS

Mapas interactivos integrados. Visualiza tu ruta diaria, optimiza trayectos y certifica la presencia comercial mediante **geo-posicionamiento en tiempo real**. Transparencia absoluta en el campo.

### 4. 🧠 Recruitment Intelligence (Pipeline Heatmap)

No dejes que el talento se enfríe. Nuestro embudo de candidatos detecta automáticamente perfiles estancados y resalta las nuevas incorporaciones con un **mapa de calor de actividad**.

### 5. 🦅 Dashboard "Ojo de Halcón"

Un panel ejecutivo unificado. Desde el radar de intervención inmediata hasta las métricas de **% de Salud Operativa**. El resumen perfecto para una toma de decisiones por segundo.

### 6. 📊 Reporting de Alto Impacto

Generación de informes PDF profesionales que no se limitan a listar tareas. Muestran recuperación de cartera, conversión de talento y **análisis de penetración por marca**.

### 7. 🏷️ Gestión de Tareas & Dashboard Actionable

Centro de tareas unificado (CRUD) con **priorización algorítmica** (Alta, Media, Baja). Integrado directamente en el Dashboard para permitir el cierre de tareas con **un solo clic**, vinculando automáticamente seguimientos a candidatos y distribuidores.

### 8. 🔐 Multi-Role & SaaS Readiness (RBAC)

Arquitectura basada en roles (**Admin, Manager, GPV**). Control granular de acceso que oculta módulos sensibles (Configuración, Importación) a perfiles operativos, garantizando la seguridad en equipos multi-usuario.

### 9. 🌍 i18n Architecture (Global Ready)

Preparado para la expansión internacional. Implementación de **react-i18next** con diccionarios de traducción centralizados para desacoplar el contenido del código y permitir una localización instantánea.

### 10. 📈 Trazabilidad Lead→Contrato (Conversion Intelligence)

El módulo de Leads registra el **timestamp exacto de conversión** (`convertedAt`) en el momento en que un prospecto pasa a estado `cliente`. Esto alimenta el KPI `leadConversionFunnel`, que calcula en tiempo real:

- **Total leads generados** (con fuente: Google Places, manual, etc.)
- **% contactados** — leads que han avanzado del estado inicial
- **% interesados** — prospectos cualificados
- **% convertidos a cliente** — tasa de cierre real
- **Leads descartados** — para analizar causas de pérdida

**Resultado:** En cualquier momento puedes responder: _"De X leads generados con esta herramienta, Y se convirtieron en clientes, con una tasa del Z%"_. Un caso de éxito documentado y medible.

### 11. 🌐 Landing Page Comercial (`/landing`)

Página pública pensada para directores comerciales, no para developers. Accesible sin autenticación en `/landing`:

- **Hero** con headline orientado a negocio y preview visual del dashboard
- **Stats** — 4 métricas clave (umbral de alerta, GPS, informe en 1 clic, PWA offline)
- **6 funcionalidades** explicadas en lenguaje de campo, sin jerga técnica
- **Cómo funciona** — flujo lunes-viernes en 3 pasos
- **Checklist de 10 pilares** + testimonio + métricas de impacto (-2h/semana, 0 distribuidores perdidos)
- **CTA final** con pregunta directa al dolor del director: _"¿Cuántos distribuidores llevan hoy más de 18 días sin visita?"_

### 12. 📱 Mobile-First & Campo Ready (390px)

La app está diseñada para el GPV que trabaja **desde el móvil en ruta**. Cada módulo ha pasado por una auditoría específica para pantallas de 390px:

- **Agenda táctil:** La vista semanal activa scroll horizontal en mobile en lugar de colapsar. El **drag & drop de visitas funciona con el dedo** (touch events nativos con ghost visual de feedback).
- **Check-in GPS con resiliencia:** El botón de captura de ubicación muestra spinner durante la espera, timeout de 10 s, y mensajes de error específicos (permiso denegado, señal no disponible, timeout) en lugar de fallar en silencio.
- **Dashboard responsive:** KPI cards, gráficos y selectores adaptan su tamaño y espaciado a cada breakpoint sin desbordarse.

---

## 🚀 Guía Rápida para el Éxito

**Arranque en 10 segundos:**

```bash
npm install && npm run dev
```

**Variables Críticas:**
Para habilitar el mapa y la prospección, configura tu `.env`:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_SUPABASE_URL`

---

## 🛠️ Stack Tecnológico de Élite

- **Frontend:** React 18 + Vite (Velocidad de carga sub-página).
- **Diseño:** Tailwind CSS v3 (Visuales Premium y consistentes).
- **Geolocalización:** Leaflet + Leaflet-Routing-Machine.
- **Reporting:** React-PDF (Templates ejecutivos dinámicos).
- **Backend:** Supabase (Sincronización en tiempo real y seguridad 2FA).
- **Calidad:** Vitest + Playwright (Blindaje contra errores).

---

## 👥 Equipo y Soporte

- **Director de Estrategia:** Salvador Muñoz Portillo ([admin@nexus-sales.eu](mailto:admin@nexus-sales.eu))
- **Entorno:** Producción GPV Canarias (v4.0 — Abril 2026)

---

> [!IMPORTANT]
> **Filosofía del Producto:** Restamos ruido para sumar ventas. Si no ayuda a cerrar un contrato o a salvar un distribuidor, no está en el Dashboard.

---

<details>
<summary>📋 Changelog técnico — v4.1 (Abril 2026)</summary>

### Nuevas funcionalidades — Sprint Abril 2026

**Alertas internas sin Google Calendar (`useInternalAlerts`)**
Hook montado en el Layout principal. Dispara toasts sonner 3 s tras el montaje y cada hora. Cubre:

- Distribuidores ≥21 días sin visita → `toast.error`
- Distribuidores ≥18 días sin visita → `toast.warning`
- Tareas vencidas o de hoy → `toast.warning`
- Candidatos activos sin contacto >7 días → `toast.info`
  Throttle de 4 horas vía `localStorage` para evitar spam.

**Quick Preview Panels (SlideOver)**

- `CandidatePreview`: badges de etapa/prioridad, teléfono/email clicables, localización, días sin contacto, última nota con categoría y próxima acción, CTA a ficha completa.
- `DistributorPreview`: código/estado, contacto, marcas, canal, ventas YTD, nivel de prioridad, % checklist PVPTE completado.
  Accesibles con el botón ojo (👁) en los listados.

**Funnel de conversión del pipeline (`PipelineFunnelChart`)**
Barras proporcionales para las 4 etapas activas (Nuevo, Contactado, Evaluación, Aprobado). Tasas de conversión entre etapas con semáforo de color (verde ≥50%, ámbar ≥25%, rojo <25%). Rechazados al pie. Filas clicables para navegar al listado filtrado. Integrado en el Dashboard como 4.ª columna.

**Sección "Tu día de hoy" en Dashboard**
Grid de 4 columnas (xl): Visitas de hoy, Tareas urgentes (vencidas + badge), Candidatos sin contacto, PipelineFunnelChart.

**Búsqueda global ampliada (CommandPalette)**
La paleta `Ctrl+K` / `⌘K` ahora incluye ventas (por cliente, distribuidor y documento) y tareas pendientes (por título y descripción). Descripciones enriquecidas con estado, etapa y prioridad.

**Exportación a Excel — Módulo Ventas**
`exportSales()` con 16 columnas tipadas y anchos optimizados. Botón "Exportar" en la cabecera de la página de Pedidos.

---

### Hardening release — Auditoría completa Abril 2026

**Cache invalidation sistemática**
`invalidateQueries` añadido en todos los hooks de mutación: `useCandidates`, `useDistributors`, `useSales`, `useVisits`, `useTasks`, `useLeads`. También en `useSyncQueue` al procesar la cola offline. Resuelve el bug de candidatos/distribuidores que desaparecían tras guardar sin recargar.

**Normalización correcta de datos desde Supabase**

- `useVisitsQuery`: aplicaba `data as Visit[]` sin pasar por `normaliseVisits`. Corregido.
- `useSalesQuery`: ordenaba por campo inexistente `createdAt`, corregido a `fechaCierre`. Añadida `normaliseSales`.

**Bug de precedencia de operadores en `normalisers.ts`**
`a ?? b ? x : y` se evaluaba como `(a ?? b) ? x : y` en lugar de `(a ?? b) ? toEntityId(...) : undefined`. Corregido con paréntesis explícitos.

**Eliminación de código muerto en `supabaseMappers.ts`**
`processCandidateFromSupabase`, `processVisitFromSupabase`, `processDistributorFromSupabase` — funciones no usadas con doble cast `as unknown as`. Eliminadas.

**Mutex en refresh de token Google**
`isRefreshingRef = useRef(false)` en `GoogleOAuthProvider` para garantizar que sólo una llamada de refresh corre a la vez, evitando la race condition teórica en sesiones con múltiples tabs.

</details>

<details>
<summary>📋 Notas Técnicas y Refactorización (Histórico)</summary>

### Estado técnico validado (Marzo-Abril 2026)

- **Landing Page comercial (v4.5):** Ruta pública `/landing` orientada a directores comerciales. Hero, stats, 6 features en lenguaje de negocio, flujo lunes-viernes, checklist de pilares, testimonio y CTA directo.
- **Push Notifications (v4.4):** Service Worker personalizado (`src/sw.ts`) con `injectManifest` + Workbox precaching. Hook `usePushNotifications` con Notification API, throttle de 8 h por distribuidor y panel de control en Ajustes → Alertas de Visita. Lógica de detección en `visitAlertChecker.ts` (umbral aviso: 18 días, crítico: 21 días).
- **Mobile-First (v4.3):** Auditoría 390px completa. WeeklyTimeGrid con scroll horizontal + touch D&D. Geolocalización con error handler, timeout 10 s y spinner. Dashboard con heights y gaps responsive.
- **Versión 4.1.0 (Producción):** Refactorización de dependencias críticas (SheetJS estable) y versionamiento semántico real.
- **RBAC (SaaS Readiness):** Sistema de roles (Admin/Manager/GPV) integrado en Sidebar, Auth mapping y flujos de datos para escalabilidad organizacional.
- **Arquitectura Zero-Circular:** Código validado con `madge` para garantizar mantenibilidad y prevenir deuda técnica estructural.
- **i18n Foundation:** Soporte inicial para multi-idioma con diccionarios JSON mediante `react-i18next`.
- **Seguridad:** 2FA/TOTP integrado y cumplimiento RGPD completo.

</details>
