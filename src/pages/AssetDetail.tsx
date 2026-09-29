import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AssetForm from '../components/AssetForm'
import ComponentForm from '../components/ComponentForm'
import { Badge, confirmDelete, Empty, ErrorNotice, formatDate, Loading } from '../components/ui'
import { api } from '../services/api'
import type { Asset, AssetDetailModel, AssetType, Component, ComponentFields, ComponentType, CreateAsset, Location, ProjectSummary, UpdateAsset } from '../types/api'
import AssetRelationships from '../components/AssetRelationships'
import AssetNetwork from '../components/AssetNetwork'
import AssetRackPlacement from '../components/AssetRackPlacement'

export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState<AssetDetailModel | null>(null)
  const [types, setTypes] = useState<AssetType[]>([])
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingComponent, setEditingComponent] = useState<Component | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void Promise.all([api.assets.detail(id!), api.assetTypes.list(), api.componentTypes.list(), api.assets.list(), api.locations.list(), api.projects.list()]).then(([row, kinds, parts, machines, places, plans]) => { if (active) { setAsset(row); setTypes(kinds); setComponentTypes(parts); setAssets(machines); setLocations(places); setProjects(plans) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])
  async function refresh() { setAsset(await api.assets.detail(id!)) }
  async function save(input: CreateAsset | UpdateAsset) { await api.assets.update(id!, input as UpdateAsset); await refresh(); setEditing(false) }
  async function lifecycle(action: 'archive' | 'restore' | 'delete') {
    if (!asset || (action === 'delete' && !confirmDelete(asset.name))) return
    setBusy(true); setError(null)
    try { if (action === 'delete') { await api.assets.delete(asset.id); navigate('/assets') } else { await api.assets[action](asset.id); await refresh() } }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Action failed.') } finally { setBusy(false) }
  }
  async function saveComponent(input: ComponentFields) { if (editingComponent === 'new') await api.components.create(input); else await api.components.update((editingComponent as Component).id, input); await refresh(); setEditingComponent(null) }
  async function removeComponent(component: Component) { if (!confirmDelete(component.name)) return; setError(null); try { await api.components.delete(component.id); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete component.') } }
  if (loading) return <Loading />
  if (!asset) return <><Link to="/assets">← Assets</Link><ErrorNotice error={error} /></>
  const associatedProjects = projects.filter(project => project.assets.some(row => row.id === asset.id))
  return <><Link className="back-link" to="/assets">← Assets</Link><div className="page-heading"><div><p className="eyebrow">Asset</p><h1>{asset.name}</h1><div className="inline"><Badge value={asset.status} /><span className="muted">{asset.assetType.name}</span></div></div><div className="actions">{!asset.archivedAt && <button className="secondary" onClick={() => setEditing(value => !value)}>Edit</button>}{asset.archivedAt ? <><button className="secondary" disabled={busy} onClick={() => void lifecycle('restore')}>Restore</button><button className="danger" disabled={busy} onClick={() => void lifecycle('delete')}>Delete permanently</button></> : <button className="danger-outline" disabled={busy} onClick={() => void lifecycle('archive')}>Archive</button>}</div></div>
    <ErrorNotice error={error} />
    {editing && <section className="panel"><h2>Edit asset</h2><AssetForm key={asset.id} asset={asset} types={types} locations={locations} onSave={save} onCancel={() => setEditing(false)} /></section>}
    <section className="panel"><h2>Overview</h2><dl className="details"><div><dt>Asset type</dt><dd>{asset.assetType.name}</dd></div><div><dt>Hostname</dt><dd>{asset.hostname || '—'}</dd></div><div><dt>Legacy IP address</dt><dd>{asset.ipAddress || '—'}</dd></div><div><dt>Manufacturer</dt><dd>{asset.manufacturer || '—'}</dd></div><div><dt>Model</dt><dd>{asset.model || '—'}</dd></div><div><dt>Serial number</dt><dd>{asset.serialNumber || '—'}</dd></div><div><dt>Location</dt><dd>{asset.location?.name || '—'}</dd></div><div><dt>Created</dt><dd>{formatDate(asset.createdAt)}</dd></div><div><dt>Updated</dt><dd>{formatDate(asset.updatedAt)}</dd></div>{asset.archivedAt && <div><dt>Archived</dt><dd>{formatDate(asset.archivedAt)}</dd></div>}</dl><h3>Notes</h3><p className="prewrap">{asset.notes || 'No notes.'}</p></section>
    <section className="panel"><div className="section-heading"><h2>Hardware</h2><button className="small" onClick={() => setEditingComponent('new')}>+ Add component</button></div>{asset.components.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Manufacturer / model</th><th>Quantity</th><th>Status</th><th>Serial / part</th><th>Actions</th></tr></thead><tbody>{asset.components.map(component => <tr key={component.id}><td>{component.name}</td><td>{componentTypes.find(type => type.id === component.componentTypeId)?.name || '—'}</td><td>{[component.manufacturer, component.model].filter(Boolean).join(' ') || '—'}</td><td>{component.quantity}</td><td><Badge value={component.status} /></td><td>{component.serialNumber || component.partNumber || '—'}</td><td><div className="inline"><button className="secondary small" onClick={() => setEditingComponent(component)}>Edit</button><button className="secondary small" onClick={() => { setError(null); void api.components.update(component.id, { assetId: null, status: 'spare' }).then(refresh).catch(cause => setError(cause.message)) }}>Move to spare</button><button className="danger-outline small" onClick={() => void removeComponent(component)}>Delete</button></div></td></tr>)}</tbody></table></div> : <Empty>No installed components.</Empty>}</section>
    {editingComponent && <section className="panel"><h2>{editingComponent === 'new' ? 'Add component' : `Edit ${editingComponent.name}`}</h2><ComponentForm key={editingComponent === 'new' ? 'new' : editingComponent.id} component={editingComponent === 'new' ? undefined : editingComponent} defaultAssetId={asset.id} types={componentTypes} assets={assets} locations={locations} onSave={saveComponent} onCancel={() => setEditingComponent(null)} /></section>}
    <AssetRackPlacement asset={asset} onRefresh={refresh} />
    <AssetNetwork asset={asset} assets={assets} onRefresh={refresh} />
    <AssetRelationships asset={asset} assets={assets} onRefresh={refresh} />
    <section className="panel"><h2>Projects</h2>{associatedProjects.length ? <div className="chip-list">{associatedProjects.map(project => <Link className="chip" to={`/projects/${project.id}`} key={project.id}>{project.name}<small>{project.status.replaceAll('_', ' ')}</small></Link>)}</div> : <Empty>No projects linked to this asset.</Empty>}</section>
  </>
}
