<script setup lang="ts">
import { api } from '../../../services/api'
import type { Asset, Component, Location, LocationFields, Rack } from '../../../types/api'
const locations = ref<Location[]>([])
const assets = ref<Asset[]>([])
const components = ref<Component[]>([])
const racks = ref<Rack[]>([])
const editing = ref<Location | 'new' | null>(null)
const name = ref('')
const parentId = ref('')
const description = ref('')
const loading = ref(true)
const busy = ref(false)
const error = ref<string | null>(null)
const tree = computed(() => { const result: { location: Location; depth: number }[] = []; const seen = new Set<string>(); function walk(parent: string | null, depth: number) { for (const location of locations.value.filter(row => row.parentId === parent)) { if (seen.has(location.id)) continue; seen.add(location.id); result.push({ location, depth }); walk(location.id, depth + 1) } } walk(null, 0); for (const location of locations.value) if (!seen.has(location.id)) { seen.add(location.id); result.push({ location, depth: 0 }); walk(location.id, 1) } return result })
const parentOptions = computed(() => [{ label: 'Root location', value: '' }, ...locations.value.filter(row => editing.value === 'new' || row.id !== editing.value?.id).map(row => ({ label: row.name, value: row.id }))])
onMounted(async () => { try { [locations.value, assets.value, components.value, racks.value] = await Promise.all([api.locations.list(), api.assets.list(), api.components.list(), api.racks.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load locations.' } finally { loading.value = false } })
function open(row: Location | 'new', suggestedParent = '') { editing.value = row; name.value = row === 'new' ? '' : row.name; parentId.value = row === 'new' ? suggestedParent : row.parentId || ''; description.value = row === 'new' ? '' : row.description || ''; error.value = null }
async function save() { busy.value = true; error.value = null; try { const input: LocationFields = { name: name.value.trim(), parentId: parentId.value || null, description: description.value.trim() || null }; const row = editing.value === 'new' ? await api.locations.create(input) : await api.locations.update((editing.value as Location).id, input); locations.value = editing.value === 'new' ? [...locations.value, row] : locations.value.map(item => item.id === row.id ? row : item); editing.value = null } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save location.' } finally { busy.value = false } }
async function remove(row: Location) { if (!window.confirm(`Permanently delete “${row.name}”?`)) return; error.value = null; try { await api.locations.delete(row.id); locations.value = locations.value.filter(item => item.id !== row.id) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not delete location.' } }
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">Infrastructure</p><h1>Locations</h1><p class="muted">Places that hold assets and spare hardware.</p></div><UButton icon="i-lucide-plus" @click="open('new')">New location</UButton></div>
  <UAlert v-if="error" color="error" :title="error" class="mb-4" />
  <section v-if="editing" class="panel"><h2 class="mb-4 text-lg font-semibold">{{ editing === 'new' ? 'Create location' : `Edit ${editing.name}` }}</h2><form class="form-grid" @submit.prevent="save"><UFormField label="Name" required><UInput v-model="name" required class="w-full" /></UFormField><UFormField label="Parent location"><USelect v-model="parentId" :items="parentOptions" class="w-full" /></UFormField><UFormField label="Description" class="full"><UTextarea v-model="description" :rows="3" class="w-full" /></UFormField><div class="form-actions full"><UButton type="button" variant="outline" color="neutral" @click="editing = null">Cancel</UButton><UButton type="submit" :loading="busy">Save location</UButton></div></form></section>
  <UCard v-if="loading"><div role="status">Loading locations…</div></UCard>
  <section v-else class="panel table-scroll"><table v-if="tree.length" class="data-table"><thead><tr><th>Location</th><th>Description</th><th>Assets</th><th>Racks</th><th>Components</th><th>Actions</th></tr></thead><tbody><tr v-for="{ location, depth } in tree" :key="location.id"><td><span class="whitespace-nowrap" :style="{ paddingLeft: `${Math.min(depth, 6) * 22}px` }">{{ depth > 0 ? '↳ ' : '' }}{{ location.name }}</span></td><td>{{ location.description || '—' }}</td><td><template v-for="asset in assets.filter(row => row.locationId === location.id)" :key="asset.id"><NuxtLink :to="`/assets/${asset.id}`">{{ asset.name }}</NuxtLink><br /></template><span v-if="!assets.some(row => row.locationId === location.id)">—</span></td><td><template v-for="rack in racks.filter(row => row.locationId === location.id)" :key="rack.id"><NuxtLink :to="`/racks/${rack.id}`">{{ rack.name }}</NuxtLink><br /></template><span v-if="!racks.some(row => row.locationId === location.id)">—</span></td><td>{{ components.filter(row => row.locationId === location.id).map(row => row.name).join(', ') || '—' }}</td><td><div class="actions"><UButton size="xs" variant="outline" @click="open('new', location.id)">Add child</UButton><UButton size="xs" variant="outline" @click="open(location)">Edit</UButton><UButton size="xs" color="error" variant="outline" @click="remove(location)">Delete</UButton></div></td></tr></tbody></table><p v-else class="empty">No locations yet. Create a place such as Home or Server Room.</p></section>
</template>
