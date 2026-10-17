import { resolveConfig } from './config'

const cognito = {
  VITE_COGNITO_USER_POOL_ID: 'pool',
  VITE_COGNITO_CLIENT_ID: 'client',
  VITE_COGNITO_DOMAIN: 'https://auth.example.com',
}

describe('runtime configuration', () => {
  it('uses the development stub only on the dev server without Cognito', () => {
    expect(resolveConfig({}, true).authMode).toBe('development-stub')
  })

  it('refuses to authenticate a production build without Cognito', () => {
    expect(resolveConfig({}, false).authMode).toBe('unconfigured')
  })

  it('allows the synthetic persona picker only when a preview build asks for it', () => {
    expect(resolveConfig({ VITE_PREVIEW_PERSONAS: 'true' }, false).authMode).toBe('development-stub')
    expect(resolveConfig({ ...cognito, VITE_PREVIEW_PERSONAS: 'true' }, false).authMode).toBe('cognito')
  })

  it('prefers Cognito whenever it is fully configured', () => {
    expect(resolveConfig(cognito, true).authMode).toBe('cognito')
    expect(resolveConfig(cognito, false).authMode).toBe('cognito')
  })

  it('defaults the API base to the CloudFront /api path', () => {
    expect(resolveConfig({}, false).apiBaseUrl).toBe('/api')
  })
})
