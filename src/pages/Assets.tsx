import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AssetForm from '../components/AssetForm'
import { Badge, Empty, ErrorNotice, Loading } from '../components/ui'
import { api } from '../services/api'
import type { Asset, AssetType, CreateAsset, UpdateAsset } from '../types/api'

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [types, setTypes] = useState<AssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  useEffect(() => { let active = true; void Promise.all([api.assets.list(), api.assetTypes.list()]).then(([rows, kinds]) => { if (active) { setAssets(rows); setTypes(kinds) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function create(input: CreateAsset | UpdateAsset) { const asset = await api.assets.create(input as CreateAsset); navigate(`/assets/${asset.id}`) }
  return <><div className="page-heading"><div><p className="eyebrow">Inventory</p><h1>Assets</h1><p className="muted">Hardware, services, and everything in your lab.</p></div><button onClick={() => setCreating(value => !value)}>+ New asset</button></div>
    <ErrorNotice error={error} />
    {creating && <section className="panel"><h2>Create asset</h2>{types.length ? <AssetForm types={types} onSave={create} onCancel={() => setCreating(false)} /> : <p className="muted">No asset types are available. The backend must provide at least one type before assets can be created.</p>}</section>}
    {loading ? <Loading /> : <section className="panel table-panel">{assets.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Hostname</th><th>IP address</th><th>Manufacturer / model</th><th>Status</th></tr></thead><tbody>{assets.map(asset => <tr key={asset.id}><td><Link className="row-link" to={`/assets/${asset.id}`}>{asset.name}</Link></td><td>{asset.assetType.name}</td><td>{asset.hostname || '—'}</td><td>{asset.ipAddress || '—'}</td><td>{[asset.manufacturer, asset.model].filter(Boolean).join(' ') || '—'}</td><td><Badge value={asset.status} /></td></tr>)}</tbody></table></div> : <Empty>No assets yet. Create one to start your inventory.</Empty>}</section>}
  </>
}
