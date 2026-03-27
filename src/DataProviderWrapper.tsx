import React from 'react'
import { Outlet } from 'react-router-dom'
import { DataProvider } from './lib/DataContext'
import { GoogleOAuthProvider } from './lib/integrations/google'
import { MicrosoftOAuthProvider } from './lib/integrations/microsoft'

const DataProviderWrapper: React.FC = () => (
  <DataProvider>
    <GoogleOAuthProvider>
      <MicrosoftOAuthProvider>
        <Outlet />
      </MicrosoftOAuthProvider>
    </GoogleOAuthProvider>
  </DataProvider>
)

export default DataProviderWrapper
