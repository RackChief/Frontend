import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Empty, ErrorNotice, Field, Loading, optional } from '../components/ui'
import { api } from '../services/api'
import type { Location, RackDetail, RackFields } from '../types/api'

export default function Racks() {
  const [racks, setRacks] = useState<RackDetail[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [name, setName] = useState('')
  const [totalUnits, setTotalUnits] = useState(42)
  const [startingUnit, setStartingUnit] = useState(1)
  const [locationId, setLocationId] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  useEffect(() => { let active = true; void Promise.all([api.racks.list(), api.locations.list()]).then(async ([rows, places]) => { const details = await Promise.all(rows.map(row => api.racks.get(row.id))); if (active) { setRacks(details); setLocations(places) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function create(event: FormEvent) { event.preventDefault(); setError(null); setBusy(true); try { const input: RackFields = { name: name.trim(), totalUnits, startingUnit, locationId: locationId || null, description: optional(description) }; const rack = await api.racks.create(input); navigate(`/racks/${rack.id}`) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create rack.') } finally { setBusy(false) } }
  return <><div className="page-heading"><div><p className="eyebrow">Infrastructure</p><h1>Racks</h1><p className="muted">Physical rack space and installed assets.</p></div><button onClick={() => setCreating(value => !value)}>+ New rack</button></div><ErrorNotice error={error} />
    {creating && <section className="panel"><h2>Create rack</h2><form className="form-grid" onSubmit={e => void create(e)}><Field label="Name"><input required value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Location"><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">No location</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field><Field label="Total U"><input type="number" min="1" max="100" required value={totalUnits} onChange={e => setTotalUnits(Number(e.target.value))} /></Field><Field label="Starting U"><input type="number" min="1" required value={startingUnit} onChange={e => setStartingUnit(Number(e.target.value))} /></Field><div className="full"><Field label="Description"><textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} /></Field></div><div className="form-actions"><button className="secondary" type="button" onClick={() => setCreating(false)}>Cancel</button><button disabled={busy} type="submit">Create rack</button></div></form></section>}
    {loading ? <Loading /> : <section className="panel table-panel">{racks.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Location</th><th>Size</th><th>Used U</th><th>Available U</th></tr></thead><tbody>{racks.map(rack => { const used = new Set<number>(); rack.placements.forEach(placement => { for (let unit = placement.startUnit; unit < placement.startUnit + placement.heightUnits; unit++) used.add(unit) }); return <tr key={rack.id}><td><Link className="row-link" to={`/racks/${rack.id}`}>{rack.name}</Link></td><td>{locations.find(row => row.id === rack.locationId)?.name || '—'}</td><td>{rack.totalUnits}U</td><td>{used.size}U</td><td>{rack.totalUnits - used.size}U</td></tr> })}</tbody></table></div> : <Empty>No racks yet. Create one to track rack placement.</Empty>}</section>}
  </>
}
