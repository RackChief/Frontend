<script setup lang="ts">
const version = useRuntimeConfig().public.appVersion
const catalog = ref<{ catalog?: { status: string; revision?: string; entryCount?: number } } | null>(null)
onMounted(async () => { try { catalog.value = await $fetch('/startup/status') } catch {} })
</script>
<template>
  <div class="page-heading"><div><p class="eyebrow">Settings</p><h1>About RackChief</h1><p class="muted">Inventory and project planning for your homelab.</p></div></div>
  <section class="panel"><h2 class="mb-4 text-lg font-semibold">RackChief</h2><dl class="details"><div><dt>Frontend version</dt><dd>{{ version }}</dd></div><div><dt>License</dt><dd>GNU Affero General Public License v3.0</dd></div><div><dt>Source code</dt><dd><a href="https://github.com/RackChief/RackChief" target="_blank" rel="noopener noreferrer">github.com/RackChief/RackChief</a></dd></div><div><dt>Project website</dt><dd><a href="https://github.com/RackChief/RackChief" target="_blank" rel="noopener noreferrer">RackChief project page</a></dd></div></dl></section>
  <section class="panel"><h2 class="mb-4 text-lg font-semibold">Hardware catalog</h2><dl class="details"><div><dt>Provider</dt><dd>NetBox Community Device Type Library</dd></div><div><dt>Status</dt><dd>{{ catalog?.catalog?.status || 'Checking…' }}</dd></div><div><dt>Indexed devices</dt><dd>{{ catalog?.catalog?.entryCount ?? '—' }}</dd></div><div class="full"><dt>Indexed commit</dt><dd><code>{{ catalog?.catalog?.revision || '—' }}</code></dd></div></dl></section>
  <section class="panel"><h2 class="mb-4 text-lg font-semibold">Third-party acknowledgements</h2><p class="mb-3">The interface uses Nuxt, Vue, Nuxt UI, Nuxt Image, and Nuxt Icon / Iconify. Authentication is provided by the RackChief backend with Better Auth.</p><p>Device elevation images are sourced, when available, from the <a href="https://github.com/netbox-community/devicetype-library" target="_blank" rel="noopener noreferrer">NetBox Community Device Type Library</a>.</p></section>
</template>
