<script setup lang="ts">
const status = ref<{ message?: string; error?: string }>({})
onMounted(async () => { try { status.value = await $fetch('/startup/status') } catch {} })
</script>
<template><main class="startup-screen" role="alert"><section class="startup-card"><p class="eyebrow">RackChief startup error</p><h1>RackChief could not start</h1><p>{{ status.error || status.message || 'The backend reported a startup failure.' }}</p><UButton to="/startup">Check again</UButton></section></main></template>
