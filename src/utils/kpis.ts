export interface WeekBounds {
  start: Date
  end: Date
}

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Fecha inválida recibida en utilidades de KPIs')
  }
  return parsed
}

export function getWeeklyBounds(
  date: Date | string | number = new Date()
): WeekBounds {
  const reference = toDate(date)
  const day = (reference.getDay() + 6) % 7 // Lunes=0

  const start = new Date(reference)
  start.setDate(reference.getDate() - day)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  return { start, end }
}

export function inWeek(
  date: Date | string | number,
  bounds: WeekBounds
): boolean {
  const value = toDate(date)
  return value >= bounds.start && value < bounds.end
}
