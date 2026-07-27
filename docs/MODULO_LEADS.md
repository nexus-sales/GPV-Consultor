# Bitácora de Implementación: Módulo de Leads Profesional

**Proyecto:** GPV Consultor
**Versión:** 2.2 (Junio 2026)

## 1. Objetivo del Módulo

Herramienta de prospección que permite **captar** negocios desde Google Maps, importar sus datos (teléfono, web, rating) y convertirlos en candidatos del pipeline.

> **⚠️ Control de acceso (importante):** la **captación** de leads (búsqueda e importación vía Google Places) consume cuota de la API de Google y está **restringida a admin y manager**. Un comercial o gestor no puede disparar búsquedas. El control es de doble capa: la UI oculta el buscador, y los handlers `handleSearch` / `handleImportLead` tienen un guard `if (!canSearchLeads) return` que impide la llamada a Google aunque se manipule el cliente.
>
> La **asignación** de leads a comerciales (para que cada uno trabaje los suyos) es funcionalidad de **v2**; hoy los leads los gestionan admin/manager.

## 2. Componentes Desarrollados

### A. Capa de Datos (Backend & Hook)

- **Supabase**: Creación de la tabla `leads` con campos para `place_id` (evita duplicados), rating, reviews y datos de contacto.
- **useLeads.ts**: Hook de React que gestiona el estado local de los leads, la persistencia en `localStorage` (para trabajo offline) y la sincronización automática con Supabase.
- **Integración Context**: Los leads se han integrado en el `useAppData` global para que cualquier parte de la app pueda acceder a ellos.

### B. Servicio de Prospección (Google Maps)

- **googlePlacesService.ts**: Servicio especializado que utiliza el SDK oficial de Google Maps JavaScript.
- **Carga Dinámica**: El SDK se carga solo cuando es necesario, inyectando la API Key de forma segura desde las variables de entorno.
- **Lógica de Detalles**: Implementación de `getDetails` para extraer información profunda de un negocio (web, teléfono formateado) que no viene en la búsqueda inicial.

### C. Interfaz de Usuario (Frontend)

- **Página de Leads**: Diseño premium con modo oscuro, gradientes y animaciones.
- **Buscador Inteligente**: Formulario dual para Sector y Ciudad.
- **Filtros Avanzados**: Sistema para filtrar leads por estado (nuevo, interesado, etc.) y ordenación por Rating o fecha de creación.
- **Exportación Excel**: Botón para descargar la lista de leads filtrada en formato `.xlsx`.

## 3. Guía de Configuración (Setup)

### Paso 1: Variables de Entorno (.env)

Se requiere la siguiente clave:
`VITE_GOOGLE_PLACES_KEY=TU_API_KEY_DE_GOOGLE`

### Paso 2: Google Cloud Console

Habilitar estas APIs en el mismo proyecto:

1. **Places API** (datos de negocios).
2. **Maps JavaScript API** (buscador en la web).
3. **Geocoding API** (geocodificación de direcciones, usada por `geocoder.ts`).

> **Seguridad de la API key:** la key viaja al navegador (uso en frontend), así que **debe estar restringida en Google Cloud** por dominio (HTTP referrer: `gpv.nexus-sales.eu` + `localhost`) y por API (solo las tres de arriba). Sin esas restricciones, una key expuesta puede generar coste. Conviene además fijar un límite de presupuesto.

### Paso 3: Base de Datos

Ejecutar el script SQL proporcionado para crear la tabla `leads` y habilitar las políticas de seguridad (RLS).

## 4. Flujo de Trabajo del Usuario

> El actor que **capta** es admin o manager (ver control de acceso en la sección 1).

1. Admin/manager busca "Restaurantes" en "Las Palmas".
2. Selecciona los mejores prospectos basándose en su **Rating**.
3. Pulsa **"Importar"** para guardarlos en la base de datos.
4. Cuando un prospecto muestra interés, pulsa **"Convertir"** y el sistema lo mueve automáticamente a **Candidatos (Pipeline)**.
