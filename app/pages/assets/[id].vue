<script setup lang="ts">
import { api } from '../../../services/api'
import type { Asset, AssetDetailModel, AssetType, Component, ComponentFields, ComponentType, CreateAsset, Location, ProjectSummary, UpdateAsset } from '../../../types/api'

const route = useRoute()
const asset = ref<AssetDetailModel | null>(null)
const types = ref<AssetType[]>([])
const locations = ref<Location[]>([])
const assets = ref<Asset[]>([])
const componentTypes = ref<ComponentType[]>([])
const projects = ref<ProjectSummary[]>([])
const editingComponent = ref<Component | 'new' | null>(null)
const loading = ref(true)
const busy = ref(false)
const editing = ref(false)
const error = ref<string | null>(null)
const id = computed(() => String(route.params.id))
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : '—'
const associatedProjects = computed(() => projects.value.filter(project => project.assets.some(row => row.id === id.value)))
onMounted(async () => { try { [asset.value, types.value, locations.value, assets.value, componentTypes.value, projects.value] = await Promise.all([api.assets.detail(id.value), api.assetTypes.list(), api.locations.list(), api.assets.list(), api.componentTypes.list(), api.projects.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load asset.' } finally { loading.value = false } })
async function refresh() { asset.value = await api.assets.detail(id.value) }
async function save(input: CreateAsset | UpdateAsset) { await api.assets.update(id.value, input as UpdateAsset); await refresh(); editing.value = false }
async function saveComponent(input: ComponentFields) { if (editingComponent.value === 'new') await api.components.create(input); else if (editingComponent.value) await api.components.update(editingComponent.value.id, input); await refresh(); editingComponent.value = null }
async function moveToSpare(row: Component) { try { error.value = null; await api.components.update(row.id, { assetId: null, status: 'spare' }); await refresh() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not move component.' } }
async function removeComponent(row: Component) { if (!window.confirm(`Delete component “${row.name}”?`)) return; try { error.value = null; await api.components.delete(row.id); await refresh() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not delete component.' } }
async function lifecycle(action: 'archive' | 'restore' | 'delete') {
  if (!asset.value || (action === 'delete' && !window.confirm(`Permanently delete “${asset.value.name}”? This cannot be undone.`))) return
  busy.value = true; error.value = null
  try { if (action === 'delete') { await api.assets.delete(id.value); await navigateTo('/assets') } else { await api.assets[action](id.value); await refresh() } }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Action failed.' } finally { busy.value = false }
}
</script>

<template>
  <NuxtLink to="/assets" class="block mb-5 text-cyan-300">← Assets</NuxtLink>
  <UCard v-if="loading"><div role="status">Loading asset…</div></UCard>
  <template v-else-if="asset"><div class="page-heading"><div><p class="eyebrow">Asset</p><h1>{{ asset.name }}</h1><div class="inline"><UBadge variant="subtle">{{ asset.status }}</UBadge><span class="muted">{{ asset.assetType.name }}</span></div></div><div class="actions"><UButton v-if="!asset.archivedAt" variant="outline" @click="editing = !editing">Edit</UButton><UButton v-if="asset.archivedAt" variant="outline" :loading="busy" @click="lifecycle('restore')">Restore</UButton><UButton v-if="asset.archivedAt" color="error" :loading="busy" @click="lifecycle('delete')">Delete permanently</UButton><UButton v-else color="error" variant="outline" :loading="busy" @click="lifecycle('archive')">Archive</UButton></div></div>
    <UAlert v-if="error" color="error" :title="error" class="mb-4" />
    <section v-if="editing" class="panel"><h2 class="mb-4 text-lg font-semibold">Edit asset</h2><AssetForm :key="asset.id" :asset="asset" :types="types" :locations="locations" :on-save="save" :on-cancel="() => editing = false" /></section>
    <section class="panel"><h2 class="mb-4 text-lg font-semibold">Overview</h2><dl class="details"><div><dt>Asset type</dt><dd>{{ asset.assetType.name }}</dd></div><div><dt>Hostname</dt><dd>{{ asset.hostname || '—' }}</dd></div><div><dt>Legacy IP address</dt><dd>{{ asset.ipAddress || '—' }}</dd></div><div><dt>Manufacturer</dt><dd>{{ asset.manufacturer || '—' }}</dd></div><div><dt>Model</dt><dd>{{ asset.model || '—' }}</dd></div><div><dt>Serial number</dt><dd>{{ asset.serialNumber || '—' }}</dd></div><div><dt>Location</dt><dd>{{ locations.find(row => row.id === asset?.locationId)?.name || '—' }}</dd></div><div><dt>Created</dt><dd>{{ formatDate(asset.createdAt) }}</dd></div><div><dt>Updated</dt><dd>{{ formatDate(asset.updatedAt) }}</dd></div><div v-if="asset.archivedAt"><dt>Archived</dt><dd>{{ formatDate(asset.archivedAt) }}</dd></div></dl><h3 class="mt-4 font-semibold">Notes</h3><p class="prewrap">{{ asset.notes || 'No notes.' }}</p></section>
    <section class="panel"><div class="section-heading"><h2 class="text-lg font-semibold">Hardware</h2><UButton size="sm" icon="i-lucide-plus" @click="editingComponent = 'new'">Add component</UButton></div><div v-if="asset.components.length" class="table-scroll"><table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Model</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr v-for="row in asset.components" :key="row.id"><td>{{ row.name }}</td><td>{{ componentTypes.find(type => type.id === row.componentTypeId)?.name || '—' }}</td><td>{{ [row.manufacturer, row.model].filter(Boolean).join(' ') || '—' }}</td><td>{{ row.quantity }}</td><td><UBadge variant="subtle">{{ row.status }}</UBadge></td><td><div class="actions"><UButton size="xs" variant="outline" @click="editingComponent = row">Edit</UButton><UButton size="xs" variant="outline" @click="moveToSpare(row)">Move to spare</UButton><UButton size="xs" color="error" variant="outline" @click="removeComponent(row)">Delete</UButton></div></td></tr></tbody></table></div><p v-else class="muted">No installed components.</p></section>
    <section v-if="editingComponent" class="panel"><h2 class="mb-4 text-lg font-semibold">{{ editingComponent === 'new' ? 'Add component' : `Edit ${editingComponent.name}` }}</h2><ComponentForm :key="editingComponent === 'new' ? 'new' : editingComponent.id" :component="editingComponent === 'new' ? undefined : editingComponent" :default-asset-id="asset.id" :types="componentTypes" :assets="assets" :locations="locations" :on-save="saveComponent" :on-cancel="() => editingComponent = null" /></section>
    <AssetRackPlacement :asset="asset" @refresh="refresh" />
    <DeviceImageManager :asset="asset" />
    <AssetNetwork :asset="asset" :assets="assets" @refresh="refresh" />
    <AssetRelationships :asset="asset" :assets="assets" @refresh="refresh" />
    <section class="panel"><h2 class="mb-4 text-lg font-semibold">Projects</h2><div v-if="associatedProjects.length" class="chip-list"><NuxtLink v-for="project in associatedProjects" :key="project.id" class="chip" :to="`/projects/${project.id}`">{{ project.name }}<small>{{ project.status.replaceAll('_', ' ') }}</small></NuxtLink></div><p v-else class="muted">No projects linked to this asset.</p></section>
  </template>
  <UAlert v-else color="error" :title="error || 'Asset not found.'" />
</template>
