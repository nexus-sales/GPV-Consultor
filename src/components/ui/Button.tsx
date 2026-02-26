import { forwardRef, ReactNode, ComponentType } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'outline'
    | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  className?: string
  icon?: ComponentType<{ className?: string }>
}

const variants = {
  primary:
    'bg-gradient-to-r from-pastel-indigo via-pastel-indigo to-indigo-600 hover:from-pastel-indigo/90 hover:to-indigo-700 text-white shadow-lg shadow-pastel-indigo/25',
  secondary:
    'bg-gradient-to-r from-pastel-cyan via-pastel-cyan to-cyan-600 hover:from-pastel-cyan/90 hover:to-cyan-700 text-white shadow-lg shadow-pastel-cyan/25',
  success:
    'bg-gradient-to-r from-pastel-green via-pastel-green to-green-600 hover:from-pastel-green/90 hover:to-green-700 text-white shadow-lg shadow-pastel-green/25',
  warning:
    'bg-gradient-to-r from-pastel-yellow via-pastel-yellow to-yellow-600 hover:from-pastel-yellow/90 hover:to-yellow-700 text-gray-800 dark:text-gray-200 dark:text-gray-200 dark:text-gray-200 shadow-lg shadow-pastel-yellow/25',
  danger:
    'bg-gradient-to-r from-pastel-red via-pastel-red to-red-600 hover:from-pastel-red/90 hover:to-red-700 text-white shadow-lg shadow-pastel-red/25',
  outline:
    'border-2 border-pastel-indigo text-pastel-indigo hover:bg-pastel-indigo hover:text-white',
  ghost:
    'text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 hover:bg-pastel-indigo/10 hover:text-pastel-indigo'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className = '',
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-indigo/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]'

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            Cargando...
          </>
        ) : (
          <>
            {Icon && <Icon className="h-4 w-4" />}
            {children}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
