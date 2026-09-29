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
  id: string; assetTypeId: string; assetType: AssetTypeSummary; name: string; status: AssetStatus
  hostname: string | null; ipAddress: string | null; manufacturer: string | null; model: string | null
  serialNumber: string | null; notes: string | null; archivedAt: string | null; createdAt: string; updatedAt: string
}
export interface CreateAsset { name: string; assetTypeId: string; status?: AssetStatus; hostname?: string; ipAddress?: string; manufacturer?: string; model?: string; serialNumber?: string; notes?: string }
export type UpdateAsset = Partial<Pick<Asset, 'name' | 'assetTypeId' | 'hostname' | 'ipAddress' | 'manufacturer' | 'model' | 'serialNumber' | 'notes'>> & { status?: EditableAssetStatus }

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
