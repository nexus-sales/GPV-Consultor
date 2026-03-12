// Diagnóstico de conexión Supabase
import { supabase } from '../supabaseClient'
import { logger } from '../logger'

export async function checkSupabaseStatus() {
  try {
    logger.info('🔍 Verificando estado de Supabase...')

    // Test básico de conexión
    const { data, error } = await supabase
      .from('distributorsGPV')
      .select('count')
      .limit(1)

    if (error) {
      logger.error('❌ Error de conexión', error)

      if (
        error.message.includes('paused') ||
        error.message.includes('inactive')
      ) {
        logger.warn('⏸️  PROYECTO PAUSADO - Reactivar en Dashboard')
        return { status: 'paused', error }
      }

      if (error.message.includes('limit') || error.message.includes('quota')) {
        logger.warn('📊 LÍMITE ALCANZADO - Considerar upgrade')
        return { status: 'quota_exceeded', error }
      }

      return { status: 'error', error }
    }

    logger.info('✅ Supabase funcionando correctamente')
    return { status: 'active', data }
  } catch (err) {
    logger.error('💥 Error inesperado', err)
    return { status: 'unknown_error', error: err }
  }
}

// Usar en la app para diagnóstico
// checkSupabaseStatus().then(result => logger.info(result))
