import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DataProvider } from './lib/DataContext'
import { GoogleOAuthProvider } from './lib/integrations/google'
import { MicrosoftOAuthProvider } from './lib/integrations/microsoft'
import { runCacheGuard } from './lib/cacheGuard'

const DataProviderWrapper: React.FC = () => {
  // useState initializer corre síncronamente durante el render de este
  // componente, ANTES de que DataProvider (hijo) renderice y sus hooks
  // llamen a loadFromStorage(). Garantiza que si el usuario cambió,
  // localStorage ya está limpio cuando los hooks lo leen por primera vez.
  useState(() => { runCacheGuard(); return null })

  return (
    <DataProvider>
      <GoogleOAuthProvider>
        <MicrosoftOAuthProvider>
          <Outlet />
        </MicrosoftOAuthProvider>
      </GoogleOAuthProvider>
    </DataProvider>
  )
}

export default DataProviderWrapper
