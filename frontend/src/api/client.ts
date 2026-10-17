import { config } from '../app/config'

/** The backend error envelope (code, message, field errors, request ID). */
export interface ErrorEnvelope {
  code: string
  message: string
  field_errors: { field: string; message: string }[]
  request_id: string
}

export class ApiError extends Error {
  readonly status: number
  readonly envelope: ErrorEnvelope

  constructor(status: number, envelope: ErrorEnvelope) {
    super(envelope.message)
    this.status = status
    this.envelope = envelope
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string
  idempotencyKey?: string
}

/** Calls the GRAIL API with a fresh correlation ID; errors surface as ApiError. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Correlation-Id': crypto.randomUUID() }
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? null : JSON.stringify(options.body),
  })
  const payload: unknown = await response.json()
  if (!response.ok) throw new ApiError(response.status, payload as ErrorEnvelope)
  return payload as T
}
