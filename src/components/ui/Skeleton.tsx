import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-800'
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl'
  }

  const style: React.CSSProperties = {
    width: width,
    height: height
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

export const SkeletonPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-3">
        <Skeleton width={300} height={40} />
        <Skeleton width={180} height={20} />
      </div>
      <Skeleton width={140} height={48} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={120} />
      ))}
    </div>

    <Skeleton height={400} />
  </div>
)
