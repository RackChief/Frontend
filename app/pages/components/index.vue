<script setup lang="ts">
import { api } from '../../../services/api'
import { componentStatuses, type Asset, type Component, type ComponentFields, type ComponentType, type Location } from '../../../types/api'
const components = ref<Component[]>([])
const types = ref<ComponentType[]>([])
const assets = ref<Asset[]>([])
const locations = ref<Location[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const editing = ref<Component | 'new' | null>(null)
const search = ref('')
const status = ref('all')
const typeId = ref('all')
const assetId = ref('all')
const locationId = ref('all')
const visible = computed(() => components.value.filter(component => (status.value === 'all' || (status.value === 'unassigned' ? !component.assetId : component.status === status.value)) && (typeId.value === 'all' || component.componentTypeId === typeId.value) && (assetId.value === 'all' || component.assetId === assetId.value) && (locationId.value === 'all' || component.locationId === locationId.value) && [component.name, component.manufacturer, component.model, component.partNumber, component.serialNumber, types.value.find(type => type.id === component.componentTypeId)?.name, assets.value.find(asset => asset.id === component.assetId)?.name].some(value => value?.toLowerCase().includes(search.value.toLowerCase()))))
const statusOptions = [{ label: 'All', value: 'all' }, { label: 'Unassigned', value: 'unassigned' }, ...componentStatuses.map(value => ({ label: value, value }))]
const typeOptions = computed(() => [{ label: 'All', value: 'all' }, ...types.value.map(type => ({ label: type.name, value: type.id }))])
const assetOptions = computed(() => [{ label: 'All', value: 'all' }, ...assets.value.map(asset => ({ label: asset.name, value: asset.id }))])
const locationOptions = computed(() => [{ label: 'All', value: 'all' }, ...locations.value.map(location => ({ label: location.name, value: location.id }))])
onMounted(async () => { try { [components.value, types.value, assets.value, locations.value] = await Promise.all([api.components.list(), api.componentTypes.list(), api.assets.list(), api.locations.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load components.' } finally { loading.value = false } })
async function save(input: ComponentFields) { const row = editing.value === 'new' ? await api.components.create(input) : await api.components.update((editing.value as Component).id, input); components.value = editing.value === 'new' ? [row, ...components.value] : components.value.map(item => item.id === row.id ? row : item); editing.value = null }
async function remove(component: Component) { if (!window.confirm(`Permanently delete “${component.name}”?`)) return; error.value = null; try { await api.components.delete(component.id); components.value = components.value.filter(row => row.id !== component.id) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not delete component.' } }
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">Inventory</p><h1>Components</h1><p class="muted">Installed hardware and spare parts.</p></div><UButton icon="i-lucide-plus" @click="editing = 'new'">New component</UButton></div>
  <UAlert v-if="error" color="error" :title="error" class="mb-4" />
  <section v-if="editing" class="panel"><h2 class="mb-4 text-lg font-semibold">{{ editing === 'new' ? 'Create component' : `Edit ${editing.name}` }}</h2><ComponentForm v-if="types.length" :key="editing === 'new' ? 'new' : editing.id" :component="editing === 'new' ? undefined : editing" :types="types" :assets="assets" :locations="locations" :on-save="save" :on-cancel="() => editing = null" /><p v-else class="empty">No component types are available.</p></section>
  <section class="panel"><div class="filter-row"><UFormField label="Search components"><UInput v-model="search" type="search" placeholder="Name, model, serial or asset" class="w-full" /></UFormField><UFormField label="Status"><USelect v-model="status" :items="statusOptions" class="w-full" /></UFormField><UFormField label="Type"><USelect v-model="typeId" :items="typeOptions" class="w-full" /></UFormField><UFormField label="Asset"><USelect v-model="assetId" :items="assetOptions" class="w-full" /></UFormField><UFormField label="Location"><USelect v-model="locationId" :items="locationOptions" class="w-full" /></UFormField></div></section>
  <UCard v-if="loading"><div role="status">Loading components…</div></UCard>
  <section v-else class="panel table-scroll"><table v-if="visible.length" class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Asset</th><th>Manufacturer / model</th><th>Quantity</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead><tbody><tr v-for="component in visible" :key="component.id"><td><strong>{{ component.name }}</strong><div v-if="component.serialNumber" class="muted text-sm">S/N {{ component.serialNumber }}</div></td><td>{{ types.find(type => type.id === component.componentTypeId)?.name || '—' }}</td><td><NuxtLink v-if="component.assetId" :to="`/assets/${component.assetId}`">{{ assets.find(asset => asset.id === component.assetId)?.name || 'Unknown asset' }}</NuxtLink><span v-else>Spare / unassigned</span></td><td>{{ [component.manufacturer, component.model].filter(Boolean).join(' ') || '—' }}</td><td>{{ component.quantity }}</td><td><UBadge variant="subtle">{{ component.status }}</UBadge></td><td>{{ locations.find(location => location.id === component.locationId)?.name || component.storageLocation || '—' }}</td><td><div class="actions"><UButton size="xs" variant="outline" @click="editing = component">Edit</UButton><UButton size="xs" color="error" variant="outline" @click="remove(component)">Delete</UButton></div></td></tr></tbody></table><p v-else class="empty">{{ components.length ? 'No components match your filters.' : 'No components yet. Add installed hardware or a spare.' }}</p></section>
</template>
