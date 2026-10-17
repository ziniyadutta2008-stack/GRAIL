import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router'

import { AuthProvider } from '../auth/AuthContext'
import { OrganizationProvider } from '../auth/organizationName'
import { PersonaDirectoryProvider } from '../auth/personaDirectory'
import { LawWatchProvider } from '../frameworks/lawWatchStore'
import { RegistryProvider } from '../intake/registry'
import { PolicyLibraryProvider } from '../policies/library'
import { RaciProvider } from '../raci/store'
import { EvidenceProvider } from '../evidence/store'
import { RemediationProvider } from '../remediation/store'
import { WorkflowProvider } from '../workflows/store'
import { AppRoutes } from './routes'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }))
  return (
    <QueryClientProvider client={queryClient}>
      <PersonaDirectoryProvider>
        <OrganizationProvider>
        <AuthProvider>
          <RegistryProvider>
            <LawWatchProvider>
            <PolicyLibraryProvider>
              <RaciProvider><WorkflowProvider><EvidenceProvider><RemediationProvider>{children}</RemediationProvider></EvidenceProvider></WorkflowProvider></RaciProvider>
            </PolicyLibraryProvider>
            </LawWatchProvider>
          </RegistryProvider>
        </AuthProvider>
        </OrganizationProvider>
      </PersonaDirectoryProvider>
    </QueryClientProvider>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
