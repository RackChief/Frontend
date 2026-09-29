// Mirrors Backend/src/modules/{assets,asset-types,projects}/*.schema.ts.
export type AssetStatus = 'planned' | 'active' | 'offline' | 'retired' | 'archived'
export type EditableAssetStatus = Exclude<AssetStatus, 'archived'>
export type ProjectStatus = 'idea' | 'planned' | 'committed' | 'in_progress' | 'waiting' | 'completed' | 'cancelled' | 'archived'
export type EditableProjectStatus = Exclude<ProjectStatus, 'archived'>
export type Priority = 'low' | 'normal' | 'high' | 'critical'
export type ItemType = 'work' | 'purchase'
export type ItemStatus = 'planned' | 'committed' | 'in_progress' | 'ordered' | 'received' | 'completed' | 'blocked' | 'cancelled'

export const assetStatuses: EditableAssetStatus[] = ['planned', 'active', 'offline', 'retired']
export const projectStatuses: EditableProjectStatus[] = ['idea', 'planned', 'committed', 'in_progress', 'waiting', 'completed', 'cancelled']
export const priorities: Priority[] = ['low', 'normal', 'high', 'critical']
export const itemStatuses: ItemStatus[] = ['planned', 'committed', 'in_progress', 'ordered', 'received', 'completed', 'blocked', 'cancelled']

export interface AssetTypeSummary { id: string; name: string; slug: string }
export interface AssetType extends AssetTypeSummary { description: string | null; builtIn: boolean; createdAt: string; updatedAt: string }
export interface Asset {
  id: string; assetTypeId: string; assetType: AssetTypeSummary; name: string; status: AssetStatus; locationId: string | null
  hostname: string | null; ipAddress: string | null; manufacturer: string | null; model: string | null
  serialNumber: string | null; notes: string | null; archivedAt: string | null; createdAt: string; updatedAt: string
}
export interface CreateAsset { name: string; assetTypeId: string; status?: AssetStatus; locationId?: string | null; hostname?: string; ipAddress?: string; manufacturer?: string; model?: string; serialNumber?: string; notes?: string }
export type UpdateAsset = Partial<Pick<Asset, 'name' | 'assetTypeId' | 'locationId' | 'hostname' | 'ipAddress' | 'manufacturer' | 'model' | 'serialNumber' | 'notes'>> & { status?: EditableAssetStatus }

export interface ProjectAsset { id: string; name: string; hostname: string | null; assetType: AssetTypeSummary }
export interface ProjectSummary {
  id: string; name: string; description: string | null; status: ProjectStatus; priority: Priority
  targetDate: string | null; estimatedCost: number | null; actualCost: number | null; notes: string | null
  completedAt: string | null; archivedAt: string | null; createdAt: string; updatedAt: string; assets: ProjectAsset[]
}
export interface ProjectItem {
  id: string; projectId: string; type: ItemType; title: string; description: string | null; status: ItemStatus
  targetDate: string | null; vendor: string | null; url: string | null; estimatedCost: number | null
  actualCost: number | null; shippingCost: number | null; orderedAt: string | null; receivedAt: string | null
  completedAt: string | null; notes: string | null; sortOrder: number; createdAt: string; updatedAt: string
}
export interface ProjectUpdate { id: string; projectId: string; body: string; createdAt: string }
export interface Project extends ProjectSummary { items: ProjectItem[]; updates: ProjectUpdate[] }
export interface ProjectFields {
  name: string; description?: string | null; status?: ProjectStatus; priority?: Priority; targetDate?: string | null
  estimatedCost?: number | null; actualCost?: number | null; notes?: string | null; assetIds?: string[]
}
export type CreateProject = ProjectFields
export type UpdateProject = Partial<ProjectFields>
export interface ItemFields {
  type: ItemType; title: string; description?: string | null; status?: ItemStatus; targetDate?: string | null
  vendor?: string | null; url?: string | null; estimatedCost?: number | null; actualCost?: number | null
  shippingCost?: number | null; orderedAt?: string | null; receivedAt?: string | null; completedAt?: string | null
  notes?: string | null; sortOrder?: number
}
export type CreateProjectItem = ItemFields
export type UpdateProjectItem = Partial<ItemFields>

