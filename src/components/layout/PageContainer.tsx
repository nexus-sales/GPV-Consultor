import React from 'react'

type PageContainerSize = 'narrow' | 'default' | 'wide' | 'ultra' | 'full'

export interface PageContainerProps {
  children: React.ReactNode
  size?: PageContainerSize
  className?: string
}

const sizeClassName: Record<PageContainerSize, string> = {
  narrow: 'max-w-5xl',
  default: 'max-w-7xl',
  wide: 'max-w-[1600px]',
  ultra: 'max-w-[1920px]',
  full: 'max-w-none'
}

export function PageContainer({
  children,
  size = 'default',
  className
}: PageContainerProps) {
  const classes = [
    'mx-auto w-full px-4 sm:px-6 lg:px-10',
    sizeClassName[size],
    className
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}

