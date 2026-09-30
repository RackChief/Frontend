<script setup lang="ts">
import { componentStatuses, type Asset, type Component, type ComponentFields, type ComponentStatus, type ComponentType, type Location } from '../../types/api'
const props = defineProps<{ component?: Component; types: ComponentType[]; assets: Asset[]; locations: Location[]; defaultAssetId?: string; onSave: (input: ComponentFields) => Promise<void>; onCancel: () => void }>()
const noSelection = '__none__'
const localDate = (value: string | null | undefined) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
type AttributeRow = { key: string; value: string; original?: unknown; originalText?: string }
const form = reactive({
  name: props.component?.name || '', componentTypeId: props.component?.componentTypeId || props.types[0]?.id || '',
  assetId: props.component?.assetId || props.defaultAssetId || noSelection, locationId: props.component?.locationId || noSelection,
  status: (props.component?.status || (props.defaultAssetId ? 'installed' : 'spare')) as ComponentStatus,
  quantity: props.component?.quantity || 1, manufacturer: props.component?.manufacturer || '', model: props.component?.model || '',
  partNumber: props.component?.partNumber || '', serialNumber: props.component?.serialNumber || '',
  storageLocation: props.component?.storageLocation || '', installedAt: localDate(props.component?.installedAt),
  removedAt: localDate(props.component?.removedAt), notes: props.component?.notes || '',
})
const attributes = ref<AttributeRow[]>(Object.entries(props.component?.attributes || {}).map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value), original: value, originalText: typeof value === 'string' ? value : JSON.stringify(value) })))
const typeOptions = computed(() => props.types.map(type => ({ label: type.name, value: type.id })))
const assetOptions = computed(() => [{ label: 'Unassigned / spare', value: noSelection }, ...props.assets.map(asset => ({ label: asset.name, value: asset.id }))])
const locationOptions = computed(() => [{ label: 'No location', value: noSelection }, ...props.locations.map(location => ({ label: location.name, value: location.id }))])
const statusOptions = componentStatuses.map(value => ({ label: value, value }))
const busy = ref(false)
const error = ref<string | null>(null)
const optional = (value: string) => value.trim() || null
function changeAsset(value: string) { form.assetId = value; form.status = value === noSelection ? 'spare' : 'installed' }
async function submit() {
  busy.value = true; error.value = null
  try {
    const entries = attributes.value.filter(row => row.key.trim()).map(row => [row.key.trim(), row.originalText === row.value ? row.original : row.value] as const)
    if (new Set(entries.map(row => row[0])).size !== entries.length) throw new Error('Attribute names must be unique.')
    await props.onSave({ name: form.name.trim(), componentTypeId: form.componentTypeId, assetId: form.assetId === noSelection ? null : form.assetId, locationId: form.locationId === noSelection ? null : form.locationId, status: form.status, quantity: Number(form.quantity), manufacturer: optional(form.manufacturer), model: optional(form.model), partNumber: optional(form.partNumber), serialNumber: optional(form.serialNumber), storageLocation: optional(form.storageLocation), installedAt: form.installedAt ? new Date(form.installedAt).toISOString() : null, removedAt: form.removedAt ? new Date(form.removedAt).toISOString() : null, notes: optional(form.notes), attributes: Object.fromEntries(entries) })
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save component.' }
  finally { busy.value = false }
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit"><UAlert v-if="error" color="error" :title="error" class="full" />
    <UFormField label="Name (optional)" help="Leave blank to use the component type."><UInput v-model="form.name" :placeholder="types.find(type => type.id === form.componentTypeId)?.name || 'Component type'" class="w-full" /></UFormField>
    <UFormField label="Component type" required><USelect v-model="form.componentTypeId" :items="typeOptions" class="w-full" /></UFormField>
    <UFormField label="Installed in asset"><USelect :model-value="form.assetId" :items="assetOptions" class="w-full" @update:model-value="changeAsset" /></UFormField>
    <UFormField label="Status"><USelect v-model="form.status" :items="statusOptions" class="w-full" /></UFormField>
    <UFormField label="Location"><USelect v-model="form.locationId" :items="locationOptions" class="w-full" /></UFormField>
    <UFormField label="Storage spot"><UInput v-model="form.storageLocation" placeholder="Shelf or drawer" class="w-full" /></UFormField>
    <UFormField label="Quantity" required><UInput v-model="form.quantity" type="number" min="1" step="1" class="w-full" /></UFormField>
    <UFormField label="Manufacturer"><UInput v-model="form.manufacturer" class="w-full" /></UFormField>
    <UFormField label="Model"><UInput v-model="form.model" class="w-full" /></UFormField>
    <UFormField label="Part number"><UInput v-model="form.partNumber" class="w-full" /></UFormField>
    <UFormField label="Serial number"><UInput v-model="form.serialNumber" class="w-full" /></UFormField>
    <UFormField label="Installed at"><UInput v-model="form.installedAt" type="datetime-local" class="w-full" /></UFormField>
    <UFormField label="Removed at"><UInput v-model="form.removedAt" type="datetime-local" class="w-full" /></UFormField>
    <UFormField label="Notes"><UTextarea v-model="form.notes" :rows="3" class="w-full" /></UFormField>
    <div class="full"><h3 class="font-semibold mb-2">Additional attributes</h3><p class="muted mb-2">Store custom details as names and values.</p><div v-for="(row, index) in attributes" :key="index" class="attribute-row"><UInput v-model="row.key" :aria-label="`Attribute ${index + 1} name`" placeholder="Name" /><UInput v-model="row.value" :aria-label="`Attribute ${index + 1} value`" placeholder="Value" /><UButton type="button" size="xs" variant="outline" color="neutral" @click="attributes.splice(index, 1)">Remove</UButton></div><UButton type="button" size="xs" variant="outline" @click="attributes.push({ key: '', value: '' })">Add attribute</UButton></div>
    <div class="form-actions full"><UButton type="button" variant="outline" color="neutral" @click="onCancel">Cancel</UButton><UButton type="submit" :loading="busy" :disabled="!types.length">{{ component ? 'Save component' : 'Create component' }}</UButton></div>
  </form>
</template>
