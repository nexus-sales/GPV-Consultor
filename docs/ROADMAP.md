# 🗺️ Roadmap de Desarrollo - GPV

## 📋 Resumen Ejecutivo

Este documento define las **8 fases** para llevar la aplicación desde el MVP actual (localStorage) hasta una solución empresarial completa con Supabase, autenticación, PWA y reportes avanzados.

**Estado actual:** ✅ MVP funcional con 6 mejoras implementadas  
**Objetivo:** Sistema de gestión comercial enterprise-ready  
**Duración estimada:** 6-8 semanas (dependiendo del equipo)

---

## 🎯 Fase 1: Integración con Supabase (Prioridad: CRÍTICA)

**Duración estimada:** 5-7 días  
**Dependencias:** Ninguna  
**Riesgo:** Medio

### Objetivos

- Migrar de `localStorage` a base de datos real PostgreSQL
- Configurar proyecto en Supabase
- Implementar CRUD completo para todas las entidades

### Tareas Técnicas

#### 1.1 Configuración inicial

```bash
# Instalar dependencias
npm install @supabase/supabase-js
npm install -D dotenv

# Crear estructura de archivos
touch .env.local
touch src/lib/supabase/client.ts
touch src/lib/supabase/types.ts
```

#### 1.2 Variables de entorno

```env
# .env.local
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

#### 1.3 Cliente de Supabase

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

#### 1.4 Esquema SQL (ejecutar en Supabase SQL Editor)

```sql
-- Ver archivo: docs/database-schema.sql
-- Incluye: distributors, candidates, visits, sales, notes, users
```

#### 1.5 Seeds iniciales

```sql
-- Datos de prueba para desarrollo
INSERT INTO distributors (code, name, channel_type, status, province) VALUES
  ('D001', 'Distribuidora Las Palmas Centro', 'exclusive', 'active', 'Las Palmas'),
  ('D002', 'Comercial Tenerife Sur', 'non_exclusive', 'pending', 'Santa Cruz de Tenerife'),
  ('D003', 'Mayorista Fuerteventura', 'd2d', 'active', 'Las Palmas');

INSERT INTO candidates (name, city, stage, priority, created_by) VALUES
  ('Nuevo PDV Puerto Rico', 'Mogán', 'new', 'high', 'system'),
  ('Tienda El Médano', 'Granadilla de Abona', 'contacted', 'medium', 'system'),
  ('Comercial Arucas', 'Arucas', 'evaluation', 'low', 'system');
```

#### 1.6 Reemplazar hooks personalizados

```typescript
// Antes: src/lib/useAppData.js (localStorage)
// Después: src/lib/hooks/useDistributors.ts (Supabase)

export const useDistributors = () => {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDistributors()
  }, [])

  const fetchDistributors = async () => {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setDistributors(data)
    setLoading(false)
  }

  const addDistributor = async (payload: NewDistributor) => {
    const { data, error } = await supabase
      .from('distributors')
      .insert(payload)
      .select()
      .single()

    if (data) {
      setDistributors(prev => [...prev, data])
    }
  }

  // ... más métodos

  return { distributors, loading, addDistributor, ... }
}
```

### Archivos a modificar

- `src/lib/useAppData.js` → Deprecar y reemplazar con hooks específicos
- `src/lib/storage.js` → Eliminar (ya no se usa localStorage)
- `src/lib/DataContext.jsx` → Actualizar para usar Supabase
- Todos los componentes que usen `useAppData`

### Criterios de aceptación

- ✅ Todas las operaciones CRUD funcionan con Supabase
- ✅ Sin errores de sincronización entre componentes
- ✅ Datos persisten después de recargar la página
- ✅ Performance < 200ms en lecturas, < 500ms en escrituras

---

## 🔐 Fase 2: Auth + RLS (Prioridad: ALTA)

**Duración estimada:** 4-6 días  
**Dependencias:** Fase 1 completada  
**Riesgo:** Alto (configuración de políticas complejas)

### Objetivos

- Implementar autenticación con Supabase Auth
- Configurar Row-Level Security (RLS)
- Crear sistema de roles y permisos

### Tareas Técnicas

#### 2.1 Configurar Supabase Auth

```typescript
// src/lib/auth/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, signInWithOTP, signOut }
}
```

#### 2.2 Componente de Login

```tsx
// src/pages/Login.tsx
export const Login = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { signInWithOTP } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await signInWithOTP(email)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-indigo to-pastel-cyan">
      {!sent ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-3xl shadow-2xl"
        >
          <h1>Acceso GPV</h1>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
          <button type="submit">Enviar enlace mágico</button>
        </form>
      ) : (
        <div>📧 Revisa tu email para acceder</div>
      )}
    </div>
  )
}
```

#### 2.3 Políticas RLS

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Política: Admin ve todo
CREATE POLICY "Admins can view all" ON distributors
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Política: Comercial ve solo sus registros
CREATE POLICY "Users can view own records" ON distributors
  FOR SELECT USING (
    auth.uid() = created_by OR
    auth.jwt() ->> 'zone' = zone
  );

-- Política: Comercial solo edita sus registros
CREATE POLICY "Users can update own records" ON distributors
  FOR UPDATE USING (
    auth.uid() = created_by
  );

-- Política: Todos pueden crear
CREATE POLICY "Users can insert" ON distributors
  FOR INSERT WITH CHECK (true);
```

