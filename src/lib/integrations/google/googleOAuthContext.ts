import React from 'react'

export interface GoogleOAuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  userEmail: string | null
  login: () => void
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || ''
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'openid',
  'email',
  'profile'
].join(' ')

export const GoogleOAuthContext = React.createContext<
  GoogleOAuthContextType | undefined
>(undefined)