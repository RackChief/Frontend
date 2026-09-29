<script setup lang="ts">
import { api } from '../../services/api'
import type { Asset } from '../../types/api'
const props = defineProps<{ asset: Asset }>()
const sides = ['front', 'rear'] as const
const custom = ref({ front: false, rear: false })
const version = ref(0)
const busy = ref(false)
const error = ref<string | null>(null)
onMounted(async () => { try { custom.value = await api.images.customSides(props.asset.id) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load image overrides.' } })
async function upload(side: 'front' | 'rear', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { error.value = 'Choose a PNG, JPEG, or WebP image no larger than 5 MB.'; input.value = ''; return }
  busy.value = true; error.value = null
  try { await api.images.upload(props.asset.id, side, file); custom.value[side] = true; version.value = Date.now() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not upload image.' }
  finally { busy.value = false; input.value = '' }
}
async function remove(side: 'front' | 'rear') {
  busy.value = true; error.value = null
  try { await api.images.remove(props.asset.id, side); custom.value[side] = false; version.value = Date.now() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not remove image override.' }
  finally { busy.value = false }
}
</script>
<template>
  <section class="panel"><h2 class="mb-2 text-lg font-semibold">Device images</h2><p class="muted mb-4">Custom images take priority over cached default faceplates. PNG, JPEG, or WebP, up to 5 MB.</p><div class="device-preview-grid"><div v-for="side in sides" :key="side"><h3 class="mb-2 font-semibold capitalize">{{ side }} <UBadge v-if="custom[side]" size="xs" variant="subtle">Custom</UBadge></h3><DeviceFaceplate :asset-id="asset.id" :name="asset.name" :manufacturer="asset.manufacturer" :model="asset.model" :side="side" :version="version" /><div class="actions mt-3"><label class="upload-control">Upload {{ side }} image<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="busy" @change="upload(side, $event)" /></label><UButton v-if="custom[side]" size="sm" color="error" variant="outline" :disabled="busy" @click="remove(side)">Remove override</UButton></div></div></div><UAlert v-if="error" color="error" :title="error" class="mt-4" /></section>
</template>
