import { createContext } from 'react'
import type { AppContextType } from './types'

export const DataContext = createContext<AppContextType | null>(null)
