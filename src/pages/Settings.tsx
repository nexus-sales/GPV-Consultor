import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ColorScheme, ColorSchemeConfig } from '../lib/ThemeContext'
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  SparklesIcon,
  Cog6ToothIcon as CogIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  ShareIcon,
  CircleStackIcon,
  LockClosedIcon,
  CubeIcon,
  FingerPrintIcon,
  TvIcon,
  XMarkIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../lib/useTheme'
import { useAppData } from '../lib/useAppData'
import { useAuth } from '../lib/hooks/useAuth'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabaseClient'
import { prepareCandidateForSupabase, prepareDistributorForSupabase } from '../lib/mappers/supabaseMappers'

// --- Tipos de Ajustes ---
type SettingTab = 'general' | 'appearance' | 'operations' | 'sectors' | 'security' | 'system'

interface SidebarItemProps {
  id: SettingTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: (id: SettingTab) => void
}

const SidebarItem: React.FC<SidebarItemProps> = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${active
      ? 'bg-pastel-indigo text-white shadow-lg shadow-pastel-indigo/30'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span className="font-semibold text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
  </button>
)

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>('general')
  const [testingConnection, setTestingConnection] = useState(false)
  const { isDark, toggle, colorScheme, setColorScheme, availableSchemes } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const {
    preferences,
    updatePreferences,
    pipelineStages,
    sectors,
    brandOptions,
    addBrand,
    removeBrand,
    addSector,
    removeSector,
    addPipelineStage,
    updatePipelineStage,
    removePipelineStage,
    reorderPipelineStage,
    forceSync,
    candidates,
    distributors
  } = useAppData()

  const handlePushLocalData = async () => {
    if (!confirm('⚠️ ¿Estás seguro? \n\nEsto subirá TODOS los candidatos y distribuidores que ves en la aplicación a Supabase database.\n\nÚsalo si tienes datos en local que no aparecen en la nube.')) return

    try {
      // 1. Prepare Candidates
      if (candidates.length > 0) {
        const candidatesToUpload = candidates.map(c => {
          const processed = prepareCandidateForSupabase(c)
          const clean: any = {}

          const allowedFields = [
            'id', 'name', 'taxId', 'stage', 'channelCode',
            'contact', 'city', 'island', 'province',
            'category', 'categoryId', 'pendingData',
            'brandPolicy', 'priority', 'score', 'notes',
            'notesHistory', 'createdAt', 'updatedAt',
            'lastContactAt', 'position', 'source'
          ]

          allowedFields.forEach(field => {
            if (processed[field] !== undefined) {
              clean[field] = processed[field]
            }
          })

          clean.id = String(clean.id)
          return clean
        })

        const { error: candError } = await supabase.from('candidatesGPV').upsert(candidatesToUpload, { onConflict: 'id' })
        if (candError) {
          console.error('Error subiendo candidatos:', candError)
          throw new Error(`Error subiendo candidatos: ${candError.message} (Code: ${candError.code})`)
        }
      }

      // 2. Prepare Distributors
      if (distributors.length > 0) {
        const distributorsToUpload = distributors.map(d => {
          const processed = prepareDistributorForSupabase(d)
          const clean: any = { ...processed }

          // Limpieza defensiva
          if (clean.category && typeof clean.category === 'object') delete clean.category
          if (clean.checklist && typeof clean.checklist === 'object') delete clean.checklist // Si DB no tiene checklist jsonb, borrar
          if (clean.brandPolicy) delete clean.brandPolicy
          if (clean.priorityDrivers) delete clean.priorityDrivers // Ya debería estar como snake_case priority_drivers si existe

          clean.id = String(clean.id)
          return clean
        })

        const { error: distError } = await supabase.from('distributorsGPV').upsert(distributorsToUpload, { onConflict: 'id' })
        if (distError) {
          console.error('Error detallado distribuidores:', distError)
          throw new Error(`Error subiendo distribuidores: ${distError.message} (Code: ${distError.code})`)
        }
      }

      alert('✅ Migración completada con éxito.\n\nLos datos locales se han subido a Supabase.')
      await forceSync() // Await para asegurar que termine
    } catch (error: any) {
      console.error('Error migrating data:', error)
      alert(`❌ Error en la migración: ${error.message || 'Desconocido'}`)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/login')
    }
  }

  const [newBrandNames, setNewBrandNames] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Handlers
  const handlePrivacyEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences({ privacyEmail: e.target.value })
  }

  // Secciones
  const renderGeneral = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Información de la Organización</h3>
        <p className="text-sm text-gray-500">Configura los detalles globales de tu instancia de GPV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nombre de la Instancia</span>
            <input
              type="text"
              defaultValue="GPV Canarias"
              className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pastel-indigo/20 outline-none"
              placeholder="Nombre de la instancia"
              aria-label="Nombre de la instancia"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Eslogan / Subtítulo</span>
            <input
              type="text"
              defaultValue="Gestión Integral Comercial"
              className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pastel-indigo/20 outline-none"
              placeholder="Eslogan o subtítulo"
              aria-label="Eslogan o subtítulo"
            />
          </label>
        </div>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group" onClick={() => document.getElementById('logo-upload')?.click()}>
          <input
            type="file"
            id="logo-upload"
            className="hidden"
            accept="image/png, image/svg+xml, image/jpeg"
            placeholder="Selecciona un logo"
            aria-label="Selecciona un logo"
            title="Selecciona un logo"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (file.size > 2 * 1024 * 1024) {
                  alert('El archivo es demasiado grande (max 2MB)')
                  return
                }
                const reader = new FileReader()
                reader.onloadend = () => {
                  setLogoPreview(reader.result as string)
                }
                reader.readAsDataURL(file)
              }
            }}
          />
          {logoPreview ? (
            <div className="relative w-32 h-32 mb-4 group-hover:opacity-90 transition-opacity">
              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                <ArrowPathIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-pastel-indigo/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TvIcon className="h-8 w-8 text-pastel-indigo" />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); document.getElementById('logo-upload')?.click() }}>
            {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
          </Button>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest text-center">
            PNG, JPG o SVG (max 2MB)
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Región y Despliegue</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Zona Horaria</p>
            <p className="text-sm font-semibold">Atlantic/Canary (GMT+0)</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Moneda</p>
            <p className="text-sm font-semibold">Euro (€)</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAppearance = () => {
    // Helper para resolver colores de Tailwind o nombres a Hex para los previews
    // resolveColor eliminado porque las variables primary, secondary, accent ya no se usan

    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Personalización Visual</h3>
          <p className="text-sm text-gray-500">Adapta el entorno de trabajo a tu estilo y necesidades.</p>
        </div>

        {/* Modo Interfaz */}
        <div className="grid grid-cols-1 gap-8">
          <div className={`p-6 rounded-3xl border-2 transition-all duration-300 ${isDark ? 'border-pastel-indigo bg-pastel-indigo/5' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pastel-indigo/10 flex items-center justify-center">
                  {isDark ? <MoonIcon className="h-6 w-6 text-pastel-indigo" /> : <SunIcon className="h-6 w-6 text-pastel-indigo" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Modo Interfaz</h4>
                  <p className="text-sm text-gray-500">{isDark ? 'Modo noche activo' : 'Modo día activo'}</p>
                </div>
              </div>
              <button
                onClick={toggle}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pastel-indigo/50 ${isDark ? 'bg-pastel-indigo' : 'bg-gray-200'}`}
                aria-label="Cambiar modo oscuro/claro"
                title="Cambiar modo oscuro/claro"
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isDark ? 'translate-x-8' : ''}`} />
              </button>
            </div>
          </div>

          {/* Selector de Esquema de Color Premium */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-pastel-indigo" />
                <h4 className="font-bold text-gray-900 dark:text-white">Esquema de Color</h4>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 uppercase tracking-wider">
                {availableSchemes[colorScheme]?.name || colorScheme}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Object.entries(availableSchemes).map(([key, config]) => {
                const schemeKey = key as ColorScheme
                const scheme = config as ColorSchemeConfig
                const isActive = colorScheme === schemeKey

                return (
                  <button
                    key={key}
                    onClick={() => setColorScheme(schemeKey)}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300 outline-none ${isActive
                      ? 'border-pastel-indigo shadow-lg shadow-pastel-indigo/20 scale-100 ring-2 ring-pastel-indigo/20 ring-offset-2 dark:ring-offset-gray-900'
                      : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
                      }`}
                  >
                    {/* Preview Area */}
                    <div className="relative h-28 w-full bg-gray-50 dark:bg-gray-900 p-3 pointer-events-none">
                      <div className="h-full w-full rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex border border-gray-100 dark:border-gray-700">
                        {/* Sidebar Preview */}
                        <div
                          className={`w-1/4 h-full opacity-90`}
                          style={{ backgroundColor: scheme.primary.startsWith('#') ? scheme.primary : undefined }}
                        >
                          {!scheme.primary.startsWith('#') && <div className={`w-full h-full bg-${scheme.primary}-500`} />}
                        </div>
                        {/* Main Content Preview */}
                        <div className="flex-1 flex flex-col">
                          {/* Header */}
                          <div className="h-3 w-full border-b border-dashed border-gray-200 dark:border-gray-700 flex items-center px-1 gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: scheme.secondary.startsWith('#') ? scheme.secondary : undefined }}
                            >
                              {!scheme.secondary.startsWith('#') && <div className={`w-full h-full rounded-full bg-${scheme.secondary}-400`} />}
                            </div>
                          </div>
                          {/* Body */}
                          <div className="p-1.5 space-y-1.5">
                            <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-700 rounded-sm"></div>
                            <div className="flex gap-1">
                              <div className="h-6 w-full bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600 relative overflow-hidden">
                                <div
                                  className="absolute right-1 bottom-1 w-2 h-2 rounded-full"
                                  style={{ backgroundColor: scheme.accent.startsWith('#') ? scheme.accent : undefined }}
                                >
                                  {!scheme.accent.startsWith('#') && <div className={`w-full h-full rounded-full bg-${scheme.accent}-500`} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Indicator Overlay */}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[1px]">
                          <div className="bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-xl transform scale-100 animate-in fade-in zoom-in duration-200">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-pastel-indigo" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Label Area */}
                    <div className="py-3 px-4 w-full text-left bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-700/30 transition-colors">
                      <span className={`block text-xs font-bold truncate ${isActive ? 'text-pastel-indigo' : 'text-gray-600 dark:text-gray-300'}`}>
                        {scheme.name}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }





  const renderOperations = () => (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Configuración del Pipeline</h3>
        <p className="text-sm text-gray-500">Define las etapas del embudo de ventas y reglas de negocio.</p>
      </div>

      <div className="space-y-4">
        {pipelineStages.map((stage, idx) => (
          <div key={stage.id} className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group hover:shadow-md transition-all">
            <div className={`w-3 h-12 rounded-full ${stage.tone?.startsWith('bg-') ? stage.tone.replace('bg-', 'bg-opacity-100 bg-') : 'bg-pastel-indigo'}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{stage.label}</p>
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded-md font-bold text-gray-400 uppercase tracking-widest">ID: {stage.id}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 mr-2">
                <button
                  onClick={() => reorderPipelineStage(stage.id, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-gray-300 hover:text-pastel-indigo disabled:opacity-0 transition-all"
                  aria-label="Subir etapa"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => reorderPipelineStage(stage.id, 'down')}
                  disabled={idx === pipelineStages.length - 1}
                  className="p-1 text-gray-300 hover:text-pastel-indigo disabled:opacity-0 transition-all"
                  aria-label="Bajar etapa"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-pastel-indigo hover:bg-pastel-indigo/10"
                onClick={() => {
                  const newLabel = prompt('Nuevo nombre de la etapa:', stage.label)
                  if (newLabel && newLabel !== stage.label) {
                    updatePipelineStage(stage.id, { label: newLabel })
                  }
                  const newDesc = prompt('Nueva descripción:', stage.description)
                  if (newDesc && newDesc !== stage.description) {
                    updatePipelineStage(stage.id, { description: newDesc })
                  }
                }}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar la etapa "${stage.label}"?\n\nLos candidatos en esta etapa podrían quedar huérfanos visualmente.`)) {
                    removePipelineStage(stage.id)
                  }
                }}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <button
          onClick={() => {
            const label = prompt('Nombre de la nueva etapa:')
            if (!label) return
            const description = prompt('Descripción corta:') || ''
            const id = label.toLowerCase().trim().replace(/\s+/g, '_')

            addPipelineStage({
              id,
              label,
              description,
              tone: 'bg-pastel-indigo/10', // Default modern style
              accent: 'border-pastel-indigo/20',
              badge: 'bg-pastel-indigo/15 text-pastel-indigo',
              empty: `No hay candidatos en ${label} activamente.`
            })
          }}
          className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-3xl text-gray-400 hover:text-pastel-indigo hover:border-pastel-indigo hover:bg-pastel-indigo/5 transition-all group"
        >
          <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm">Añadir Nueva Etapa al Embudo</span>
        </button>
      </div>
    </div>
  )

  const renderSectors = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sectores y Marcas</h3>
          <p className="text-sm text-gray-500">Administra las líneas de negocio y proveedores disponibles.</p>
        </div>
        <Button
          onClick={() => {
            const label = prompt('Nombre del nuevo sector:')
            if (label) {
              addSector({
                id: label.toLowerCase().replace(/\s+/g, '_'),
                label,
                icon: '📁',
                color: 'blue'
              })
            }
          }}
          className="gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Añadir Sector
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {sectors.map((sector) => {
          const sectorBrands = brandOptions.filter(b => b.sectorId === sector.id)

          return (
            <div key={sector.id} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pastel-indigo to-pastel-cyan rounded-[32px] opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
              <Card className="relative p-8 overflow-hidden border-none shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-[30px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-4xl shadow-inner">
                      {sector.icon}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{sector.label}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md font-black text-gray-400 uppercase tracking-tighter">ID: {sector.id}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-pastel-indigo/10 text-pastel-indigo rounded-md font-bold uppercase tracking-tight">{sectorBrands.length} Operadores</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50/50 dark:bg-gray-900/30 p-2 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                    <input
                      type="text"
                      placeholder="Nueva marca..."
                      value={newBrandNames[sector.id] || ''}
                      onChange={(e) => setNewBrandNames(prev => ({ ...prev, [sector.id]: e.target.value }))}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-pastel-indigo/30 outline-none w-full sm:w-40"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const label = newBrandNames[sector.id]
                        if (label) {
                          addBrand({ label, sectorId: sector.id })
                          setNewBrandNames(prev => ({ ...prev, [sector.id]: '' }))
                        }
                      }}
                      disabled={!newBrandNames[sector.id]}
                      className="whitespace-nowrap w-full sm:w-auto"
                    >
                      Añadir
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sectorBrands.map(brand => (
                    <div
                      key={brand.id}
                      className="group/brand relative flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-pastel-indigo/20 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-4">
                        {brand.label}
                      </span>
                      <button
                        onClick={() => removeBrand(brand.id)}
                        className="absolute right-2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover/brand:opacity-100 transition-all"
                        aria-label="Eliminar marca"
                        title="Eliminar marca"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {sectorBrands.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-400 font-medium italic">No hay operadores registrados en este sector</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar sector ${sector.label} y todas sus marcas?`)) {
                      removeSector(sector.id)
                    }
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar sector"
                  title="Eliminar sector"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Seguridad y Datos</h3>
        <p className="text-sm text-gray-500">Gestión de cumplimiento (GDPR), privacidad y accesos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <LockClosedIcon className="h-5 w-5 text-pastel-indigo" />
            <h4 className="font-bold">Política de Privacidad</h4>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email del DPD</span>
            <input
              type="email"
              value={preferences.privacyEmail}
              onChange={handlePrivacyEmailChange}
              className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-pastel-indigo/20"
              placeholder="dpd@gpvcanarias.com"
            />
          </label>
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
            <span>GDPR Compliance: <strong>Activado</strong></span>
            <ShieldCheckIcon className="h-4 w-4" />
          </div>
        </Card>

        <Card className="p-6 border-none shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <FingerPrintIcon className="h-5 w-5 text-pastel-cyan" />
            <h4 className="font-bold">Acciones de Cuenta</h4>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-sm">Cambiar mi Contraseña</Button>
            <Button variant="outline" className="w-full justify-start text-sm">Autenticación de 2 Factores</Button>
            <Button variant="ghost" className="w-full justify-start text-sm text-red-500 hover:bg-red-50" onClick={handleLogout}>Revocar Todos los Accesos</Button>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderSystem = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Estado del Sistema</h3>
          <p className="text-sm text-gray-500">Monitorización de servicios y sincronización de datos.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={forceSync}>
          <ArrowPathIcon className="h-4 w-4" />
          Sync Forzada
        </Button>
      </div>

      <Card className="p-6 border-none shadow-xl bg-white dark:bg-gray-800 space-y-4 border-l-4 border-l-orange-500">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
          <CircleStackIcon className="h-8 w-8 text-orange-500" />
          <div>
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">Migración y Rescate de Datos</h4>
            <p className="text-sm text-gray-500">Utiliza esto si tus datos locales no aparecen en Supabase.</p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 text-sm text-orange-800 dark:text-orange-200">
          <p className="font-bold mb-1">⚠️ Sincronización Manual</p>
          <p>Esta acción tomará todos los datos locales que ves ahora mismo en tu pantalla y los enviará a la base de datos de Supabase, sobreescribiendo si es necesario.</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={async (e) => {
            e.preventDefault()
            if (testingConnection) return
            setTestingConnection(true)
            try {
              console.log('Iniciando prueba de conexión...')

              // Timeout cubre TODA la operación (incluyendo auth)
              const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Tiempo de espera agotado (10s). Revisa tu conexión a internet o la URL de Supabase.')), 10000)
              )

              const test = async () => {
                const { data: { session } } = await supabase.auth.getSession()
                console.log(session ? `✅ Sesión activa: ${session.user.email}` : '⚠️ Sin sesión activa')
                // SELECT es más seguro para testear: no requiere permisos de escritura
                return supabase.from('candidatesGPV').select('id').limit(1)
              }

              const result = await Promise.race([test(), timeout]) as any
              const { error } = result || {}

              if (error) {
                console.error('Error de prueba:', error)
                alert(`❌ Error de conexión: ${error.message} (Code: ${error.code})`)
              } else {
                console.log('✅ Prueba de conexión exitosa')
                alert('✅ Conexión con Supabase verificada correctamente.')
              }
            } catch (e) {
              console.error('Excepción de prueba:', e)
              alert(`❌ Error crítico: ${e instanceof Error ? e.message : 'Desconocido'}`)
            } finally {
              setTestingConnection(false)
            }
          }} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50" disabled={testingConnection}>
            {testingConnection ? 'Probando...' : 'Probar Conexión'}
          </Button>
          <Button onClick={(e) => { e.preventDefault(); handlePushLocalData() }} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-lg shadow-orange-500/30 animate-pulse">
            <ArrowUpTrayIcon className="h-5 w-5" />
            SUBIR DATOS AHORA
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Base de Datos', status: 'Online', icon: CircleStackIcon, color: 'green' },
          { label: 'Servicio de Sync', status: 'Trabajando', icon: ArrowPathIcon, color: 'blue' },
          { label: 'Almacenamiento', status: '94% Libre', icon: CubeIcon, color: 'indigo' }
        ].map((sys, idx) => (
          <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 text-center space-y-3">
            <div className={`mx-auto w-12 h-12 rounded-2xl bg-${sys.color}-100 dark:bg-${sys.color}-900/30 flex items-center justify-center`}>
              <sys.icon className={`h-6 w-6 text-${sys.color}-500`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{sys.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{sys.status}</p>
            </div>
          </div>
        ))}
      </div>



      <Card className="p-6 border-none shadow-xl bg-gray-900 text-white">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-pastel-cyan" />
            Logs de Consola Remota
          </h4>
          <span className="text-[10px] bg-white/10 px-2 py-1 rounded">DEBUG MODE</span>
        </div>
        <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto space-y-1">
          <p>[08:05:01] Auth: Token validado correctamente.</p>
          <p>[08:05:02] Sync: Sincronización de 14 registros completada.</p>
          <p>[08:05:10] UI: Renderizado de Dashboard finalizado (420ms).</p>
          <p className="animate-pulse">_</p>
        </div>
      </Card>
    </div>
  )

  const content = {
    general: renderGeneral(),
    appearance: renderAppearance(),
    operations: renderOperations(),
    sectors: renderSectors(),
    security: renderSecurity(),
    system: renderSystem()
  }[activeTab]

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar Navigation */}
        <div className="lg:w-80 flex flex-col gap-8">
          <div className="p-8 rounded-4xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pastel-indigo/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <p className="text-xs font-bold text-pastel-cyan uppercase tracking-widest mb-1">Management Console</p>
            <h1 className="text-3xl font-black mb-1">Ajustes</h1>
            <p className="text-sm text-gray-400">Panel de control administrativo</p>
          </div>

          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            <SidebarItem id="general" label="Gobernanza" icon={CogIcon} active={activeTab === 'general'} onClick={setActiveTab} />
            <SidebarItem id="appearance" label="Identidad Visual" icon={SparklesIcon} active={activeTab === 'appearance'} onClick={setActiveTab} />
            <SidebarItem id="operations" label="Flujos de Venta" icon={WrenchScrewdriverIcon} active={activeTab === 'operations'} onClick={setActiveTab} />
            <SidebarItem id="sectors" label="Marcas y Sectores" icon={CubeIcon} active={activeTab === 'sectors'} onClick={setActiveTab} />
            <SidebarItem id="security" label="Privacidad y Firma" icon={ShieldCheckIcon} active={activeTab === 'security'} onClick={setActiveTab} />
            <SidebarItem id="system" label="Estado de Red" icon={ArrowPathIcon} active={activeTab === 'system'} onClick={setActiveTab} />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="p-8 md:p-12 border-none shadow-2xl min-h-[600px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[40px] relative">
            {content}

            {/* Save Indicator (Fixed at bottom) */}
            <div className="absolute bottom-8 right-8 flex items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Estado de cambios</p>
                <p className="text-xs font-bold text-pastel-green">Sincronizado en la nube</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-pastel-green/10 flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-pastel-green" />
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}

// ✅ PlusIcon is now imported from @heroicons/react


export default SettingsPage
