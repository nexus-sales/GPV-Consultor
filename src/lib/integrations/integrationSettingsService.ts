import { env, isSupabaseConfigured } from '../config'
import { logger } from '../logger'
import { supabase } from '../supabaseClient'
import { defaultIntegrationConfig, IntegrationConfig } from './types'

const log = logger.create('IntegrationSettings')

const STORAGE_KEY = 'gpv_integration_config'
const SETTINGS_KEY = 'default'

const normaliseIntegrationConfig = (
  config?: Partial<IntegrationConfig> | null
): IntegrationConfig => ({
  calendar: {
    ...defaultIntegrationConfig.calendar,
    ...(config?.calendar ?? {})
  },
  tasks: {
    ...defaultIntegrationConfig.tasks,
    ...(config?.tasks ?? {})
  },
  email: {
    ...defaultIntegrationConfig.email,
    ...(config?.email ?? {})
  }
})

export const readLocalIntegrationConfig = (): IntegrationConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return defaultIntegrationConfig
    }

    return normaliseIntegrationConfig(JSON.parse(saved) as IntegrationConfig)
  } catch {
    return defaultIntegrationConfig
  }
}

export const writeLocalIntegrationConfig = (config: IntegrationConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export const loadRemoteIntegrationConfig = async (
  enabled: boolean
): Promise<IntegrationConfig | null> => {
  if (!enabled || !isSupabaseConfigured || !env.supabaseUrl) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('integration_settingsGPV')
      .select('config')
      .eq('setting_key', SETTINGS_KEY)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data?.config) {
      return null
    }

    const config = normaliseIntegrationConfig(
      data.config as Partial<IntegrationConfig>
    )
    writeLocalIntegrationConfig(config)
    return config
  } catch (error) {
    log.warn('No se pudo cargar integration_settingsGPV; usando fallback local', error)
    return null
  }
}

export const saveRemoteIntegrationConfig = async (
  config: IntegrationConfig,
  userId: string | undefined,
  enabled: boolean
): Promise<boolean> => {
  if (!enabled || !userId || !isSupabaseConfigured) {
    return false
  }

  try {
    const { error } = await supabase.from('integration_settingsGPV').upsert(
      {
        setting_key: SETTINGS_KEY,
        config,
        updated_by: userId,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'setting_key' }
    )

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    log.warn('No se pudo guardar integration_settingsGPV; usando fallback local', error)
    return false
  }
}