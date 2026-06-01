import type { Preferences, User } from '../types'

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-juan-delgado',
    fullName: 'Juan Delgado',
    email: 'admin@gpvcanarias.com',
    role: 'admin',
    region: 'Canarias',
    permissions: 'Supervisor',
    phone: '+34 600 123 456',
    avatarInitials: 'JD',
    lastLogin: '2025-10-07T08:45:00.000Z',
    activity: [
      {
        id: 'activity-login',
        type: 'information',
        title: 'Inicio de sesión',
        description: 'Inicio de sesión exitoso',
        timestamp: new Date().toISOString(),
        detail: 'Hoy a las 08:45 • IP segura'
      },
      {
        id: 'activity-distributors',
        type: 'information',
        title: 'Actualización de distribuidores',
        description: 'Se editaron 3 fichas',
        timestamp: new Date().toISOString(),
        detail: 'Se editaron 3 fichas • Hace 2 horas'
      },
      {
        id: 'activity-reports',
        type: 'information',
        title: 'Exportación de reporte semanal',
        description: 'Archivo PDF generado',
        timestamp: new Date().toISOString(),
        detail: 'Archivo PDF generado • Ayer 19:30'
      }
    ],
    createdAt: '2025-01-12T09:00:00.000Z'
  }
]

export const DEFAULT_PREFERENCES: Preferences = {
  privacyEmail: 'info@ucoipcanarias.com',
  allowDataExports: true,
  backofficeOperators: []
}
