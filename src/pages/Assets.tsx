import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AssetForm from '../components/AssetForm'
import { Badge, Empty, ErrorNotice, Loading } from '../components/ui'
import { api } from '../services/api'
import { assetStatuses, type Asset, type AssetType, type CreateAsset, type Location, type UpdateAsset } from '../types/api'

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [types, setTypes] = useState<AssetType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [typeId, setTypeId] = useState('all')
  const [locationId, setLocationId] = useState('all')
  const navigate = useNavigate()
  useEffect(() => { let active = true; void Promise.all([api.assets.list(), api.assetTypes.list(), api.locations.list()]).then(([rows, kinds, places]) => { if (active) { setAssets(rows); setTypes(kinds); setLocations(places) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function create(input: CreateAsset | UpdateAsset) { const asset = await api.assets.create(input as CreateAsset); navigate(`/assets/${asset.id}`) }
  const visible = useMemo(() => assets.filter(asset => (status === 'all' || asset.status === status) && (typeId === 'all' || asset.assetTypeId === typeId) && (locationId === 'all' || (locationId === 'none' ? !asset.locationId : asset.locationId === locationId)) && [asset.name, asset.hostname, asset.manufacturer, asset.model, asset.serialNumber].some(value => value?.toLowerCase().includes(search.toLowerCase()))), [assets, status, typeId, locationId, search])
  return <><div className="page-heading"><div><p className="eyebrow">Inventory</p><h1>Assets</h1><p className="muted">Hardware, services, and everything in your lab.</p></div><button onClick={() => setCreating(value => !value)}>+ New asset</button></div>
    <ErrorNotice error={error} />
    {creating && <section className="panel"><h2>Create asset</h2>{types.length ? <AssetForm types={types} locations={locations} onSave={create} onCancel={() => setCreating(false)} /> : <p className="muted">No asset types are available. The backend must provide at least one type before assets can be created.</p>}</section>}
    <section className="panel"><div className="filter-row"><label className="field"><span>Search assets</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, host, model, serial" /></label><label className="field"><span>Status</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All</option>{[...assetStatuses, 'archived'].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="field"><span>Type</span><select value={typeId} onChange={e => setTypeId(e.target.value)}><option value="all">All</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label className="field"><span>Location</span><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="all">All</option><option value="none">Unassigned</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label></div></section>
    {loading ? <Loading /> : <section className="panel table-panel">{visible.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Hostname</th><th>IP address</th><th>Location</th><th>Manufacturer / model</th><th>Status</th></tr></thead><tbody>{visible.map(asset => <tr key={asset.id}><td><Link className="row-link" to={`/assets/${asset.id}`}>{asset.name}</Link></td><td>{asset.assetType.name}</td><td>{asset.hostname || '—'}</td><td>{asset.ipAddress || '—'}</td><td>{locations.find(row => row.id === asset.locationId)?.name || '—'}</td><td>{[asset.manufacturer, asset.model].filter(Boolean).join(' ') || '—'}</td><td><Badge value={asset.status} /></td></tr>)}</tbody></table></div> : <Empty>{assets.length ? 'No assets match your filters.' : 'No assets yet. Create one to start your inventory.'}</Empty>}</section>}
  </>
}
