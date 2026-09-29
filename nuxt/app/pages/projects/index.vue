<script setup lang="ts">
import { api } from '../../../services/api'
import { priorities, projectStatuses, type Asset, type CreateProject, type ProjectSummary, type UpdateProject } from '../../../types/api'
const projects = ref<ProjectSummary[]>([])
const assets = ref<Asset[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const status = ref('all')
const priority = ref('all')
const visible = computed(() => projects.value.filter(project => (status.value === 'all' || project.status === status.value) && (priority.value === 'all' || project.priority === priority.value) && [project.name, project.description, ...project.assets.map(asset => asset.name)].some(value => value?.toLowerCase().includes(search.value.toLowerCase()))))
const statusOptions = [{ label: 'All', value: 'all' }, ...[...projectStatuses, 'archived'].map(value => ({ label: value.replaceAll('_', ' '), value }))]
const priorityOptions = [{ label: 'All', value: 'all' }, ...priorities.map(value => ({ label: value, value }))]
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : '—'
const formatMoney = (value: number | null) => value == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
onMounted(async () => { try { [projects.value, assets.value] = await Promise.all([api.projects.list(), api.assets.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load projects.' } finally { loading.value = false } })
async function create(input: CreateProject | UpdateProject) { const project = await api.projects.create(input as CreateProject); await navigateTo(`/projects/${project.id}`) }
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">Planning</p><h1>Projects</h1><p class="muted">Track work, purchases, and the assets they affect.</p></div><UButton icon="i-lucide-plus" @click="creating = !creating">New project</UButton></div>
  <UAlert v-if="error" color="error" :title="error" class="mb-4" />
  <section v-if="creating" class="panel"><h2 class="mb-4 text-lg font-semibold">Create project</h2><ProjectForm :assets="assets" :on-save="create" :on-cancel="() => creating = false" /></section>
  <section class="panel"><div class="filter-row"><UFormField label="Search projects"><UInput v-model="search" type="search" placeholder="Name, description, asset" class="w-full" /></UFormField><UFormField label="Status"><USelect v-model="status" :items="statusOptions" class="w-full" /></UFormField><UFormField label="Priority"><USelect v-model="priority" :items="priorityOptions" class="w-full" /></UFormField></div></section>
  <UCard v-if="loading"><div role="status">Loading projects…</div></UCard>
  <section v-else class="panel table-scroll"><table v-if="visible.length" class="data-table"><thead><tr><th>Name</th><th>Status</th><th>Priority</th><th>Target</th><th>Estimated</th><th>Assets</th></tr></thead><tbody><tr v-for="project in visible" :key="project.id"><td><NuxtLink class="row-link" :to="`/projects/${project.id}`">{{ project.name }}</NuxtLink><div class="muted text-sm">{{ project.description }}</div></td><td><UBadge variant="subtle">{{ project.status.replaceAll('_', ' ') }}</UBadge></td><td><UBadge variant="subtle">{{ project.priority }}</UBadge></td><td>{{ formatDate(project.targetDate) }}</td><td>{{ formatMoney(project.estimatedCost) }}</td><td>{{ project.assets.length }}</td></tr></tbody></table><p v-else class="empty">{{ projects.length ? 'No projects match your filters.' : 'No projects yet. Create one to plan your next change.' }}</p></section>
</template>
