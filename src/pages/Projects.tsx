import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProjectForm from '../components/ProjectForm'
import { Badge, Empty, ErrorNotice, formatDate, formatMoney, Loading } from '../components/ui'
import { api } from '../services/api'
import type { Asset, CreateProject, ProjectSummary, UpdateProject } from '../types/api'

export default function Projects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  useEffect(() => { let active = true; void Promise.all([api.projects.list(), api.assets.list()]).then(([rows, assetRows]) => { if (active) { setProjects(rows); setAssets(assetRows) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function create(input: CreateProject | UpdateProject) { const project = await api.projects.create(input as CreateProject); navigate(`/projects/${project.id}`) }
  return <><div className="page-heading"><div><p className="eyebrow">Planning</p><h1>Projects</h1><p className="muted">Track work, purchases, and the assets they affect.</p></div><button onClick={() => setCreating(value => !value)}>+ New project</button></div>
    <ErrorNotice error={error} />
    {creating && <section className="panel"><h2>Create project</h2><ProjectForm assets={assets} onSave={create} onCancel={() => setCreating(false)} /></section>}
    {loading ? <Loading /> : <section className="panel table-panel">{projects.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Status</th><th>Priority</th><th>Target</th><th>Estimated</th><th>Assets</th></tr></thead><tbody>{projects.map(project => <tr key={project.id}><td><Link className="row-link" to={`/projects/${project.id}`}>{project.name}</Link><div className="cell-subtitle">{project.description}</div></td><td><Badge value={project.status} /></td><td><Badge value={project.priority} /></td><td>{formatDate(project.targetDate)}</td><td>{formatMoney(project.estimatedCost)}</td><td>{project.assets.length}</td></tr>)}</tbody></table></div> : <Empty>No projects yet. Create one to plan your next change.</Empty>}</section>}
  </>
}
