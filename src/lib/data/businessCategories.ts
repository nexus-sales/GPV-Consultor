/**
 * Categorías de negocio para la prospección de CLIENTES DIRECTOS.
 *
 * El buscador de leads consulta Google Maps con "<categoría> <zona>". Antes se
 * escribía la categoría a mano, pensando en posibles colaboradores; esta lista
 * reapunta el motor a negocios que son cliente final (los que contratan
 * telefonía, alarmas o energía para su propio local).
 *
 * No es un desplegable cerrado: el campo sigue admitiendo texto libre, porque
 * Google entiende muchas más categorías de las que tiene sentido listar. Esto
 * son atajos para lo que se busca a diario, no una restricción.
 *
 * `query` es lo que se le manda literalmente a Google, que a veces funciona
 * mejor con un término distinto del que se le enseña al comercial.
 */

export interface BusinessCategory {
  id: string
  /** Lo que ve el comercial */
  label: string
  /** Lo que se envía a Google Maps */
  query: string
  /** Agrupación para el selector */
  group: string
}

export const BUSINESS_CATEGORIES: readonly BusinessCategory[] = [
  // Hostelería — alto consumo eléctrico y varias líneas
  {
    id: 'restaurante',
    label: 'Restaurante',
    query: 'restaurante',
    group: 'Hostelería'
  },
  {
    id: 'bar',
    label: 'Bar / Cafetería',
    query: 'bar cafetería',
    group: 'Hostelería'
  },
  {
    id: 'hotel',
    label: 'Hotel / Apartamentos',
    query: 'hotel',
    group: 'Hostelería'
  },
  {
    id: 'panaderia',
    label: 'Panadería / Pastelería',
    query: 'panadería',
    group: 'Hostelería'
  },

  // Comercio a pie de calle
  {
    id: 'supermercado',
    label: 'Supermercado / Alimentación',
    query: 'supermercado',
    group: 'Comercio'
  },
  {
    id: 'tienda_ropa',
    label: 'Tienda de ropa',
    query: 'tienda de ropa',
    group: 'Comercio'
  },
  {
    id: 'ferreteria',
    label: 'Ferretería',
    query: 'ferretería',
    group: 'Comercio'
  },
  { id: 'estanco', label: 'Estanco', query: 'estanco', group: 'Comercio' },

  // Salud y cuidado personal
  {
    id: 'clinica_dental',
    label: 'Clínica dental',
    query: 'clínica dental',
    group: 'Salud y cuidado'
  },
  {
    id: 'farmacia',
    label: 'Farmacia',
    query: 'farmacia',
    group: 'Salud y cuidado'
  },
  {
    id: 'peluqueria',
    label: 'Peluquería / Estética',
    query: 'peluquería',
    group: 'Salud y cuidado'
  },
  { id: 'optica', label: 'Óptica', query: 'óptica', group: 'Salud y cuidado' },
  {
    id: 'veterinario',
    label: 'Clínica veterinaria',
    query: 'veterinario',
    group: 'Salud y cuidado'
  },
  {
    id: 'gimnasio',
    label: 'Gimnasio',
    query: 'gimnasio',
    group: 'Salud y cuidado'
  },

  // Servicios profesionales — suelen tener varias líneas y sede fija
  {
    id: 'asesoria',
    label: 'Asesoría / Gestoría',
    query: 'asesoría gestoría',
    group: 'Servicios'
  },
  {
    id: 'inmobiliaria',
    label: 'Inmobiliaria',
    query: 'inmobiliaria',
    group: 'Servicios'
  },
  {
    id: 'despacho_abogados',
    label: 'Despacho de abogados',
    query: 'abogados',
    group: 'Servicios'
  },
  {
    id: 'autoescuela',
    label: 'Autoescuela',
    query: 'autoescuela',
    group: 'Servicios'
  },

  // Automoción e industria ligera
  {
    id: 'taller',
    label: 'Taller mecánico',
    query: 'taller mecánico',
    group: 'Automoción e industria'
  },
  {
    id: 'concesionario',
    label: 'Concesionario',
    query: 'concesionario de coches',
    group: 'Automoción e industria'
  },
  {
    id: 'lavanderia',
    label: 'Lavandería industrial',
    query: 'lavandería',
    group: 'Automoción e industria'
  },
  {
    id: 'almacen',
    label: 'Almacén / Distribución',
    query: 'almacén distribución',
    group: 'Automoción e industria'
  }
] as const

/** Categorías agrupadas, en el orden de la lista, para pintar un <optgroup>. */
export const getCategoriesByGroup = (): Array<{
  group: string
  items: BusinessCategory[]
}> => {
  const groups: Array<{ group: string; items: BusinessCategory[] }> = []

  BUSINESS_CATEGORIES.forEach((category) => {
    const existing = groups.find((entry) => entry.group === category.group)
    if (existing) existing.items.push(category)
    else groups.push({ group: category.group, items: [category] })
  })

  return groups
}

/**
 * Traduce lo que el comercial eligió o escribió al término que se manda a
 * Google. Si no coincide con ninguna categoría conocida, se usa tal cual: el
 * texto libre sigue siendo válido.
 */
export const toSearchQuery = (value: string): string => {
  const clean = value.trim()
  if (!clean) return ''

  const match = BUSINESS_CATEGORIES.find(
    (category) =>
      category.id === clean ||
      category.label.toLowerCase() === clean.toLowerCase()
  )

  return match ? match.query : clean
}
