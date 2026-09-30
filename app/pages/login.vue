<script setup lang="ts">
const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
async function submit() {
  busy.value = true
  error.value = null
  try { await signIn(email.value, password.value); await navigateTo('/assets') }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not sign in.' }
  finally { busy.value = false }
}
</script>

<template>
  <main class="login"><UCard class="login-card"><form class="login-form" @submit.prevent="submit">
    <NuxtImg src="/rackchief-horizontal.png" width="320" height="107" alt="RackChief" class="login-logo" />
    <h1 class="sr-only">RackChief</h1><p>Sign in to manage your lab.</p>
    <UAlert v-if="error" color="error" :title="error" />
    <UFormField label="Email" required><UInput v-model="email" type="email" autocomplete="username" required class="w-full" /></UFormField>
    <UFormField label="Password" required><UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" /></UFormField>
    <UButton type="submit" :loading="busy" block>Sign in</UButton>
  </form></UCard></main>
</template>
