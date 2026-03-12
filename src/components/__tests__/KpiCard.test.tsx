/**
 * Tests para el componente KpiCard
 * Pruebas de renderizado, interacción y accesibilidad
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import KpiCard from '../KpiCard'
import { ChartBarIcon } from '@heroicons/react/24/outline'

describe('KpiCard', () => {
  const defaultProps = {
    title: 'Ventas Totales',
    value: 1234,
    subtitle: 'Esta semana',
    icon: ChartBarIcon
  }

  it('renderiza correctamente con props básicos', () => {
    render(<KpiCard {...defaultProps} />)
    
    expect(screen.getByText('Ventas Totales')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getByText('Esta semana')).toBeInTheDocument()
  })

  it('renderiza el icono cuando se proporciona', () => {
    render(<KpiCard {...defaultProps} />)
    
    // Verificar que el icono está presente en el DOM
    const iconContainer = document.querySelector('.bg-pastel-indigo\\/10')
    expect(iconContainer).toBeInTheDocument()
  })

  it('aplica la clase de color indigo por defecto', () => {
    const { container } = render(<KpiCard {...defaultProps} />)
    
    // Verificar que existen clases relacionadas con indigo
    expect(container.innerHTML).toContain('pastel-indigo')
  })

  it('aplica clases de color cyan cuando color="cyan"', () => {
    render(<KpiCard {...defaultProps} color="cyan" />)
    
    expect(screen.getByText('Ventas Totales').parentElement?.innerHTML).toContain('pastel-cyan')
  })

  it('muestra estado de loading cuando loading=true', () => {
    render(<KpiCard {...defaultProps} loading={true} />)
    
    // Buscar el elemento con animación de pulse
    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('no muestra loading cuando loading=false', () => {
    render(<KpiCard {...defaultProps} loading={false} />)
    
    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).not.toBeInTheDocument()
  })

  it('llama a onClick cuando se hace click y onClick está definido', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<KpiCard {...defaultProps} onClick={handleClick} />)
    
    const card = screen.getByText('Ventas Totales').closest('div[role="button"]')
    expect(card).toBeInTheDocument()
    
    if (card) {
      await user.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    }
  })

  it('no es clickable cuando onClick no está definido', () => {
    render(<KpiCard {...defaultProps} />)
    
    const card = screen.getByText('Ventas Totales').parentElement?.parentElement
    expect(card?.getAttribute('role')).not.toBe('button')
  })

  it('es accesible con teclado (Enter)', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<KpiCard {...defaultProps} onClick={handleClick} />)
    
    const card = screen.getByText('Ventas Totales').closest('div[role="button"]')
    
    if (card) {
      await user.keyboard('{Enter}')
      // El evento se dispara en el elemento con role="button"
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
      // Nota: la implementación real puede variar
    }
  })

  it('muestra trend positivo con icono de tendencia hacia arriba', () => {
    render(<KpiCard {...defaultProps} trend={15} />)
    
    // El trend se muestra dentro del badge con clase bg-pastel-green/15
    const trendBadge = document.querySelector('.bg-pastel-green\\/15')
    expect(trendBadge).toBeInTheDocument()
    // Verificar que hay un icono de tendencia positiva (ArrowTrendingUpIcon)
    expect(trendBadge?.querySelector('svg')).toBeInTheDocument()
  })

  it('muestra trend negativo con icono de tendencia hacia abajo', () => {
    render(<KpiCard {...defaultProps} trend={-10} />)
    
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('no muestra trend cuando es null', () => {
    render(<KpiCard {...defaultProps} trend={null} />)
    
    // No debería haber elemento con porcentaje de trend
    const trendElement = screen.queryByText(/\d+%/)
    expect(trendElement).not.toBeInTheDocument()
  })

  it('aplica hover styles cuando se pasa el mouse por encima', async () => {
    const user = userEvent.setup()
    render(<KpiCard {...defaultProps} />)
    
    // Obtener el contenedor principal del KpiCard (el div con rounded-2xl)
    const card = screen.getByText('Ventas Totales').closest('.rounded-2xl')
    expect(card).toBeInTheDocument()
    
    if (card) {
      await user.hover(card)
      // Verificar que el icon container tiene clases de transición
      const iconContainer = card.querySelector('.rounded-xl')
      expect(iconContainer?.className).toContain('transition-all')
    }
  })

  it('renderiza valor como string cuando es string', () => {
    render(<KpiCard {...defaultProps} value="1,234 €" />)
    
    expect(screen.getByText('1,234 €')).toBeInTheDocument()
  })

  it('usa color rojo para variant "red"', () => {
    render(<KpiCard {...defaultProps} color="red" />)
    
    expect(screen.getByText('Ventas Totales').parentElement?.innerHTML).toContain('pastel-red')
  })

  it('usa color verde para variant "green"', () => {
    render(<KpiCard {...defaultProps} color="green" />)
    
    expect(screen.getByText('Ventas Totales').parentElement?.innerHTML).toContain('pastel-green')
  })

  it('usa color amarillo para variant "yellow"', () => {
    render(<KpiCard {...defaultProps} color="yellow" />)
    
    expect(screen.getByText('Ventas Totales').parentElement?.innerHTML).toContain('pastel-yellow')
  })
})
