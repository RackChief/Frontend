import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null
let origin = ''
let onUnauthorized: () => void = () => {}

export function configureApiClient(authClient: SupabaseClient | null, apiOrigin: string, unauthorized: () => void) {
  client = authClient
  origin = apiOrigin.replace(/\/$/, '')
  onUnauthorized = unauthorized
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

interface ApiIssue { path?: PropertyKey[]; message?: string }
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await client?.auth.getSession() || { data: { session: null } }
  if (!session) throw new ApiError(401, 'Your session has ended. Please sign in again.')
  try {
    return await $fetch<T>(`${origin}/api/v1${path}`, {
      method: (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      body: options.body as string | Blob | undefined,
      headers: { Authorization: `Bearer ${session.access_token}`, ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...Object.fromEntries(new Headers(options.headers)) },
    }) as T
  } catch (cause) {
    const response = cause as { status?: number; statusCode?: number; data?: { error?: string; issues?: ApiIssue[] } }
    const status = response.statusCode || response.status || 0
    const issues = response.data?.issues?.map(issue => `${issue.path?.join('.') || 'Field'}: ${issue.message || 'Invalid value'}`).join('; ')
    const fallback = status === 401 ? 'Your session has ended. Please sign in again.'
      : status === 404 ? 'The requested record was not found.'
      : status === 409 ? 'This change conflicts with existing data.'
      : status === 0 ? 'Could not reach the RackChief API.' : `Request failed (${status}).`
    if (status === 401) { void client?.auth.signOut(); onUnauthorized() }
    throw new ApiError(status, issues || response.data?.error || fallback)
  }
}
