<script setup lang="ts">
import type { Asset, AssetType, CreateAsset, Location, UpdateAsset, EditableAssetStatus } from '../../types/api'
import { assetStatuses } from '../../types/api'

const props = defineProps<{ asset?: Asset; types: AssetType[]; locations: Location[]; onSave: (input: CreateAsset | UpdateAsset) => Promise<void>; onCancel: () => void }>()
const form = reactive({
  name: props.asset?.name || '', assetTypeId: props.asset?.assetTypeId || props.types[0]?.id || '',
  status: (props.asset?.status === 'archived' ? 'active' : props.asset?.status || 'active') as EditableAssetStatus,
  locationId: props.asset?.locationId || '', hostname: props.asset?.hostname || '', ipAddress: props.asset?.ipAddress || '',
  manufacturer: props.asset?.manufacturer || '', model: props.asset?.model || '', serialNumber: props.asset?.serialNumber || '', notes: props.asset?.notes || '',
})
const busy = ref(false)
const error = ref<string | null>(null)
const typeOptions = computed(() => props.types.map(type => ({ label: type.name, value: type.id })))
const locationOptions = computed(() => [{ label: 'No location', value: '' }, ...props.locations.map(location => ({ label: location.name, value: location.id }))])
const statusOptions = assetStatuses.map(value => ({ label: value, value }))
async function submit() {
  if (!form.name.trim() || !form.assetTypeId) { error.value = 'Name and asset type are required.'; return }
  busy.value = true; error.value = null
  const fields = { name: form.name.trim(), assetTypeId: form.assetTypeId, status: form.status, locationId: form.locationId || null, hostname: form.hostname.trim(), ipAddress: form.ipAddress.trim(), manufacturer: form.manufacturer.trim(), model: form.model.trim(), serialNumber: form.serialNumber.trim(), notes: form.notes.trim() }
  const input: CreateAsset | UpdateAsset = props.asset ? { ...fields, hostname: fields.hostname || null, ipAddress: fields.ipAddress || null, manufacturer: fields.manufacturer || null, model: fields.model || null, serialNumber: fields.serialNumber || null, notes: fields.notes || null } : fields
  try { await props.onSave(input) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save asset.' } finally { busy.value = false }
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <UAlert v-if="error" color="error" :title="error" class="full" />
    <UFormField label="Name" required><UInput v-model="form.name" required class="w-full" /></UFormField>
    <UFormField label="Asset type" required><USelect v-model="form.assetTypeId" :items="typeOptions" class="w-full" /></UFormField>
    <UFormField label="Status"><USelect v-model="form.status" :items="statusOptions" class="w-full" /></UFormField>
    <UFormField label="Location"><USelect v-model="form.locationId" :items="locationOptions" class="w-full" /></UFormField>
    <UFormField label="Hostname"><UInput v-model="form.hostname" class="w-full" /></UFormField>
    <UFormField label="Legacy IP address"><UInput v-model="form.ipAddress" placeholder="IPv4 or IPv6" class="w-full" /></UFormField>
    <UFormField label="Manufacturer"><UInput v-model="form.manufacturer" class="w-full" /></UFormField>
    <UFormField label="Model"><UInput v-model="form.model" class="w-full" /></UFormField>
    <UFormField label="Serial number"><UInput v-model="form.serialNumber" class="w-full" /></UFormField>
    <UFormField label="Notes"><UTextarea v-model="form.notes" :rows="3" class="w-full" /></UFormField>
    <div class="form-actions full"><UButton variant="outline" color="neutral" type="button" @click="onCancel">Cancel</UButton><UButton type="submit" :loading="busy" :disabled="!types.length">Save asset</UButton></div>
  </form>
</template>
