<script setup lang="ts">
import { api } from '../../../services/api'
import type { Asset, Location, PlacementFields, RackDetail, RackFields, RackOrientation, RackPlacement } from '../../../types/api'
const noSelection = '__none__'
const route = useRoute()
const id = computed(() => String(route.params.id))
const rack = ref<RackDetail | null>(null)
const assets = ref<Asset[]>([])
const locations = ref<Location[]>([])
const view = ref<RackOrientation>('front')
const editingRack = ref(false)
const editingPlacement = ref<RackPlacement | null>(null)
const placementOpen = ref(false)
const newPlacementUnit = ref<number | null>(null)
const availabilityLoading = ref(false)
const availabilityError = ref<string | null>(null)
const placementError = ref<string | null>(null)
const placedAssetIds = ref<Set<string>>(new Set())
let availabilityRequest = 0
const rackForm = reactive({ name: '', totalUnits: 42, startingUnit: 1, locationId: noSelection, description: '', notes: '' })
const placementForm = reactive({ assetId: '', startUnit: 1, orientation: 'front' as RackOrientation, notes: '' })
const loading = ref(true)
const busy = ref(false)
const error = ref<string | null>(null)
const locationOptions = computed(() => [{ label: 'No location', value: noSelection }, ...locations.value.map(place => ({ label: place.name, value: place.id }))])
const assetOptions = computed(() => assets.value.map(asset => ({ label: asset.name, value: asset.id })))
const availableAssets = computed(() => newPlacementUnit.value === null ? [] : assets.value.filter(asset =>
  asset.status !== 'archived' && asset.rackUnits > 0 && !placedAssetIds.value.has(asset.id) && fitsBelow(newPlacementUnit.value!, asset.rackUnits)
))
const availableAssetOptions = computed(() => availableAssets.value.map(asset => ({ label: `${asset.name} · ${asset.rackUnits}U`, value: asset.id })))
const selectedAsset = computed(() => assets.value.find(asset => asset.id === placementForm.assetId))
const selectedStartUnit = computed(() => newPlacementUnit.value !== null && selectedAsset.value ? newPlacementUnit.value - Math.ceil(selectedAsset.value.rackUnits) + 1 : null)
const units = computed(() => rack.value ? Array.from({ length: rack.value.totalUnits }, (_, index) => rack.value!.startingUnit + rack.value!.totalUnits - 1 - index) : [])
const visiblePlacements = computed(() => rack.value?.placements.filter(row => row.orientation === view.value) || [])
function placementGridRow(row: RackPlacement) {
  return `${units.value[0] - row.startUnit - Math.ceil(row.heightUnits) + 2} / span ${Math.ceil(row.heightUnits)}`
}
function placementAsset(row: RackPlacement) { return assets.value.find(asset => asset.id === row.assetId) }
onMounted(async () => { try { [rack.value, assets.value, locations.value] = await Promise.all([api.racks.get(id.value), api.assets.list(), api.locations.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load rack.' } finally { loading.value = false } })
async function refresh() { rack.value = await api.racks.get(id.value) }
function openRack() { if (!rack.value) return; Object.assign(rackForm, { name: rack.value.name, totalUnits: rack.value.totalUnits, startingUnit: rack.value.startingUnit, locationId: rack.value.locationId || noSelection, description: rack.value.description || '', notes: rack.value.notes || '' }); editingRack.value = true }
function isOccupied(unit: number) { return visiblePlacements.value.some(row => row.startUnit <= unit && unit < row.startUnit + Math.ceil(row.heightUnits)) }
function fitsBelow(topUnit: number, height: number) {
  const startUnit = topUnit - Math.ceil(height) + 1
  return !!rack.value && startUnit >= rack.value.startingUnit && !visiblePlacements.value.some(row => row.startUnit <= topUnit && startUnit < row.startUnit + Math.ceil(row.heightUnits))
}
async function openEmptyUnit(unit: number) {
  if (isOccupied(unit)) return
  editingPlacement.value = null
  newPlacementUnit.value = unit
  placementError.value = null
  availabilityError.value = null
  placedAssetIds.value = new Set()
  Object.assign(placementForm, { assetId: '', startUnit: unit, orientation: view.value, notes: '' })
  placementOpen.value = true
  availabilityLoading.value = true
  const requestId = ++availabilityRequest
  try {
    const racks = await api.racks.list()
    const details = await Promise.all(racks.map(row => row.id === id.value && rack.value ? rack.value : api.racks.get(row.id)))
    if (requestId === availabilityRequest) placedAssetIds.value = new Set(details.flatMap(row => row.placements.map(placement => placement.assetId)))
  } catch (cause) {
    if (requestId === availabilityRequest) availabilityError.value = cause instanceof Error ? cause.message : 'Could not load unplaced assets.'
  } finally { if (requestId === availabilityRequest) availabilityLoading.value = false }
}
function openPlacement(row: RackPlacement) {
  availabilityRequest++
  availabilityLoading.value = false
  availabilityError.value = null
  editingPlacement.value = row
  newPlacementUnit.value = null
  placementError.value = null
  Object.assign(placementForm, { assetId: row.assetId, startUnit: row.startUnit, orientation: row.orientation, notes: row.notes || '' })
  placementOpen.value = true
}
async function saveRack() { busy.value = true; error.value = null; try { const input: RackFields = { name: rackForm.name.trim(), totalUnits: Number(rackForm.totalUnits), startingUnit: Number(rackForm.startingUnit), locationId: rackForm.locationId === noSelection ? null : rackForm.locationId, description: rackForm.description.trim() || null, notes: rackForm.notes.trim() || null }; await api.racks.update(id.value, input); await refresh(); editingRack.value = false } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not update rack.' } finally { busy.value = false } }
async function savePlacement() {
  if (!editingPlacement.value && (!placementForm.assetId || !availableAssets.value.some(asset => asset.id === placementForm.assetId) || selectedStartUnit.value === null)) return
  busy.value = true
  placementError.value = null
  try {
    const input: PlacementFields = { assetId: placementForm.assetId, startUnit: editingPlacement.value ? Number(placementForm.startUnit) : selectedStartUnit.value!, orientation: placementForm.orientation, notes: placementForm.notes.trim() || null }
    if (editingPlacement.value) await api.racks.placements.update(id.value, editingPlacement.value.id, input)
    else await api.racks.placements.create(id.value, input)
    await refresh()
    placementOpen.value = false
    editingPlacement.value = null
    view.value = input.orientation || 'front'
  } catch (cause) { placementError.value = cause instanceof Error ? cause.message : 'Could not save placement.' }
  finally { busy.value = false }
}
async function removePlacement(row: RackPlacement) { if (!window.confirm(`Remove ${row.asset.name} from this rack?`)) return; placementError.value = null; try { await api.racks.placements.delete(id.value, row.id); await refresh(); placementOpen.value = false; editingPlacement.value = null } catch (cause) { placementError.value = cause instanceof Error ? cause.message : 'Could not remove placement.' } }
async function removeRack() { if (!rack.value || !window.confirm(`Permanently delete “${rack.value.name}”?`)) return; error.value = null; try { await api.racks.delete(id.value); await navigateTo('/racks') } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not delete rack.' } }
</script>

<template>
  <NuxtLink to="/racks" class="block mb-5 text-cyan-300">← Racks</NuxtLink>
  <UCard v-if="loading"><div role="status">Loading rack…</div></UCard>
  <template v-else-if="rack"><div class="page-heading"><div><p class="eyebrow">Rack</p><h1>{{ rack.name }}</h1><p class="muted">{{ rack.totalUnits }}U · {{ locations.find(row => row.id === rack?.locationId)?.name || 'No location' }}</p></div><div class="actions"><UButton variant="outline" @click="openRack">Edit rack</UButton><UButton color="error" variant="outline" @click="removeRack">Delete rack</UButton></div></div><UAlert v-if="error" color="error" :title="error" class="mb-4" />
    <section v-if="editingRack" class="panel"><h2 class="mb-4 text-lg font-semibold">Edit rack</h2><form class="form-grid" @submit.prevent="saveRack"><UFormField label="Name" required><UInput v-model="rackForm.name" required class="w-full" /></UFormField><UFormField label="Location"><USelect v-model="rackForm.locationId" :items="locationOptions" class="w-full" /></UFormField><UFormField label="Total U"><UInput v-model="rackForm.totalUnits" type="number" min="1" max="100" class="w-full" /></UFormField><UFormField label="Starting U"><UInput v-model="rackForm.startingUnit" type="number" min="1" class="w-full" /></UFormField><UFormField label="Description"><UInput v-model="rackForm.description" class="w-full" /></UFormField><UFormField label="Notes"><UInput v-model="rackForm.notes" class="w-full" /></UFormField><div class="form-actions full"><UButton type="button" variant="outline" color="neutral" @click="editingRack = false">Cancel</UButton><UButton type="submit" :loading="busy">Save rack</UButton></div></form></section>
    <section class="panel">
      <div class="section-heading">
        <h2 class="text-lg font-semibold">Rack layout</h2>
      </div>
      <div class="actions my-4" role="group" aria-label="Rack orientation">
        <UButton :variant="view === 'front' ? 'solid' : 'outline'" :aria-pressed="view === 'front'" @click="view = 'front'">Front</UButton>
        <UButton :variant="view === 'rear' ? 'solid' : 'outline'" :aria-pressed="view === 'rear'" @click="view = 'rear'">Rear</UButton>
      </div>
      <div class="rack-layout-frame">
        <div class="rack-layout" :aria-label="`${rack.name} ${view} layout`">
          <template v-for="(unit, index) in units" :key="unit">
            <span class="rack-number" :style="{ gridRow: index + 1 }">{{ unit }}U</span>
            <button class="rack-slot" type="button" :style="{ gridRow: index + 1 }" :disabled="isOccupied(unit)" :aria-label="`Place asset with top at ${unit}U`" @click="openEmptyUnit(unit)" />
          </template>
          <div v-for="placement in visiblePlacements" :key="placement.id" class="rack-placement" :style="{ gridRow: placementGridRow(placement) }">
            <NuxtLink class="rack-placement-link" :to="`/assets/${placement.assetId}`" :aria-label="`View ${placement.asset.name}`">
              <DeviceFaceplate class="rack-faceplate" :asset-id="placement.assetId" :name="placement.asset.name" :manufacturer="placementAsset(placement)?.manufacturer" :model="placementAsset(placement)?.model" :side="view" />
              <span class="rack-placement-info">
                <strong>{{ placement.asset.name }}</strong>
                <span>{{ [placementAsset(placement)?.manufacturer, placementAsset(placement)?.model].filter(Boolean).join(' ') || `${placement.heightUnits}U asset` }}</span>
                <span>{{ placement.heightUnits }}U<span v-if="placement.notes"> · {{ placement.notes }}</span></span>
              </span>
            </NuxtLink>
            <UButton class="rack-placement-edit" size="xs" variant="solid" :aria-label="`Edit placement for ${placement.asset.name}`" @click="openPlacement(placement)">Edit</UButton>
          </div>
        </div>
      </div>
    </section>
    <UModal v-model:open="placementOpen" :title="editingPlacement ? 'Edit placement' : `Place asset at ${newPlacementUnit}U`">
      <template #body>
        <form class="rack-placement-form" @submit.prevent="savePlacement">
          <UAlert v-if="availabilityError || placementError" color="error" :title="availabilityError || placementError || ''" />
          <template v-if="!editingPlacement">
            <p class="muted">The selected asset will use this unit as its top edge on the {{ view }} of the rack.</p>
            <p v-if="availabilityLoading" role="status" class="muted">Loading unplaced assets…</p>
            <template v-else-if="!availabilityError && availableAssets.length">
              <UFormField label="Unplaced asset" required>
                <USelect v-model="placementForm.assetId" :items="availableAssetOptions" placeholder="Choose an asset" class="w-full" />
              </UFormField>
              <p v-if="selectedStartUnit !== null" class="muted">Occupies {{ selectedStartUnit }}U–{{ newPlacementUnit }}U</p>
            </template>
            <p v-else-if="!availabilityError" class="muted">No unplaced assets fit at this unit.</p>
          </template>
          <template v-else>
            <UFormField label="Asset" required><USelect v-model="placementForm.assetId" :items="assetOptions" class="w-full" /></UFormField>
            <div class="form-grid">
              <UFormField label="Orientation"><USelect v-model="placementForm.orientation" :items="[{ label: 'Front', value: 'front' }, { label: 'Rear', value: 'rear' }]" class="w-full" /></UFormField>
              <UFormField label="Starting U"><UInput v-model="placementForm.startUnit" type="number" :min="rack.startingUnit" :max="rack.startingUnit + rack.totalUnits - 1" required class="w-full" /></UFormField>
            </div>
          </template>
          <UFormField label="Notes"><UInput v-model="placementForm.notes" class="w-full" /></UFormField>
          <div class="form-actions">
            <UButton v-if="editingPlacement" type="button" color="error" variant="outline" @click="removePlacement(editingPlacement)">Remove placement</UButton>
            <UButton type="button" variant="outline" color="neutral" @click="placementOpen = false">Cancel</UButton>
            <UButton type="submit" :loading="busy" :disabled="!placementForm.assetId || (!editingPlacement && (availabilityLoading || !!availabilityError || !availableAssets.some(asset => asset.id === placementForm.assetId)))">Save placement</UButton>
          </div>
        </form>
      </template>
    </UModal>
  </template>
  <UAlert v-else color="error" :title="error || 'Rack not found.'" />
</template>
