import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ComponentForm from '../components/ComponentForm'
import { Badge, confirmDelete, Empty, ErrorNotice, Loading } from '../components/ui'
import { api } from '../services/api'
import { componentStatuses, type Asset, type Component, type ComponentFields, type ComponentType, type Location } from '../types/api'

export default function Components() {
  const [components, setComponents] = useState<Component[]>([])
  const [types, setTypes] = useState<ComponentType[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filter, setFilter] = useState('all')
  const [typeId, setTypeId] = useState('all')
  const [assetId, setAssetId] = useState('all')
  const [locationId, setLocationId] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Component | 'new' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void Promise.all([api.components.list(), api.componentTypes.list(), api.assets.list(), api.locations.list()]).then(([rows, kinds, machines, places]) => { if (active) { setComponents(rows); setTypes(kinds); setAssets(machines); setLocations(places) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => components.filter(component => (filter === 'all' || (filter === 'unassigned' ? !component.assetId : component.status === filter)) && (typeId === 'all' || component.componentTypeId === typeId) && (assetId === 'all' || component.assetId === assetId) && (locationId === 'all' || component.locationId === locationId) && [component.name, component.manufacturer, component.model, component.partNumber, component.serialNumber, types.find(type => type.id === component.componentTypeId)?.name, assets.find(asset => asset.id === component.assetId)?.name].some(value => value?.toLowerCase().includes(search.toLowerCase()))), [components, filter, typeId, assetId, locationId, search, types, assets])
  async function save(input: ComponentFields) {
    const row = editing === 'new' ? await api.components.create(input) : await api.components.update((editing as Component).id, input)
    setComponents(rows => editing === 'new' ? [row, ...rows] : rows.map(item => item.id === row.id ? row : item))
    setEditing(null)
  }
  async function remove(component: Component) {
    if (!confirmDelete(component.name)) return
    setError(null)
    try { await api.components.delete(component.id); setComponents(rows => rows.filter(row => row.id !== component.id)); if (editing !== 'new' && editing?.id === component.id) setEditing(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete component.') }
  }
  return <><div className="page-heading"><div><p className="eyebrow">Inventory</p><h1>Components</h1><p className="muted">Installed hardware and spare parts.</p></div><button onClick={() => setEditing('new')}>+ New component</button></div>
    <ErrorNotice error={error} />
    {editing && <section className="panel"><h2>{editing === 'new' ? 'Create component' : `Edit ${editing.name}`}</h2>{types.length ? <ComponentForm key={editing === 'new' ? 'new' : editing.id} component={editing === 'new' ? undefined : editing} types={types} assets={assets} locations={locations} onSave={save} onCancel={() => setEditing(null)} /> : <Empty>No component types are available.</Empty>}</section>}
    <section className="panel"><div className="filter-row"><label className="field"><span>Search components</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, model, serial or asset" /></label><label className="field"><span>Status</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All</option><option value="unassigned">Unassigned</option>{componentStatuses.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="field"><span>Type</span><select value={typeId} onChange={e => setTypeId(e.target.value)}><option value="all">All</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label className="field"><span>Asset</span><select value={assetId} onChange={e => setAssetId(e.target.value)}><option value="all">All</option>{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><label className="field"><span>Location</span><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="all">All</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label></div></section>
    {loading ? <Loading /> : <section className="panel table-panel">{visible.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Asset</th><th>Manufacturer / model</th><th>Quantity</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead><tbody>{visible.map(component => { const asset = assets.find(row => row.id === component.assetId); const location = locations.find(row => row.id === component.locationId); return <tr key={component.id}><td><strong>{component.name}</strong>{component.serialNumber && <div className="cell-subtitle">S/N {component.serialNumber}</div>}</td><td>{types.find(type => type.id === component.componentTypeId)?.name || '—'}</td><td>{asset ? <Link to={`/assets/${asset.id}`}>{asset.name}</Link> : 'Spare / unassigned'}</td><td>{[component.manufacturer, component.model].filter(Boolean).join(' ') || '—'}</td><td>{component.quantity}</td><td><Badge value={component.status} /></td><td>{location?.name || component.storageLocation || '—'}{location && component.storageLocation && <div className="cell-subtitle">{component.storageLocation}</div>}</td><td><div className="inline"><button className="secondary small" onClick={() => setEditing(component)}>Edit</button><button className="danger-outline small" onClick={() => void remove(component)}>Delete</button></div></td></tr> })}</tbody></table></div> : <Empty>{components.length ? 'No components match your filters.' : 'No components yet. Add installed hardware or a spare.'}</Empty>}</section>}
  </>
}
