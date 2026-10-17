import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_COGNITO_USER_POOL_ID: z.string().min(1).optional(),
  VITE_COGNITO_CLIENT_ID: z.string().min(1).optional(),
  VITE_COGNITO_DOMAIN: z.string().url().optional(),
  VITE_PREVIEW_PERSONAS: z.enum(['true', 'false']).optional(),
})

/**
 * How sign-in works in this build:
 * - cognito: managed login is configured (implemented in Stage 2);
 * - development-stub: local dev server only, persona picker over synthetic data;
 * - unconfigured: a production build without Cognito settings; sign-in is refused.
 * VITE_PREVIEW_PERSONAS=true is only for a temporary review build of the synthetic screens.
 */
export type AuthMode = 'cognito' | 'development-stub' | 'unconfigured'

export interface RuntimeConfig {
  apiBaseUrl: string
  authMode: AuthMode
}

export function resolveConfig(env: Record<string, unknown>, isDev: boolean): RuntimeConfig {
  const parsed = EnvSchema.parse(env)
  const cognitoReady = Boolean(parsed.VITE_COGNITO_USER_POOL_ID && parsed.VITE_COGNITO_CLIENT_ID && parsed.VITE_COGNITO_DOMAIN)
  const previewPersonas = parsed.VITE_PREVIEW_PERSONAS === 'true'
  const authMode: AuthMode = cognitoReady ? 'cognito' : isDev || previewPersonas ? 'development-stub' : 'unconfigured'
  return { apiBaseUrl: parsed.VITE_API_BASE_URL, authMode }
}

export const config = resolveConfig(import.meta.env, import.meta.env.DEV)
