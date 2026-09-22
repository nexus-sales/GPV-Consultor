import type React from 'react'
import {
  ArrowUpTrayIcon,
  BellIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon as CogIcon,
  DocumentTextIcon,
  HomeIcon,
  IdentificationIcon,
  PhoneIcon,
  ShoppingBagIcon,
  SignalIcon,
  TagIcon,
  UserGroupIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { hasMinRole, type UserRole } from './roles'

export interface AppNavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
  minRole?: UserRole
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    color: 'indigo',
    description: 'Vista general ejecutiva'
  },
  {
    name: 'Radar',
    href: '/radar',
    icon: SignalIcon,
    color: 'blue',
    description: 'Clientes y leads cercanos'
  },
  {
    name: 'Backoffice',
    href: '/backoffice',
    icon: BuildingOffice2Icon,
    color: 'indigo',
    description: 'Gestion y reportes backoffice',
    minRole: 'gestor'
  },
  {
    name: 'Candidatos',
    href: '/candidates',
    icon: UserGroupIcon,
    color: 'yellow',
    description: 'Prospects activos'
  },
  {
    name: 'Distribuidores',
    href: '/distributors',
    icon: UsersIcon,
    color: 'green',
    description: 'Red de distribucion'
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: IdentificationIcon,
    color: 'cyan',
    description: 'Prospectos Google Maps'
  },
  {
    name: 'Visitas',
    href: '/visits',
    icon: CalendarIcon,
    color: 'purple',
    description: 'Acompanamientos y revisiones'
  },
  {
    name: 'Pipeline',
    href: '/kanban',
    icon: ChartBarIcon,
    color: 'cyan',
    description: 'Flujo de ventas'
  },
  {
    name: 'Tareas',
    href: '/tasks',
    icon: TagIcon,
    color: 'orange',
    description: 'Agenda de compromisos'
  },
  {
    name: 'Call Center',
    href: '/calls',
    icon: PhoneIcon,
    color: 'blue',
    description: 'Seguimiento telefonico'
  },
  {
    name: 'Pedidos',
    href: '/sales',
    icon: ShoppingBagIcon,
    color: 'green',
    description: 'Control de ventas y activaciones'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: DocumentTextIcon,
    color: 'cyan',
    description: 'Analisis y metricas'
  },
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: BellIcon,
    color: 'red',
    description: 'Centro de avisos'
  },
  {
    name: 'Importar Datos',
    href: '/import',
    icon: ArrowUpTrayIcon,
    color: 'green',
    description: 'Carga masiva CSV/Excel',
    minRole: 'admin'
  },
  {
    name: 'Configuracion',
    href: '/settings',
    icon: CogIcon,
    color: 'indigo',
    description: 'Preferencias y seguridad',
    minRole: 'admin'
  }
]

/**
 * ¿Puede este rol abrir esta entrada de menú?
 *
 * Sin `minRole`, la entrada es para todos. Con `minRole`, la comparación la
 * resuelve `hasMinRole` a partir de los niveles de ROLE_DEFINITIONS, así que
 * un rol nuevo queda cubierto por su nivel sin tocar esta función.
 */
export const canAccessNavigationItem = (
  item: AppNavigationItem,
  role: UserRole
): boolean => {
  if (!item.minRole) return true
  return hasMinRole(role, item.minRole)
}

export const getNavigationItemForPath = (
  pathname: string
): AppNavigationItem => {
  return (
    appNavigationItems.find((item) => item.href === pathname) ||
    appNavigationItems.find(
      (item) => item.href !== '/' && pathname.startsWith(item.href)
    ) ||
    appNavigationItems[0]
  )
}