#### 2.4 Tabla de usuarios extendida

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'commercial')),
  zone TEXT, -- 'las_palmas' | 'tenerife' | 'todas'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, role, zone)
  VALUES (NEW.id, 'commercial', 'todas');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Componentes nuevos

- `src/pages/Login.tsx`
- `src/lib/auth/useAuth.ts`
- `src/lib/auth/ProtectedRoute.tsx`
- `src/components/UserMenu.tsx` (perfil + logout)

### Criterios de aceptación

- ✅ Login con email funciona (magic link)
- ✅ Usuarios autenticados ven Dashboard
- ✅ Usuarios no autenticados redirigen a /login
- ✅ RLS impide ver datos de otros usuarios (comercial)
- ✅ Admin ve todos los registros

---

## ⚙️ Fase 3: Reglas de Negocio (Prioridad: ALTA)

**Duración estimada:** 3-4 días  
**Dependencias:** Fase 1 completada  
**Riesgo:** Bajo

### Objetivos

- Implementar validaciones específicas del negocio
- Bloqueos automáticos según datos
- Configuración de marcas por tipo de canal

### Tareas Técnicas

#### 3.1 Bloqueo Lowi por external_code

```typescript
// src/lib/validation/brandValidation.ts
export const validateBrandAccess = (
  distributor: Distributor,
  brandId: string
): { allowed: boolean; reason?: string } => {
  if (brandId === 'lowi' && distributor.externalCode === 'EXISTENTE_VF') {
    return {
      allowed: false,
      reason: 'Cliente con activo Vodafone; Lowi no ofertable'
    }
  }

  return { allowed: true }
}
```

#### 3.2 Tooltip en selector de marcas

```tsx
// src/components/BrandSelector.tsx
const isBrandDisabled = (brandId: string) => {
  const validation = validateBrandAccess(distributor, brandId)
  return !validation.allowed
}

{
  brands.map((brand) => (
    <Tooltip
      content={!isBrandDisabled(brand.id) ? '' : validation.reason}
      key={brand.id}
    >
      <button
        disabled={isBrandDisabled(brand.id)}
        className={cn(
          'brand-button',
          isBrandDisabled(brand.id) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {brand.label}
      </button>
    </Tooltip>
  ))
}
```

#### 3.3 Checklist PVPTE obligatorio

```typescript
// src/lib/validation/checklistValidation.ts
export const canCreateSale = (distributor: Distributor): boolean => {
  const requiredFields = [
    distributor.fiscalName,
    distributor.cif,
    distributor.fiscalAddress,
    distributor.contactPerson,
    distributor.phone,
    distributor.email
  ]

  const completedFields = requiredFields.filter(Boolean).length
  const completionPercentage = (completedFields / requiredFields.length) * 100

  return completionPercentage >= 70 // Parametrizable
}
```

