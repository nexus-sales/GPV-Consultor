import { forwardRef, ReactNode } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  variant?: 'default' | 'elevated'
  className?: string
  hover?: boolean
  padding?: string
}

interface CardSubComponentProps {
  children?: ReactNode
  className?: string
}

const variants = {
  default:
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
  elevated:
    'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      className = '',
      hover = false,
      padding = 'p-6',
      ...props
    },
    ref
  ) => {
    const hoverClasses = hover ? 'hover:shadow-xl cursor-pointer' : ''
    const baseClasses = 'rounded-2xl transition-shadow duration-200'
    const classes = `${baseClasses} ${variants[variant]} ${padding} ${hoverClasses} ${className}`

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

interface CardComponent
  extends React.ForwardRefExoticComponent<
    CardProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: React.FC<CardSubComponentProps>
  Title: React.FC<CardSubComponentProps>
  Description: React.FC<CardSubComponentProps>
  Content: React.FC<CardSubComponentProps>
}

const CardWithSubComponents = Card as CardComponent
CardWithSubComponents.Header = CardHeader
CardWithSubComponents.Title = CardTitle
CardWithSubComponents.Description = CardDescription
CardWithSubComponents.Content = CardContent

export default CardWithSubComponents
