import { useEffect, useState, type FormEvent } from 'react'
import { Empty, ErrorNotice, Field, formatDate, Loading } from '../components/ui'
import { api } from '../services/api'
import type { McpSettings as McpSettingsModel, McpToken } from '../types/api'

function expiry(value: string): string | undefined { return value ? new Date(value).toISOString() : undefined }
function localDate(value: string | null): string { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

export default function McpSettings() {
  const [settings, setSettings] = useState<McpSettingsModel | null>(null)
  const [tokens, setTokens] = useState<McpToken[]>([])
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [rawToken, setRawToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void Promise.all([api.mcp.settings(), api.mcp.tokens()]).then(([configuration, rows]) => { if (active) { setSettings(configuration); setTokens(rows) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function changeEnabled() { if (!settings) return; setBusy(true); setError(null); try { setSettings(await api.mcp.setEnabled(!settings.enabled)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not change MCP setting.') } finally { setBusy(false) } }
  async function create(event: FormEvent) { event.preventDefault(); setBusy(true); setError(null); try { const { token, ...metadata } = await api.mcp.createToken(name.trim(), expiry(expiresAt)); setRawToken(token); setTokens(rows => [metadata, ...rows]); setName(''); setExpiresAt('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create token.') } finally { setBusy(false) } }
  async function update(token: McpToken, input: { name?: string; enabled?: boolean; expiresAt?: string | null }) { setBusy(true); setError(null); try { const row = await api.mcp.updateToken(token.id, input); setTokens(rows => rows.map(item => item.id === row.id ? row : item)); setEditing(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update token.') } finally { setBusy(false) } }
  async function remove(token: McpToken) { if (!window.confirm(`Revoke “${token.name}”? Clients using this token will lose access.`)) return; setBusy(true); setError(null); try { await api.mcp.deleteToken(token.id); setTokens(rows => rows.filter(row => row.id !== token.id)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not revoke token.') } finally { setBusy(false) } }
  return <><div className="page-heading"><div><p className="eyebrow">Settings</p><h1>MCP access</h1><p className="muted">Control access to the RackChief MCP endpoint.</p></div></div><ErrorNotice error={error} />{loading ? <Loading /> : <>
    <section className="panel"><h2>MCP endpoint</h2><p>Endpoint: <code>/mcp</code></p><p>Status: <strong>{settings?.enabled ? 'Enabled' : 'Disabled'}</strong></p><p className="muted">MCP is disabled by default. Tokens only work while it is enabled.</p><button className={settings?.enabled ? 'danger-outline' : ''} disabled={busy || !settings} onClick={() => void changeEnabled()}>{settings?.enabled ? 'Disable MCP' : 'Enable MCP'}</button></section>
    <section className="panel"><h2>Create token</h2><p className="muted">Copy the token when it appears. It cannot be retrieved later.</p><form className="form-grid" onSubmit={e => void create(e)}><Field label="Token name"><input required value={name} onChange={e => setName(e.target.value)} placeholder="Automation client" /></Field><Field label="Expiration (optional)"><input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></Field><div className="form-actions"><button disabled={busy} type="submit">Create token</button></div></form>
      {rawToken && <div className="notice token-reveal"><strong>New token — shown only now</strong><p>Copy it to your client before closing this message.</p><code>{rawToken}</code><div className="inline"><button className="secondary small" onClick={() => void navigator.clipboard.writeText(rawToken).catch(() => setError('Clipboard access failed. Select and copy the token manually.'))}>Copy token</button><button className="secondary small" onClick={() => setRawToken(null)}>Done</button></div></div>}
    </section>
    <section className="panel table-panel">{tokens.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Status</th><th>Created</th><th>Expires</th><th>Last used</th><th>Actions</th></tr></thead><tbody>{tokens.map(token => <tr key={token.id}><td>{editing === token.id ? <input aria-label="Token name" value={editName} onChange={e => setEditName(e.target.value)} /> : token.name}</td><td>{token.enabled ? 'Enabled' : 'Disabled'}</td><td>{formatDate(token.createdAt)}</td><td>{editing === token.id ? <input aria-label="Token expiration" type="datetime-local" value={editExpiresAt} onChange={e => setEditExpiresAt(e.target.value)} /> : formatDate(token.expiresAt)}</td><td>{formatDate(token.lastUsedAt)}</td><td><div className="inline">{editing === token.id ? <><button className="small" disabled={busy || !editName.trim()} onClick={() => void update(token, { name: editName.trim(), expiresAt: expiry(editExpiresAt) || null })}>Save</button><button className="secondary small" onClick={() => setEditing(null)}>Cancel</button></> : <><button className="secondary small" onClick={() => { setEditing(token.id); setEditName(token.name); setEditExpiresAt(localDate(token.expiresAt)) }}>Edit</button><button className="secondary small" disabled={busy} onClick={() => void update(token, { enabled: !token.enabled })}>{token.enabled ? 'Disable' : 'Enable'}</button><button className="danger-outline small" disabled={busy} onClick={() => void remove(token)}>Revoke</button></>}</div></td></tr>)}</tbody></table></div> : <Empty>No MCP tokens yet.</Empty>}</section>
  </>}</>
}