#### 3.4 Defaults de marcas por canal

```typescript
// src/lib/defaults/brandDefaults.ts
export const getDefaultBrands = (channelType: ChannelType): string[] => {
  const defaults: Record<ChannelType, string[]> = {
    exclusive: ['silbo', 'lowi', 'vodafone'],
    non_exclusive: ['silbo'], // Solo Silbö, puede solicitar upgrade
    d2d: ['silbo', 'lowi', 'vodafone']
  }

  return defaults[channelType] || ['silbo']
}
```

### Archivos a crear/modificar

- `src/lib/validation/brandValidation.ts`
- `src/lib/validation/checklistValidation.ts`
- `src/lib/defaults/brandDefaults.ts`
- `src/components/BrandSelector.tsx`
- `src/components/SaleForm.jsx` (agregar validación pre-submit)

### Criterios de aceptación

- ✅ Lowi bloqueado para external_code='EXISTENTE_VF'
- ✅ Tooltip informativo visible al hover
- ✅ Botón "Registrar Venta" deshabilitado si < 70% completitud
- ✅ Marcas por defecto según canal al crear distribuidor

---

## 📂 Fase 4: Importador Excel/CSV (Prioridad: MEDIA)

**Duración estimada:** 5-6 días  
**Dependencias:** Fase 1 completada  
**Riesgo:** Medio (validación compleja)

### Objetivos

- Wizard interactivo para importar datos masivos
- Mapeo visual de columnas Excel ↔ Campos BD
- Validación con vista previa de errores
- Logs de importación

### Tareas Técnicas

#### 4.1 Componente Wizard

```tsx
// src/components/ImportWizard.tsx
type Step = 'upload' | 'mapping' | 'validation' | 'import' | 'result'

export const ImportWizard = () => {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<PreviewResult>()

  // Step 1: Subir archivo
  // Step 2: Mapear columnas (dropdown por cada campo)
  // Step 3: Vista previa (tabla con errores marcados)
  // Step 4: Confirmar importación
  // Step 5: Resultado (X creados, Y actualizados, Z errores)

  return (
    <Modal>
      <StepIndicator currentStep={step} />
      {step === 'upload' && <UploadStep onNext={handleUpload} />}
      {step === 'mapping' && (
        <MappingStep columns={columns} onNext={handleMapping} />
      )}
      {step === 'validation' && (
        <ValidationStep preview={preview} onNext={handleImport} />
      )}
      {step === 'result' && <ResultStep result={importResult} />}
    </Modal>
  )
}
```

#### 4.2 Validación con feedback visual

```tsx
// src/components/ValidationStep.tsx
<table>
  <thead>
    <tr>
      <th>Estado</th>
      <th>Fila</th>
      <th>Datos</th>
      <th>Errores</th>
    </tr>
  </thead>
  <tbody>
    {preview.rows.map((row, idx) => (
      <tr key={idx} className={row.errors.length ? 'bg-red-50' : 'bg-green-50'}>
        <td>
          {row.errors.length ? (
            <XCircleIcon className="text-red-500" />
          ) : (
            <CheckCircleIcon className="text-green-500" />
          )}
        </td>
        <td>{idx + 1}</td>
        <td>{row.name}</td>
        <td>
          {row.errors.map((err) => (
            <div className="text-xs text-red-600">{err}</div>
          ))}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

#### 4.3 Normalización de datos

```typescript
// src/lib/import/normalizers.ts
export const normalizeCIF = (cif: string): string => {
  return cif.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export const normalizePhone = (phone: string): string => {
  // Convertir a formato español estándar
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('34')) clean = clean.slice(2)
  return clean.length === 9 ? clean : ''
}

