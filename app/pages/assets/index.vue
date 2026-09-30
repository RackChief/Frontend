<script setup lang="ts">
import { api } from '../../../services/api'
import { assetStatuses, type Asset, type AssetType, type CreateAsset, type Location, type UpdateAsset } from '../../../types/api'

const assets = ref<Asset[]>([])
const types = ref<AssetType[]>([])
const locations = ref<Location[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const creating = ref(false)
const search = ref('')
const status = ref('all')
const typeId = ref('all')
const locationId = ref('all')
const visible = computed(() => assets.value.filter(asset => (status.value === 'all' || asset.status === status.value) && (typeId.value === 'all' || asset.assetTypeId === typeId.value) && (locationId.value === 'all' || (locationId.value === 'none' ? !asset.locationId : asset.locationId === locationId.value)) && [asset.name, asset.hostname, asset.manufacturer, asset.model, asset.serialNumber].some(value => value?.toLowerCase().includes(search.value.toLowerCase()))))
const statusOptions = [{ label: 'All', value: 'all' }, ...[...assetStatuses, 'archived'].map(value => ({ label: value, value }))]
const typeOptions = computed(() => [{ label: 'All', value: 'all' }, ...types.value.map(type => ({ label: type.name, value: type.id }))])
const locationOptions = computed(() => [{ label: 'All', value: 'all' }, { label: 'Unassigned', value: 'none' }, ...locations.value.map(place => ({ label: place.name, value: place.id }))])
onMounted(async () => { try { [assets.value, types.value, locations.value] = await Promise.all([api.assets.list(), api.assetTypes.list(), api.locations.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load assets.' } finally { loading.value = false } })
async function create(input: CreateAsset | UpdateAsset) { const asset = await api.assets.create(input as CreateAsset); await navigateTo(`/assets/${asset.id}`) }
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">Inventory</p><h1>Assets</h1><p class="muted">Hardware, services, and everything in your lab.</p></div><UButton icon="i-lucide-plus" @click="creating = !creating">New asset</UButton></div>
  <UAlert v-if="error" color="error" :title="error" class="mb-4" />
  <section v-if="creating" class="panel"><h2 class="mb-4 text-lg font-semibold">Create asset</h2><AssetForm v-if="types.length" :types="types" :locations="locations" :on-save="create" :on-cancel="() => creating = false" /><p v-else class="empty">No asset types are available.</p></section>
  <section class="panel"><div class="filter-row"><UFormField label="Search assets"><UInput v-model="search" type="search" placeholder="Name, host, model, serial" class="w-full" /></UFormField><UFormField label="Status"><USelect v-model="status" :items="statusOptions" class="w-full" /></UFormField><UFormField label="Type"><USelect v-model="typeId" :items="typeOptions" class="w-full" /></UFormField><UFormField label="Location"><USelect v-model="locationId" :items="locationOptions" class="w-full" /></UFormField></div></section>
  <UCard v-if="loading"><div role="status">Loading assets…</div></UCard>
  <section v-else class="panel table-scroll"><table v-if="visible.length" class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Hostname</th><th>IP address</th><th>Location</th><th>Manufacturer / model</th><th>Status</th></tr></thead><tbody><tr v-for="asset in visible" :key="asset.id"><td><NuxtLink class="row-link" :to="`/assets/${asset.id}`">{{ asset.name }}</NuxtLink></td><td>{{ asset.assetType.name }}</td><td>{{ asset.hostname || '—' }}</td><td>{{ asset.ipAddress || '—' }}</td><td>{{ locations.find(row => row.id === asset.locationId)?.name || '—' }}</td><td>{{ [asset.manufacturer, asset.model].filter(Boolean).join(' ') || '—' }}</td><td><UBadge :color="asset.status === 'active' ? 'success' : asset.status === 'archived' ? 'neutral' : 'primary'" variant="subtle">{{ asset.status }}</UBadge></td></tr></tbody></table><p v-else class="empty">{{ assets.length ? 'No assets match your filters.' : 'No assets yet. Create one to start your inventory.' }}</p></section>
</template>
