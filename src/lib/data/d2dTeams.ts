/**
 * Sistema de gestión de equipos D2D (Door-to-Door)
 *
 * Los distribuidores D2D se agrupan por equipos para:
 * - Consolidar ventas a nivel de equipo
 * - Gestionar objetivos grupales
 * - Facilitar coordinación y reportes
 */

export interface D2DTeam {
  id: string
  name: string
  leaderId?: string // ID del líder del equipo (opcional)
  leaderName?: string
  createdAt: string
  active: boolean
  notes?: string
}

export interface TeamMember {
  distributorId: string
  distributorName: string
  teamId: string
  joinedAt: string
  role: 'leader' | 'member'
}

const TEAMS_STORAGE_KEY = 'd2d_teams'
const MEMBERS_STORAGE_KEY = 'd2d_team_members'

/**
 * Obtiene todos los equipos D2D
 */
export const getD2DTeams = (): D2DTeam[] => {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Obtiene equipos activos
 */
export const getActiveTeams = (): D2DTeam[] => {
  return getD2DTeams().filter((t) => t.active)
}

/**
 * Crea un nuevo equipo D2D
 */
export const createD2DTeam = (
  name: string,
  leaderId?: string,
  leaderName?: string,
  notes?: string
): D2DTeam => {
  const teams = getD2DTeams()

  const newTeam: D2DTeam = {
    id: `TEAM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    name,
    leaderId,
    leaderName,
    createdAt: new Date().toISOString(),
    active: true,
    notes
  }

  teams.push(newTeam)
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))

  return newTeam
}

/**
 * Actualiza un equipo D2D
 */
export const updateD2DTeam = (
  teamId: string,
  updates: Partial<D2DTeam>
): boolean => {
  const teams = getD2DTeams()
  const index = teams.findIndex((t) => t.id === teamId)

  if (index === -1) return false

  teams[index] = { ...teams[index], ...updates }
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))

  return true
}

/**
 * Desactiva un equipo D2D (soft delete)
 */
export const deactivateTeam = (teamId: string): boolean => {
  return updateD2DTeam(teamId, { active: false })
}

/**
 * Obtiene todos los miembros de equipos
 */
export const getTeamMembers = (): TeamMember[] => {
  try {
    const stored = localStorage.getItem(MEMBERS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Obtiene miembros de un equipo específico
 */
export const getTeamMembersByTeamId = (teamId: string): TeamMember[] => {
  return getTeamMembers().filter((m) => m.teamId === teamId)
}

/**
 * Obtiene el equipo de un distribuidor
 */
export const getDistributorTeam = (
  distributorId: string
): TeamMember | null => {
  const members = getTeamMembers()
  return members.find((m) => m.distributorId === distributorId) || null
}

/**
 * Añade un distribuidor a un equipo
 */
export const addDistributorToTeam = (
  distributorId: string,
  distributorName: string,
  teamId: string,
  role: 'leader' | 'member' = 'member'
): TeamMember => {
  const members = getTeamMembers()

  // Verificar si ya está en un equipo
  const existing = members.find((m) => m.distributorId === distributorId)
  if (existing) {
    // Actualizar equipo
    existing.teamId = teamId
    existing.role = role
    existing.joinedAt = new Date().toISOString()
  } else {
    // Añadir nuevo miembro
    const newMember: TeamMember = {
      distributorId,
      distributorName,
      teamId,
      joinedAt: new Date().toISOString(),
      role
    }
    members.push(newMember)
  }

  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members))

  return existing || members[members.length - 1]
}

/**
 * Elimina un distribuidor de su equipo
 */
export const removeDistributorFromTeam = (distributorId: string): boolean => {
  const members = getTeamMembers()
  const index = members.findIndex((m) => m.distributorId === distributorId)

  if (index === -1) return false

  members.splice(index, 1)
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members))

  return true
}

/**
 * Obtiene estadísticas de un equipo
 */
export const getTeamStats = (teamId: string) => {
  const members = getTeamMembersByTeamId(teamId)
  const team = getD2DTeams().find((t) => t.id === teamId)

  if (!team) return null

  return {
    teamId,
    teamName: team.name,
    memberCount: members.length,
    hasLeader: members.some((m) => m.role === 'leader'),
    members: members.map((m) => ({
      id: m.distributorId,
      name: m.distributorName,
      role: m.role,
      joinedAt: m.joinedAt
    }))
  }
}

/**
 * Obtiene resumen de todos los equipos
 */
export const getAllTeamsStats = () => {
  const teams = getActiveTeams()
  const members = getTeamMembers()

  return teams.map((team) => {
    const teamMembers = members.filter((m) => m.teamId === team.id)

    return {
      teamId: team.id,
      teamName: team.name,
      leaderName: team.leaderName || 'Sin líder',
      memberCount: teamMembers.length,
      active: team.active,
      createdAt: team.createdAt
    }
  })
}

/**
 * Inicializa equipos de ejemplo (para testing)
 */
export const initializeSampleTeams = () => {
  const existingTeams = getD2DTeams()

  if (existingTeams.length === 0) {
    createD2DTeam(
      'Equipo Norte',
      undefined,
      undefined,
      'Cobertura zona norte de Tenerife'
    )
    createD2DTeam(
      'Equipo Sur',
      undefined,
      undefined,
      'Cobertura zona sur de Tenerife'
    )
    createD2DTeam(
      'Equipo Gran Canaria',
      undefined,
      undefined,
      'Cobertura isla de Gran Canaria'
    )
    createD2DTeam(
      'Equipo Lanzarote-Fuerteventura',
      undefined,
      undefined,
      'Cobertura islas orientales'
    )
  }
}