export const normalizeProvince = (province: string): string => {
  const mapping: Record<string, string> = {
    lp: 'Las Palmas',
    'las palmas': 'Las Palmas',
    gc: 'Las Palmas',
    sc: 'Santa Cruz de Tenerife',
    tenerife: 'Santa Cruz de Tenerife',
    'sta cruz': 'Santa Cruz de Tenerife'
  }
  return mapping[province.toLowerCase()] || province
}
```

### Componentes a crear

- `src/components/import/ImportWizard.tsx`
- `src/components/import/UploadStep.tsx`
- `src/components/import/MappingStep.tsx`
- `src/components/import/ValidationStep.tsx`
- `src/components/import/ResultStep.tsx`
- `src/lib/import/normalizers.ts`
- `src/lib/import/validators.ts`

### Criterios de aceptación

- ✅ Soporta archivos .xlsx, .xls y .csv
- ✅ Detecta automáticamente columnas similares
- ✅ Muestra errores antes de importar
- ✅ Permite corregir datos en línea
- ✅ Log completo de operaciones (guardar en BD)

---

## 📊 Fase 5: Dashboard Avanzado (Prioridad: MEDIA)

**Duración estimada:** 6-8 días  
**Dependencias:** Fase 1 completada  
**Riesgo:** Bajo

### Objetivos

- Gráficas interactivas con Recharts
- Filtros por fecha/zona/usuario
- Comparativa semanal y mensual
- Ranking por municipio/isla

### Tareas Técnicas

#### 5.1 Instalar librerías de gráficas

```bash
npm install recharts date-fns
```

#### 5.2 Gráfica de ventas por marca

```tsx
// src/components/charts/SalesByBrand.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

export const SalesByBrand = ({ data }: { data: SalesSummary[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="brand" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#5C7CFA" name="Operaciones" />
        <Bar dataKey="revenue" fill="#66D9E8" name="Ingresos estimados" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

#### 5.3 Comparativa semanal

```typescript
// src/lib/analytics/comparisons.ts
export const getWeeklyComparison = async (week: number, year: number) => {
  const currentWeek = await getWeekData(week, year)
  const previousWeek = await getWeekData(week - 1, year)

  return {
    visits: {
      current: currentWeek.visits,
      previous: previousWeek.visits,
      change:
        ((currentWeek.visits - previousWeek.visits) / previousWeek.visits) * 100
    },
    sales: {
      current: currentWeek.sales,
      previous: previousWeek.sales,
      change:
        ((currentWeek.sales - previousWeek.sales) / previousWeek.sales) * 100
    }
  }
}
```

#### 5.4 Mapa de cobertura (opcional)

```tsx
// src/components/maps/CoverageMap.tsx
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

export const CoverageMap = ({
  distributors
}: {
  distributors: Distributor[]
}) => {
  return (
    <MapContainer center={[28.4, -16.5]} zoom={8}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {distributors.map((dist) => (
        <CircleMarker
          key={dist.id}
          center={[dist.latitude, dist.longitude]}
          radius={dist.status === 'active' ? 10 : 5}
          color={dist.status === 'active' ? 'green' : 'orange'}
        >
          <Popup>{dist.name}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
```

### Componentes a crear

- `src/components/charts/SalesByBrand.tsx`
- `src/components/charts/SalesByFamily.tsx`
- `src/components/charts/ConversionFunnel.tsx`
- `src/components/charts/QualityScore.tsx`
- `src/components/charts/WeeklyComparison.tsx`
- `src/components/maps/CoverageMap.tsx` (opcional)

### Criterios de aceptación

- ✅ Gráficas responden a filtros en tiempo real
- ✅ Datos actualizados cada vez que se agregan ventas/visitas
- ✅ Exportar gráficas como PNG
- ✅ Tooltips informativos en cada punto

---

## 📱 Fase 6: PWA + Offline (Prioridad: BAJA)

**Duración estimada:** 4-5 días  
**Dependencias:** Fase 1 y 2 completadas  
**Riesgo:** Alto (sincronización compleja)

### Objetivos

- Instalar como app nativa en móvil
- Cache de assets estáticos
- Cola de sincronización offline
- Notificaciones push (opcional)

### Tareas Técnicas

#### 6.1 Manifest.json

```json
// public/manifest.json
{
  "name": "GPV - Gestión Comercial",
  "short_name": "GPV",
  "description": "Herramienta de gestión para red comercial GPV en Canarias",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#5C7CFA",
  "theme_color": "#5C7CFA",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 6.2 Service Worker (Workbox)

```bash
npm install -D workbox-webpack-plugin
```

```typescript
// src/service-worker.ts
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate
} from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache de assets estáticos
precacheAndRoute(self.__WB_MANIFEST)

// Estrategia para API (network-first)
registerRoute(
  ({ url }) => url.origin === 'https://tu-proyecto.supabase.co',
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutos
      })
    ]
  })
)

