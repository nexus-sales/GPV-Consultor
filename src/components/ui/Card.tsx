import { forwardRef, ReactNode } from 'react'
import { useTheme } from '../../lib/useTheme'

interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  children?: ReactNode
  variant?: 'default' | 'elevated' | 'gradient' | 'glass' | 'colored'
  color?: 'indigo' | 'cyan' | 'green' | 'yellow' | 'red' | null
  className?: string
  hover?: boolean
  padding?: string
}

interface CardSubComponentProps {
  children?: ReactNode
  className?: string
}

const variants = {
  default: {
    light: 'bg-white border border-gray-200 dark:border-gray-600 shadow-sm',
    dark: 'bg-slate-800/90 border border-slate-600/30 shadow-sm'
  },
  elevated: {
    light:
      'bg-white border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-100/50',
    dark: 'bg-slate-800/95 border border-slate-600/30 shadow-lg shadow-slate-900/50'
  },
  gradient: {
    light:
      'bg-gradient-to-br from-white/90 via-gray-50/70 to-pastel-indigo/5 border border-pastel-indigo/10 shadow-lg shadow-pastel-indigo/5',
    dark: 'bg-gradient-to-br from-slate-800/90 via-slate-700/70 to-pastel-indigo/10 border border-pastel-indigo/20 shadow-lg shadow-pastel-indigo/10'
  },
  glass: {
    light: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl',
    dark: 'bg-slate-800/80 backdrop-blur-sm border border-slate-600/20 shadow-xl'
  },
  colored: {
    indigo: {
      light:
        'bg-gradient-to-br from-pastel-indigo/5 via-white/80 to-pastel-indigo/10 border border-pastel-indigo/20',
      dark: 'bg-gradient-to-br from-pastel-indigo/10 via-slate-800/80 to-pastel-indigo/5 border border-pastel-indigo/30'
    },
    cyan: {
      light:
        'bg-gradient-to-br from-pastel-cyan/5 via-white/80 to-pastel-cyan/10 border border-pastel-cyan/20',
      dark: 'bg-gradient-to-br from-pastel-cyan/10 via-slate-800/80 to-pastel-cyan/5 border border-pastel-cyan/30'
    },
    green: {
      light:
        'bg-gradient-to-br from-pastel-green/5 via-white/80 to-pastel-green/10 border border-pastel-green/20',
      dark: 'bg-gradient-to-br from-pastel-green/10 via-slate-800/80 to-pastel-green/5 border border-pastel-green/30'
    },
    yellow: {
      light:
        'bg-gradient-to-br from-pastel-yellow/5 via-white/80 to-pastel-yellow/10 border border-pastel-yellow/20',
      dark: 'bg-gradient-to-br from-pastel-yellow/10 via-slate-800/80 to-pastel-yellow/5 border border-pastel-yellow/30'
    },
    red: {
      light:
        'bg-gradient-to-br from-pastel-red/5 via-white/80 to-pastel-red/10 border border-pastel-red/20',
      dark: 'bg-gradient-to-br from-pastel-red/10 via-slate-800/80 to-pastel-red/5 border border-pastel-red/30'
    }
  }
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      color = null,
      className = '',
      hover = false,
      padding = 'p-6',
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme()
    let variantClasses: string

    if (variant === 'colored' && color) {
      const colorVariant = variants.colored[color]
      variantClasses = isDark ? colorVariant.dark : colorVariant.light
    } else {
      const standardVariant = variants[variant as keyof typeof variants]
      if (typeof standardVariant === 'object' && 'light' in standardVariant) {
        variantClasses = isDark ? standardVariant.dark : standardVariant.light
      } else {
        // Fallback por si acaso
        variantClasses =
          'bg-white border border-gray-200 dark:border-gray-600 shadow-sm'
      }
    }

    const hoverClasses = hover
      ? 'hover:shadow-xl hover:scale-[1.01] cursor-pointer'
      : ''
    const baseClasses = 'rounded-2xl transition-all duration-300'

    const classes = `${baseClasses} ${variantClasses} ${padding} ${hoverClasses} ${className}`

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader: React.FC<CardSubComponentProps> = ({
  children,
  className = ''
}) => <div className={`mb-6 ${className}`}>{children}</div>

const CardTitle: React.FC<CardSubComponentProps> = ({
  children,
  className = ''
}) => (
  <h3
    className={`text-xl font-semibold text-gray-900 dark:text-white ${className}`}
  >
    {children}
  </h3>
)

const CardDescription: React.FC<CardSubComponentProps> = ({
  children,
  className = ''
}) => (
  <p className={`text-gray-600 dark:text-gray-400 mt-1 ${className}`}>
    {children}
  </p>
)

const CardContent: React.FC<CardSubComponentProps> = ({
  children,
  className = ''
}) => <div className={className}>{children}</div>

// Tipo para Card con subcomponentes
interface CardComponent
  extends React.ForwardRefExoticComponent<
    CardProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: React.FC<CardSubComponentProps>
  Title: React.FC<CardSubComponentProps>
  Description: React.FC<CardSubComponentProps>
  Content: React.FC<CardSubComponentProps>
}

// Asignar subcomponentes
const CardWithSubComponents = Card as CardComponent
CardWithSubComponents.Header = CardHeader
CardWithSubComponents.Title = CardTitle
CardWithSubComponents.Description = CardDescription
CardWithSubComponents.Content = CardContent

export default CardWithSubComponents
