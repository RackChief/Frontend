<script setup lang="ts">
import { api } from '../../services/api'
import type { Asset, UploadedDeviceImage } from '../../types/api'

const props = defineProps<{ asset: Asset }>()
const sides = ['front', 'rear'] as const
const custom = ref({ front: false, rear: false })
const version = ref(0)
const busy = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const catalog = ref<{ path: string; side: 'front' | 'rear'; label: string; rawUrl: string }[]>([])
const selectedCatalog = reactive({ front: '', rear: '' })
const pickerOpen = ref(false)
const pickerSide = ref<'front' | 'rear'>('front')
const uploadedImages = ref<UploadedDeviceImage[]>([])
const libraryLoading = ref(false)
const librarySearch = ref('')
const selectedImageKey = ref('')
const filteredImages = computed(() => uploadedImages.value.filter(image => `${image.assetName} ${image.side}`.toLowerCase().includes(librarySearch.value.trim().toLowerCase())))
const selectedImage = computed(() => filteredImages.value.find(image => `${image.assetId}:${image.side}` === selectedImageKey.value))
let searchTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => { try { custom.value = await api.images.customSides(props.asset.id) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load image overrides.' } })
watch(search, (value) => { if (searchTimer) clearTimeout(searchTimer); if (value.trim().length < 2) { catalog.value = []; return }; searchTimer = setTimeout(async () => { try { catalog.value = await api.images.catalog(value) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not search the image catalog.' } }, 300) })

async function openPicker(side: 'front' | 'rear') {
  pickerSide.value = side
  selectedImageKey.value = ''
  uploadedImages.value = []
  librarySearch.value = ''
  error.value = null
  libraryLoading.value = true
  pickerOpen.value = true
  try { uploadedImages.value = await api.images.library() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load uploaded images.' }
  finally { libraryLoading.value = false }
}
async function chooseUploaded() {
  const image = selectedImage.value
  if (!image) return
  busy.value = true
  error.value = null
  try {
    await api.images.useUploaded(props.asset.id, pickerSide.value, image.assetId, image.side)
    custom.value[pickerSide.value] = true
    version.value = Date.now()
    pickerOpen.value = false
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not use uploaded image.' }
  finally { busy.value = false }
}
async function chooseCatalog(side: 'front' | 'rear') {
  const path = selectedCatalog[side]
  if (!path) return
  busy.value = true
  error.value = null
  try { await api.images.selectCatalog(props.asset.id, side, path); custom.value[side] = true; version.value = Date.now() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not select catalog image.' }
  finally { busy.value = false }
}
async function uploadFromPicker(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    error.value = 'Choose a PNG, JPEG, or WebP image no larger than 5 MB.'
    input.value = ''
    return
  }
  busy.value = true
  error.value = null
  try {
    await api.images.upload(props.asset.id, pickerSide.value, file)
    custom.value[pickerSide.value] = true
    version.value = Date.now()
    pickerOpen.value = false
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not upload image.' }
  finally { busy.value = false; input.value = '' }
}
async function remove(side: 'front' | 'rear') {
  busy.value = true
  error.value = null
  try { await api.images.remove(props.asset.id, side); custom.value[side] = false; version.value = Date.now() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not remove image override.' }
  finally { busy.value = false }
}
</script>

<template>
  <section class="panel">
    <h2 class="mb-2 text-lg font-semibold">Device images</h2>
    <p class="muted mb-4">Pick a previously uploaded image, upload a new one, or search the NetBox Community Device Type Library.</p>
    <div class="device-preview-grid">
      <div v-for="side in sides" :key="side">
        <h3 class="mb-2 font-semibold capitalize">{{ side }} <UBadge v-if="custom[side]" size="xs" variant="subtle">Selected</UBadge></h3>
        <DeviceFaceplate :asset-id="asset.id" :name="asset.name" :manufacturer="asset.manufacturer" :model="asset.model" :side="side" :version="version" />
        <div class="actions mt-3">
          <UButton size="sm" variant="outline" :disabled="busy" @click="openPicker(side)">Pick {{ side }} image</UButton>
          <UButton v-if="custom[side]" size="sm" color="error" variant="outline" :disabled="busy" @click="remove(side)">Remove override</UButton>
        </div>
        <USelect v-if="catalog.filter(item => item.side === side).length" v-model="selectedCatalog[side]" :items="catalog.filter(item => item.side === side).map(item => ({ label: item.label, value: item.path }))" placeholder="Select a catalog image" class="mt-3 w-full" />
        <UButton v-if="selectedCatalog[side]" size="sm" class="mt-2" :loading="busy" @click="chooseCatalog(side)">Use selected {{ side }} image</UButton>
      </div>
    </div>
    <UFormField label="Search catalog" help="Search by vendor, model, or filename"><UInput v-model="search" placeholder="Example: Dell R740 or UDM Pro" class="mt-4 w-full" /></UFormField>
    <p v-if="search.length >= 2 && !catalog.length" class="muted mt-2">No matching catalog images.</p>
    <UAlert v-if="error && !pickerOpen" color="error" :title="error" class="mt-4" />
  </section>
  <UModal v-model:open="pickerOpen" :title="`Pick ${pickerSide} image`">
    <template #body>
      <div class="image-picker">
        <UAlert v-if="error" color="error" :title="error" />
        <p v-if="libraryLoading" class="muted" role="status">Loading uploaded images…</p>
        <template v-else>
          <UInput v-if="uploadedImages.length" v-model="librarySearch" placeholder="Search uploaded images" class="w-full" />
          <div v-if="filteredImages.length" class="image-picker-grid">
            <button v-for="image in filteredImages" :key="`${image.assetId}:${image.side}`" type="button" class="image-picker-choice" :aria-pressed="selectedImageKey === `${image.assetId}:${image.side}`" @click="selectedImageKey = `${image.assetId}:${image.side}`">
              <img :src="image.previewUrl" :alt="`${image.assetName} ${image.side} image`" loading="lazy" />
              <strong>{{ image.assetName }}</strong><span class="muted capitalize">{{ image.side }}</span>
            </button>
          </div>
          <p v-else class="muted">{{ uploadedImages.length ? 'No images match your search.' : 'No previously uploaded images yet.' }}</p>
        </template>
        <div class="form-actions">
          <label class="upload-control">Upload new image<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="busy" @change="uploadFromPicker" /></label>
          <UButton type="button" variant="outline" color="neutral" @click="pickerOpen = false">Cancel</UButton>
          <UButton type="button" :loading="busy" :disabled="!selectedImage || libraryLoading" @click="chooseUploaded">Use selected image</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
