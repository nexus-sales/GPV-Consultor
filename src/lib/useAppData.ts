import { useContext } from 'react'
import { DataContext } from './context'
import type { AppContextType } from './types'

export const useAppData = (): AppContextType => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useAppData must be used within a DataProvider')
  }
  return context
}
