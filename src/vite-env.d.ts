/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GOOGLE_PLACES_KEY?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_REDIRECT_URI?: string
  readonly VITE_MICROSOFT_CLIENT_ID?: string
  readonly VITE_MICROSOFT_REDIRECT_URI?: string
  readonly PACKAGE_VERSION?: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
