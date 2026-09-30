import type { Asset, AssetDetailModel, AssetType, CreateAsset, UpdateAsset, Project, ProjectSummary, CreateProject, UpdateProject, ProjectItem, CreateProjectItem, UpdateProjectItem, ProjectUpdate, Component, ComponentType, CreateComponent, UpdateComponent, Location, LocationFields, McpSettings, McpToken, CreatedMcpToken, McpTokenUpdate, Rack, RackDetail, RackFields, RackPlacement, PlacementFields, NetworkInterface, InterfaceFields, NetworkPort, PortFields, IpAddress, AddressFields, NetworkConnection, ConnectionFields, AssetRelationship, RelationshipFields } from '../../types/api'
import { request } from './client'

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
  images: {
    customSides: (assetId: string) => request<{ front: boolean; rear: boolean }>(`/device-images/${id(assetId)}`),
    urls: async (assetId: string) => {
      const urls = await request<{ front: string; rear: string }>(`/device-images/${id(assetId)}/urls`)
      return { front: urls.front.replace('/api/v1/device-images/', '/device-image-source/'), rear: urls.rear.replace('/api/v1/device-images/', '/device-image-source/') }
    },
    upload: (assetId: string, side: 'front' | 'rear', file: File) => request<{ side: string; contentType: string; source: 'custom' }>(`/device-images/${id(assetId)}/${side}`, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } }),
    remove: (assetId: string, side: 'front' | 'rear') => request<void>(`/device-images/${id(assetId)}/${side}`, { method: 'DELETE' }),
    catalog: (query: string) => request<{ path: string; side: 'front' | 'rear'; label: string; rawUrl: string }[]>(`/device-images/catalog?q=${encodeURIComponent(query)}`),
    selectCatalog: (assetId: string, side: 'front' | 'rear', path: string) => request<{ side: string; contentType: string; source: 'catalog' }>(`/device-images/${id(assetId)}/${side}/catalog`, { method: 'POST', body: json({ path }) }),
  },
  deviceLibrary: {
    search: (query: string) => request<{ path: string; label: string }[]>(`/device-library/device-types?q=${encodeURIComponent(query)}`),
    preview: (path: string) => request<{ path: string; manufacturer: string; model: string; slug?: string; partNumber?: string; rackUnits: number; isFullDepth: boolean; comments?: string; raw: Record<string, unknown> }>(`/device-library/device-types/preview?path=${encodeURIComponent(path)}`),
  },
  catalog: {
    manufacturers: () => request<{ name: string; deviceCount: number }[]>('/catalog/manufacturers'),
    search: (query: { q?: string; manufacturer?: string } = {}) => { const params = new URLSearchParams(); if (query.q) params.set('q', query.q); if (query.manufacturer) params.set('manufacturer', query.manufacturer); return request<import('../../types/api').CatalogDeviceSummary[]>(`/catalog/device-types${params.size ? `?${params}` : ''}`) },
    get: (deviceId: string) => request<import('../../types/api').CatalogDevice>(`/catalog/device-types/${id(deviceId)}`),
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
