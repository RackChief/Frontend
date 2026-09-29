<script setup lang="ts">
import { priorities, projectStatuses, type Asset, type CreateProject, type EditableProjectStatus, type Priority, type Project, type UpdateProject } from '../../types/api'

const props = defineProps<{ project?: Project; assets: Asset[]; onSave: (input: CreateProject | UpdateProject) => Promise<void>; onCancel: () => void }>()
const form = reactive({
  name: props.project?.name || '', description: props.project?.description || '',
  status: (props.project?.status === 'archived' ? 'planned' : props.project?.status || 'idea') as EditableProjectStatus,
  priority: (props.project?.priority || 'normal') as Priority, targetDate: props.project?.targetDate || '',
  estimatedCost: props.project?.estimatedCost?.toString() || '', actualCost: props.project?.actualCost?.toString() || '',
  notes: props.project?.notes || '', assetIds: props.project?.assets.map(asset => asset.id) || [] as string[],
})
const busy = ref(false)
const error = ref<string | null>(null)
const statusOptions = projectStatuses.map(value => ({ label: value.replaceAll('_', ' '), value }))
const priorityOptions = priorities.map(value => ({ label: value, value }))
const optional = (value: string) => value.trim() || null
const amount = (value: string) => value.trim() ? Number(value) : null
function toggle(id: string) { form.assetIds = form.assetIds.includes(id) ? form.assetIds.filter(value => value !== id) : [...form.assetIds, id] }
async function submit() {
  if (!form.name.trim()) { error.value = 'Name is required.'; return }
  busy.value = true; error.value = null
  try { await props.onSave({ name: form.name.trim(), description: optional(form.description), status: form.status, priority: form.priority, targetDate: optional(form.targetDate), estimatedCost: amount(form.estimatedCost), actualCost: amount(form.actualCost), notes: optional(form.notes), assetIds: form.assetIds }) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save project.' }
  finally { busy.value = false }
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit"><UAlert v-if="error" color="error" :title="error" class="full" />
    <UFormField label="Name" required><UInput v-model="form.name" required class="w-full" /></UFormField>
    <UFormField label="Status"><USelect v-model="form.status" :items="statusOptions" class="w-full" /></UFormField>
    <UFormField label="Priority"><USelect v-model="form.priority" :items="priorityOptions" class="w-full" /></UFormField>
    <UFormField label="Target date"><UInput v-model="form.targetDate" type="date" class="w-full" /></UFormField>
    <UFormField label="Estimated cost"><UInput v-model="form.estimatedCost" type="number" min="0" step="0.01" class="w-full" /></UFormField>
    <UFormField label="Actual cost"><UInput v-model="form.actualCost" type="number" min="0" step="0.01" class="w-full" /></UFormField>
    <UFormField label="Description"><UTextarea v-model="form.description" :rows="3" class="w-full" /></UFormField>
    <UFormField label="Notes"><UTextarea v-model="form.notes" :rows="3" class="w-full" /></UFormField>
    <fieldset class="full asset-choices"><legend>Associated assets</legend><p v-if="!assets.length" class="muted">No assets available.</p><label v-for="asset in assets" :key="asset.id"><input type="checkbox" :checked="form.assetIds.includes(asset.id)" @change="toggle(asset.id)" /> <span>{{ asset.name }} <small class="muted">({{ asset.assetType.name }})</small></span></label></fieldset>
    <div class="form-actions full"><UButton variant="outline" color="neutral" type="button" @click="onCancel">Cancel</UButton><UButton type="submit" :loading="busy">Save project</UButton></div>
  </form>
</template>
