import {
  channelBrandDefaults,
  type ChannelType,
  type PipelineStageId
} from './config'
import type { BrandPolicy, Category } from '../types'

type Matcher = (code: string) => boolean

interface TaxonomyRule extends Category {
  matcher: Matcher;
  brandPolicy: BrandPolicy & {
    allowed?: string[] | null;
    blocked?: string[];
    conditional?: string[];
    messages?: Record<string, string>;
  };
  pendingData?: boolean;
}

export const taxonomyRules: TaxonomyRule[] = [
  {
    id: 'espsb',
    label: 'ESPSB',
    description:
      'Habilitado para Lowi, Silbö y Vodafone (red comercial propia).',
    matcher: (code) => /^ESPSB/i.test(code ?? ''),
    badgeClass:
      'bg-pastel-indigo/15 text-pastel-indigo border border-pastel-indigo/30',
    tooltip:
      'ESPSB identifica distribuidores con red comercial completa: todas las marcas disponibles.',
    brandPolicy: {
      allowed: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'],
      blocked: [],
      conditional: [],
      note: 'Todas las marcas habilitadas. Verificar cobertura de objetivos.'
    }
  },
  {
    id: 'lwmy',
    label: 'LWMY',
    description: 'Habilitado para Lowi, Silbö y Vodafone.',
    matcher: (code) => /^LWMY/i.test(code ?? ''),
    badgeClass:
      'bg-pastel-cyan/15 text-pastel-cyan border border-pastel-cyan/30',
    tooltip: 'LWMY indica red completa: Lowi, Silbö y Vodafone habilitados.',
    brandPolicy: {
      allowed: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'],
      blocked: [],
      conditional: [],
      note: 'Todas las marcas disponibles para LWMY.'
    }
  },
  {
    id: 'pvpte',
    label: 'PVPTE',
    description: 'Pendiente de datos. Lowi activable tras completar checklist.',
    matcher: (code) => /^PVPTE/i.test(code ?? ''),
    badgeClass:
      'bg-pastel-yellow/15 text-pastel-yellow border border-pastel-yellow/30',
    tooltip: 'Completar datos fiscales y documentación para habilitar Lowi.',
    brandPolicy: {
      allowed: ['silbo', 'lowi'],
      blocked: [],
      conditional: ['lowi'],
      note: 'Lowi requiere checklist completa (pendiente).'
    },
    pendingData: true
  },
  {
    id: 'existente_vf',
    label: 'Existente Vodafone',
    description:
      'Distribuidor activo en Vodafone. Lowi bloqueado para evitar solapamiento.',
    matcher: (code) =>
      /^EXISTENTE/i.test(code ?? '') || /(EXISTENTE|VF)/i.test(code ?? ''),
    badgeClass: 'bg-pastel-red/15 text-pastel-red border border-pastel-red/30',
    tooltip: 'Cliente con activo Vodafone; Lowi no ofertable.',
    brandPolicy: {
      allowed: ['silbo', 'vodafone_resid', 'vodafone_soho'],
      blocked: ['lowi'],
      conditional: [],
      note: 'Lowi bloqueado por coexistencia con Vodafone.',
      messages: {
        lowi: 'Cliente con activo Vodafone; Lowi no ofertable.'
      }
    }
  }
]

export const defaultCategory: Category = {
  id: 'general',
  label: 'General',
  description: 'Sin restricciones específicas registradas.',
    author: '',
    createdAt: '',
    content: '',
    badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    tooltip: 'Categoría general sin reglas específicas.',
    brandPolicy: {
      allowed: null,
      blocked: [],
      conditional: [],
      note: ''
    },
    pendingData: false
}

export const resolveCategory = (code: string | null | undefined): Category => {
  const normalisedCode = (code ?? '').trim().toUpperCase()
  const matchedRule = taxonomyRules.find((rule) => rule.matcher(normalisedCode))
  if (!matchedRule) {
    return { ...defaultCategory }
  }

  const { brandPolicy, pendingData = false, ...rest } = matchedRule
  const policy = brandPolicy || {
    allowed: null,
    blocked: [],
    conditional: [],
    note: '',
    messages: undefined
  }
  return {
    ...rest,
    brandPolicy: {
      allowed: policy.allowed ? [...policy.allowed] : null,
      blocked: policy.blocked ? [...policy.blocked] : [],
      conditional: policy.conditional ? [...policy.conditional] : [],
      note: policy.note ?? '',
      messages: policy.messages ? { ...policy.messages } : undefined
    },
    pendingData: Boolean(pendingData)
  }
}

export const applyBrandPolicy = (
  brands: string[] = [],
  category: Category = defaultCategory
): string[] => {
  const unique = Array.from(new Set(brands.filter(Boolean)))

  if (!category) {
    return unique
  }

  const { brandPolicy } = category

  if (brandPolicy.allowed && brandPolicy.allowed.length) {
    return unique.filter((brand) => brandPolicy.allowed?.includes(brand))
  }

  if (brandPolicy.blocked && brandPolicy.blocked.length) {
    return unique.filter((brand) => !brandPolicy.blocked?.includes(brand))
  }

  return unique
}

export const defaultBrandsForChannel = (
  channelType: ChannelType
): readonly string[] => channelBrandDefaults[channelType] ?? []

export const deriveBrandsForChannel = (
  brands: string[] = [],
  channelType: ChannelType = 'non_exclusive',
  category: Category = defaultCategory
): string[] => {
  const baseline =
    Array.isArray(brands) && brands.length
      ? brands
      : [...defaultBrandsForChannel(channelType)]
  const filtered = applyBrandPolicy(baseline, category)

  if (filtered.length) {
    return filtered
  }

  const allowedFallback = category?.brandPolicy?.allowed ?? []
  if (allowedFallback?.length) {
    return [allowedFallback[0]]
  }

  const fromDefaults = defaultBrandsForChannel(channelType).filter(
    (brand) => !(category?.brandPolicy?.blocked ?? []).includes(brand)
  )

  if (fromDefaults.length) {
    return Array.from(new Set(fromDefaults))
  }

  return []
}
