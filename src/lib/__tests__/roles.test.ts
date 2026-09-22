import { describe, it, expect } from 'vitest'
import {
  ROLE_DEFINITIONS,
  USER_ROLES,
  DEFAULT_ROLE,
  isUserRole,
  toUserRole,
  roleLevel,
  hasMinRole
} from '../roles'
import { appNavigationItems, canAccessNavigationItem } from '../navigation'

describe('roles', () => {
  it('no tiene ids ni niveles duplicados', () => {
    const ids = ROLE_DEFINITIONS.map((r) => r.id)
    const levels = ROLE_DEFINITIONS.map((r) => r.level)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(levels).size).toBe(levels.length)
  })

  it('el rol por defecto es el de menor nivel', () => {
    const minLevel = Math.min(...ROLE_DEFINITIONS.map((r) => r.level))
    expect(roleLevel(DEFAULT_ROLE)).toBe(minLevel)
  })

  it('valida y normaliza roles que llegan de fuera', () => {
    expect(isUserRole('admin')).toBe(true)
    expect(isUserRole('superusuario')).toBe(false)
    expect(toUserRole('manager')).toBe('manager')
    expect(toUserRole('')).toBe(DEFAULT_ROLE)
    expect(toUserRole(undefined)).toBe(DEFAULT_ROLE)
    // Un rol desconocido no alcanza nada, ni siquiera el nivel más bajo
    expect(hasMinRole('superusuario', DEFAULT_ROLE)).toBe(false)
  })

  it('la jerarquía es acumulativa hacia abajo', () => {
    expect(hasMinRole('admin', 'commercial')).toBe(true)
    expect(hasMinRole('manager', 'gestor')).toBe(true)
    expect(hasMinRole('gestor', 'commercial')).toBe(true)
    expect(hasMinRole('commercial', 'gestor')).toBe(false)
    expect(hasMinRole('gestor', 'manager')).toBe(false)
    expect(hasMinRole('manager', 'admin')).toBe(false)
  })

  it('cada rol se alcanza a sí mismo', () => {
    USER_ROLES.forEach((role) => {
      expect(hasMinRole(role, role)).toBe(true)
    })
  })
})

describe('gating de navegación por rol', () => {
  const itemFor = (href: string) => {
    const item = appNavigationItems.find((i) => i.href === href)
    if (!item) throw new Error(`No existe la entrada de menú ${href}`)
    return item
  }

  it('backoffice es accesible desde gestor hacia arriba, no para comercial', () => {
    const backoffice = itemFor('/backoffice')
    expect(canAccessNavigationItem(backoffice, 'admin')).toBe(true)
    expect(canAccessNavigationItem(backoffice, 'manager')).toBe(true)
    expect(canAccessNavigationItem(backoffice, 'gestor')).toBe(true)
    expect(canAccessNavigationItem(backoffice, 'commercial')).toBe(false)
  })

  it('las entradas solo de admin siguen siendo solo de admin', () => {
    USER_ROLES.filter((r) => r !== 'admin').forEach((role) => {
      expect(canAccessNavigationItem(itemFor('/settings'), role)).toBe(false)
      expect(canAccessNavigationItem(itemFor('/import'), role)).toBe(false)
    })
    expect(canAccessNavigationItem(itemFor('/settings'), 'admin')).toBe(true)
  })

  it('una entrada sin minRole la ve cualquier rol', () => {
    USER_ROLES.forEach((role) => {
      expect(canAccessNavigationItem(itemFor('/candidates'), role)).toBe(true)
    })
  })
})
