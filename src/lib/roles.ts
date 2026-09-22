/**
 * Sistema de roles — fuente única de verdad.
 *
 * Añadir un rol nuevo = añadir una entrada a ROLE_DEFINITIONS. Nada más:
 * el tipo `UserRole`, la validación de roles que llegan de la base de datos,
 * el gating de rutas por `minRole` y cualquier comprobación de permisos se
 * derivan de este array.
 *
 * ── Sobre los niveles ──────────────────────────────────────────────────────
 * `level` expresa amplitud de acceso, no jerarquía de organigrama: un rol ve
 * lo que ven todos los de nivel inferior. Se numeran de diez en diez a
 * propósito, para poder intercalar roles nuevos (un "supervisor" entre
 * manager y gestor sería level 70) sin renumerar los existentes ni tocar
 * ninguna comprobación.
 *
 * ── Al migrar al backend propio ────────────────────────────────────────────
 * Este array es el contrato que el backend debe replicar. Hoy existe una
 * segunda copia de la lista en la Edge Function `create-gpv-user`
 * (VALID_ROLES); al migrar, esa validación debería leer de aquí o de su
 * equivalente en el servidor, para no volver a tener dos listas que se
 * desincronizan.
 */

export interface RoleDefinition {
  /** Identificador persistido en user_profilesGPV.role */
  id: string
  /** Nombre legible, para selectores y pantallas de administración */
  label: string
  /** Amplitud de acceso: un rol alcanza todo lo que exija su nivel o menos */
  level: number
  /** Para qué existe el rol; se muestra como ayuda en la gestión de usuarios */
  description: string
}

export const ROLE_DEFINITIONS = [
  {
    id: 'admin',
    label: 'Administrador',
    level: 100,
    description: 'Control total: usuarios, configuración e importaciones.'
  },
  {
    id: 'manager',
    label: 'Manager / GPV',
    level: 80,
    description: 'Dirige el equipo comercial y ve toda la actividad.'
  },
  {
    id: 'gestor',
    label: 'Gestor de backoffice',
    level: 60,
    description: 'Gestión administrativa y seguimiento de contactos.'
  },
  {
    id: 'commercial',
    label: 'Comercial',
    level: 40,
    description: 'Trabaja su cartera: visitas, candidatos y ventas.'
  }
] as const satisfies readonly RoleDefinition[]

export type UserRole = (typeof ROLE_DEFINITIONS)[number]['id']

/** Rol que se asigna cuando el perfil no trae uno válido. El más restrictivo. */
export const DEFAULT_ROLE: UserRole = 'commercial'

const ROLE_BY_ID = new Map<string, RoleDefinition>(
  ROLE_DEFINITIONS.map((role) => [role.id, role])
)

/** Lista de ids válidos, para validaciones y selectores. */
export const USER_ROLES: readonly UserRole[] = ROLE_DEFINITIONS.map(
  (role) => role.id
)

/** Type guard: ¿este valor suelto es un rol conocido? */
export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && ROLE_BY_ID.has(value)

/** Normaliza cualquier valor a un rol válido, cayendo al más restrictivo. */
export const toUserRole = (value: unknown): UserRole =>
  isUserRole(value) ? value : DEFAULT_ROLE

export const getRoleDefinition = (role: UserRole): RoleDefinition =>
  ROLE_BY_ID.get(role) ?? ROLE_BY_ID.get(DEFAULT_ROLE)!

/** Nivel de acceso de un rol; 0 si es desconocido (no alcanza nada). */
export const roleLevel = (role: unknown): number =>
  isUserRole(role) ? getRoleDefinition(role).level : 0

/**
 * ¿`role` alcanza el nivel exigido por `minRole`?
 *
 * Es la única regla de comparación de roles de la app: si un día deja de ser
 * lineal (permisos por capacidad en vez de por nivel), se cambia aquí y el
 * resto del código no se entera.
 */
export const hasMinRole = (role: unknown, minRole: UserRole): boolean =>
  roleLevel(role) >= roleLevel(minRole)