// Estrategia para imágenes (cache-first)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
      })
    ]
  })
)
```

#### 6.3 Cola de sincronización offline

```typescript
// src/lib/offline/syncQueue.ts
import { openDB } from 'idb'

interface QueueItem {
  id: string
  type: 'visit' | 'sale' | 'note'
  action: 'create' | 'update' | 'delete'
  payload: any
  timestamp: number
}

export const queueOfflineAction = async (item: QueueItem) => {
  const db = await openDB('silbo-offline', 1, {
    upgrade(db) {
      db.createObjectStore('queue', { keyPath: 'id' })
    }
  })
  await db.add('queue', item)
}

export const processSyncQueue = async () => {
  const db = await openDB('silbo-offline', 1)
  const items = await db.getAll('queue')

  for (const item of items) {
    try {
      await syncItemToSupabase(item)
      await db.delete('queue', item.id)
    } catch (error) {
      console.error('Error syncing:', item, error)
    }
  }
}
```

### Componentes a crear

- `public/manifest.json`
- `src/service-worker.ts`
- `src/lib/offline/syncQueue.ts`
- `src/components/OfflineIndicator.tsx`

### Criterios de aceptación

- ✅ App instalable en iOS/Android
- ✅ Funciona sin conexión (lectura)
- ✅ Cola de acciones pendientes visible
- ✅ Sincroniza automáticamente al reconectar
- ✅ Indicador de estado offline/online

---

## 📄 Fase 7: Informe Semanal PRO (Prioridad: MEDIA)

**Duración estimada:** 6-7 días  
**Dependencias:** Fase 1 y 5 completadas  
**Riesgo:** Medio

### Objetivos

- Plantilla PDF profesional con branding
- Portada, KPIs, gráficas, focos/riesgos
- Generación automática cada lunes
- Envío por email a stakeholders

### Tareas Técnicas

#### 7.1 Generación de PDF

```bash
npm install @react-pdf/renderer
```

```tsx
// src/components/reports/WeeklyReport.tsx
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  logo: {
    width: 120,
    height: 40
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C7CFA',
    marginBottom: 10
  }
})

export const WeeklyReportPDF = ({ data }: { data: WeeklyData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Portada */}
      <View style={styles.header}>
        <Image style={styles.logo} src="/silbo-logo.png" />
        <Text>
          Semana {data.weekNumber} - {data.year}
        </Text>
      </View>

      <Text style={styles.title}>Informe Semanal de Actividad Comercial</Text>

      {/* KPIs */}
      <View>
        <Text>Visitas realizadas: {data.visits}</Text>
        <Text>Nuevos activos: {data.newActives}</Text>
        <Text>Operaciones: {data.operations}</Text>
      </View>

      {/* Gráficas (capturadas como imagen) */}
      <Image src={data.chartImages.salesByBrand} />

      {/* Focos y riesgos */}
      <View>
        <Text style={{ fontSize: 18, marginTop: 20 }}>
          🎯 Focos de atención
        </Text>
        {data.focus.map((item) => (
          <Text key={item.id}>• {item.text}</Text>
        ))}
      </View>
    </Page>
  </Document>
)
```

#### 7.2 Captura de gráficas

```typescript
// src/lib/reports/captureCharts.ts
import html2canvas from 'html2canvas'

