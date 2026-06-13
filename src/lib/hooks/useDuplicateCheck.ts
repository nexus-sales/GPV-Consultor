import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { createLogger } from '../logger'

const log = createLogger('duplicate-check')

export const BANNED_NAMES = [
  'generico',
  'test',
  'prueba',
  'sin nombre',
  'candidato sin nombre',
  'distribuidor sin nombre',
]

export type DuplicateWarning = {
  matchType: 'tax_id' | 'name'
  ownership: 'mine' | 'other'
  entityName?: string
  entityCity?: string
} | null

export function useDuplicateCheck(
  entity: 'candidate' | 'distributor' | 'backoffice'
) {
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning>(null)
  const [duplicateChecking, setDuplicateChecking] = useState(false)
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false)

  const checkDuplicate = async (taxId: string, name: string): Promise<void> => {
    const cleanTaxId = taxId.trim()
    const cleanName = name.trim()
    if (!cleanTaxId && !cleanName) return

    setDuplicateChecking(true)
    try {
      const { data, error } = await (supabase as never as {
        rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
      }).rpc('check_entity_exists', {
        p_entity: entity,
        p_tax_id: cleanTaxId || null,
        p_name: cleanName || null,
      })

      if (error) {
        log.warn('check_entity_exists falló — continuando sin comprobación:', error.message)
        return
      }

      type CheckRow = { match_type: string; ownership: string; entity_name: string | null; entity_city: string | null }
      const row = (Array.isArray(data) ? (data as CheckRow[])[0] : null)
      if (row?.match_type) {
        setDuplicateWarning({
          matchType: row.match_type as 'tax_id' | 'name',
          ownership: row.ownership as 'mine' | 'other',
          entityName: row.entity_name ?? undefined,
          entityCity: row.entity_city ?? undefined,
        })
      } else {
        setDuplicateWarning(null)
      }
    } catch (err) {
      log.warn('check_entity_exists excepción — continuando sin comprobación:', err)
    } finally {
      setDuplicateChecking(false)
    }
  }

  const confirmDuplicate = () => setDuplicateConfirmed(true)

  const dismissWarning = () => {
    setDuplicateWarning(null)
    setDuplicateConfirmed(false)
  }

  const resetOnEdit = () => {
    if (duplicateWarning !== null || duplicateConfirmed) {
      setDuplicateWarning(null)
      setDuplicateConfirmed(false)
    }
  }

  return {
    duplicateWarning,
    duplicateChecking,
    duplicateConfirmed,
    checkDuplicate,
    confirmDuplicate,
    dismissWarning,
    resetOnEdit,
  }
}
