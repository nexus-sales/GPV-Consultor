/**
 * Vista consolidada de ventas por equipo D2D
 * Agrupa y suma las ventas de todos los miembros de cada equipo
 */

import { getD2DTeams, getTeamMembersByTeamId } from './d2dTeams'
import type { Sale } from '../types'

export interface TeamSalesConsolidation {
  teamId: string
  teamName: string
  memberCount: number
  totalSales: number
  salesByBrand: Record<string, number>
  salesByMember: Array<{
    distributorId: string
    distributorName: string
    salesCount: number
  }>
  periodStart: string
  periodEnd: string
}

/**
 * Consolida ventas por equipo para un período específico
 */
export const consolidateTeamSales = (
  allSales: Sale[],
  startDate?: string,
  endDate?: string
): TeamSalesConsolidation[] => {
  const teams = getD2DTeams().filter((t) => t.active)
  const consolidations: TeamSalesConsolidation[] = []

  for (const team of teams) {
    const members = getTeamMembersByTeamId(team.id)
    const memberIds = members.map((m) => m.distributorId)

    // Filtrar ventas del equipo
    let teamSales = allSales.filter((sale) =>
      memberIds.includes(String(sale.distributorId))
    )

    // Filtrar por fecha si se especifica
    if (startDate) {
      teamSales = teamSales.filter((sale) => sale.date >= startDate)
    }
    if (endDate) {
      teamSales = teamSales.filter((sale) => sale.date <= endDate)
    }

    // Contar ventas por marca
    const salesByBrand: Record<string, number> = {}
    for (const sale of teamSales) {
      salesByBrand[sale.brand] = (salesByBrand[sale.brand] || 0) + 1
    }

    // Contar ventas por miembro
    const salesByMember: Array<{
      distributorId: string
      distributorName: string
      salesCount: number
    }> = []

    for (const member of members) {
      const memberSales = teamSales.filter(
        (sale) => String(sale.distributorId) === member.distributorId
      )

      salesByMember.push({
        distributorId: member.distributorId,
        distributorName: member.distributorName,
        salesCount: memberSales.length
      })
    }

    consolidations.push({
      teamId: team.id,
      teamName: team.name,
      memberCount: members.length,
      totalSales: teamSales.length,
      salesByBrand,
      salesByMember: salesByMember.sort((a, b) => b.salesCount - a.salesCount),
      periodStart: startDate || 'Todas',
      periodEnd: endDate || 'Todas'
    })
  }

  return consolidations.sort((a, b) => b.totalSales - a.totalSales)
}

/**
 * Obtiene ranking de equipos por ventas
 */
export const getTeamRanking = (
  allSales: Sale[],
  startDate?: string,
  endDate?: string
) => {
  const consolidations = consolidateTeamSales(allSales, startDate, endDate)

  return consolidations.map((team, index) => ({
    rank: index + 1,
    teamId: team.teamId,
    teamName: team.teamName,
    totalSales: team.totalSales,
    memberCount: team.memberCount,
    avgSalesPerMember:
      team.memberCount > 0
        ? Math.round((team.totalSales / team.memberCount) * 10) / 10
        : 0
  }))
}

/**
 * Calcula la contribución de cada miembro al total del equipo
 */
export const getMemberContribution = (
  teamId: string,
  allSales: Sale[],
  startDate?: string,
  endDate?: string
) => {
  const consolidation = consolidateTeamSales(allSales, startDate, endDate).find(
    (c) => c.teamId === teamId
  )

  if (!consolidation || consolidation.totalSales === 0) {
    return []
  }

  return consolidation.salesByMember.map((member) => ({
    ...member,
    percentage: Math.round(
      (member.salesCount / consolidation.totalSales) * 100
    ),
    contribution: member.salesCount
  }))
}
