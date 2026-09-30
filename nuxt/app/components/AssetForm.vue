<script setup lang="ts">
import type { Asset, AssetType, CreateAsset, Location, UpdateAsset, EditableAssetStatus, CatalogDeviceSummary } from '../../types/api'
import { api } from '../../services/api'
import { assetStatuses } from '../../types/api'

const props = defineProps<{ asset?: Asset; types: AssetType[]; locations: Location[]; onSave: (input: CreateAsset | UpdateAsset) => Promise<void>; onCancel: () => void }>()
const noSelection = '__none__'
const form = reactive({
  name: props.asset?.name || '', assetTypeId: props.asset?.assetTypeId || props.types[0]?.id || '',
  status: (props.asset?.status === 'archived' ? 'active' : props.asset?.status || 'active') as EditableAssetStatus,
  locationId: props.asset?.locationId || noSelection, hostname: props.asset?.hostname || '', ipAddress: props.asset?.ipAddress || '',
  manufacturer: props.asset?.manufacturer || '', model: props.asset?.model || '', serialNumber: props.asset?.serialNumber || '', rackUnits: props.asset?.rackUnits ?? 1, notes: props.asset?.notes || '',
})
const busy = ref(false)
const error = ref<string | null>(null)
const libraryQuery = ref('')
const catalogResults = ref<CatalogDeviceSummary[]>([])
const catalogManufacturers = ref<{ name: string; deviceCount: number }[]>([])
const allManufacturers = '__all__'
const catalogManufacturer = ref(allManufacturers)
const catalogSearchTerm = ref('')
const selectedCatalogId = ref('')
let catalogSearchTimer: ReturnType<typeof setTimeout> | undefined
const libraryBusy = ref(false)
const catalogId = ref<string | null>(props.asset?.deviceTypePath || null)
const catalogSource = ref<Record<string, unknown> | null>(props.asset?.deviceTypeData || null)
const selectedCatalog = ref<{ manufacturer: string; model: string; uHeight: number | null; isFullDepth: boolean | null; frontImageAvailable: boolean; rearImageAvailable: boolean; interfaces: unknown[]; consolePorts: unknown[]; powerPorts: unknown[] } | null>(null)
const creationMode = ref<'custom' | 'catalog'>('custom')
const typeOptions = computed(() => props.types.map(type => ({ label: type.name, value: type.id })))
const locationOptions = computed(() => [{ label: 'No location', value: noSelection }, ...props.locations.map(location => ({ label: location.name, value: location.id }))])
const statusOptions = assetStatuses.map(value => ({ label: value, value }))
const manufacturerOptions = computed(() => [{ label: 'All manufacturers', name: allManufacturers, description: 'Search across all manufacturers' }, ...catalogManufacturers.value.map(item => ({ label: item.name, name: item.name, description: `${item.deviceCount} device types` }))])
const deviceOptions = computed(() => catalogResults.value.map(item => ({ label: `${item.manufacturer} ${item.model}`, id: item.id, description: `${item.uHeight ?? '?'}U${item.partNumber ? ` · ${item.partNumber}` : ''}` })))
async function openCatalog() { creationMode.value = 'catalog'; if (!catalogManufacturers.value.length) { try { catalogManufacturers.value = await api.catalog.manufacturers() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Device catalog unavailable. You can still create a custom asset.' } } }
async function searchLibrary() { if (libraryQuery.value.trim().length < 2 && catalogManufacturer.value === allManufacturers) return; libraryBusy.value = true; error.value = null; try { catalogResults.value = await api.catalog.search({ q: libraryQuery.value || undefined, manufacturer: catalogManufacturer.value === allManufacturers ? undefined : catalogManufacturer.value }) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Device catalog unavailable. You can still create a custom asset.' } finally { libraryBusy.value = false } }
function queueCatalogSearch(term: string) { libraryQuery.value = term; if (catalogSearchTimer) clearTimeout(catalogSearchTimer); if (term.trim().length < 2 && catalogManufacturer.value === allManufacturers) { catalogResults.value = []; return } catalogSearchTimer = setTimeout(() => { void searchLibrary() }, 250) }
async function selectLibrary(id: string) { if (!id) return; libraryBusy.value = true; error.value = null; try { const preview = await api.catalog.get(id); form.manufacturer = preview.manufacturer; form.model = preview.model; form.rackUnits = preview.uHeight ?? 1; catalogId.value = preview.id; catalogSource.value = { sourceRevision: preview.sourceRevision }; selectedCatalog.value = preview; if (!form.name.trim()) form.name = `${preview.manufacturer} ${preview.model}` } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load that catalog device.' } finally { libraryBusy.value = false } }
watch(catalogManufacturer, () => { if (catalogSearchTerm.value.trim().length >= 2 || catalogManufacturer.value !== allManufacturers) void searchLibrary() })
watch(selectedCatalogId, id => { if (id) void selectLibrary(id) })
onBeforeUnmount(() => { if (catalogSearchTimer) clearTimeout(catalogSearchTimer) })
async function submit() {
  if (!form.name.trim() || !form.assetTypeId) { error.value = 'Name and asset type are required.'; return }
  busy.value = true; error.value = null
  const fields = { name: form.name.trim(), assetTypeId: form.assetTypeId, status: form.status, locationId: form.locationId === noSelection ? null : form.locationId, hostname: form.hostname.trim(), ipAddress: form.ipAddress.trim(), manufacturer: form.manufacturer.trim(), model: form.model.trim(), serialNumber: form.serialNumber.trim(), rackUnits: Number(form.rackUnits), ...(catalogId.value ? { deviceTypeSource: 'netbox-device-type-library', deviceTypePath: catalogId.value, deviceTypeData: catalogSource.value || {}, catalogProvider: 'netbox-device-type-library', catalogDeviceId: catalogId.value, catalogRevision: String(catalogSource.value?.sourceRevision || '') } : {}), notes: form.notes.trim() }
  const input: CreateAsset | UpdateAsset = props.asset ? { ...fields, hostname: fields.hostname || null, ipAddress: fields.ipAddress || null, manufacturer: fields.manufacturer || null, model: fields.model || null, serialNumber: fields.serialNumber || null, notes: fields.notes || null } : { ...fields, hostname: fields.hostname || undefined, ipAddress: fields.ipAddress || undefined, manufacturer: fields.manufacturer || undefined, model: fields.model || undefined, serialNumber: fields.serialNumber || undefined, notes: fields.notes || undefined }
  try { await props.onSave(input) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save asset.' } finally { busy.value = false }
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <UAlert v-if="error" color="error" :title="error" class="full" />
    <section v-if="!props.asset" class="full panel"><h3 class="mb-2 font-semibold">How would you like to create it?</h3><div class="inline mb-3"><UButton type="button" :variant="creationMode === 'catalog' ? 'solid' : 'outline'" @click="openCatalog">From Device Catalog</UButton><UButton type="button" :variant="creationMode === 'custom' ? 'solid' : 'outline'" @click="creationMode = 'custom'">Custom Asset</UButton></div><template v-if="creationMode === 'catalog'"><p class="muted mb-3">Type to filter manufacturers and device models.</p><div class="form-grid"><UInputMenu v-model="catalogManufacturer" :items="manufacturerOptions" value-key="name" label-key="label" description-key="description" placeholder="All manufacturers" class="w-full" /><UInputMenu v-model="selectedCatalogId" v-model:search-term="catalogSearchTerm" :items="deviceOptions" value-key="id" label-key="label" description-key="description" placeholder="Type a model or part number" :loading="libraryBusy" :ignore-filter="false" class="w-full" @update:search-term="queueCatalogSearch" /></div><p v-if="!catalogManufacturers.length && error" class="muted mt-2">{{ error }}</p><p v-else-if="catalogSearchTerm.trim().length >= 2 && !catalogResults.length && !libraryBusy" class="muted mt-2">No matching device types found.</p></template></section>
    <section v-if="selectedCatalog" class="full panel"><h3 class="font-semibold">{{ selectedCatalog.manufacturer }} {{ selectedCatalog.model }}</h3><p class="muted">Height: {{ selectedCatalog.uHeight ?? '?' }}U · Full depth: {{ selectedCatalog.isFullDepth == null ? 'Unknown' : selectedCatalog.isFullDepth ? 'Yes' : 'No' }} · Front image: {{ selectedCatalog.frontImageAvailable ? 'Yes' : 'No' }} · Rear image: {{ selectedCatalog.rearImageAvailable ? 'Yes' : 'No' }}</p><p class="muted">Templates: {{ selectedCatalog.interfaces.length }} interfaces · {{ selectedCatalog.consolePorts.length }} console ports · {{ selectedCatalog.powerPorts.length }} power ports</p></section>
    <UFormField label="Name" required><UInput v-model="form.name" required class="w-full" /></UFormField>
    <UFormField label="Asset type" required><USelect v-model="form.assetTypeId" :items="typeOptions" class="w-full" /></UFormField>
    <UFormField label="Status"><USelect v-model="form.status" :items="statusOptions" class="w-full" /></UFormField>
    <UFormField label="Location"><USelect v-model="form.locationId" :items="locationOptions" class="w-full" /></UFormField>
    <UFormField label="Hostname"><UInput v-model="form.hostname" class="w-full" /></UFormField>
    <UFormField label="Legacy IP address"><UInput v-model="form.ipAddress" placeholder="IPv4 or IPv6" class="w-full" /></UFormField>
    <UFormField label="Manufacturer"><UInput v-model="form.manufacturer" class="w-full" /></UFormField>
    <UFormField label="Model"><UInput v-model="form.model" class="w-full" /></UFormField>
    <UFormField label="Serial number"><UInput v-model="form.serialNumber" class="w-full" /></UFormField>
    <UFormField label="Device height (U)" help="Used for every rack placement of this asset; 0U is valid for child devices"><UInput v-model="form.rackUnits" type="number" min="0" max="100" step="0.5" required class="w-full" /></UFormField>
    <UFormField label="Notes"><UTextarea v-model="form.notes" :rows="3" class="w-full" /></UFormField>
    <div class="form-actions full"><UButton variant="outline" color="neutral" type="button" @click="onCancel">Cancel</UButton><UButton type="submit" :loading="busy" :disabled="!types.length">Save asset</UButton></div>
  </form>
</template>
