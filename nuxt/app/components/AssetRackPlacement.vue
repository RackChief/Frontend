<script setup lang="ts">
import { api } from '../../services/api'
import type { AssetDetailModel, PlacementFields, Rack, RackOrientation } from '../../types/api'
const props = defineProps<{ asset: AssetDetailModel }>()
const emit = defineEmits<{ refresh: [] }>()
const racks = ref<Rack[]>([])
const editing = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)
const form = reactive({ rackId: '', startUnit: 1, orientation: 'front' as RackOrientation, notes: '' })
onMounted(async () => { try { racks.value = await api.racks.list() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load racks.' } })
const rackOptions = computed(() => racks.value.map(row => ({ label: row.name, value: row.id })))
const selectedRack = computed(() => racks.value.find(row => row.id === form.rackId))
function open(placement?: AssetDetailModel['rackPlacements'][number]) { Object.assign(form, { rackId: placement?.rackId || racks.value[0]?.id || '', startUnit: placement?.startUnit || 1, orientation: placement?.orientation || 'front', notes: placement?.notes || '' }); editing.value = true; selected.value = placement || null }
const selected = ref<AssetDetailModel['rackPlacements'][number] | null>(null)
async function save() { busy.value = true; error.value = null; try { const input: PlacementFields = { assetId: props.asset.id, startUnit: Number(form.startUnit), orientation: form.orientation, notes: form.notes.trim() || null }; if (selected.value) await api.racks.placements.update(form.rackId, selected.value.id, input); else await api.racks.placements.create(form.rackId, input); editing.value = false; emit('refresh') } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not save placement.' } finally { busy.value = false } }
async function remove(row: AssetDetailModel['rackPlacements'][number]) { if (!window.confirm(`Remove ${props.asset.name} from ${row.rack.name}?`)) return; try { error.value = null; await api.racks.placements.delete(row.rackId, row.id); editing.value = false; emit('refresh') } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not remove placement.' } }
</script>
<template>
  <section class="panel"><div class="section-heading"><h2 class="text-lg font-semibold">Rack / location</h2><UButton size="sm" icon="i-lucide-plus" :disabled="!racks.length" @click="open()">Place in rack</UButton></div><p class="muted mb-3">Location: {{ asset.location?.name || 'No location' }} · Device height: {{ asset.rackUnits }}U</p><div v-if="asset.rackPlacements.length" class="table-scroll"><table class="data-table"><thead><tr><th>Rack</th><th>Position</th><th>Height</th><th>Side</th><th>Actions</th></tr></thead><tbody><tr v-for="row in asset.rackPlacements" :key="row.id"><td><NuxtLink :to="`/racks/${row.rackId}`">{{ row.rack.name }}</NuxtLink></td><td>{{ row.startUnit }}U</td><td>{{ asset.rackUnits }}U</td><td>{{ row.orientation }}</td><td><div class="actions"><UButton size="xs" variant="outline" @click="open(row)">Edit</UButton><UButton size="xs" variant="outline" color="error" @click="remove(row)">Remove</UButton></div></td></tr></tbody></table></div><p v-else class="muted">No rack placement.</p><UAlert v-if="error" color="error" :title="error" class="mt-3" /></section>
  <section v-if="editing" class="panel"><h2 class="mb-4 text-lg font-semibold">{{ selected ? 'Edit placement' : 'Place asset' }}</h2><form class="form-grid" @submit.prevent="save"><UFormField label="Rack" required><USelect v-model="form.rackId" :items="rackOptions" :disabled="!!selected" class="w-full" /></UFormField><UFormField label="Side"><USelect v-model="form.orientation" :items="[{ label: 'Front', value: 'front' }, { label: 'Rear', value: 'rear' }]" class="w-full" /></UFormField><UFormField label="Starting U"><UInput v-model="form.startUnit" type="number" :min="selectedRack?.startingUnit || 1" :max="selectedRack ? selectedRack.startingUnit + selectedRack.totalUnits - 1 : undefined" required class="w-full" /></UFormField><UFormField label="Notes"><UInput v-model="form.notes" class="w-full" /></UFormField><div class="form-actions full"><UButton type="button" variant="outline" color="neutral" @click="editing = false">Cancel</UButton><UButton type="submit" :loading="busy" :disabled="!form.rackId">Save placement</UButton></div></form></section>
</template>
