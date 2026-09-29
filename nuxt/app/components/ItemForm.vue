<script setup lang="ts">
import { itemStatuses, type CreateProjectItem, type ItemStatus, type ItemType, type ProjectItem, type UpdateProjectItem } from '../../types/api'
const props = defineProps<{ item?: ProjectItem; onSave: (input: CreateProjectItem | UpdateProjectItem) => Promise<void>; onCancel: () => void }>()
const localDateTime = (value: string | null | undefined) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
const form = reactive({
  type: (props.item?.type || 'work') as ItemType, title: props.item?.title || '', description: props.item?.description || '',
  status: (props.item?.status || 'planned') as ItemStatus, targetDate: props.item?.targetDate || '', vendor: props.item?.vendor || '',
  url: props.item?.url || '', estimatedCost: props.item?.estimatedCost?.toString() || '', actualCost: props.item?.actualCost?.toString() || '',
  shippingCost: props.item?.shippingCost?.toString() || '', orderedAt: localDateTime(props.item?.orderedAt), receivedAt: localDateTime(props.item?.receivedAt),
  completedAt: localDateTime(props.item?.completedAt), sortOrder: String(props.item?.sortOrder ?? 0), notes: props.item?.notes || '',
})
const busy = ref(false)
const error = ref<string | null>(null)
const typeOptions = [{ label: 'Work', value: 'work' }, { label: 'Purchase', value: 'purchase' }]
const statusOptions = itemStatuses.map(value => ({ label: value.replaceAll('_', ' '), value }))
const optional = (value: string) => value.trim() || null
const amount = (value: string) => value.trim() ? Number(value) : null
const iso = (value: string) => value ? new Date(value).toISOString() : null
async function submit() {
  if (!form.title.trim()) { error.value = 'Title is required.'; return }
  busy.value = true; error.value = null
  try {
    const purchase = form.type === 'purchase'
    await props.onSave({ type: form.type, title: form.title.trim(), description: optional(form.description), status: form.status, targetDate: optional(form.targetDate), vendor: purchase ? optional(form.vendor) : null, url: purchase ? optional(form.url) : null, estimatedCost: purchase ? amount(form.estimatedCost) : null, actualCost: purchase ? amount(form.actualCost) : null, shippingCost: purchase ? amount(form.shippingCost) : null, orderedAt: purchase ? iso(form.orderedAt) : null, receivedAt: purchase ? iso(form.receivedAt) : null, completedAt: iso(form.completedAt), notes: optional(form.notes), sortOrder: Number(form.sortOrder) })
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save item.' }
  finally { busy.value = false }
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit"><UAlert v-if="error" color="error" :title="error" class="full" />
    <UFormField label="Type"><USelect v-model="form.type" :items="typeOptions" class="w-full" /></UFormField>
    <UFormField label="Title" required><UInput v-model="form.title" required class="w-full" /></UFormField>
    <UFormField label="Status"><USelect v-model="form.status" :items="statusOptions" class="w-full" /></UFormField>
    <UFormField label="Target date"><UInput v-model="form.targetDate" type="date" class="w-full" /></UFormField>
    <UFormField label="Sort order"><UInput v-model="form.sortOrder" type="number" step="0.01" class="w-full" /></UFormField>
    <UFormField label="Description"><UTextarea v-model="form.description" :rows="3" class="w-full" /></UFormField>
    <template v-if="form.type === 'purchase'"><UFormField label="Vendor"><UInput v-model="form.vendor" class="w-full" /></UFormField><UFormField label="URL"><UInput v-model="form.url" type="url" class="w-full" /></UFormField><UFormField label="Estimated cost"><UInput v-model="form.estimatedCost" type="number" min="0" step="0.01" class="w-full" /></UFormField><UFormField label="Actual cost"><UInput v-model="form.actualCost" type="number" min="0" step="0.01" class="w-full" /></UFormField><UFormField label="Shipping cost"><UInput v-model="form.shippingCost" type="number" min="0" step="0.01" class="w-full" /></UFormField><UFormField label="Ordered at"><UInput v-model="form.orderedAt" type="datetime-local" class="w-full" /></UFormField><UFormField label="Received at"><UInput v-model="form.receivedAt" type="datetime-local" class="w-full" /></UFormField></template>
    <UFormField label="Completed at"><UInput v-model="form.completedAt" type="datetime-local" class="w-full" /></UFormField>
    <UFormField label="Notes"><UTextarea v-model="form.notes" :rows="3" class="w-full" /></UFormField>
    <div class="form-actions full"><UButton variant="outline" color="neutral" type="button" @click="onCancel">Cancel</UButton><UButton type="submit" :loading="busy">Save item</UButton></div>
  </form>
</template>
