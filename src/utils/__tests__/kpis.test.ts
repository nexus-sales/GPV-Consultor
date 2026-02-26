import { describe, expect, it } from 'vitest'
import { getWeeklyBounds, inWeek } from '../kpis'

describe('kpis utils', () => {
  it('should compute monday as start of week', () => {
    const reference = new Date('2024-05-29T10:00:00')
    const { start, end } = getWeeklyBounds(reference)

    expect(start.getDay()).toBe(1)
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('should determine if a date belongs to the same week', () => {
    const reference = new Date('2024-05-29T10:00:00')
    const bounds = getWeeklyBounds(reference)

    expect(inWeek(bounds.start, bounds)).toBe(true)
    expect(inWeek(new Date(bounds.end.getTime()), bounds)).toBe(false)
  })
})
