import React from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import Card from '../ui/Card'

// Tipos para el componente
type QualityStatus = 'excellent' | 'good' | 'warning' | 'poor'

interface QualityMetric {
  label: string
  percentage: number
  status: QualityStatus
  description: string
}

interface QualityItemProps {
  label: string
  percentage: number
  status: QualityStatus
  description: string
}

interface StatusConfig {
  icon: React.ElementType
  color: string
  bgColor: string
  barColor: string
}

const QualityItem: React.FC<QualityItemProps> = ({
  label,
  percentage,
  status,
  description
}) => {
  const getStatusConfig = (status: QualityStatus): StatusConfig => {
    switch (status) {
      case 'excellent':
        return {
          icon: CheckCircleIcon,
          color: 'text-pastel-green',
          bgColor: 'bg-pastel-green/15',
          barColor: 'bg-pastel-green'
        }
      case 'good':
        return {
          icon: CheckCircleIcon,
          color: 'text-pastel-cyan',
          bgColor: 'bg-pastel-cyan/15',
          barColor: 'bg-pastel-cyan'
        }
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-pastel-yellow',
          bgColor: 'bg-pastel-yellow/15',
          barColor: 'bg-pastel-yellow'
        }
      case 'poor':
        return {
          icon: ClockIcon,
          color: 'text-pastel-red',
          bgColor: 'bg-pastel-red/15',
          barColor: 'bg-pastel-red'
        }
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          barColor: 'bg-gray-400'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`${config.bgColor} ${config.color} p-1.5 rounded-lg`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {label}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${config.color}`}>{percentage}%</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        {/* Inline style required for dynamic width - see docs/CSS_INLINE_STYLES.md */}
        <div
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${config.barColor}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-label={`${label}: ${percentage}%`}
        />
      </div>
    </div>
  )
}

const QualityMetrics: React.FC = () => {
  const metrics: QualityMetric[] = [
    {
      label: 'Completitud de Datos',
      percentage: 87,
      status: 'excellent',
      description: 'Información completa de distribuidores'
    },
    {
      label: 'Actividad Reciente',
      percentage: 72,
      status: 'good',
      description: 'Distribuidores con actividad en 30 días'
    },
    {
      label: 'Documentación',
      percentage: 65,
      status: 'warning',
      description: 'Documentos legales actualizados'
    },
    {
      label: 'Contactabilidad',
      percentage: 45,
      status: 'poor',
      description: 'Contactos verificados recientemente'
    }
  ]

  const overallScore = Math.round(
    metrics.reduce((sum, metric) => sum + metric.percentage, 0) / metrics.length
  )

  const getOverallScoreColor = (score: number): string => {
    if (score >= 80) return 'text-pastel-green'
    if (score >= 60) return 'text-pastel-cyan'
    if (score >= 40) return 'text-pastel-yellow'
    return 'text-pastel-red'
  }

  return (
    <Card variant="gradient" hover className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="flex items-center gap-2">
            <div className="bg-pastel-cyan/15 p-2 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-pastel-cyan" />
            </div>
            Calidad de Datos
          </Card.Title>
          <div
            className={`text-2xl font-bold ${getOverallScoreColor(overallScore)}`}
          >
            {overallScore}%
          </div>
        </div>
        <Card.Description>
          Puntuación general de calidad del sistema
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="space-y-6">
          {metrics.map((metric, index) => (
            <QualityItem key={`quality-metric-${index}`} {...metric} />
          ))}
        </div>
      </Card.Content>
    </Card>
  )
}

export default QualityMetrics
