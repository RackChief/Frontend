import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AssetForm from '../components/AssetForm'
import { Badge, confirmDelete, ErrorNotice, formatDate, Loading } from '../components/ui'
import { api } from '../services/api'
import type { Asset, AssetType, CreateAsset, UpdateAsset } from '../types/api'

export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [types, setTypes] = useState<AssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void Promise.all([api.assets.get(id!), api.assetTypes.list()]).then(([row, kinds]) => { if (active) { setAsset(row); setTypes(kinds) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])
  async function save(input: CreateAsset | UpdateAsset) { const row = await api.assets.update(id!, input as UpdateAsset); setAsset(row); setEditing(false) }
  async function lifecycle(action: 'archive' | 'restore' | 'delete') {
    if (!asset || (action === 'delete' && !confirmDelete(asset.name))) return
    setBusy(true); setError(null)
    try { if (action === 'delete') { await api.assets.delete(asset.id); navigate('/assets') } else setAsset(await api.assets[action](asset.id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Action failed.') } finally { setBusy(false) }
  }
  if (loading) return <Loading />
  if (!asset) return <><Link to="/assets">← Assets</Link><ErrorNotice error={error} /></>
  return <><Link className="back-link" to="/assets">← Assets</Link><div className="page-heading"><div><p className="eyebrow">Asset</p><h1>{asset.name}</h1><div className="inline"><Badge value={asset.status} /><span className="muted">{asset.assetType.name}</span></div></div><div className="actions">{!asset.archivedAt && <button className="secondary" onClick={() => setEditing(value => !value)}>Edit</button>}{asset.archivedAt ? <><button className="secondary" disabled={busy} onClick={() => void lifecycle('restore')}>Restore</button><button className="danger" disabled={busy} onClick={() => void lifecycle('delete')}>Delete permanently</button></> : <button className="danger-outline" disabled={busy} onClick={() => void lifecycle('archive')}>Archive</button>}</div></div>
    <ErrorNotice error={error} />
    {editing && <section className="panel"><h2>Edit asset</h2><AssetForm key={asset.id} asset={asset} types={types} onSave={save} onCancel={() => setEditing(false)} /></section>}
    <section className="panel"><h2>Details</h2><dl className="details"><div><dt>Asset type</dt><dd>{asset.assetType.name}</dd></div><div><dt>Hostname</dt><dd>{asset.hostname || '—'}</dd></div><div><dt>IP address</dt><dd>{asset.ipAddress || '—'}</dd></div><div><dt>Manufacturer</dt><dd>{asset.manufacturer || '—'}</dd></div><div><dt>Model</dt><dd>{asset.model || '—'}</dd></div><div><dt>Serial number</dt><dd>{asset.serialNumber || '—'}</dd></div><div><dt>Created</dt><dd>{formatDate(asset.createdAt)}</dd></div><div><dt>Updated</dt><dd>{formatDate(asset.updatedAt)}</dd></div>{asset.archivedAt && <div><dt>Archived</dt><dd>{formatDate(asset.archivedAt)}</dd></div>}</dl><h3>Notes</h3><p className="prewrap">{asset.notes || 'No notes.'}</p></section>
  </>
}
