<script setup lang="ts">
import { api } from '../../../services/api'
import type { Asset, CreateProject, CreateProjectItem, Project, ProjectItem, UpdateProject, UpdateProjectItem } from '../../../types/api'
const route = useRoute()
const id = computed(() => String(route.params.id))
const project = ref<Project | null>(null)
const assets = ref<Asset[]>([])
const loading = ref(true)
const busy = ref(false)
const editing = ref(false)
const itemEditor = ref<ProjectItem | 'new' | null>(null)
const updateBody = ref('')
const error = ref<string | null>(null)
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : '—'
const formatMoney = (value: number | null) => value == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
onMounted(async () => { try { [project.value, assets.value] = await Promise.all([api.projects.get(id.value), api.assets.list()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load project.' } finally { loading.value = false } })
async function refresh() { project.value = await api.projects.get(id.value) }
async function save(input: CreateProject | UpdateProject) { await api.projects.update(id.value, input as UpdateProject); await refresh(); editing.value = false }
async function lifecycle(action: 'archive' | 'restore' | 'delete') {
  if (!project.value || (action === 'delete' && !window.confirm(`Permanently delete “${project.value.name}”? This cannot be undone.`))) return
  busy.value = true; error.value = null
  try { if (action === 'delete') { await api.projects.delete(id.value); await navigateTo('/projects') } else { await api.projects[action](id.value); await refresh() } }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Action failed.' } finally { busy.value = false }
}
async function saveItem(input: CreateProjectItem | UpdateProjectItem) {
  if (itemEditor.value && itemEditor.value !== 'new') await api.projects.items.update(id.value, itemEditor.value.id, input as UpdateProjectItem)
  else await api.projects.items.create(id.value, input as CreateProjectItem)
  await refresh(); itemEditor.value = null
}
async function deleteItem(item: ProjectItem) {
  if (!window.confirm(`Delete item “${item.title}”?`)) return
  busy.value = true; error.value = null
  try { await api.projects.items.delete(id.value, item.id); await refresh() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not delete item.' } finally { busy.value = false }
}
async function addUpdate() {
  if (!updateBody.value.trim()) { error.value = 'Update text is required.'; return }
  busy.value = true; error.value = null
  try { await api.projects.updates.create(id.value, updateBody.value.trim()); updateBody.value = ''; await refresh() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not add update.' } finally { busy.value = false }
}
async function deleteUpdate(updateId: string) {
  if (!window.confirm('Delete this project update?')) return
  busy.value = true; error.value = null
  try { await api.projects.updates.delete(id.value, updateId); await refresh() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not delete update.' } finally { busy.value = false }
}
</script>

<template>
  <NuxtLink to="/projects" class="block mb-5 text-cyan-300">← Projects</NuxtLink>
  <UCard v-if="loading"><div role="status">Loading project…</div></UCard>
  <template v-else-if="project"><div class="page-heading"><div><p class="eyebrow">Project</p><h1>{{ project.name }}</h1><div class="inline"><UBadge variant="subtle">{{ project.status.replaceAll('_', ' ') }}</UBadge><UBadge variant="subtle">{{ project.priority }}</UBadge></div></div><div class="actions"><UButton v-if="!project.archivedAt" variant="outline" @click="editing = !editing">Edit</UButton><UButton v-if="project.archivedAt" variant="outline" :loading="busy" @click="lifecycle('restore')">Restore</UButton><UButton v-if="project.archivedAt" color="error" :loading="busy" @click="lifecycle('delete')">Delete permanently</UButton><UButton v-else color="error" variant="outline" :loading="busy" @click="lifecycle('archive')">Archive</UButton></div></div>
    <UAlert v-if="error" color="error" :title="error" class="mb-4" />
    <section v-if="editing" class="panel"><h2 class="mb-4 text-lg font-semibold">Edit project</h2><ProjectForm :key="project.id" :project="project" :assets="assets" :on-save="save" :on-cancel="() => editing = false" /></section>
    <section class="panel"><h2 class="mb-4 text-lg font-semibold">Overview</h2><p class="prewrap">{{ project.description || 'No description.' }}</p><dl class="details"><div><dt>Target date</dt><dd>{{ formatDate(project.targetDate) }}</dd></div><div><dt>Estimated cost</dt><dd>{{ formatMoney(project.estimatedCost) }}</dd></div><div><dt>Actual cost</dt><dd>{{ formatMoney(project.actualCost) }}</dd></div><div><dt>Completed</dt><dd>{{ formatDate(project.completedAt) }}</dd></div><div><dt>Created</dt><dd>{{ formatDate(project.createdAt) }}</dd></div><div><dt>Updated</dt><dd>{{ formatDate(project.updatedAt) }}</dd></div><div v-if="project.archivedAt"><dt>Archived</dt><dd>{{ formatDate(project.archivedAt) }}</dd></div></dl><h3 class="mt-4 font-semibold">Notes</h3><p class="prewrap">{{ project.notes || 'No notes.' }}</p></section>
    <section class="panel"><h2 class="mb-4 text-lg font-semibold">Associated assets</h2><div v-if="project.assets.length" class="chip-list"><NuxtLink v-for="asset in project.assets" :key="asset.id" :to="`/assets/${asset.id}`" class="chip">{{ asset.name }}<small>{{ asset.assetType.name }}{{ asset.hostname ? ` · ${asset.hostname}` : '' }}</small></NuxtLink></div><p v-else class="empty">No assets associated with this project.</p></section>
    <section class="panel"><div class="section-heading"><h2 class="text-lg font-semibold">Items</h2><UButton icon="i-lucide-plus" @click="itemEditor = 'new'">Add item</UButton></div>
      <div v-if="itemEditor" class="subpanel"><h3 class="mb-4 font-semibold">{{ itemEditor === 'new' ? 'Add item' : 'Edit item' }}</h3><ItemForm :key="itemEditor === 'new' ? 'new' : itemEditor.id" :item="itemEditor === 'new' ? undefined : itemEditor" :on-save="saveItem" :on-cancel="() => itemEditor = null" /></div>
      <div v-if="project.items.length" class="table-scroll"><table class="data-table"><thead><tr><th>Item</th><th>Type</th><th>Status</th><th>Target</th><th>Cost</th><th>Actions</th></tr></thead><tbody><tr v-for="item in project.items" :key="item.id"><td><strong>{{ item.title }}</strong><div v-if="item.description" class="muted text-sm">{{ item.description }}</div><div v-if="item.type === 'purchase' && item.vendor" class="muted text-sm">Vendor: {{ item.vendor }}</div><a v-if="item.url" :href="item.url" target="_blank" rel="noreferrer">Item link ↗</a><div v-if="item.notes" class="muted text-sm">{{ item.notes }}</div></td><td>{{ item.type }}</td><td><UBadge variant="subtle">{{ item.status.replaceAll('_', ' ') }}</UBadge></td><td>{{ formatDate(item.targetDate) }}</td><td>{{ formatMoney(item.actualCost ?? item.estimatedCost) }}</td><td><div class="actions"><UButton size="xs" variant="outline" @click="itemEditor = item">Edit</UButton><UButton size="xs" color="error" variant="outline" :disabled="busy" @click="deleteItem(item)">Delete</UButton></div></td></tr></tbody></table></div><p v-else class="empty">No work or purchase items yet.</p>
    </section>
    <section class="panel"><h2 class="mb-4 text-lg font-semibold">Updates &amp; history</h2><form class="update-form" @submit.prevent="addUpdate"><UFormField label="Add update"><UTextarea v-model="updateBody" :rows="3" required placeholder="What changed?" class="w-full" /></UFormField><UButton type="submit" :loading="busy">Add update</UButton></form><div v-if="project.updates.length" class="mt-6"><div v-for="update in project.updates" :key="update.id" class="timeline-entry"><div><time>{{ new Date(update.createdAt).toLocaleString() }}</time><p class="prewrap">{{ update.body }}</p></div><UButton size="xs" color="error" variant="outline" :disabled="busy" @click="deleteUpdate(update.id)">Delete</UButton></div></div><p v-else class="empty">No updates yet.</p></section>
  </template>
  <UAlert v-else color="error" :title="error || 'Project not found.'" />
</template>
