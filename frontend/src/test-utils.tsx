import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import axe from 'axe-core'
import { MemoryRouter } from 'react-router'

import type { AuthMode } from './app/config'
import { AppRoutes } from './app/routes'
import { AuthProvider } from './auth/AuthContext'
import { OrganizationProvider } from './auth/organizationName'
import { PersonaDirectoryProvider } from './auth/personaDirectory'
import { LawWatchProvider } from './frameworks/lawWatchStore'
import { RegistryProvider } from './intake/registry'
import { PolicyLibraryProvider } from './policies/library'
import { RaciProvider } from './raci/store'
import { EvidenceProvider } from './evidence/store'
import { RemediationProvider } from './remediation/store'
import { WorkflowProvider } from './workflows/store'

interface RenderOptions {
  path?: string
  personaId?: string
  mode?: AuthMode
}

export function renderApp({ path = '/', personaId, mode = 'development-stub' }: RenderOptions = {}) {
  if (!personaId) sessionStorage.removeItem('grail-demo-persona')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <PersonaDirectoryProvider>
        <OrganizationProvider>
        <AuthProvider mode={mode} {...(personaId ? { initialPersonaId: personaId } : {})}>
          <RegistryProvider>
            <LawWatchProvider>
            <PolicyLibraryProvider>
              <RaciProvider>
              <WorkflowProvider>
              <EvidenceProvider>
              <RemediationProvider>
              <MemoryRouter initialEntries={[path]}>
                <AppRoutes />
              </MemoryRouter>
              </RemediationProvider>
              </EvidenceProvider>
              </WorkflowProvider>
              </RaciProvider>
            </PolicyLibraryProvider>
            </LawWatchProvider>
          </RegistryProvider>
        </AuthProvider>
        </OrganizationProvider>
      </PersonaDirectoryProvider>
    </QueryClientProvider>,
  )
}

/** Runs axe; jsdom cannot compute colour contrast, which tokens.test.ts covers instead. */
export async function seriousA11yViolations(container: HTMLElement) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.help}`)
}

/** Return a value a test expects to exist, failing with a clear message when it is missing. */
export function required<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what} to exist`)
  return value
}