export const captureChart = async (elementId: string): Promise<string> => {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    backgroundColor: '#ffffff'
  })

  return canvas.toDataURL('image/png')
}
```

#### 7.3 Envío automático por email

```typescript
// Supabase Edge Function: functions/send-weekly-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(/* ... */)

  // Generar PDF del informe
  const pdfBuffer = await generateWeeklyReport()

  // Enviar email con Resend/SendGrid
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'informes@silbocanarias.com',
      to: ['gerencia@silbocanarias.com', 'comercial@silbocanarias.com'],
      subject: `📊 Informe Semanal - Semana ${weekNumber}`,
      html: '<p>Adjunto encontrarás el informe semanal de actividad.</p>',
      attachments: [
        {
          filename: `informe-semana-${weekNumber}.pdf`,
          content: pdfBuffer.toString('base64')
        }
      ]
    })
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Componentes a crear

- `src/components/reports/WeeklyReportPDF.tsx`
- `src/components/reports/ReportPreview.tsx`
- `src/lib/reports/captureCharts.ts`
- `src/lib/reports/generatePDF.ts`
- `supabase/functions/send-weekly-report/index.ts`

### Criterios de aceptación

- ✅ PDF con branding Silbö (logo, colores)
- ✅ Gráficas incluidas como imágenes de alta calidad
- ✅ Sección de focos/riesgos editable
- ✅ Descarga manual desde Dashboard
- ✅ Envío automático los lunes a las 9:00 AM (Cron job)

---

## 🚀 Fase 8: Despliegue & QA (Prioridad: CRÍTICA)

**Duración estimada:** 3-4 días  
**Dependencias:** Todas las fases anteriores  
**Riesgo:** Bajo

### Objetivos

- Deploy en producción
- CI/CD automatizado
- Testing de regresión
- Documentación técnica

### Tareas Técnicas

#### 8.1 Configurar Vercel/Netlify

```bash
# Instalar CLI
npm install -g vercel

# Deploy
vercel --prod
```

```yaml
# vercel.json
{
  'buildCommand': 'npm run build',
  'outputDirectory': 'dist',
  'env':
    {
      'VITE_SUPABASE_URL': '@supabase_url',
      'VITE_SUPABASE_ANON_KEY': '@supabase_anon_key'
    },
  'headers':
    [
      {
        'source': '/service-worker.js',
        'headers':
          [
            {
              'key': 'Cache-Control',
              'value': 'public, max-age=0, must-revalidate'
            }
          ]
      }
    ]
}
```

#### 8.2 CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 8.3 Checklist de QA

```markdown
### Funcionalidades críticas

- [ ] Login/Logout funciona
- [ ] CRUD de distribuidores
- [ ] CRUD de candidatos
- [ ] Registro de visitas
- [ ] Registro de ventas
- [ ] Importación Excel
- [ ] Exportación filtrada
- [ ] Generación PDF

### Validaciones de negocio

- [ ] Lowi bloqueado para external_code='EXISTENTE_VF'
- [ ] Checklist obligatorio para ventas
- [ ] Marcas por defecto según canal

### Performance

- [ ] Carga inicial < 3s
- [ ] Interacciones < 200ms
- [ ] Lighthouse Score > 90

### Responsividad

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Móvil (375x667)

### Navegadores

- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (iOS)
- [ ] Edge
```

#### 8.4 Documentación técnica

```markdown
# README.md actualizado

## 🚀 Inicio rápido

\`\`\`bash
git clone https://github.com/tu-org/silbo-canarias.git
cd silbo-canarias
npm install
cp .env.example .env.local # Configurar variables
npm run dev
\`\`\`

## 📁 Estructura del proyecto

- `/src/components` - Componentes reutilizables
- `/src/pages` - Páginas principales
- `/src/lib` - Lógica de negocio, hooks, utilidades
- `/src/styles` - Estilos globales
- `/supabase` - Migraciones y Edge Functions

## 🔐 Variables de entorno

- `VITE_SUPABASE_URL` - URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave pública de Supabase
- `RESEND_API_KEY` - API key para envío de emails

## 🧪 Testing

\`\`\`bash
npm test # Unit tests
npm run test:e2e # End-to-end con Playwright
npm run test:coverage # Reporte de cobertura
\`\`\`

## 📝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md)
```

### Archivos a crear

