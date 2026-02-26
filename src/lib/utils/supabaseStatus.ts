// Diagnóstico de conexión Supabase
import { supabase } from '../supabaseClient'

export async function checkSupabaseStatus() {
  try {
    console.log('🔍 Verificando estado de Supabase...')

    // Test básico de conexión
    const { data, error } = await supabase
      .from('distributorsGPV')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Error de conexión:', error.message)

      if (
        error.message.includes('paused') ||
        error.message.includes('inactive')
      ) {
        console.warn('⏸️  PROYECTO PAUSADO - Reactivar en Dashboard')
        return { status: 'paused', error }
      }

      if (error.message.includes('limit') || error.message.includes('quota')) {
        console.warn('📊 LÍMITE ALCANZADO - Considerar upgrade')
        return { status: 'quota_exceeded', error }
      }

      return { status: 'error', error }
    }

    console.log('✅ Supabase funcionando correctamente')
    return { status: 'active', data }
  } catch (err) {
    console.error('💥 Error inesperado:', err)
    return { status: 'unknown_error', error: err }
  }
}

// Usar en la app para diagnóstico
// checkSupabaseStatus().then(result => console.log(result))
