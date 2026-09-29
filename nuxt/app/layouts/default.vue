<script setup lang="ts">
const route = useRoute()
const { session, signOut } = useAuth()
const navigation = [
  { to: '/assets', label: 'Assets', icon: 'i-lucide-server' },
  { to: '/components', label: 'Components', icon: 'i-lucide-package' },
  { to: '/locations', label: 'Locations', icon: 'i-lucide-map-pin' },
  { to: '/racks', label: 'Racks', icon: 'i-lucide-warehouse' },
  { to: '/projects', label: 'Projects', icon: 'i-lucide-folder-kanban' },
  { to: '/settings/mcp', label: 'MCP settings', icon: 'i-lucide-key-round' },
  { to: '/settings/about', label: 'About', icon: 'i-lucide-info' },
]
</script>

<template>
  <div v-if="route.path === '/login'"><slot /></div>
  <div v-else class="app-shell">
    <aside class="sidebar">
      <NuxtLink class="brand" to="/assets"><NuxtImg src="/rackchief-icon.png" width="38" height="38" alt="" /><span>RackChief</span></NuxtLink>
      <nav aria-label="Main navigation">
        <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-link" active-class="active"><Icon :name="item.icon" aria-hidden="true" /> {{ item.label }}</NuxtLink>
      </nav>
      <div class="account"><span>{{ session?.user.email }}</span><UButton variant="ghost" color="primary" @click="signOut">Sign out</UButton></div>
    </aside>
    <main class="content"><slot /></main>
  </div>
</template>