- `vercel.json` / `netlify.toml`
- `.github/workflows/deploy.yml`
- `docs/QA-CHECKLIST.md`
- `docs/DEPLOYMENT.md`
- `README.md` actualizado

### Criterios de aceptación

- ✅ Deploy automático en cada push a main
- ✅ Tests pasan antes de deploy
- ✅ URLs de producción configuradas
- ✅ Documentación completa
- ✅ Checklist QA 100% validado

---

## 📊 Resumen de Estimaciones

| Fase                    | Duración | Riesgo   | Prioridad  |
| ----------------------- | -------- | -------- | ---------- |
| 1. Supabase Integration | 5-7 días | 🟡 Medio | 🔴 Crítica |
| 2. Auth + RLS           | 4-6 días | 🔴 Alto  | 🔴 Alta    |
| 3. Reglas de Negocio    | 3-4 días | 🟢 Bajo  | 🔴 Alta    |
| 4. Importador Excel     | 5-6 días | 🟡 Medio | 🟡 Media   |
| 5. Dashboard Avanzado   | 6-8 días | 🟢 Bajo  | 🟡 Media   |
| 6. PWA + Offline        | 4-5 días | 🔴 Alto  | 🟢 Baja    |
| 7. Informe Semanal PRO  | 6-7 días | 🟡 Medio | 🟡 Media   |
| 8. Despliegue & QA      | 3-4 días | 🟢 Bajo  | 🔴 Crítica |

**Total estimado:** 36-47 días (~6-8 semanas)

---

## 🎯 Estrategia de Implementación Recomendada

### Sprint 1 (Semanas 1-2): Fundamentos

- ✅ Fase 1: Supabase Integration (100%)
- ✅ Fase 2: Auth + RLS (80%)
- ✅ Fase 3: Reglas de Negocio (50%)

**Objetivo:** Sistema funcional con BD real y autenticación

### Sprint 2 (Semanas 3-4): Funcionalidades Core

- ✅ Fase 2: Auth + RLS (completar 20%)
- ✅ Fase 3: Reglas de Negocio (completar 50%)
- ✅ Fase 4: Importador Excel (100%)

**Objetivo:** Migración de datos y validaciones completas

### Sprint 3 (Semanas 5-6): Analytics & Reporting

- ✅ Fase 5: Dashboard Avanzado (100%)
- ✅ Fase 7: Informe Semanal PRO (80%)

**Objetivo:** Visibilidad y reportes automáticos

### Sprint 4 (Semanas 7-8): PWA & Deploy

- ✅ Fase 6: PWA + Offline (100%)
- ✅ Fase 7: Informe Semanal PRO (completar 20%)
- ✅ Fase 8: Despliegue & QA (100%)

**Objetivo:** App en producción lista para usuarios

---

## 📝 Notas Importantes

### Dependencias externas

- **Supabase Plan:** Pro ($25/mes) para RLS avanzado y Edge Functions
- **Resend API:** Para envío de emails ($20/mes)
- **Vercel Pro:** Opcional si se necesitan más builds ($20/mes)

### Equipo recomendado

- 1 Developer Full-stack (React + PostgreSQL)
- 1 QA Tester (para fase 8)
- 1 Product Owner (definición de reglas de negocio)

### Riesgos identificados

1. **Auth + RLS:** Configuración compleja, puede requerir más tiempo
2. **PWA Offline:** Sincronización puede tener edge cases difíciles
3. **Importador:** Datos reales pueden tener formatos inesperados

### Estrategia de mitigación

- Prototipar RLS en ambiente de pruebas primero
- Implementar logging exhaustivo en sync offline
- Hacer análisis de datos reales antes de implementar importador

---

## 🎉 Siguiente Paso

**Acción recomendada:** Comenzar con **Fase 1 - Integración Supabase**

1. Crear cuenta en Supabase
2. Ejecutar migraciones SQL
3. Configurar variables de entorno
4. Migrar primer hook (`useDistributors`)
5. Validar que CRUD funciona

¿Quieres que detalle más alguna fase específica o comenzamos con la Fase 1? 🚀
