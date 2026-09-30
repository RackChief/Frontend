<script setup lang="ts">
const email = ref('')
const password = ref('')
const name = ref('')
const busy = ref(false)
const loading = ref(true)
const setupRequired = ref(false)
const error = ref<string | null>(null)
try { setupRequired.value = (await $fetch<{ setupRequired: boolean }>('/api/v1/setup/status')).setupRequired } catch { error.value = 'Could not reach the RackChief backend.' } finally { loading.value = false }
if (!loading.value && !setupRequired.value && !error.value) await navigateTo('/login', { replace: true })
async function submit() { busy.value = true; error.value = null; try { await $fetch('/api/v1/setup/admin', { method: 'POST', body: { email: email.value, password: password.value, name: name.value } }); await navigateTo('/login?created=1') } catch (cause) { const response = cause as { data?: { error?: string; issues?: { message?: string }[] } }; error.value = response.data?.issues?.map(issue => issue.message).filter(Boolean).join('; ') || response.data?.error || 'Could not create the administrator.' } finally { busy.value = false } }
</script>

<template>
  <main class="login"><UCard class="login-card"><form v-if="!loading && setupRequired" class="login-form" @submit.prevent="submit">
    <NuxtImg src="/rackchief-horizontal.png" width="320" height="107" alt="RackChief" class="login-logo" />
    <h1>Set up RackChief</h1><p>Create the first administrator account. Public registration is disabled afterward.</p>
    <UAlert v-if="error" color="error" :title="error" />
    <UFormField label="Name" required><UInput v-model="name" autocomplete="name" required class="w-full" /></UFormField>
    <UFormField label="Email" required><UInput v-model="email" type="email" autocomplete="username" required class="w-full" /></UFormField>
    <UFormField label="Password" required><UInput v-model="password" type="password" autocomplete="new-password" minlength="8" required class="w-full" /></UFormField>
    <UButton type="submit" :loading="busy" block>Create administrator</UButton>
  </form><div v-else-if="loading" role="status">Checking setup…</div><UAlert v-else-if="error" color="error" :title="error" /></UCard></main>
</template>
