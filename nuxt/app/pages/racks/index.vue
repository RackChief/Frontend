<script setup lang="ts">
import { api } from '../../../services/api'
import type { Location, RackDetail, RackFields } from '../../../types/api'
const racks = ref<RackDetail[]>([])
const locations = ref<Location[]>([])
const loading = ref(true)
const creating = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)
const form = reactive({ name: '', totalUnits: 42, startingUnit: 1, locationId: '', description: '' })
onMounted(async () => { try { const [rows, places] = await Promise.all([api.racks.list(), api.locations.list()]); racks.value = await Promise.all(rows.map(row => api.racks.get(row.id))); locations.value = places } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load racks.' } finally { loading.value = false } })
const locationOptions = computed(() => [{ label: 'No location', value: '' }, ...locations.value.map(place => ({ label: place.name, value: place.id }))])
function usedUnits(rack: RackDetail) { const used = new Set<number>(); rack.placements.forEach(placement => { for (let unit = placement.startUnit; unit < placement.startUnit + placement.heightUnits; unit++) used.add(unit) }); return used.size }
async function create() { busy.value = true; error.value = null; try { const input: RackFields = { name: form.name.trim(), totalUnits: Number(form.totalUnits), startingUnit: Number(form.startingUnit), locationId: form.locationId || null, description: form.description.trim() || null }; const rack = await api.racks.create(input); await navigateTo(`/racks/${rack.id}`) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not create rack.' } finally { busy.value = false } }
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">Infrastructure</p><h1>Racks</h1><p class="muted">Physical rack space and installed assets.</p></div><UButton icon="i-lucide-plus" @click="creating = !creating">New rack</UButton></div>
  <UAlert v-if="error" color="error" :title="error" class="mb-4" />
  <section v-if="creating" class="panel"><h2 class="mb-4 text-lg font-semibold">Create rack</h2><form class="form-grid" @submit.prevent="create"><UFormField label="Name" required><UInput v-model="form.name" required class="w-full" /></UFormField><UFormField label="Location"><USelect v-model="form.locationId" :items="locationOptions" class="w-full" /></UFormField><UFormField label="Total U"><UInput v-model="form.totalUnits" type="number" min="1" max="100" required class="w-full" /></UFormField><UFormField label="Starting U"><UInput v-model="form.startingUnit" type="number" min="1" required class="w-full" /></UFormField><UFormField label="Description" class="full"><UTextarea v-model="form.description" :rows="2" class="w-full" /></UFormField><div class="form-actions full"><UButton type="button" variant="outline" color="neutral" @click="creating = false">Cancel</UButton><UButton type="submit" :loading="busy">Create rack</UButton></div></form></section>
  <UCard v-if="loading"><div role="status">Loading racks…</div></UCard>
  <section v-else class="panel table-scroll"><table v-if="racks.length" class="data-table"><thead><tr><th>Name</th><th>Location</th><th>Size</th><th>Used U</th><th>Available U</th></tr></thead><tbody><tr v-for="rack in racks" :key="rack.id"><td><NuxtLink class="row-link" :to="`/racks/${rack.id}`">{{ rack.name }}</NuxtLink></td><td>{{ locations.find(row => row.id === rack.locationId)?.name || '—' }}</td><td>{{ rack.totalUnits }}U</td><td>{{ usedUnits(rack) }}U</td><td>{{ rack.totalUnits - usedUnits(rack) }}U</td></tr></tbody></table><p v-else class="empty">No racks yet. Create one to track rack placement.</p></section>
</template>
