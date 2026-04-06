# GPV Consultor · El Santo Grial CRM (v4.1)

> **Más que gestión, Inteligencia Operativa.** Transformamos datos comerciales en decisiones de alto impacto para el Archipiélago Canario.

[![Estado del Proyecto](https://img.shields.io/badge/Estado-Santo_Grial_V4-indigo.svg?style=for-the-badge&logo=rocket)](/)
[![Tech Stack](https://img.shields.io/badge/Stack-React_18_|_Supabase_|_Leaflet-blue.svg?style=for-the-badge)](/)

---

## 💎 Los 6 Pilares del Santo Grial

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

### 8. 📈 Trazabilidad Lead→Contrato (Conversion Intelligence)

El módulo de Leads registra el **timestamp exacto de conversión** (`convertedAt`) en el momento en que un prospecto pasa a estado `cliente`. Esto alimenta el KPI `leadConversionFunnel`, que calcula en tiempo real:

- **Total leads generados** (con fuente: Google Places, manual, etc.)
- **% contactados** — leads que han avanzado del estado inicial
- **% interesados** — prospectos cualificados
- **% convertidos a cliente** — tasa de cierre real
- **Leads descartados** — para analizar causas de pérdida

**Resultado:** En cualquier momento puedes responder: _"De X leads generados con esta herramienta, Y se convirtieron en clientes, con una tasa del Z%"_. Un caso de éxito documentado y medible.

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
<summary>📋 Notas Técnicas y Refactorización (Histórico)</summary>

### Estado técnico validado (Marzo-Abril 2026)

- **Cero 'any'** en TypeScript (Estricto).
- **Refactorización Visual:** Eliminados gradientes innecesarios por una interfaz sólida y profesional.
- **Sincronización:** Soporte completo para Google Workspace y Microsoft 365.
- **Gestión de Tareas (v4.1):** Módulo de tareas (CRUD) integrado con `tasksGPV` en Supabase. Dashboard con cierre rápido de tareas y lógica de "salud delegada" (tareas/visitas futuras).
- **Conversion Intelligence (v4.2):** Campo `convertedAt` en leads con auto-stamp al marcar como `cliente`. KPI `leadConversionFunnel` en `kpiCalculations.ts` expone el embudo completo lead→contrato con tasas calculadas en tiempo real.
- **Refactoring:** Limpieza profunda de JSX en el Dashboard y optimización de destructuring en hooks globales.
- **Seguridad:** 2FA/TOTP integrado y cumplimiento RGPD completo.

</details>
