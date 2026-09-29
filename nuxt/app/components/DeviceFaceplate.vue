<script setup lang="ts">
import { api } from '../../services/api'
const props = defineProps<{ assetId: string; name: string; manufacturer?: string | null; model?: string | null; side: 'front' | 'rear'; version?: number; compact?: boolean }>()
const failed = ref(false)
const source = ref('')
async function load() {
  failed.value = false
  source.value = ''
  try { const urls = await api.images.urls(props.assetId); source.value = `${urls[props.side]}${props.version ? `&v=${props.version}` : ''}` }
  catch { failed.value = true }
}
onMounted(load)
watch(() => [props.assetId, props.side, props.version], load)
</script>
<template>
  <div class="device-faceplate" :class="{ compact }">
    <NuxtImg v-if="source && !failed" :src="source" :alt="`${name} ${side} elevation`" width="800" height="160" sizes="sm:420px md:800px" loading="lazy" @error="failed = true" />
    <div v-else class="generic-faceplate"><strong>{{ name }}</strong><span>{{ [manufacturer, model].filter(Boolean).join(' ') || 'Device' }}</span></div>
  </div>
</template>
