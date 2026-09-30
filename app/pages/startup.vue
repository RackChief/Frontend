<script setup lang="ts">
const status = ref<{ phase: string; message: string; catalog?: { status: string; entryCount?: number; revision?: string } }>({ phase: 'starting', message: 'Connecting to RackChief…' })
let timer: ReturnType<typeof setInterval> | undefined
async function refresh() { try { status.value = await $fetch('/startup/status'); if (status.value.phase === 'error') { await navigateTo('/error'); return } if (status.value.phase === 'ready') { try { await $fetch('/health'); await navigateTo('/') } catch {} } } catch { status.value = { phase: 'starting', message: 'Waiting for the RackChief backend…' } } }
onMounted(() => { void refresh(); timer = setInterval(() => void refresh(), 1500) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>
<template><main class="startup-screen" role="status"><section class="startup-card"><p class="eyebrow">RackChief startup</p><h1>Starting RackChief</h1><p>{{ status.message }}</p><span class="startup-spinner" aria-hidden="true" /><small>Database migrations and catalog preparation must finish before the application is available.</small><p v-if="status.catalog?.status === 'ready'" class="muted">Catalog ready: {{ status.catalog.entryCount }} devices · revision {{ status.catalog.revision?.slice(0, 12) }}</p></section></main></template>