// Backend/src/modules/components/component.schema.ts and locations/location.schema.ts.
export type ComponentStatus = 'installed' | 'spare' | 'planned' | 'retired' | 'failed'
export const componentStatuses: ComponentStatus[] = ['installed', 'spare', 'planned', 'retired', 'failed']
export interface ComponentType { id: string; name: string; slug: string; description: string | null; builtIn: boolean; createdAt: string; updatedAt: string }
export interface Component {
  id: string; assetId: string | null; componentTypeId: string; locationId: string | null; name: string
  manufacturer: string | null; model: string | null; partNumber: string | null; serialNumber: string | null
  quantity: number; status: ComponentStatus; attributes: Record<string, unknown>; storageLocation: string | null
  installedAt: string | null; removedAt: string | null; notes: string | null; createdAt: string; updatedAt: string
}
export interface ComponentFields {
  assetId?: string | null; componentTypeId: string; locationId?: string | null; name: string
  manufacturer?: string | null; model?: string | null; partNumber?: string | null; serialNumber?: string | null
  quantity?: number; status: ComponentStatus; attributes?: Record<string, unknown>; storageLocation?: string | null
  installedAt?: string | null; removedAt?: string | null; notes?: string | null
}
export type CreateComponent = ComponentFields
export type UpdateComponent = Partial<ComponentFields>
export interface Location { id: string; name: string; description: string | null; parentId: string | null; createdAt: string; updatedAt: string }
export interface LocationFields { name: string; description?: string | null; parentId?: string | null }
export interface McpSettings { enabled: boolean }
export interface McpToken { id: string; name: string; enabled: boolean; lastUsedAt: string | null; expiresAt: string | null; createdAt: string; updatedAt: string }
export interface CreatedMcpToken extends McpToken { token: string }
export interface McpTokenUpdate { name?: string; enabled?: boolean; expiresAt?: string | null }
export interface Rack { id: string; name: string; description: string | null; totalUnits: number; startingUnit: number; locationId: string | null; notes: string | null; createdAt: string; updatedAt: string }
export interface RackFields { name: string; description?: string | null; totalUnits: number; startingUnit?: number; locationId?: string | null; notes?: string | null }
export type RackOrientation = 'front' | 'rear'
export interface RackPlacement { id: string; rackId: string; assetId: string; startUnit: number; heightUnits: number; orientation: RackOrientation; notes: string | null; createdAt: string; updatedAt: string; asset: { id: string; name: string; status: string; assetTypeId: string } }
export interface RackDetail extends Rack { placements: RackPlacement[] }
export interface PlacementFields { assetId: string; startUnit: number; heightUnits?: number; orientation?: RackOrientation; notes?: string | null }
export type InterfaceType = 'ethernet' | 'wireless' | 'virtual' | 'bridge' | 'bond' | 'loopback' | 'other'
export const interfaceTypes: InterfaceType[] = ['ethernet', 'wireless', 'virtual', 'bridge', 'bond', 'loopback', 'other']
export type PortType = 'rj45' | 'sfp' | 'sfp_plus' | 'sfp28' | 'qsfp' | 'qsfp28' | 'fiber' | 'other'
export const portTypes: PortType[] = ['rj45', 'sfp', 'sfp_plus', 'sfp28', 'qsfp', 'qsfp28', 'fiber', 'other']
export type ConnectionType = 'copper' | 'fiber' | 'dac' | 'other'
export const connectionTypes: ConnectionType[] = ['copper', 'fiber', 'dac', 'other']
export interface NetworkInterface { id: string; assetId: string; name: string; description: string | null; macAddress: string | null; speedMbps: number | null; interfaceType: InterfaceType; enabled: boolean; notes: string | null; createdAt: string; updatedAt: string }
export interface InterfaceFields { name: string; description?: string | null; macAddress?: string | null; speedMbps?: number | null; interfaceType: InterfaceType; enabled?: boolean; notes?: string | null }
export interface IpAddress { id: string; networkInterfaceId: string; address: string; isPrimary: boolean; description: string | null; createdAt: string; updatedAt: string }
export interface AddressFields { address: string; isPrimary?: boolean; description?: string | null }
export interface NetworkPort { id: string; assetId: string; interfaceId: string | null; name: string; portNumber: number | null; portType: PortType; speedMbps: number | null; poeCapable: boolean; poeEnabled: boolean; enabled: boolean; description: string | null; notes: string | null; createdAt: string; updatedAt: string }
export interface PortFields { interfaceId?: string | null; name: string; portNumber?: number | null; portType: PortType; speedMbps?: number | null; poeCapable?: boolean; poeEnabled?: boolean; enabled?: boolean; description?: string | null; notes?: string | null }
export interface NetworkConnection { id: string; portAId: string; portBId: string; connectionType: ConnectionType | null; label: string | null; notes: string | null; createdAt: string; updatedAt: string }
export interface ConnectionFields { portAId: string; portBId: string; connectionType?: ConnectionType | null; label?: string | null; notes?: string | null }
export type RelationshipType = 'hosts' | 'runs_on' | 'depends_on' | 'backs_up_to' | 'managed_by' | 'powered_by' | 'connected_to' | 'other'
export const relationshipTypes: RelationshipType[] = ['hosts', 'runs_on', 'depends_on', 'backs_up_to', 'managed_by', 'powered_by', 'connected_to', 'other']
export interface AssetRelationship { id: string; sourceAssetId: string; targetAssetId: string; relationshipType: RelationshipType; notes: string | null; createdAt: string; updatedAt: string }
export interface RelationshipFields { sourceAssetId: string; targetAssetId: string; relationshipType: RelationshipType; notes?: string | null }
export interface AssetDetailModel extends Asset {
  location: { id: string; name: string; parentId: string | null } | null
  rackPlacements: (Omit<RackPlacement, 'asset'> & { rack: { id: string; name: string } })[]
  components: Component[]
  interfaces: (NetworkInterface & { ipAddresses: IpAddress[] })[]
  ports: NetworkPort[]
  relationships: AssetRelationship[]
}
