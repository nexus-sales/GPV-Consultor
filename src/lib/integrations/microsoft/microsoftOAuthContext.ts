import React from 'react'

export interface MicrosoftOAuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  userEmail: string | null
  login: () => void
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

export const MICROSOFT_CLIENT_ID =
  import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
export const MICROSOFT_REDIRECT_URI =
  import.meta.env.VITE_MICROSOFT_REDIRECT_URI || ''
export const MICROSOFT_SCOPES = [
  'offline_access',
  'openid',
  'email',
  'User.Read',
  'Calendars.ReadWrite',
  'Tasks.ReadWrite'
].join(' ')

export const MicrosoftOAuthContext = React.createContext<
  MicrosoftOAuthContextType | undefined
>(undefined)
