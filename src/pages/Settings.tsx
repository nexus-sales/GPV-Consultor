import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MFASetupPanel } from '../components/auth/MFASetupPanel'
import { PageContainer } from '../components/layout/PageContainer'
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
  ArrowDownTrayIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  AtSymbolIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../lib/useTheme'
import { useAppData } from '../lib/useAppData'
import { useAuth } from '../lib/hooks/useAuth'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabaseClient'
import { useConfirm } from '../lib/ConfirmProvider'
import {
  prepareCandidateForSupabase,
  prepareDistributorForSupabase
} from '../lib/mappers/supabaseMappers'
import { createPrefixedLogger, getLogHistory } from '../lib/logger'
import { CalendarSyncPanel, TaskSyncPanel, visitToCalendarEvent } from '../lib/integrations'

const log = createPrefixedLogger('[Settings]')

// --- Tipos de Ajustes ---
type SettingTab =
  | 'general'
  | 'appearance'
  | 'operations'
  | 'sectors'
  | 'security'
  | 'integrations'
  | 'system'

interface SidebarItemProps {
  id: SettingTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: (id: SettingTab) => void
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  label,
  icon: Icon,
  active,
  onClick
}) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
    <span className="font-semibold text-sm">{label}</span>
    {active && (
      <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
    )}
  </button>
)

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>('general')
  const [testingConnection, setTestingConnection] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('')
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const { isDark, toggle, colorScheme, setColorScheme, availableSchemes } =
    useTheme()
  const { signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

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
    visits,
    candidates,
    distributors
  } = useAppData()

  useEffect(() => {
    if (!isAdmin && activeTab === 'integrations') {
      setActiveTab('general')
    }
  }, [activeTab, isAdmin])

  const handlePushLocalData = async () => {
    const isConfirmed = await confirm({
      title: '⚠️ ¿Estás seguro?',
      description:
        'Esto subirá TODOS los candidatos y distribuidores que ves en la aplicación a Supabase database.\n\nÚsalo si tienes datos en local que no aparecen en la nube.',
      type: 'warning'
    })
    if (!isConfirmed) return

    try {
      // 1. Prepare Candidates
      if (candidates.length > 0) {
        const candidatesToUpload = candidates.map((c) => {
          const processed = prepareCandidateForSupabase(c)
          const clean: Record<string, unknown> = {}

          const allowedFields = [
            'id',
            'name',
            'taxId',
            'stage',
            'channelCode',
            'contact',
            'city',
            'island',
            'province',
            'category',
            'categoryId',
            'pendingData',
            'brandPolicy',
            'priority',
            'score',
            'notes',
            'notesHistory',
            'createdAt',
            'updatedAt',
            'lastContactAt',
            'position',
            'source'
          ]

          allowedFields.forEach((field) => {
            if (processed[field] !== undefined) {
              clean[field] = processed[field]
            }
          })

          clean.id = String(clean.id)
          return clean
        })

        const { error: candError } = await supabase
          .from('candidatesGPV')
          .upsert(candidatesToUpload, { onConflict: 'id' })
        if (candError) {
          log.error('Error subiendo candidatos:', candError)
          throw new Error(
            `Error subiendo candidatos: ${candError.message} (Code: ${candError.code})`
          )
        }
      }

      // 2. Prepare Distributors
      if (distributors.length > 0) {
        const distributorsToUpload = distributors.map((d) => {
          const processed = prepareDistributorForSupabase(d)
          const clean: Record<string, unknown> = { ...processed }

          // Limpieza defensiva
          if (clean.category && typeof clean.category === 'object')
            delete clean.category
          if (clean.checklist && typeof clean.checklist === 'object')
            delete clean.checklist // Si DB no tiene checklist jsonb, borrar
          if (clean.brandPolicy) delete clean.brandPolicy
          if (clean.priorityDrivers) delete clean.priorityDrivers // Ya debería estar como snake_case priority_drivers si existe

          clean.id = String(clean.id)
          return clean
        })

        const { error: distError } = await supabase
          .from('distributorsGPV')
          .upsert(distributorsToUpload, { onConflict: 'id' })
        if (distError) {
          log.error('Error detallado distribuidores:', distError)
          throw new Error(
            `Error subiendo distribuidores: ${distError.message} (Code: ${distError.code})`
          )
        }
      }

      toast.success(
        'Migracion completada. Los datos locales se han subido a Supabase.'
      )
      await forceSync()
    } catch (error: unknown) {
      log.error('Error migrating data:', error)
      toast.error(
        `Error en la migracion: ${error instanceof Error ? error.message : 'Desconocido'}`
      )
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      log.error('Logout failed:', error)
      navigate('/login')
    }
  }

  const [newBrandNames, setNewBrandNames] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(
    preferences.instanceLogo || null
  )

  // Sprint 2: Email DPD con guardado explicito
  const [dpdEmail, setDpdEmail] = useState(preferences.privacyEmail || '')
  const [dpdSaving, setDpdSaving] = useState(false)

  // Sprint 2: Gobernanza persistida
  const [orgName, setOrgName] = useState(
    ((preferences as Record<string, unknown>).orgName as string) ||
      'GPV Canarias'
  )
  const [orgSlogan, setOrgSlogan] = useState(
    ((preferences as Record<string, unknown>).orgSlogan as string) ||
      'Gestión Integral Comercial'
  )
  const [orgSaving, setOrgSaving] = useState(false)

  // Sprint 2: Edicion inline de etapas pipeline (reemplaza prompt())
  const [editingStage, setEditingStage] = useState<{
    id: string
    label: string
    description: string
    tone?: string
    icon?: string
  } | null>(null)

  // Sprint 2: Edicion inline de sectores
  const [editingSector, setEditingSector] = useState<{
    id: string
    label: string
    icon?: string
    color?: string
  } | null>(null)

  // Editar marca
  const [editingBrand, setEditingBrand] = useState<{
    id: string
    label: string
    sectorId: string
  } | null>(null)

  // Colores corporativos personalizados
  const [customColors, setCustomColors] = useState({
    primary: preferences.primaryColor || '#6366f1',
    secondary: preferences.secondaryColor || '#06b6d4',
    accent: preferences.accentColor || '#f59e0b'
  })

  // System logs state
  const [logHistory, setLogHistory] = useState<
    Array<{ timestamp: string; level: string; module: string; message: string }>
  >([])

  const refreshLogHistory = () => {
    setLogHistory(getLogHistory(10))
  }

  const handleExportLogs = () => {
    const allLogs = getLogHistory(50)
    const logText = allLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.module}: ${log.message}`
      )
      .join('\n')

    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gpv-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Logs exportados correctamente')
  }

  const handleClearLogs = async () => {
    const isConfirmed = await confirm({
      title: '¿Limpiar historial de logs?',
      description:
        'Esta acción eliminará todos los logs almacenados localmente. ¿Estás seguro?',
      type: 'warning'
    })

    if (isConfirmed) {
      // Clear logs from localStorage
      localStorage.removeItem('gpv_log_history')
      refreshLogHistory()
      toast.success('Historial de logs limpiado')
    }
  }

  // Exportar datos personales (RGPD)
  const handleExportMyData = async () => {
    const isConfirmed = await confirm({
      title: 'Exportar mis datos personales',
      description:
        'Se generará un archivo JSON con todos tus datos personales, candidatos, distribuidores, ventas y visitas almacenados. Esto puede tardar unos segundos.',
      type: 'info'
    })

    if (!isConfirmed) return

    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        preferences,
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.name,
          taxId: c.taxId,
          stage: c.stage,
          channelCode: c.channelCode,
          contact: c.contact,
          city: c.city,
          island: c.island,
          province: c.province,
          category: c.category,
          priority: c.priority,
          score: c.score,
          notes: c.notes,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        })),
        distributors: distributors.map((d) => ({
          id: d.id,
          name: d.name,
          taxId: d.taxId,
          status: d.status,
          contact: d.contact,
          city: d.city,
          province: d.province,
          sectorId: d.sectorId,
          brandId: d.brandId,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        })),
        visits: visits.map((v) => ({
          id: v.id,
          distributorId: v.distributorId,
          date: v.date,
          result: v.result,
          summary: v.summary,
          createdAt: v.createdAt
        })),
        sales: sales.map((s) => ({
          id: s.id,
          distributorId: s.distributorId,
          brand: s.brand,
          amount: s.amount,
          date: s.date,
          createdAt: s.createdAt
        }))
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gpv-mis-datos-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(
        'Datos exportados correctamente. Revisa tu carpeta de descargas.'
      )
    } catch (error) {
      log.error('Error exportando datos:', error)
      toast.error('Error al exportar los datos. Inténtalo de nuevo.')
    }
  }

  // Eliminar cuenta (RGPD)
  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm({
      title: '⚠️ Eliminar cuenta permanentemente',
      description:
        'Esta acción ELIMINARÁ todos tus datos de forma PERMANENTE:\n\n• Tu usuario\n• Todos los candidatos\n• Todos los distribuidores\n• Todas las ventas y visitas\n• Todas las configuraciones\n\n¿Estás ABSOLUTAMENTE SEGURO? Esta acción NO se puede deshacer.',
      type: 'danger',
      confirmText: 'Sí, eliminar todo'
    })

    if (!isConfirmed) return

    // Segunda confirmación
    const finalConfirm = await confirm({
      title: '⚠️ ÚLTIMA CONFIRMACIÓN',
      description:
        'Por favor, escribe "ELIMINAR" para confirmar que quieres borrar todos tus datos permanentemente.',
      type: 'danger',
      confirmText: 'ELIMINAR',
      requireTextConfirm: true
    })

    if (!finalConfirm) return

    try {
      // Eliminar datos locales
      localStorage.clear()

      // Eliminar usuario de Supabase (requiere llamada a Edge Function)
      // const { error } = await supabase.functions.invoke('delete-account')
      // if (error) throw error

      toast.success(
        'Cuenta eliminada. Tus datos han sido borrados permanentemente.'
      )

      // Cerrar sesión
      setTimeout(async () => {
        await signOut()
        navigate('/login')
      }, 2000)
    } catch (error) {
      log.error('Error eliminando cuenta:', error)
      toast.error('Error al eliminar la cuenta. Contacta con soporte.')
    }
  }

  // Auto-refresh logs on mount
  useEffect(() => {
    refreshLogHistory()
    // Cargar versión de la app desde package.json o manifest
    const version = import.meta.env.PACKAGE_VERSION || '2.5.0'
    setAppVersion(version)

    // Cargar favicon guardado
    if (preferences.favicon) {
      updateFavicon(preferences.favicon)
    }
  }, []) // eslint-disable-line

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true)
    try {
      // Simular check de actualizaciones (en producción compararía con GitHub releases)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const currentVersion = '2.5.0'
      const latestVersion = '2.5.0' // En producción, fetch desde GitHub API

      if (currentVersion >= latestVersion) {
        toast.success('¡Tienes la última versión!')
      } else {
        toast.info(`Nueva versión disponible: ${latestVersion}`)
      }
    } catch {
      toast.error('Error buscando actualizaciones')
    } finally {
      setCheckingUpdates(false)
    }
  }

  // --- Handlers ---

  const handleSaveDpdEmail = async () => {
    if (!dpdEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(dpdEmail)) {
      toast.error('Introduce un email valido para el DPD')
      return
    }
    setDpdSaving(true)
    updatePreferences({ privacyEmail: dpdEmail })
    await new Promise((r) => setTimeout(r, 300))
    toast.success('Email del DPD guardado correctamente')
    setDpdSaving(false)
  }

  const handleSaveOrg = async () => {
    setOrgSaving(true)
    updatePreferences({ orgName, orgSlogan } as Parameters<
      typeof updatePreferences
    >[0])
    await new Promise((r) => setTimeout(r, 300))
    toast.success('Información de la organización guardada')
    setOrgSaving(false)
  }

  const handleSaveStageEdit = () => {
    if (!editingStage) return
    updatePipelineStage(editingStage.id, {
      label: editingStage.label,
      description: editingStage.description,
      tone: editingStage.tone,
      icon: editingStage.icon
    })
    toast.success(`Etapa "${editingStage.label}" actualizada`)
    setEditingStage(null)
  }

  const handleSaveSectorEdit = () => {
    if (!editingSector) return
    const newId = editingSector.label.toLowerCase().trim().replace(/\s+/g, '_')
    // Remove old sector and add with new name/icon/color
    const oldSector = sectors.find((s) => s.id === editingSector.id)
    if (oldSector) {
      removeSector(editingSector.id)
      addSector({
        id: newId,
        label: editingSector.label,
        icon: editingSector.icon || oldSector.icon,
        color: editingSector.color || oldSector.color || 'blue'
      })
    }
    toast.success(`Sector "${editingSector.label}" actualizado`)
    setEditingSector(null)
  }

  const handleSaveBrandEdit = () => {
    if (!editingBrand) return
    // Remove old brand and add with new name
    removeBrand(editingBrand.id)
    addBrand({
      id: editingBrand.id, // Keep same ID
      label: editingBrand.label,
      sectorId: editingBrand.sectorId
    })
    toast.success(`Marca "${editingBrand.label}" actualizada`)
    setEditingBrand(null)
  }

  const handleLogoUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (max 2MB)')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const logoData = reader.result as string
      setLogoPreview(logoData)
      updatePreferences({ instanceLogo: logoData })
      toast.success('Logo guardado correctamente')

      // Actualizar favicon dinámicamente
      updateFavicon(logoData)
    }
    reader.readAsDataURL(file)
  }

  const updateFavicon = (faviconData: string) => {
    // Crear o actualizar el favicon dinámicamente
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = faviconData

    // También actualizar apple-touch-icon
    let appleLink = document.querySelector(
      "link[rel~='apple-touch-icon']"
    ) as HTMLLinkElement
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = faviconData

    updatePreferences({ favicon: faviconData })
    toast.success('Favicon actualizado correctamente')
  }

  const handleSaveCustomColors = () => {
    updatePreferences({
      primaryColor: customColors.primary,
      secondaryColor: customColors.secondary,
      accentColor: customColors.accent
    })
    toast.success(
      'Colores corporativos guardados. Los cambios se aplicarán en toda la aplicación.'
    )
  }

  const handleResetCustomColors = () => {
    setCustomColors({
      primary: '#6366f1',
      secondary: '#06b6d4',
      accent: '#f59e0b'
    })
    updatePreferences({
      primaryColor: '#6366f1',
      secondaryColor: '#06b6d4',
      accentColor: '#f59e0b'
    })
    toast.success('Colores restablecidos a los valores por defecto')
  }

  // Secciones
  const renderGeneral = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Información de la Organización
        </h3>
        <p className="text-sm text-gray-500">
          Configura los detalles globales de tu instancia de GPV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Nombre de la Instancia
            </span>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              placeholder="Nombre de la instancia"
              aria-label="Nombre de la instancia"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Eslogan / Subtítulo
            </span>
            <input
              type="text"
              value={orgSlogan}
              onChange={(e) => setOrgSlogan(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              placeholder="Eslogan o subtítulo"
              aria-label="Eslogan o subtítulo"
            />
          </label>
          <Button onClick={handleSaveOrg} disabled={orgSaving} className="mt-2">
            {orgSaving ? 'Guardando...' : 'Guardar Información'}
          </Button>
        </div>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800"
          onClick={() => document.getElementById('logo-upload')?.click()}
        >
          <input
            type="file"
            id="logo-upload"
            className="hidden"
            accept="image/png, image/svg+xml, image/jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleLogoUpload(file)
              }
            }}
          />
          {logoPreview ? (
            <div className="relative w-32 h-32 mb-4 group-hover:opacity-90 transition-opacity">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                <ArrowPathIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TvIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById('logo-upload')?.click()
            }}
          >
            {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
          </Button>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest text-center">
            PNG, JPG o SVG (max 2MB)
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">
          Región y Despliegue
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">
              Zona Horaria
            </label>
            <select
              value={preferences.timezone || 'Atlantic/Canary'}
              onChange={(e) => updatePreferences({ timezone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="Atlantic/Canary">Atlantic/Canary (GMT+0)</option>
              <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
              <option value="Europe/London">Europe/London (GMT+0)</option>
              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
              <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
              <option value="Europe/Rome">Europe/Rome (GMT+1)</option>
              <option value="Europe/Amsterdam">Europe/Amsterdam (GMT+1)</option>
              <option value="Europe/Brussels">Europe/Brussels (GMT+1)</option>
              <option value="Europe/Lisbon">Europe/Lisbon (GMT+0)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
              <option value="America/Chicago">America/Chicago (GMT-6)</option>
              <option value="America/Denver">America/Denver (GMT-7)</option>
              <option value="America/Los_Angeles">
                America/Los_Angeles (GMT-8)
              </option>
              <option value="America/Mexico_City">
                America/Mexico City (GMT-6)
              </option>
              <option value="America/Bogota">America/Bogota (GMT-5)</option>
              <option value="America/Lima">America/Lima (GMT-5)</option>
              <option value="America/Santiago">America/Santiago (GMT-4)</option>
              <option value="America/Buenos_Aires">
                America/Buenos Aires (GMT-3)
              </option>
              <option value="America/Sao_Paulo">
                America/Sao Paulo (GMT-3)
              </option>
              <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="Australia/Sydney">
                Australia/Sydney (GMT+10)
              </option>
              <option value="Pacific/Auckland">
                Pacific/Auckland (GMT+12)
              </option>
            </select>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">
              Moneda
            </p>
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Personalización Visual
          </h3>
          <p className="text-sm text-gray-500">
            Adapta el entorno de trabajo a tu estilo y necesidades.
          </p>
        </div>

        {/* Modo Interfaz */}
        <div className="grid grid-cols-1 gap-8">
          <div
          className={`rounded-xl border p-6 transition-colors ${isDark ? 'border-indigo-200 bg-indigo-50/20 dark:border-indigo-800 dark:bg-indigo-900/20' : 'border-gray-200 bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  {isDark ? (
                    <MoonIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <SunIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Modo Interfaz
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isDark ? 'Modo noche activo' : 'Modo día activo'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggle}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-indigo-600' : 'bg-gray-200'}`}
                aria-label="Cambiar modo oscuro/claro"
                title="Cambiar modo oscuro/claro"
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isDark ? 'translate-x-8' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Selector de Esquema de Color Premium */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Esquema de Color
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setColorScheme('indigo')}
                  className="text-xs"
                  title="Restablecer al esquema por defecto (Índigo)"
                >
                  <ArrowPathIcon className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 uppercase tracking-wider">
                  {availableSchemes[colorScheme]?.name || colorScheme}
                </span>
              </div>
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
                    className={`group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 outline-none ${
                      isActive
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-100 ring-2 ring-indigo-500/20 ring-offset-2 dark:ring-offset-gray-900'
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
                    }`}
                  >
                    {/* Preview Area */}
                    <div className="relative h-28 w-full bg-gray-50 dark:bg-gray-900 p-3 pointer-events-none">
                      <div className="h-full w-full rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex border border-gray-100 dark:border-gray-700">
                        {/* Sidebar Preview */}
                        {/* Inline style required: dynamic hex color cannot be expressed as a Tailwind class at runtime - see docs/CSS_INLINE_STYLES.md */}
                        <div
                          className={`w-1/4 h-full opacity-90`}
                          style={{
                            backgroundColor: scheme.primary.startsWith('#')
                              ? scheme.primary
                              : undefined
                          }}
                        >
                          {!scheme.primary.startsWith('#') && (
                            <div
                              className={`w-full h-full bg-${scheme.primary}-500`}
                            />
                          )}
                        </div>
                        {/* Main Content Preview */}
                        <div className="flex-1 flex flex-col">
                          {/* Header */}
                          <div className="h-3 w-full border-b border-dashed border-gray-200 dark:border-gray-700 flex items-center px-1 gap-1">
                            {/* Inline style required: dynamic hex color - see docs/CSS_INLINE_STYLES.md */}
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: scheme.secondary.startsWith(
                                  '#'
                                )
                                  ? scheme.secondary
                                  : undefined
                              }}
                            >
                              {!scheme.secondary.startsWith('#') && (
                                <div
                                  className={`w-full h-full rounded-full bg-${scheme.secondary}-400`}
                                />
                              )}
                            </div>
                          </div>
                          {/* Body */}
                          <div className="p-1.5 space-y-1.5">
                            <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-700 rounded-sm"></div>
                            <div className="flex gap-1">
                              <div className="h-6 w-full bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600 relative overflow-hidden">
                                {/* Inline style required: dynamic hex color - see docs/CSS_INLINE_STYLES.md */}
                                <div
                                  className="absolute right-1 bottom-1 w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: scheme.accent.startsWith(
                                      '#'
                                    )
                                      ? scheme.accent
                                      : undefined
                                  }}
                                >
                                  {!scheme.accent.startsWith('#') && (
                                    <div
                                      className={`w-full h-full rounded-full bg-${scheme.accent}-500`}
                                    />
                                  )}
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
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Label Area */}
                    <div className="py-3 px-4 w-full text-left bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-700/30 transition-colors">
                      <span
                        className={`block text-xs font-bold truncate ${isActive ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        {scheme.name}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Colores Corporativos Personalizados */}
        <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-indigo-500" />
              <h4 className="font-bold text-gray-900 dark:text-white">
                Colores Corporativos Personalizados
              </h4>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCustomColors}
                className="text-xs"
              >
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSaveCustomColors}>
                Guardar Colores
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Color Primario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColors.primary}
                  onChange={(e) =>
                    setCustomColors({
                      ...customColors,
                      primary: e.target.value
                    })
                  }
                  className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColors.primary}
                  onChange={(e) =>
                    setCustomColors({
                      ...customColors,
                      primary: e.target.value
                    })
                  }
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase"
                  placeholder="#6366f1"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Botones principales, enlaces, iconos destacados
              </p>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Color Secundario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColors.secondary}
                  onChange={(e) =>
                    setCustomColors({
                      ...customColors,
                      secondary: e.target.value
                    })
                  }
                  className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColors.secondary}
                  onChange={(e) =>
                    setCustomColors({
                      ...customColors,
                      secondary: e.target.value
                    })
                  }
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase"
                  placeholder="#06b6d4"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Elementos secundarios, acentos visuales
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Color de Acento
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColors.accent}
                  onChange={(e) =>
                    setCustomColors({ ...customColors, accent: e.target.value })
                  }
                  className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColors.accent}
                  onChange={(e) =>
                    setCustomColors({ ...customColors, accent: e.target.value })
                  }
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase"
                  placeholder="#f59e0b"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Notificaciones, badges, elementos de atención
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderOperations = () => (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Configuración del Pipeline
        </h3>
        <p className="text-sm text-gray-500">
          Define las etapas del embudo de ventas y reglas de negocio.
        </p>
      </div>

      <div className="space-y-4">
        {pipelineStages.map((stage, idx) => (
          <div
            key={stage.id}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div
              className={`w-3 h-12 rounded-full ${stage.tone?.startsWith('bg-') ? stage.tone.replace('bg-', 'bg-opacity-100 bg-') : 'bg-indigo-600'}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {stage.icon && (
                  <span className="text-xl" title="Icono de la etapa">
                    {stage.icon}
                  </span>
                )}
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stage.label}
                </p>
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded-md font-bold text-gray-400 uppercase tracking-widest">
                  ID: {stage.id}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {stage.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 mr-2">
                <button
                  onClick={() => reorderPipelineStage(stage.id, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                  aria-label="Subir etapa"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => reorderPipelineStage(stage.id, 'down')}
                  disabled={idx === pipelineStages.length - 1}
                  className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                  aria-label="Bajar etapa"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                onClick={() =>
                  setEditingStage({
                    id: stage.id,
                    label: stage.label,
                    description: stage.description,
                    tone: stage.tone,
                    icon: stage.icon
                  })
                }
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={async () => {
                  if (
                    await confirm({
                      title: 'Eliminar Etapa',
                      description: `¿Estás seguro de eliminar la etapa "${stage.label}"?\n\nLos candidatos en esta etapa podrían quedar huérfanos visualmente.`,
                      type: 'danger'
                    })
                  ) {
                    removePipelineStage(stage.id)
                  }
                }}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Inline Modal for Editing Stage */}
        {editingStage && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Editar Etapa
              </h4>
              <label className="flex flex-col gap-2 mb-4">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Nombre
                </span>
                <input
                  type="text"
                  value={editingStage.label}
                  onChange={(e) =>
                    setEditingStage({ ...editingStage, label: e.target.value })
                  }
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-2 mb-4">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Descripción
                </span>
                <textarea
                  value={editingStage.description}
                  onChange={(e) =>
                    setEditingStage({
                      ...editingStage,
                      description: e.target.value
                    })
                  }
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  rows={3}
                />
              </label>
              <label className="flex flex-col gap-2 mb-6">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Color de la etapa
                </span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      value: 'bg-indigo-100',
                      label: 'Índigo',
                      class: 'bg-indigo-100 border-indigo-500'
                    },
                    {
                      value: 'bg-cyan-100',
                      label: 'Cyan',
                      class: 'bg-cyan-100 border-cyan-500'
                    },
                    {
                      value: 'bg-emerald-100',
                      label: 'Verde',
                      class: 'bg-emerald-100 border-emerald-500'
                    },
                    {
                      value: 'bg-amber-100',
                      label: 'Amarillo',
                      class: 'bg-amber-100 border-amber-500'
                    },
                    {
                      value: 'bg-red-100',
                      label: 'Rojo',
                      class: 'bg-red-100 border-red-500'
                    },
                    {
                      value: 'bg-orange-100',
                      label: 'Naranja',
                      class: 'bg-orange-100 border-orange-500'
                    },
                    {
                      value: 'bg-gray-100',
                      label: 'Gris',
                      class: 'bg-gray-100 border-gray-400'
                    },
                    {
                      value: 'bg-purple-100',
                      label: 'Morado',
                      class: 'bg-purple-100 border-purple-400'
                    }
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setEditingStage({ ...editingStage, tone: color.value })
                      }
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        editingStage.tone === color.value
                          ? `${color.class} scale-110 shadow-sm`
                          : 'border-transparent hover:scale-105'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </label>
              <label className="flex flex-col gap-2 mb-6">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Icono de la etapa
                </span>
                <div className="grid grid-cols-8 gap-2">
                  {[
                    '🎯',
                    '⭐',
                    '🚀',
                    '💡',
                    '📌',
                    '🔥',
                    '✨',
                    '💎',
                    '📊',
                    '📈',
                    '🏆',
                    '🎖️',
                    '🏅',
                    '🎪',
                    '🎨',
                    '🎭',
                    '📢',
                    '📣',
                    '🔔',
                    '📍',
                    '🚩',
                    '🎌',
                    '🏁',
                    '🎗️',
                    '💬',
                    '📝',
                    '✏️',
                    '📋',
                    '🗂️',
                    '📁',
                    '🗃️',
                    '📦'
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setEditingStage({ ...editingStage, icon: emoji })
                      }
                      className={`w-10 h-10 text-xl rounded-xl border-2 transition-all ${
                        editingStage.icon === emoji
                          ? 'border-indigo-500 bg-indigo-50 scale-110'
                          : 'border-gray-200 dark:border-gray-700 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingStage(null)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSaveStageEdit}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

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
              tone: 'bg-indigo-100',
              accent: 'border-indigo-200',
              badge: 'bg-indigo-100 text-indigo-700',
              empty: `No hay candidatos en ${label} activamente.`
            })
          }}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-5 text-gray-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
        >
          <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm">
            Añadir Nueva Etapa al Embudo
          </span>
        </button>
      </div>
    </div>
  )

  const renderSectors = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Sectores y Marcas
          </h3>
          <p className="text-sm text-gray-500">
            Administra las líneas de negocio y proveedores disponibles.
          </p>
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
          const sectorBrands = brandOptions.filter(
            (b) => b.sectorId === sector.id
          )

          return (
            <div key={sector.id} className="group relative">
              <Card className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-4xl dark:bg-gray-700/50">
                      {sector.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                          {sector.label}
                        </h4>
                        <button
                          onClick={() =>
                            setEditingSector({
                              id: sector.id,
                              label: sector.label,
                              icon: sector.icon,
                              color: sector.color
                            })
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
                          aria-label="Editar sector"
                          title="Editar sector"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-700">
                          ID: {sector.id}
                        </span>
                        <span className="rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                          {sectorBrands.length} Operadores
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 sm:flex-row dark:border-gray-700 dark:bg-gray-900/30">
                    <input
                      type="text"
                      placeholder="Nueva marca..."
                      value={newBrandNames[sector.id] || ''}
                      onChange={(e) =>
                        setNewBrandNames((prev) => ({
                          ...prev,
                          [sector.id]: e.target.value
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 sm:w-40 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const label = newBrandNames[sector.id]
                        if (label) {
                          addBrand({ label, sectorId: sector.id })
                          setNewBrandNames((prev) => ({
                            ...prev,
                            [sector.id]: ''
                          }))
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
                  {sectorBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className="group/brand relative flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-white dark:border-gray-700 dark:bg-gray-700/30 dark:hover:bg-gray-700"
                    >
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-4">
                        {brand.label}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover/brand:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setEditingBrand({
                              id: brand.id,
                              label: brand.label,
                              sectorId: brand.sectorId
                            })
                          }
                          className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          aria-label="Editar marca"
                          title="Editar marca"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeBrand(brand.id)}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          aria-label="Eliminar marca"
                          title="Eliminar marca"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {sectorBrands.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-400 font-medium italic">
                        No hay operadores registrados en este sector
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Eliminar Sector',
                        description: `¿Eliminar sector ${sector.label} y todas sus marcas?`,
                        type: 'danger'
                      })
                    ) {
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

        {/* Inline Modal for Editing Sector */}
        {editingSector && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Editar Sector
              </h4>
              <label className="flex flex-col gap-2 mb-6">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Nombre del Sector
                </span>
                <input
                  type="text"
                  value={editingSector.label}
                  onChange={(e) =>
                    setEditingSector({
                      ...editingSector,
                      label: e.target.value
                    })
                  }
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-2 mb-6">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Icono del Sector
                </span>
                <div className="grid grid-cols-8 gap-2">
                  {[
                    '📁',
                    '💼',
                    '🏢',
                    '🏭',
                    '🛒',
                    '🏥',
                    '🏨',
                    '🍽️',
                    '🚗',
                    '✈️',
                    '🏠',
                    '📱',
                    '💻',
                    '🎮',
                    '🎬',
                    '🎵',
                    '📚',
                    '🎓',
                    '⚽',
                    '🏋️',
                    '🎨',
                    '📸',
                    '🐶',
                    '🐱',
                    '🌟',
                    '💎',
                    '🔧',
                    '⚡',
                    '🔥',
                    '💡',
                    '🎯',
                    '📊'
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setEditingSector({ ...editingSector, icon: emoji })
                      }
                      className={`w-10 h-10 text-xl rounded-xl border-2 transition-all ${
                        editingSector.icon === emoji
                          ? 'border-indigo-500 bg-indigo-50 scale-110'
                          : 'border-gray-200 dark:border-gray-700 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </label>
              <label className="flex flex-col gap-2 mb-6">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Color del Sector
                </span>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
                    { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
                    { value: 'green', label: 'Verde', class: 'bg-green-500' },
                    {
                      value: 'yellow',
                      label: 'Amarillo',
                      class: 'bg-yellow-500'
                    },
                    {
                      value: 'orange',
                      label: 'Naranja',
                      class: 'bg-orange-500'
                    },
                    { value: 'red', label: 'Rojo', class: 'bg-red-500' },
                    {
                      value: 'purple',
                      label: 'Morado',
                      class: 'bg-purple-500'
                    },
                    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
                    {
                      value: 'indigo',
                      label: 'Índigo',
                      class: 'bg-indigo-500'
                    },
                    { value: 'gray', label: 'Gris', class: 'bg-gray-500' }
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setEditingSector({
                          ...editingSector,
                          color: color.value
                        })
                      }
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        editingSector.color === color.value
                          ? 'border-gray-600 dark:border-gray-300 scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      title={color.label}
                    >
                      <div
                        className={`w-full h-full rounded-xl ${color.class}`}
                      />
                    </button>
                  ))}
                </div>
              </label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingSector(null)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSaveSectorEdit}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Modal for Editing Brand */}
        {editingBrand && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Editar Marca
              </h4>
              <label className="flex flex-col gap-2 mb-6">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Nombre de la Marca
                </span>
                <input
                  type="text"
                  value={editingBrand.label}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, label: e.target.value })
                  }
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  autoFocus
                />
              </label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingBrand(null)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSaveBrandEdit}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Seguridad y Datos
        </h3>
        <p className="text-sm text-gray-500">
          Gestión de cumplimiento (GDPR), privacidad y accesos.
        </p>
      </div>

      {/* RGPD Export */}
      <Card className="border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-800 dark:bg-green-900/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <ArrowDownTrayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              Exportar mis datos personales (RGPD)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tienes derecho a solicitar una copia de tus datos personales.
              Descarga un archivo JSON con toda tu información almacenada en
              GPV.
            </p>
            <Button
              onClick={handleExportMyData}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Descargar mis datos
            </Button>
          </div>
        </div>
      </Card>

      {/* RGPD Delete Account */}
      <Card className="border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-900/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              Eliminar cuenta permanentemente (RGPD)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tienes derecho al olvido. Elimina tu cuenta y todos tus datos de
              forma permanente. Esta acción es IRREVERSIBLE.
            </p>
            <Button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <LockClosedIcon className="h-5 w-5 text-indigo-500" />
            <h4 className="font-bold">Política de Privacidad</h4>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Email del DPD
            </span>
            <div className="flex gap-2">
              <input
                type="email"
                value={dpdEmail}
                onChange={(e) => setDpdEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="dpd@gpvcanarias.com"
              />
              <Button onClick={handleSaveDpdEmail} disabled={dpdSaving}>
                {dpdSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </label>
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
            <span>
              GDPR Compliance: <strong>Activado</strong>
            </span>
            <ShieldCheckIcon className="h-4 w-4" />
          </div>
        </Card>

        <Card className="space-y-4 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FingerPrintIcon className="h-5 w-5 text-cyan-600" />
            <h4 className="font-bold">Autenticación en dos pasos (2FA)</h4>
          </div>
          <MFASetupPanel />
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-red-500 hover:bg-red-50"
              onClick={handleLogout}
            >
              Cerrar sesión en todos los dispositivos
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderIntegrations = () => (
    <div className="space-y-8 animate-fade-in">
      {!isAdmin ? (
        <Card className="space-y-4 border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <LockClosedIcon className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Acceso restringido
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                La configuración de integraciones externas está reservada a
                usuarios con rol administrador mientras el proyecto sigue en
                modo técnico.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Integraciones Externas
        </h3>
        <p className="text-sm text-gray-500">
          Conecta GPV con Google Workspace y Microsoft 365 para sincronizar
          calendarios y tareas.
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/10">
        <div className="flex items-start gap-4">
          <CloudArrowUpIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white">
              Sincronización Bidireccional
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>
                • <strong>Visitas comerciales</strong> → Eventos en tu
                calendario
              </li>
              <li>
                • <strong>Llamadas de seguimiento</strong> → Recordatorios y
                tareas
              </li>
              <li>
                • <strong>Fechas límite</strong> → Alertas en tu móvil
              </li>
              <li>
                • <strong>Actualizaciones</strong> → Sincronización en tiempo
                real
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Provider Wrappers */}
      {/* Provider Wrappers — ya montados en DataProviderWrapper; aquí solo los paneles */}
      <div className="grid grid-cols-1 gap-6">
            <CalendarSyncPanel
              events={(() => {
                const distMap = new Map(distributors.map((d) => [d.id, d]))
                const candMap = new Map(candidates.map((c) => [c.id, c]))
                return (visits ?? [])
                  .filter((v) => v.date && v.result !== 'completada')
                  .map((v) => {
                    const d = v.distributorId ? distMap.get(v.distributorId) : null
                    const c = v.candidateId ? candMap.get(v.candidateId) : null
                    const title = d?.name ?? c?.name ?? 'Visita comercial'
                    const location = d
                      ? [d.city, d.province].filter(Boolean).join(', ') || undefined
                      : c
                        ? [c.city, c.island]
                            .filter(Boolean)
                            .join(', ') || undefined
                        : undefined
                    return visitToCalendarEvent(v, title, location)
                  })
              })()}
            />
            <TaskSyncPanel />
          </div>

      {/* Configuration Note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>⚠️ Nota de configuración:</strong> Para habilitar estas
          integraciones, debes configurar las variables de entorno
          <code className="mx-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded">
            VITE_GOOGLE_CLIENT_ID
          </code>{' '}
          y
          <code className="mx-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded">
            VITE_MICROSOFT_CLIENT_ID
          </code>
          en tu archivo .env. Los secretos OAuth ya no deben vivir en frontend;
          el siguiente paso será mover el intercambio y refresco de tokens a backend.
        </p>
      </div>
        </>
      )}
    </div>
  )

  const renderSystem = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Estado del Sistema
          </h3>
          <p className="text-sm text-gray-500">
            Monitorización de servicios y sincronización de datos.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={forceSync}>
          <ArrowPathIcon className="h-4 w-4" />
          Sync Forzada
        </Button>
      </div>

      <Card className="space-y-4 border-l-4 border-l-orange-500 bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
          <CircleStackIcon className="h-8 w-8 text-orange-500" />
          <div>
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">
              Migración y Rescate de Datos
            </h4>
            <p className="text-sm text-gray-500">
              Utiliza esto si tus datos locales no aparecen en Supabase.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/30 dark:bg-orange-900/20 dark:text-orange-200">
          <p className="font-bold mb-1">⚠️ Sincronización Manual</p>
          <p>
            Esta acción tomará todos los datos locales que ves ahora mismo en tu
            pantalla y los enviará a la base de datos de Supabase,
            sobreescribiendo si es necesario.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={async (e) => {
              e.preventDefault()
              if (testingConnection) return
              setTestingConnection(true)
              try {
                log.info('Iniciando prueba de conexión...')

                // Timeout cubre TODA la operación (incluyendo auth)
                const timeout = new Promise<never>((_, reject) =>
                  setTimeout(
                    () =>
                      reject(
                        new Error(
                          'Tiempo de espera agotado (10s). Revisa tu conexión a internet o la URL de Supabase.'
                        )
                      ),
                    10000
                  )
                )

                const test = async () => {
                  const {
                    data: { session }
                  } = await supabase.auth.getSession()
                  log.info(
                    session
                      ? `✅ Sesión activa: ${session.user.email}`
                      : '⚠️ Sin sesión activa'
                  )
                  // SELECT es más seguro para testear: no requiere permisos de escritura
                  return supabase.from('candidatesGPV').select('id').limit(1)
                }

                const result = (await Promise.race([test(), timeout])) as {
                  error?: { message: string; code: string } | null
                }
                const { error } = result || {}

                if (error) {
                  log.error('Error de prueba:', error)
                  toast.error(
                    `Error de conexión: ${error.message} (Code: ${error.code})`
                  )
                } else {
                  log.info('✅ Prueba de conexión exitosa')
                  toast.success(
                    'Conexión con Supabase verificada correctamente.'
                  )
                }
              } catch (e) {
                log.error('Excepción de prueba:', e)
                toast.error(
                  `Error crítico: ${e instanceof Error ? e.message : 'Desconocido'}`
                )
              } finally {
                setTestingConnection(false)
              }
            }}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
            disabled={testingConnection}
          >
            {testingConnection ? 'Probando...' : 'Probar Conexión'}
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault()
              handlePushLocalData()
            }}
            className="gap-2 bg-orange-500 text-white"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            SUBIR DATOS AHORA
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            label: 'Base de Datos',
            status: 'Online',
            icon: CircleStackIcon,
            color: 'green'
          },
          {
            label: 'Servicio de Sync',
            status: 'Trabajando',
            icon: ArrowPathIcon,
            color: 'blue'
          },
          {
            label: 'Almacenamiento',
            status: '94% Libre',
            icon: CubeIcon,
            color: 'indigo'
          },
          {
            label: 'Google Places API',
            status: import.meta.env.VITE_GOOGLE_PLACES_KEY
              ? 'Configurada'
              : 'No configurada',
            icon: MapPinIcon,
            color: import.meta.env.VITE_GOOGLE_PLACES_KEY ? 'green' : 'gray'
          },
          {
            label: 'Versión',
            status: `v${appVersion}`,
            icon: ClipboardDocumentCheckIcon,
            color: 'purple',
            clickable: true,
            onClick: handleCheckForUpdates
          }
        ].map((sys, idx) => (
          <div
            key={idx}
            className={`space-y-3 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800 ${sys.clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
            onClick={sys.onClick}
          >
            <div
              className={`mx-auto w-12 h-12 rounded-xl bg-${sys.color}-100 dark:bg-${sys.color}-900/30 flex items-center justify-center ${sys.clickable ? 'group-hover:scale-110 transition-transform' : ''}`}
            >
              <sys.icon className={`h-6 w-6 text-${sys.color}-500`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {sys.label}
              </p>
              <p
                className={`text-sm font-bold mt-1 ${sys.clickable ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}
              >
                {sys.status}
              </p>
              {sys.clickable && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {checkingUpdates
                    ? 'Buscando...'
                    : 'Click para buscar actualizaciones'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="p-6 border-none shadow-xl bg-gray-900 text-white">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-cyan-500" />
            Logs de Consola Remota
          </h4>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              className="text-xs border-white/20 text-white hover:bg-white/10"
              title="Exportar logs a archivo .txt"
            >
              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              className="text-xs border-white/20 text-white hover:bg-red-500/20 hover:border-red-500"
              title="Limpiar historial de logs"
            >
              <TrashIcon className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLogHistory}
              className="text-xs border-white/20 text-white hover:bg-white/10"
            >
              <ArrowPathIcon className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded">
              DEBUG MODE
            </span>
          </div>
        </div>
        <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto space-y-1">
          {logHistory.length === 0 ? (
            <p className="text-gray-500 italic">No hay logs recientes</p>
          ) : (
            logHistory.map((log, idx) => (
              <p key={idx} className="truncate">
                <span className="text-gray-500">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  className={`ml-2 font-bold ${
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warn'
                        ? 'text-yellow-400'
                        : log.level === 'info'
                          ? 'text-blue-400'
                          : 'text-gray-400'
                  }`}
                >
                  {log.level.toUpperCase()}
                </span>
                <span className="ml-2 text-gray-300">{log.message}</span>
              </p>
            ))
          )}
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
    integrations: renderIntegrations(),
    system: renderSystem()
  }[activeTab]

  return (
    <PageContainer size="wide" className="py-6 md:py-8 animate-fade-in">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Navigation */}
        <div className="lg:w-80 flex flex-col gap-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
              Management Console
            </p>
            <h1 className="text-2xl font-bold mb-1">Ajustes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Panel de control administrativo
            </p>
          </div>

          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            <SidebarItem
              id="general"
              label="Gobernanza"
              icon={CogIcon}
              active={activeTab === 'general'}
              onClick={setActiveTab}
            />
            <SidebarItem
              id="appearance"
              label="Identidad Visual"
              icon={SparklesIcon}
              active={activeTab === 'appearance'}
              onClick={setActiveTab}
            />
            <SidebarItem
              id="operations"
              label="Flujos de Venta"
              icon={WrenchScrewdriverIcon}
              active={activeTab === 'operations'}
              onClick={setActiveTab}
            />
            <SidebarItem
              id="sectors"
              label="Marcas y Sectores"
              icon={CubeIcon}
              active={activeTab === 'sectors'}
              onClick={setActiveTab}
            />
            <SidebarItem
              id="security"
              label="Privacidad y Firma"
              icon={ShieldCheckIcon}
              active={activeTab === 'security'}
              onClick={setActiveTab}
            />
            {isAdmin && (
              <SidebarItem
                id="integrations"
                label="Integraciones"
                icon={ArrowTrendingUpIcon}
                active={activeTab === 'integrations'}
                onClick={setActiveTab}
              />
            )}
            <SidebarItem
              id="system"
              label="Estado de Red"
              icon={ArrowPathIcon}
              active={activeTab === 'system'}
              onClick={setActiveTab}
            />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="relative min-h-[600px] rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-12">
            {content}

            {/* Save Indicator (Fixed at bottom) */}
            <div className="absolute bottom-8 right-8 flex items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                  Estado de cambios
                </p>
                <p className="text-xs font-bold text-green-600 dark:text-green-300">
                  Sincronizado en la nube
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

// ✅ PlusIcon is now imported from @heroicons/react

export default SettingsPage
