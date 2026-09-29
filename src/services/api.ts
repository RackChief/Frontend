import { supabase } from './auth'
import type { Asset, AssetDetailModel, AssetType, CreateAsset, UpdateAsset, Project, ProjectSummary, CreateProject, UpdateProject, ProjectItem, CreateProjectItem, UpdateProjectItem, ProjectUpdate, Component, ComponentType, CreateComponent, UpdateComponent, Location, LocationFields, McpSettings, McpToken, CreatedMcpToken, McpTokenUpdate, Rack, RackDetail, RackFields, RackPlacement, PlacementFields, NetworkInterface, InterfaceFields, NetworkPort, PortFields, IpAddress, AddressFields, NetworkConnection, ConnectionFields, AssetRelationship, RelationshipFields } from '../types/api'

const origin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

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
      : response.status === 409 ? 'This change conflicts with existing data.'
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
  componentTypes: { list: () => request<ComponentType[]>('/component-types') },
  components: {
    list: (filters: { assetId?: string; componentTypeId?: string; status?: string; unassigned?: boolean } = {}) => {
      const query = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) if (value !== undefined) query.set(key, String(value))
      return request<Component[]>(`/components${query.size ? `?${query}` : ''}`)
    },
    get: (componentId: string) => request<Component>(`/components/${id(componentId)}`),
    create: (input: CreateComponent) => request<Component>('/components', { method: 'POST', body: json(input) }),
    update: (componentId: string, input: UpdateComponent) => request<Component>(`/components/${id(componentId)}`, { method: 'PATCH', body: json(input) }),
    delete: (componentId: string) => request<void>(`/components/${id(componentId)}`, { method: 'DELETE' }),
  },
  locations: {
    list: () => request<Location[]>('/locations'),
    create: (input: LocationFields) => request<Location>('/locations', { method: 'POST', body: json(input) }),
    update: (locationId: string, input: Partial<LocationFields>) => request<Location>(`/locations/${id(locationId)}`, { method: 'PATCH', body: json(input) }),
    delete: (locationId: string) => request<void>(`/locations/${id(locationId)}`, { method: 'DELETE' }),
  },
  mcp: {
    settings: () => request<McpSettings>('/settings/mcp'),
    setEnabled: (enabled: boolean) => request<McpSettings>('/settings/mcp', { method: 'PATCH', body: json({ enabled }) }),
    tokens: () => request<McpToken[]>('/mcp-tokens'),
    createToken: (name: string, expiresAt?: string) => request<CreatedMcpToken>('/mcp-tokens', { method: 'POST', body: json({ name, ...(expiresAt ? { expiresAt } : {}) }) }),
    updateToken: (tokenId: string, input: McpTokenUpdate) => request<McpToken>(`/mcp-tokens/${id(tokenId)}`, { method: 'PATCH', body: json(input) }),
    deleteToken: (tokenId: string) => request<void>(`/mcp-tokens/${id(tokenId)}`, { method: 'DELETE' }),
  },
  racks: {
    list: () => request<Rack[]>('/racks'),
    get: (rackId: string) => request<RackDetail>(`/racks/${id(rackId)}`),
    create: (input: RackFields) => request<Rack>('/racks', { method: 'POST', body: json(input) }),
    update: (rackId: string, input: Partial<RackFields>) => request<Rack>(`/racks/${id(rackId)}`, { method: 'PATCH', body: json(input) }),
    delete: (rackId: string) => request<void>(`/racks/${id(rackId)}`, { method: 'DELETE' }),
    placements: {
      create: (rackId: string, input: PlacementFields) => request<RackPlacement>(`/racks/${id(rackId)}/placements`, { method: 'POST', body: json(input) }),
      update: (rackId: string, placementId: string, input: Partial<PlacementFields>) => request<RackPlacement>(`/racks/${id(rackId)}/placements/${id(placementId)}`, { method: 'PATCH', body: json(input) }),
      delete: (rackId: string, placementId: string) => request<void>(`/racks/${id(rackId)}/placements/${id(placementId)}`, { method: 'DELETE' }),
    },
  },
  assets: {
    list: () => request<Asset[]>('/assets'),
    get: (assetId: string) => request<Asset>(`/assets/${id(assetId)}`),
    detail: (assetId: string) => request<AssetDetailModel>(`/assets/${id(assetId)}/detail`),
    create: (input: CreateAsset) => request<Asset>('/assets', { method: 'POST', body: json(input) }),
    update: (assetId: string, input: UpdateAsset) => request<Asset>(`/assets/${id(assetId)}`, { method: 'PATCH', body: json(input) }),
    archive: (assetId: string) => request<Asset>(`/assets/${id(assetId)}/archive`, { method: 'POST' }),
    restore: (assetId: string) => request<Asset>(`/assets/${id(assetId)}/restore`, { method: 'POST' }),
    delete: (assetId: string) => request<void>(`/assets/${id(assetId)}`, { method: 'DELETE' }),
  },
  network: {
    interfaces: {
      create: (assetId: string, input: InterfaceFields) => request<NetworkInterface>(`/assets/${id(assetId)}/interfaces`, { method: 'POST', body: json(input) }),
      update: (interfaceId: string, input: Partial<InterfaceFields>) => request<NetworkInterface>(`/network-interfaces/${id(interfaceId)}`, { method: 'PATCH', body: json(input) }),
      delete: (interfaceId: string) => request<void>(`/network-interfaces/${id(interfaceId)}`, { method: 'DELETE' }),
    },
    ports: {
      list: () => request<NetworkPort[]>('/network-ports'),
      create: (assetId: string, input: PortFields) => request<NetworkPort>(`/assets/${id(assetId)}/ports`, { method: 'POST', body: json(input) }),
      update: (portId: string, input: Partial<PortFields>) => request<NetworkPort>(`/network-ports/${id(portId)}`, { method: 'PATCH', body: json(input) }),
      delete: (portId: string) => request<void>(`/network-ports/${id(portId)}`, { method: 'DELETE' }),
    },
    addresses: {
      create: (interfaceId: string, input: AddressFields) => request<IpAddress>(`/network-interfaces/${id(interfaceId)}/ip-addresses`, { method: 'POST', body: json(input) }),
      update: (addressId: string, input: Partial<AddressFields>) => request<IpAddress>(`/ip-addresses/${id(addressId)}`, { method: 'PATCH', body: json(input) }),
      delete: (addressId: string) => request<void>(`/ip-addresses/${id(addressId)}`, { method: 'DELETE' }),
    },
    connections: {
      list: (assetId?: string) => request<NetworkConnection[]>(`/network-connections${assetId ? `?assetId=${id(assetId)}` : ''}`),
      create: (input: ConnectionFields) => request<NetworkConnection>('/network-connections', { method: 'POST', body: json(input) }),
      update: (connectionId: string, input: Partial<ConnectionFields>) => request<NetworkConnection>(`/network-connections/${id(connectionId)}`, { method: 'PATCH', body: json(input) }),
      delete: (connectionId: string) => request<void>(`/network-connections/${id(connectionId)}`, { method: 'DELETE' }),
    },
  },
  relationships: {
    create: (input: RelationshipFields) => request<AssetRelationship>('/asset-relationships', { method: 'POST', body: json(input) }),
    update: (relationshipId: string, input: Partial<RelationshipFields>) => request<AssetRelationship>(`/asset-relationships/${id(relationshipId)}`, { method: 'PATCH', body: json(input) }),
    delete: (relationshipId: string) => request<void>(`/asset-relationships/${id(relationshipId)}`, { method: 'DELETE' }),
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
