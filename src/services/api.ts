import { supabase } from './auth'
import type { Asset, AssetType, CreateAsset, UpdateAsset, Project, ProjectSummary, CreateProject, UpdateProject, ProjectItem, CreateProjectItem, UpdateProjectItem, ProjectUpdate } from '../types/api'

const origin = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

interface ApiIssue { path?: PropertyKey[]; message?: string }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase!.auth.getSession()
  if (!session) throw new ApiError(401, 'Your session has ended. Please sign in again.')
  let response: Response
  try {
    response = await fetch(`${origin}/api/v1${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${session.access_token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the RackChief API. Check the API URL and connection.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; issues?: ApiIssue[] }
    const issues = body.issues?.map(issue => `${issue.path?.join('.') || 'Field'}: ${issue.message || 'Invalid value'}`).join('; ')
    const fallback = response.status === 401 ? 'Your session has ended. Please sign in again.'
      : response.status === 404 ? 'The requested record was not found.'
      : response.status === 409 ? 'This record must be archived before permanent deletion.'
      : `Request failed (${response.status}).`
    if (response.status === 401) void supabase!.auth.signOut()
    throw new ApiError(response.status, issues || body.error || fallback)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const json = (body: unknown) => JSON.stringify(body)
const id = (value: string) => encodeURIComponent(value)

export const api = {
  assetTypes: { list: () => request<AssetType[]>('/asset-types') },
  assets: {
    list: () => request<Asset[]>('/assets'),
    get: (assetId: string) => request<Asset>(`/assets/${id(assetId)}`),
    create: (input: CreateAsset) => request<Asset>('/assets', { method: 'POST', body: json(input) }),
    update: (assetId: string, input: UpdateAsset) => request<Asset>(`/assets/${id(assetId)}`, { method: 'PATCH', body: json(input) }),
    archive: (assetId: string) => request<Asset>(`/assets/${id(assetId)}/archive`, { method: 'POST' }),
    restore: (assetId: string) => request<Asset>(`/assets/${id(assetId)}/restore`, { method: 'POST' }),
    delete: (assetId: string) => request<void>(`/assets/${id(assetId)}`, { method: 'DELETE' }),
  },
  projects: {
    list: () => request<ProjectSummary[]>('/projects'),
    get: (projectId: string) => request<Project>(`/projects/${id(projectId)}`),
    create: (input: CreateProject) => request<Project>('/projects', { method: 'POST', body: json(input) }),
    update: (projectId: string, input: UpdateProject) => request<Project>(`/projects/${id(projectId)}`, { method: 'PATCH', body: json(input) }),
    archive: (projectId: string) => request<Project>(`/projects/${id(projectId)}/archive`, { method: 'POST' }),
    restore: (projectId: string) => request<Project>(`/projects/${id(projectId)}/restore`, { method: 'POST' }),
    delete: (projectId: string) => request<void>(`/projects/${id(projectId)}`, { method: 'DELETE' }),
    items: {
      create: (projectId: string, input: CreateProjectItem) => request<ProjectItem>(`/projects/${id(projectId)}/items`, { method: 'POST', body: json(input) }),
      update: (projectId: string, itemId: string, input: UpdateProjectItem) => request<ProjectItem>(`/projects/${id(projectId)}/items/${id(itemId)}`, { method: 'PATCH', body: json(input) }),
      delete: (projectId: string, itemId: string) => request<void>(`/projects/${id(projectId)}/items/${id(itemId)}`, { method: 'DELETE' }),
    },
    updates: {
      create: (projectId: string, body: string) => request<ProjectUpdate>(`/projects/${id(projectId)}/updates`, { method: 'POST', body: json({ body }) }),
      delete: (projectId: string, updateId: string) => request<void>(`/projects/${id(projectId)}/updates/${id(updateId)}`, { method: 'DELETE' }),
    },
  },
}
