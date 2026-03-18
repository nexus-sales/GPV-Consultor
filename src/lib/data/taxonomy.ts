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
      'Habilitado para Vodafone (red comercial propia).',
    matcher: (code) => /^ESPSB/i.test(code ?? ''),
    badgeClass:
      'bg-pastel-indigo/15 text-pastel-indigo border border-pastel-indigo/30',
    tooltip:
      'ESPSB identifica distribuidores con red comercial completa: Vodafone habilitado.',
    brandPolicy: {
      allowed: ['vodafone_resid', 'vodafone_soho', 'o2'],
      blocked: ['silbo', 'lowi'],
      conditional: [],
      note: 'Foco exclusivo en Vodafone y O2. Silbö y Lowi deshabilitados.'
    }
  },
  {
    id: 'lwmy',
    label: 'LWMY',
    description: 'Habilitado para Vodafone.',
    matcher: (code) => /^LWMY/i.test(code ?? ''),
    badgeClass:
      'bg-pastel-cyan/15 text-pastel-cyan border border-pastel-cyan/30',
    tooltip: 'LWMY indica red de valor: Vodafone habilitado.',
    brandPolicy: {
      allowed: ['vodafone_resid', 'vodafone_soho', 'o2'],
      blocked: ['silbo', 'lowi'],
      conditional: [],
      note: 'Vodafone y O2 disponibles para LWMY.'
    }
  },
  {
    id: 'pvpte',
    label: 'PVPTE',
    description: 'Pendiente de datos. Vodafone activable tras completar checklist.',
    matcher: (code) => /^PVPTE/i.test(code ?? ''),
    badgeClass:
      'bg-pastel-yellow/15 text-pastel-yellow border border-pastel-yellow/30',
    tooltip: 'Completar datos fiscales y documentación para habilitar Vodafone.',
    brandPolicy: {
      allowed: ['vodafone_resid', 'vodafone_soho'],
      blocked: ['silbo', 'lowi'],
      conditional: ['vodafone_resid'],
      note: 'Vodafone requiere checklist completa (pendiente).'
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
      allowed: ['vodafone_resid', 'vodafone_soho'],
      blocked: ['silbo', 'lowi'],
      conditional: [],
      note: 'Acceso exclusivo a Vodafone.',
      messages: {
        vodafone: 'Distribuidor especializado en Vodafone.'
      }
    }
  },
  {
    id: 'natd',
    label: 'NatD',
    description: 'Naturgy Directo',
    matcher: (code) => /^NATD/i.test(code ?? ''),
    badgeClass: 'bg-pastel-yellow/15 text-pastel-yellow border border-pastel-yellow/30',
    tooltip: 'Canal directo de comercialización Naturgy.',
    brandPolicy: {
      allowed: ['naturgy'],
      blocked: [],
      conditional: [],
      note: 'Foco exclusivo en Energía (Naturgy).'
    }
  },
  {
    id: 'natid',
    label: 'NatID',
    description: 'Naturgy Indirecto',
    matcher: (code) => /^NATID/i.test(code ?? ''),
    badgeClass: 'bg-pastel-yellow/15 text-pastel-yellow border border-pastel-yellow/30',
    tooltip: 'Canal indirecto de comercialización Naturgy.',
    brandPolicy: {
      allowed: ['naturgy'],
      blocked: [],
      conditional: [],
      note: 'Venta de Energía a través de canal indirecto.'
    }
  },
  {
    id: 'wikva',
    label: 'WikVA',
    description: 'Canal WikVA',
    matcher: (code) => /^WIKVA/i.test(code ?? ''),
    badgeClass: 'bg-pastel-cyan/15 text-pastel-cyan border border-pastel-cyan/30',
    tooltip: 'Distribuidor bajo el paraguas WikVA.',
    brandPolicy: {
      allowed: ['vodafone_resid', 'vodafone_soho'],
      blocked: ['silbo', 'lowi'],
      conditional: [],
      note: 'Canal WikVA orientado a Vodafone.'
    }
  },
  {
    id: 'o2col',
    label: 'O2Col',
    description: 'O2 Colaborador',
    matcher: (code) => /^O2COL/i.test(code ?? ''),
    badgeClass: 'bg-pastel-indigo/15 text-pastel-indigo border border-pastel-indigo/30',
    tooltip: 'Colaborador especializado en marcas de valor.',
    brandPolicy: {
      allowed: ['vodafone_resid', 'vodafone_soho', 'o2'],
      blocked: ['silbo', 'lowi'],
      conditional: [],
      note: 'Colaborador especializado en marcas de valor (Vodafone/O2).'
    }
  },
  {
    id: 'vodcol',
    label: 'VodCol',
    description: 'Vodafone Colaborador',
    matcher: (code) => /^VODCOL/i.test(code ?? ''),
    badgeClass: 'bg-pastel-red/15 text-pastel-red border border-pastel-red/30',
    tooltip: 'Colaborador externo para servicios Vodafone.',
    brandPolicy: {
      allowed: ['vodafone_resid', 'vodafone_soho'],
      blocked: ['silbo', 'lowi'],
      conditional: [],
      note: 'Orientado a servicios del ecosistema Vodafone.'
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
