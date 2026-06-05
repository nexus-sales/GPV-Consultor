# GPV Consultor · El Santo Grial CRM (v4.3.0)

> **Más que gestión, Inteligencia Operativa.** Versión optimizada y saneada para rendimiento máximo.

[![Estado del Proyecto](https://img.shields.io/badge/Estado-4.3.0_Stable-success.svg?style=for-the-badge&logo=rocket)](/)
[![Tech Stack](https://img.shields.io/badge/Stack-React_18_|_Supabase_|_Leaflet-blue.svg?style=for-the-badge)](/)

---

## ⚡ Novedades v4.2.0 "Stability First"

Esta versión marca el retorno a la fluidez absoluta tras una fase de optimización profunda:

- **🚀 Rendimiento Extremo:** Eliminación de integraciones pesadas y estilos complejos (Glassmorphism) para garantizar 60fps en navegación móvil.
- **📡 Radar Nativo (Leaflet):** Recuperación del sistema de proximidad basado en Haversine y Leaflet, eliminando la dependencia del SDK pesado de Google Maps.
- **📊 Reportes PDF Premium:** Rediseño de exportación a PDF con `jsPDF` optimizado para informes ejecutivos limpios y ligeros.
- **🧠 Caché Geográfica:** Implementado sistema de persistencia de coordenadas en mappers para evitar llamadas redundantes a APIs de geolocalización.
- **📍 Address Autocomplete:** Integración pulida de Google Places exclusivamente para la captura de direcciones en formularios.

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

### 11. 🔄 Ecosistema de Sincronización Invisible (Google & Microsoft)

GPV ya no es una isla de datos. Se integra con los calendarios y gestores de tareas líderes mediante un flujo de sincronización inteligente:

- **Sincronización en Tiempo Real:** Al crear o editar una visita o tarea en GPV, el cambio se refleja **automáticamente** en tu Google Calendar, Microsoft Outlook o Microsoft To Do. Sin botones, sin esperas.
- **Resiliencia & Gestión de CORS:** Arquitectura robusta que maneja errores de red y políticas de seguridad (CORS) de forma proactiva, garantizando que tus datos viajen seguros entre el navegador y los servidores de Google/Microsoft.
- **Auth Invisible:** Sistema de reconexión automática que mantiene tu sesión de integración activa sin interrupciones, con un flujo de desconexión blindado que evita "sesiones fantasma".
- **Contexto Enriquecido:** Las visitas sincronizadas incluyen ubicación, notas de la entidad y metadatos privados, permitiéndote tener toda la información del cliente directamente en el widget de calendario de tu móvil.

### 12. 🌐 Landing Page Comercial (`/landing`)

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

### 13. 🛰️ Radar de Visitas 360° (Geoproximidad Activa)

Nueva herramienta de inteligencia de campo que utiliza la ubicación actual del GPV para optimizar la jornada:

- **Autolocalización GPS:** Detecta la posición del usuario en tiempo real con precisión de calle.
- **Detección por Radio (km):** Slider interactivo para visualizar clientes y leads en un radio ajustable de 1 a 50 km.
- **Cálculo de Haversine:** Algoritmo matemático integrado para determinar la distancia exacta (km) desde la ubicación actual.
- **Navegación Asistida:** Integración directa con Google Maps para iniciar rutas de navegación con un solo clic desde cada ficha del radar.
- **Clasificación Visual:** Marcadores diferenciados en mapa para Distribuidores (Activos) y Candidatos (Prospectos).

### 14. 🛡️ Blindaje de Seguridad & Auditoría (GDPR/RGPD Compliance)

Infraestructura de datos robustecida para cumplir con las normativas de privacidad de la UE:

- **Row Level Security (RLS) v2:** Políticas de acceso granulares en Supabase que aseguran que cada usuario solo acceda a los datos que le corresponden.
- **Sistema de Auditoría Inmutable:** Tabla de logs `audit_logsGPV` que registra el "quién, cuándo y qué" de cada acceso o modificación de datos sensibles.
- **Triggers de Base de Datos:** Registro automático de eliminaciones y actualizaciones de candidatos, manteniendo un historial de seguridad que no puede ser alterado desde el cliente.

### 15. 🗒️ Gestión de Notas de Alto Rendimiento

Sistema de historial unificado presente en todos los formularios (Backoffice, Candidatos, Distribuidores):

- **Persistencia Inmediata:** Las notas se sincronizan con Supabase en el momento de la creación o eliminación, evitando pérdidas de datos por refresco de página.
- **Historial Completo:** Registro detallado con autor, fecha, hora y categoría de la intervención.
- **Control Total:** Interfaz de usuario mejorada que permite la eliminación auditada de registros directamente desde el formulario.

### 16. 🌐 Google Maps Intelligence Migration

Migración completa de servicios geográficos para mayor estabilidad y precisión:

- **Autocomplete Premium:** Integración de Google Places API para la entrada de direcciones, eliminando errores de escritura y asegurando datos de ciudad/CP correctos.
- **Geocoding de Precisión:** Sustitución de Nominatim por Google Maps Geocoding para garantizar que las coordenadas de cada cliente sean exactas para el Radar.
  122:
  123: ### 17. 💎 Professional Design & Premium UI/UX (Glassmorphism)
  124:
  125: Elevación estética y funcional de toda la plataforma para un estándar de consultoría de élite:
  126:
  127: - **Arquitectura de Información por Pestañas:** Los formularios densos (Candidatos, Distribuidores, Backoffice) se han fragmentado en pestañas lógicas (**Datos, Ubicación, Fiscal, Estrategia**) para reducir la fatiga cognitiva.
  128: - **Diseño Glassmorphism:** Implementación de tokens de diseño modernos con desenfoques de fondo, bordes translúcidos y degradados dinámicos.
  129: - **Timeline Conversacional:** Historial de actividad transformado en un feed profesional con roles diferenciados (Backoffice, GPV, Sistema) y trazabilidad temporal precisa.
  130: - **Selectores Visuales:** Reemplazo de checkboxes tradicionales por cuadrículas interactivas de sectores y marcas con feedback táctil y visual.
  131: - **Micro-interacciones:** Animaciones fluidas de entrada y transiciones de estado que mejoran la percepción de velocidad y calidad de la herramienta.

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

## Actualizacion tecnica - Seguridad y notas (Mayo 2026)

- Se refuerza `scripts/security_hardening_rls.sql` para reparar politicas RLS de Supabase con nombres camelCase entrecomillados, `public."user_profilesGPV"` y `public.is_admin()` con esquema explicito.
- El script de seguridad crea/verifica `user_profilesGPV`, anade `owner_id` de forma idempotente en tablas existentes, recrea politicas de lectura/escritura por propietario o admin y recarga el schema cache de PostgREST.
- Se corrige el guardado del historial `notesHistory` en candidatos y distribuidores para notas GPV, Observacion, Seguimiento e Incidencia desde el panel lateral de edicion.
- Las notas rapidas ahora se persisten mediante `onAddNote`, se muestran al instante en el modal y no dependen de guardar/cerrar todo el formulario.
- Se habilita el guardado de notas desde el modal de detalle de distribuidor y se evita pisar notas anteriores al anadir varias seguidas.
- Se corrige la definicion de la entrada "Visitas" en el layout para recuperar el build de produccion.
- Verificacion realizada: `npx eslint src/Layout.tsx src/components/DistributorForm.tsx src/components/CandidateForm.tsx src/pages/Distributors.tsx src/pages/DistributorDetail.tsx` y `npm run build`.
- **Rendimiento y Fugas de Memoria (Mayo 2026):**
  - **Fuga de RAM de 4.7 GB solucionada:** Identificado y resuelto un bucle infinito en `Backoffice.tsx` causado por actualizaciones de estado (`setCurrentPage`) dentro de `useMemo`. Se ha extraído a un `useEffect` específico, previniendo el ahogamiento del hilo principal del navegador.
  - **Re-renders estabilizados:** El contexto principal de datos (`DataContext.tsx`) ha sido memoizado por completo. Anteriormente causaba un re-renderizado completo del árbol de React con cada latido del estado de conexión de Supabase.
  - **Notificaciones bloqueadas corregidas:** Arreglado el problema de _stale closures_ en `useInternalAlerts`, lo que causaba que el botón "Ver" de los toasts no funcionase e inyectara eventos atascados.

---

## 👥 Equipo y Soporte

- **Director de Estrategia:** Salvador Muñoz Portillo ([admin@nexus-sales.eu](mailto:admin@nexus-sales.eu))
- **Entorno:** Producción GPV Canarias (v4.0 — Abril 2026)

---

> [!IMPORTANT]
> **Filosofía del Producto:** Restamos ruido para sumar ventas. Si no ayuda a cerrar un contrato o a salvar un distribuidor, no está en el Dashboard.

---

<details>
<summary>📋 Changelog técnico — Módulo Leads: UX, Filtros & Robustez (Junio 2026)</summary>

### Módulo Leads — Mejoras integrales — Junio 2026

**Panel KPI de estados (clickable)**
Barra de 7 contadores en tiempo real (Nuevos, Pendientes, Contactados, Interesados, Rechazados, Clientes, Descartados) encima del panel de filtros. Cada contador actúa como filtro rápido — un clic filtra la lista por ese estado, un segundo clic lo limpia. Visión inmediata del embudo sin necesidad de abrir ningún filtro.

**Filtros completamente funcionales**

- **Filtro por fuente** restaurado: el setter `setFilterSource` estaba descartado, haciendo que el filtro fuera papel mojado. Restaurado y añadido el dropdown correspondiente (Google Places / SERP Web / Google Ads / Manual) al panel de filtros.
- **Estado 'Descartado'** añadido a los tres selectores de estado (filtro global, fila de tabla y tarjeta de cuadrícula) — existía el estilo de fila pero no la opción para asignarlo.

**Chips de filtros activos y botón "Limpiar todo"**
Al activar cualquier combinación de filtros (texto, estado, fuente, sector, provincia, isla o municipio) aparece una fila de pastillas azules debajo del panel. Cada pastilla muestra el filtro activo con × para eliminarlo individualmente. El botón "Limpiar todo" resetea todos los filtros de una sola acción. El usuario siempre sabe exactamente qué está filtrando.

**Columna Rating en vista de tabla**
Nueva columna con estrellas visuales (★★★★☆) y texto "4.2 · 87 reseñas" en la vista de lista. La cabecera es clicable para ordenar por rating descendente. Antes este dato, importado desde Google Places, no era visible en la tabla.

**Paginación con ellipsis (windowed)**
Reemplazado el renderizado de un botón por cada página (que reventaba visualmente con más de 7 páginas) por una paginación con ventana deslizante: muestra `1 … 4 5 6 … 20`. Escala a cualquier número de leads.

**Modal de confirmación de borrado**
Eliminados los dos `window.confirm()` nativos (tabla y tarjeta). Reemplazados por un modal propio que muestra el nombre del prospecto antes de confirmar la eliminación. Mismo estilo que el modal de notas existente.

**Sistema de notificaciones (toast) funcional**
`showNotification` estaba completamente comentada — ninguna acción daba feedback al usuario. Implementado un toast en esquina inferior-derecha con tres variantes (éxito verde, error rojo, info gris) y auto-cierre a los 4 segundos. Afecta a: conversión de lead a candidato, errores de importación y duplicados detectados.

**Manejo de errores en búsqueda Google Places**
`searchPlaces` resolvía silenciosamente con `[]` en cualquier error (REQUEST_DENIED, OVER_QUERY_LIMIT, etc.), dejando al usuario sin saber qué había fallado. Ahora lanza un `Error` con mensaje en castellano específico por código de estado. La UI muestra un banner rojo con el mensaje exacto cuando la búsqueda falla, diferenciándolo del estado "sin resultados".

</details>

<details>
<summary>📋 Changelog técnico — v4.3.0 Data Integrity (Junio 2026)</summary>

### Refactor de integridad de datos — Junio 2026

**Centralización de conversión de timestamps en `mapToSupabase`**
Las 7 tablas GPV (`distributorsGPV`, `candidatesGPV`, `tasksGPV`, `commissionAgreementsGPV`, `backofficeContactsGPV`, `visitsGPV`, `salesGPV`) convierten ahora `createdAt`→`created_at` y `updatedAt`→`updated_at` en un único punto central. Elimina el PGRST204 silencioso que impedía guardar cambios de estado en distribuidores y candidatos.

**Fix duplicación masiva de candidatos**
Reemplazado el ciclo `insert(uuid-nuevo) + remap de id` en `onAfterRefresh` por un `upsert` idempotente sobre el id original (PK confirmada). Cada mount/hot-reload ya no crea un duplicado nuevo. Los duplicados existentes se limpian con `purgeDuplicateCandidates`.

**Fix `priority` de candidatos siempre en 'medium'**
El normaliser hardcodeaba `priority: 'medium'` ignorando la columna de la BD. Corregido para leer `source.priority` con fallback a `'medium'`.

**Fix serial Excel en `fechaVisita` de backoffice**
La función `normalise` de `useBackofficeContacts` validaba `fechaVisita` como string sin comprobar el formato. Valores legacy `"46209"` (serial numérico de Excel) causaban `400 Bad Request` en cada sync. Ahora se valida el formato `YYYY-MM-DD` antes de enviar.

**Botones de escritura protegidos por rol admin**
`Sync Forzada`, `SUBIR DATOS AHORA` y los dos botones `Test INSERT` del panel de diagnóstico solo renderizan si `isAdmin === true`. Usuarios no-admin no los ven ni pueden acceder por DOM.

**Fix Test INSERT de diagnóstico**
Los payloads de `Test INSERT visitsGPV` y `Test INSERT distributorsGPV` pasan ahora por `mapToSupabase` en lugar de hardcodear nombres de columna. El test de distributors ya no da PGRST204.

**CSP ampliada para Google APIs y Vercel Live**
`connect-src` incluye ahora `https://www.googleapis.com` y `https://apis.google.com`. `script-src` incluye `https://vercel.live`. Resuelve los errores de red en Google Calendar/Tasks.

</details>

<details>
<summary>Changelog tecnico - Formularios y Supabase (5 junio 2026)</summary>

### Operatividad de formularios y saneamiento Supabase - 5 junio 2026

**Leads alineado con el esquema GPV**
El modulo Leads deja de apuntar a la tabla legacy `leads` y pasa a usar `leadsGPV` de forma consistente en hook de datos, cola offline y scripts SQL. Se mantiene compatibilidad interna en el mapper para operaciones antiguas en cola.

**Migracion segura `leads` -> `leadsGPV`**
Nuevo script `scripts/rename_leads_to_leadsGPV.sql` para renombrar o crear `public."leadsGPV"` sin perder datos. El script asegura columnas usadas por la app (`isla`, `codigo_postal`, `converted_at`, `notas`), RLS y trigger `updated_at`.

**Scripts SQL saneados**
Actualizados `schema_completo_gpv.sql`, `fix_rls_remaining_tables.sql`, `add_leads_notas.sql`, `fix_leads_converted_at.sql` y `fix_candidates_province.sql` para evitar que futuras ejecuciones vuelvan a operar sobre la tabla antigua `leads`.

**Formularios mas operativos**
Backoffice, Candidatos, Distribuidores, Visitas, Tareas, Operaciones/Pedidos, Solicitudes y selector de contactos incorporan secciones pastel por funcion: identificacion, contacto/ubicacion, agenda, comercial, actividad y alertas. El objetivo es ganar lectura rapida sin cambiar la logica de negocio.

**Fichas laterales compactas**
Las vistas rapidas de Candidatos y Distribuidores se compactan para evitar paneles laterales excesivamente altos y mejorar la lectura de contacto, actividad, origen y rendimiento.

**Validacion**
Verificado con `npm run build`.

</details>

<details>
<summary>📋 Changelog técnico — Professional Design & Premium UI/UX (Mayo 2026)</summary>

### Sprint Premium UI/UX — Mayo 2026

**Refactorización Integral de Formularios (Tabbed Views)**
Migración de `CandidateForm`, `DistributorForm` y `BackofficeContactForm` a una arquitectura de pestañas. Uso de estado local `activeTab` para mantener la integridad de los datos sin afectar la persistencia.

**Nuevo Sistema de Tokens CSS (`styles.css`)**
Definición de clases de utilidad premium: `.glass-panel`, `.premium-card`, `.premium-input`, `.premium-gradient`. Animaciones nativas de entrada (`animate-fade-in`, `animate-slide-up`) aplicadas consistentemente.

**Conversational Activity Feeds**
Rediseño del historial de notas en los tres módulos principales. Implementación de un componente de timeline con diferenciación de roles, timestamps formateados y borrado auditado.

**Extracción de Lógica de Backoffice**
El formulario de contactos de Backoffice se ha extraído a su propio componente (`BackofficeContactForm.tsx`), desacoplando la UI de la lógica de negocio de la página principal y permitiendo una personalización estética superior.

**Auditoría de Tipos & Zero-Errors**
Resolución de 15+ errores de TypeScript detectados tras la refactorización. Garantizada la compatibilidad de `updatedAt` en el normalizador de distribuidores y corregidas las importaciones de `supabaseClient`.

</details>

<details>
<summary>📋 Changelog técnico — Módulo Backoffice (Mayo 2026)</summary>

### Mejoras Módulo Backoffice — Sprint Mayo 2026

**Formulario de contacto dos columnas (landscape)**
El modal de edición adopta un layout 60/40: columna izquierda con todos los campos del contacto (incluyendo el nuevo campo _Próximo Contacto_ de fecha teal junto a Fecha Visita); columna derecha con el historial de comentarios en formato timeline con scroll independiente. Doble panel sin scroll en pantallas anchas.

**Historial de comentarios con 4 roles diferenciados**
Cuatro tipos de entrada con colores y badges propios: Backoffice (azul), GPV (verde), Observación (ámbar), Seguimiento (violeta). La sección de nuevo comentario usa un grid 2×2 de botones de selección de rol con color dinámico y placeholder contextual.

**Auto-log de cambios de estado (entradas Sistema)**
Cada cambio de _Estado de Gestión_ (manual o mediante conversión a distribuidor) inserta automáticamente una entrada `{ rol: 'Sistema', autor: 'Sistema' }` de color gris en el historial. Permite trazabilidad completa del ciclo de vida del contacto sin esfuerzo manual.

**Campo Próximo Contacto (`proximoContacto`)**
Nueva columna `TEXT` en Supabase (`scripts/add_proximo_contacto_to_backoffice.sql`). Se muestra en el formulario como input de fecha teal junto a Fecha Visita. Preservado en el merge defensivo de `refresh()` para no perder el dato mientras la columna no existe en Supabase.

**Corrección contador "firmados"**
`handleConvertToDistributor` ahora actualiza `estadoGestion: 'Firmado'` además de `estado: 'COLABORA'`, de modo que las tarjetas resumen por operador muestren el recuento correcto sin recargar.

**Layout ancho + selección de fila**
`PageContainer` cambiado a `size="wide"` (max-w-[1600px]). Las filas de la tabla aceptan clic simple para resaltar (selectedRowId) y doble clic para abrir el formulario. Cursor pointer en todas las filas.

**Búsqueda en tiempo real + orden por columna**
Input de búsqueda con icono lupa filtra por nombre, población u operador. Cabeceras Colaborador, Población y Operador son ordenables (asc/desc) con indicadores de flecha. Ambas funcionalidades resetan la paginación al activarse.

**Persistencia de comentarios (migración SQL)**
`refresh()` sobreescribía localStorage con datos de Supabase vacíos cuando las columnas aún no existían. Corregido con merge defensivo que preserva `historialComentarios` y `proximoContacto` locales si Supabase devuelve vacío. SQL ejecutado: `add_historial_comentarios_to_backoffice.sql` + `add_proximo_contacto_to_backoffice.sql`.

**Informe PDF profesional rediseñado**
Portada con título, subtítulo de período y operador, línea divisoria y 4 cajas KPI (Total, Firmados, Proponen Visita, Duplicados). Tabla de distribución por estado de gestión + tabla resumen por operador en página 1. Páginas 2+ con fichas detalladas por operador con color condicional en celdas. Banda de cabecera y pie en todas las páginas con número de página. Export con toast de confirmación y error surface.

**Exportación PDF robusta (try/catch)**
`handleExportPDF` envuelto en try/catch con `toast.info` de inicio y `toast.error` con mensaje de excepción si la generación falla, eliminando fallos silenciosos.

---

</details>

<details>
<summary>📋 Changelog técnico — v4.1 (Abril 2026)</summary>

### Nuevas funcionalidades — Sprint Abril 2026

**Normalización Geográfica Unificada (Geo-Inference Engine)**
Sistema centralizado en `geoUtils.ts` para gestionar la jerarquía **Provincia > Isla > Población**.

- **Inferencia automática:** El sistema deduce la isla a partir del municipio si el dato falta, garantizando que los filtros siempre devuelvan resultados precisos.
- **Búsqueda Global 360°:** El buscador de texto ahora indexa también Provincia e Isla en Candidatos, Leads y Distribuidores.
- **Jerarquía en Formularios:** Implementada lógica de filtrado dependiente en tiempo real en `CandidateForm` y `DistributorForm`.

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

- **Exportación a Excel — Módulo Ventas**
  `exportSales()` con 16 columnas tipadas y anchos optimizados. Botón "Exportar" en la cabecera de la página de Pedidos.

**Módulo Backoffice & Gestión de Candidatos**
Implementación integral para la gestión de operadoras y reporting semanal.

- **Asignación de Operadoras:** Nuevo campo `operator` en candidatos para tracking individualizado.
- **Propuestas GPV:** Flag de control `gpvProposal` para diferenciar candidatos con oferta activa.
- **Exportación Backoffice:** Generador de PDFs semanales y Excels específicos para cada operadora.
- **Importador de Colaboradores:** Lógica de actualización de candidatos existentes desde ficheros externos.

**Normalización de Tipos & Audit de Salud (0 Errores)**
Auditoría completa del sistema de tipos para eliminar errores de compilación y lints.

- **Sync Returns:** Refactorización de `updateVisit` y `updateTask` para retornar el objeto actualizado.
- **Limpieza de Leads:** Eliminación de variables de estado muertas y optimización de dependencias.
- **Validación Final:** El proyecto alcanza el estado de **0 errores** en `npm run lint` y `tsc --noEmit`.

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
