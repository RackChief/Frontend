<script setup lang="ts">
import { api } from '../../../services/api'
import type { McpSettings, McpToken } from '../../../types/api'
const settings = ref<McpSettings | null>(null)
const tokens = ref<McpToken[]>([])
const name = ref('')
const expiresAt = ref('')
const editing = ref<string | null>(null)
const editName = ref('')
const editExpiresAt = ref('')
const rawToken = ref<string | null>(null)
const loading = ref(true)
const busy = ref(false)
const error = ref<string | null>(null)
const expiry = (value: string) => value ? new Date(value).toISOString() : undefined
const localDate = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : '—'
onMounted(async () => { try { [settings.value, tokens.value] = await Promise.all([api.mcp.settings(), api.mcp.tokens()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load MCP settings.' } finally { loading.value = false } })
async function changeEnabled() { if (!settings.value) return; busy.value = true; error.value = null; try { settings.value = await api.mcp.setEnabled(!settings.value.enabled) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not change MCP setting.' } finally { busy.value = false } }
async function create() { busy.value = true; error.value = null; try { const { token, ...metadata } = await api.mcp.createToken(name.value.trim(), expiry(expiresAt.value)); rawToken.value = token; tokens.value = [metadata, ...tokens.value]; name.value = ''; expiresAt.value = '' } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not create token.' } finally { busy.value = false } }
function open(row: McpToken) { editing.value = row.id; editName.value = row.name; editExpiresAt.value = localDate(row.expiresAt) }
async function update(row: McpToken, input: { name?: string; enabled?: boolean; expiresAt?: string | null }) { busy.value = true; error.value = null; try { const updated = await api.mcp.updateToken(row.id, input); tokens.value = tokens.value.map(item => item.id === updated.id ? updated : item); editing.value = null } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not update token.' } finally { busy.value = false } }
async function remove(row: McpToken) { if (!window.confirm(`Revoke “${row.name}”? Clients using this token will lose access.`)) return; busy.value = true; error.value = null; try { await api.mcp.deleteToken(row.id); tokens.value = tokens.value.filter(item => item.id !== row.id) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not revoke token.' } finally { busy.value = false } }
async function copyToken() { if (!rawToken.value) return; try { await navigator.clipboard.writeText(rawToken.value) } catch { error.value = 'Clipboard access failed. Select and copy the token manually.' } }
</script>

<template>
  <div class="page-heading"><div><p class="eyebrow">Settings</p><h1>MCP access</h1><p class="muted">Control access to the RackChief MCP endpoint.</p></div></div>
  <UAlert v-if="error" color="error" :title="error" class="mb-4" />
  <UCard v-if="loading"><div role="status">Loading MCP settings…</div></UCard>
  <template v-else><section class="panel"><h2 class="mb-4 text-lg font-semibold">MCP endpoint</h2><p>Endpoint: <code>/mcp</code></p><p>Status: <strong>{{ settings?.enabled ? 'Enabled' : 'Disabled' }}</strong></p><p class="muted my-3">MCP is disabled by default. Tokens only work while it is enabled.</p><UButton :color="settings?.enabled ? 'error' : 'primary'" :variant="settings?.enabled ? 'outline' : 'solid'" :loading="busy" :disabled="!settings" @click="changeEnabled">{{ settings?.enabled ? 'Disable MCP' : 'Enable MCP' }}</UButton></section>
    <section class="panel"><h2 class="mb-4 text-lg font-semibold">Create token</h2><p class="muted mb-4">Copy the token when it appears. It cannot be retrieved later.</p><form class="form-grid" @submit.prevent="create"><UFormField label="Token name" required><UInput v-model="name" required placeholder="Automation client" class="w-full" /></UFormField><UFormField label="Expiration (optional)"><UInput v-model="expiresAt" type="datetime-local" class="w-full" /></UFormField><div class="form-actions full"><UButton type="submit" :loading="busy">Create token</UButton></div></form>
      <UAlert v-if="rawToken" color="warning" title="New token — shown only now" description="Copy it to your client before closing this message." class="my-4" /><div v-if="rawToken" class="token-reveal"><code>{{ rawToken }}</code><div class="actions mt-3"><UButton size="sm" variant="outline" @click="copyToken">Copy token</UButton><UButton size="sm" variant="outline" color="neutral" @click="rawToken = null">Done</UButton></div></div>
    </section>
    <section class="panel table-scroll"><table v-if="tokens.length" class="data-table"><thead><tr><th>Name</th><th>Status</th><th>Created</th><th>Expires</th><th>Last used</th><th>Actions</th></tr></thead><tbody><tr v-for="token in tokens" :key="token.id"><td><UInput v-if="editing === token.id" v-model="editName" aria-label="Token name" class="w-full" /><span v-else>{{ token.name }}</span></td><td>{{ token.enabled ? 'Enabled' : 'Disabled' }}</td><td>{{ formatDate(token.createdAt) }}</td><td><UInput v-if="editing === token.id" v-model="editExpiresAt" type="datetime-local" aria-label="Token expiration" class="w-full" /><span v-else>{{ formatDate(token.expiresAt) }}</span></td><td>{{ formatDate(token.lastUsedAt) }}</td><td><div class="actions"><template v-if="editing === token.id"><UButton size="xs" :disabled="busy || !editName.trim()" @click="update(token, { name: editName.trim(), expiresAt: expiry(editExpiresAt) || null })">Save</UButton><UButton size="xs" variant="outline" color="neutral" @click="editing = null">Cancel</UButton></template><template v-else><UButton size="xs" variant="outline" @click="open(token)">Edit</UButton><UButton size="xs" variant="outline" :disabled="busy" @click="update(token, { enabled: !token.enabled })">{{ token.enabled ? 'Disable' : 'Enable' }}</UButton><UButton size="xs" color="error" variant="outline" :disabled="busy" @click="remove(token)">Revoke</UButton></template></div></td></tr></tbody></table><p v-else class="empty">No MCP tokens yet.</p></section>
  </template>
</template>
