# GPV Canarias · Especificación funcional v1

## 1. Reglas de negocio clave

- **Lowi indisponible con external_code = `EXISTENTE_VF`:**
  - Bloquea la marca Lowi y muestra tooltip: “Cliente con activo Vodafone; Lowi no ofertable”.
- **PVPTE (alta por datos):**
  - Checklist obligatorio de datos fiscales y de contacto antes de permitir altas.
- **Distribuidores Exclusiva:**
  - Marcas sugeridas por defecto: Silbö, Lowi y Vodafone (permitir desmarcar).
- **Distribuidores No exclusiva:**
  - Sólo Silbö activada por defecto y habilitar solicitud de upgrade (workflow interno).
- **Canal D2D:**
  - Habilitar tres marcas por defecto y consolidar ventas registradas a nivel de equipo.

## 2. Estilo visual (referencia UI)

- **Paleta pastel:**
  - Primario `#5C7CFA`, secundario `#66D9E8`, énfasis `#FFD43B`.
  - Fondo principal `#F8F9FA`, tarjetas `#FFFFFF`.
  - Estados: éxito `#8CE99A`, alerta `#FFE066`, peligro `#FFA8A8`.
- **Tipografía:** Inter / Nunito.
- **Componentes:** Cards con `rounded-2xl`, sombras suaves, badges y pills claros.

## 3. Seguridad y PWA (roadmap breve)

- **Autenticación:** Supabase Auth (email+link o OTP).
- **Seguridad de datos:** Row-Level Security por zona y propietario.
- **PWA:**
  - `manifest.json`, service worker con precaching.
  - Estrategias: network-first para listados, cache-first para assets.
- **Offline-first:** Cola de visitas/ventas en IndexedDB con sincronización en reconexión.

## 4. Generación de PDF semanal

- **Cliente:** `pdf-lib` o `jspdf` + `autoTable` para tablas.
- **Servidor opcional:** función Edge en Supabase (Deno) para render estable.
- **Plantilla:** parametrizable, con branding Silbö (ver §7 de documento de referencia).

## 5. Métricas y KPIs

- Visitados semana: `count(visits where visit_date in semana)` sobre distribuidores ∪ candidatos.
- Nuevos activos: `count(distributors where created_at in semana and operational_status = 'activo')`.
- Ventas por marca: `sum(sales.operaciones) GROUP BY brand`.
- Mix familias: `sum(sales.operaciones) GROUP BY family`.
- Conversión candidato→activo: `convertidos / candidatos_visitados`.
- Calidad de datos: `% completas = (fichas sin missing_fields) / total_fichas`.

## 6. Backlog funcional sugerido

1. Score de prioridad por PDV (potencial = tráfico zona + histórico + completitud de datos).
2. Agenda integrada de próximas visitas con recordatorios.
3. Importador Excel/CSV con mapeo de columnas y validación.
4. Geo-mapa por isla/municipio para cobertura y gaps.
5. Envío automático del PDF semanal por correo al Departamento.

## 7. API/UI base (React 19 + Tailwind + shadcn/ui)

- **Rutas:** `/dashboard`, `/kanban`, `/distributors`, `/distributors/:id`, `/candidates`, `/candidates/:id`, `/reports/weekly`.
- **Componentes clave:** `KpiCard`, `KanbanBoard`, `DistributorForm`, `VisitForm`, `SaleForm`, `WeeklyReportPreview`, `PdfButton`.
- **Hooks:** `useKpis(week)`, `useFilters()`, `useWeeklyReport()`.

## 8. Validaciones de ficha

- CIF/NIF válido; email con formato correcto; móvil español; CP de 5 dígitos; provincia obligatoria.
- Marcas coherentes con `external_code`.
- Bloquear ventas si ficha < 70 % completa (parametrizable).

## 9. Migración de Excel (fase 1)

1. Wizard de importación (CSV/Excel).
2. Mapeo de columnas ↔ campos de distributors/candidates.
3. Reglas para normalizar usuarios y tipo de canal.
4. Vista previa de errores antes de crear registros.

## 10. Entregables

- Este documento (Especificación v1).
- Mockups/Wireframes (pendiente).
- Esquema SQL (incluido en documentación original).
- Lista de componentes React + contratos de props (pendiente).

## 11. Próximos pasos

1. Validar mapa de campos con Excel real.
2. Crear wireframes de Dashboard, Kanban y ficha.
3. MVP con `localStorage` + exportación PDF.
4. Integración con Supabase (Auth + RLS) y PWA.
