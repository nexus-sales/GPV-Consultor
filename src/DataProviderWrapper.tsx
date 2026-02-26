import React from 'react'
import { Outlet } from 'react-router-dom'
import { DataProvider } from './lib/DataContext'

const DataProviderWrapper: React.FC = () => (
  <DataProvider>
    <Outlet />
  </DataProvider>
)

export default DataProviderWrapper
