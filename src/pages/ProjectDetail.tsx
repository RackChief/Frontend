import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ItemForm from '../components/ItemForm'
import ProjectForm from '../components/ProjectForm'
import { Badge, confirmDelete, Empty, ErrorNotice, formatDate, formatMoney, Loading } from '../components/ui'
import { api } from '../services/api'
import type { Asset, CreateProject, CreateProjectItem, Project, ProjectItem, UpdateProject, UpdateProjectItem } from '../types/api'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [itemEditor, setItemEditor] = useState<ProjectItem | 'new' | null>(null)
  const [updateBody, setUpdateBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void Promise.all([api.projects.get(id!), api.assets.list()]).then(([row, assetRows]) => { if (active) { setProject(row); setAssets(assetRows) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])
  async function refresh() { setProject(await api.projects.get(id!)) }
  async function save(input: CreateProject | UpdateProject) { setProject(await api.projects.update(id!, input as UpdateProject)); setEditing(false) }
  async function lifecycle(action: 'archive' | 'restore' | 'delete') {
    if (!project || (action === 'delete' && !confirmDelete(project.name))) return
    setBusy(true); setError(null)
    try { if (action === 'delete') { await api.projects.delete(project.id); navigate('/projects') } else setProject(await api.projects[action](project.id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Action failed.') } finally { setBusy(false) }
  }
  async function saveItem(input: CreateProjectItem | UpdateProjectItem) {
    if (itemEditor && itemEditor !== 'new') await api.projects.items.update(id!, itemEditor.id, input as UpdateProjectItem)
    else await api.projects.items.create(id!, input as CreateProjectItem)
    await refresh(); setItemEditor(null)
  }
  async function deleteItem(item: ProjectItem) {
    if (!window.confirm(`Delete item “${item.title}”?`)) return
    setBusy(true); setError(null)
    try { await api.projects.items.delete(id!, item.id); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete item.') } finally { setBusy(false) }
  }
  async function addUpdate(event: FormEvent) {
    event.preventDefault()
    if (!updateBody.trim()) { setError('Update text is required.'); return }
    setBusy(true); setError(null)
    try { await api.projects.updates.create(id!, updateBody.trim()); setUpdateBody(''); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add update.') } finally { setBusy(false) }
  }
  async function deleteUpdate(updateId: string) {
    if (!window.confirm('Delete this project update?')) return
    setBusy(true); setError(null)
    try { await api.projects.updates.delete(id!, updateId); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete update.') } finally { setBusy(false) }
  }
  if (loading) return <Loading />
  if (!project) return <><Link to="/projects">← Projects</Link><ErrorNotice error={error} /></>
  return <><Link className="back-link" to="/projects">← Projects</Link><div className="page-heading"><div><p className="eyebrow">Project</p><h1>{project.name}</h1><div className="inline"><Badge value={project.status} /><Badge value={project.priority} /></div></div><div className="actions">{!project.archivedAt && <button className="secondary" onClick={() => setEditing(value => !value)}>Edit</button>}{project.archivedAt ? <><button className="secondary" disabled={busy} onClick={() => void lifecycle('restore')}>Restore</button><button className="danger" disabled={busy} onClick={() => void lifecycle('delete')}>Delete permanently</button></> : <button className="danger-outline" disabled={busy} onClick={() => void lifecycle('archive')}>Archive</button>}</div></div>
    <ErrorNotice error={error} />
    {editing && <section className="panel"><h2>Edit project</h2><ProjectForm key={project.id} project={project} assets={assets} onSave={save} onCancel={() => setEditing(false)} /></section>}
    <section className="panel"><h2>Overview</h2><p className="prewrap">{project.description || 'No description.'}</p><dl className="details"><div><dt>Target date</dt><dd>{formatDate(project.targetDate)}</dd></div><div><dt>Estimated cost</dt><dd>{formatMoney(project.estimatedCost)}</dd></div><div><dt>Actual cost</dt><dd>{formatMoney(project.actualCost)}</dd></div><div><dt>Completed</dt><dd>{formatDate(project.completedAt)}</dd></div><div><dt>Created</dt><dd>{formatDate(project.createdAt)}</dd></div><div><dt>Updated</dt><dd>{formatDate(project.updatedAt)}</dd></div>{project.archivedAt && <div><dt>Archived</dt><dd>{formatDate(project.archivedAt)}</dd></div>}</dl><h3>Notes</h3><p className="prewrap">{project.notes || 'No notes.'}</p></section>
    <section className="panel"><h2>Associated assets</h2>{project.assets.length ? <div className="chip-list">{project.assets.map(asset => <Link className="chip" key={asset.id} to={`/assets/${asset.id}`}>{asset.name}<small>{asset.assetType.name}{asset.hostname ? ` · ${asset.hostname}` : ''}</small></Link>)}</div> : <Empty>No assets associated with this project.</Empty>}</section>
    <section className="panel"><div className="section-heading"><h2>Items</h2><button onClick={() => setItemEditor('new')}>+ Add item</button></div>
      {itemEditor && <div className="subpanel"><h3>{itemEditor === 'new' ? 'Add item' : 'Edit item'}</h3><ItemForm key={itemEditor === 'new' ? 'new' : itemEditor.id} item={itemEditor === 'new' ? undefined : itemEditor} onSave={saveItem} onCancel={() => setItemEditor(null)} /></div>}
      {project.items.length ? <div className="table-scroll"><table><thead><tr><th>Item</th><th>Type</th><th>Status</th><th>Target</th><th>Cost</th><th></th></tr></thead><tbody>{project.items.map(item => <tr key={item.id}><td><strong>{item.title}</strong>{item.description && <div className="cell-subtitle">{item.description}</div>}{item.type === 'purchase' && item.vendor && <div className="cell-subtitle">Vendor: {item.vendor}</div>}{item.url && <div><a href={item.url} target="_blank" rel="noreferrer">Item link ↗</a></div>}{item.notes && <div className="cell-subtitle">{item.notes}</div>}</td><td>{item.type}</td><td><Badge value={item.status} /></td><td>{formatDate(item.targetDate)}</td><td>{formatMoney(item.actualCost ?? item.estimatedCost)}</td><td><div className="actions"><button className="small secondary" onClick={() => setItemEditor(item)}>Edit</button><button className="small danger-outline" disabled={busy} onClick={() => void deleteItem(item)}>Delete</button></div></td></tr>)}</tbody></table></div> : <Empty>No work or purchase items yet.</Empty>}</section>
    <section className="panel"><h2>Updates & history</h2><form className="update-form" onSubmit={addUpdate}><label className="field"><span>Add update</span><textarea rows={3} required value={updateBody} onChange={e => setUpdateBody(e.target.value)} placeholder="What changed?" /></label><button disabled={busy}>Add update</button></form>
      {project.updates.length ? <div className="timeline">{project.updates.map(update => <div className="timeline-entry" key={update.id}><div><time>{new Date(update.createdAt).toLocaleString()}</time><p className="prewrap">{update.body}</p></div><button className="small danger-outline" disabled={busy} onClick={() => void deleteUpdate(update.id)}>Delete</button></div>)}</div> : <Empty>No updates yet.</Empty>}</section>
  </>
}
