# Bitácora de Implementación: Módulo de Leads Profesional

**Proyecto:** GPV Canarias
**Versión:** 2.1 (Marzo 2026)

## 1. Objetivo del Módulo

Crear una herramienta de prospección inteligente que permita al equipo comercial buscar negocios en Google Maps, importar sus datos (teléfono, web, rating) y convertirlos en candidatos del pipeline con un solo clic.

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

Es imprescindible habilitar estas dos APIs en el mismo proyecto:

1. **Places API** (Para los datos de negocios).
2. **Maps JavaScript API** (Para que el buscador funcione en la web).

### Paso 3: Base de Datos

Ejecutar el script SQL proporcionado para crear la tabla `leads` y habilitar las políticas de seguridad (RLS).

## 4. Flujo de Trabajo del Usuario

1. El comercial busca "Restaurantes" en "Las Palmas".
2. Selecciona los mejores prospectos basándose en su **Rating**.
3. Pulsa **"Importar"** para guardarlos en su base de datos personal.
4. Cuando un prospecto muestra interés, pulsa **"Convertir"** y el sistema lo mueve automáticamente a la sección de **Candidatos (Pipeline)**.
