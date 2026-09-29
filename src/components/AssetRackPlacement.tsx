import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorNotice, Field, optional } from './ui'
import { api } from '../services/api'
import type { AssetDetailModel, Rack, RackOrientation } from '../types/api'

type Placement = AssetDetailModel['rackPlacements'][number]
export default function AssetRackPlacement({ asset, onRefresh }: { asset: AssetDetailModel; onRefresh: () => Promise<void> }) {
  const [racks, setRacks] = useState<Rack[]>([])
  const [editing, setEditing] = useState<Placement | 'new' | null>(null)
  const [rackId, setRackId] = useState('')
  const [startUnit, setStartUnit] = useState(1)
  const [heightUnits, setHeightUnits] = useState(1)
  const [orientation, setOrientation] = useState<RackOrientation>('front')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void api.racks.list().then(rows => { if (active) setRacks(rows) }).catch(cause => { if (active) setError(cause.message) }); return () => { active = false } }, [])
  function open(row: Placement | 'new') { setEditing(row); setRackId(row === 'new' ? racks[0]?.id || '' : row.rackId); setStartUnit(row === 'new' ? racks[0]?.startingUnit || 1 : row.startUnit); setHeightUnits(row === 'new' ? 1 : row.heightUnits); setOrientation(row === 'new' ? 'front' : row.orientation); setNotes(row === 'new' ? '' : row.notes || '') }
  async function save(event: FormEvent) { event.preventDefault(); setBusy(true); setError(null); try { const input = { assetId: asset.id, startUnit, heightUnits, orientation, notes: optional(notes) }; if (editing === 'new') await api.racks.placements.create(rackId, input); else await api.racks.placements.update((editing as Placement).rackId, (editing as Placement).id, input); await onRefresh(); setEditing(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save placement.') } finally { setBusy(false) } }
  async function remove(row: Placement) { if (!window.confirm(`Remove ${asset.name} from ${row.rack.name}?`)) return; setError(null); try { await api.racks.placements.delete(row.rackId, row.id); await onRefresh(); setEditing(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove placement.') } }
  const selectedRack = racks.find(row => row.id === rackId)
  return <section className="panel"><div className="section-heading"><h2>Rack / location</h2><button className="small" disabled={!racks.length} onClick={() => open('new')}>+ Place in rack</button></div><ErrorNotice error={error} /><p>Location: {asset.location?.name || 'Unassigned'}</p>{asset.rackPlacements.length ? <div className="chip-list">{asset.rackPlacements.map(row => <div className="chip" key={row.id}><Link to={`/racks/${row.rackId}`}>{row.rack.name}</Link><small>{row.orientation} · U{row.startUnit}–{row.startUnit + row.heightUnits - 1} · {row.heightUnits}U</small><div className="inline"><button className="secondary small" onClick={() => open(row)}>Edit</button><button className="danger-outline small" onClick={() => void remove(row)}>Remove</button></div></div>)}</div> : <Empty>Not installed in a rack.</Empty>}
    {editing && <form className="form-grid subpanel" onSubmit={e => void save(e)}><h3 className="full">{editing === 'new' ? 'Place asset' : 'Edit placement'}</h3><Field label="Rack"><select disabled={editing !== 'new'} value={rackId} onChange={e => { setRackId(e.target.value); setStartUnit(racks.find(row => row.id === e.target.value)?.startingUnit || 1) }}>{racks.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Orientation"><select value={orientation} onChange={e => setOrientation(e.target.value as RackOrientation)}><option value="front">Front</option><option value="rear">Rear</option></select></Field><Field label="Starting U"><input type="number" min={selectedRack?.startingUnit || 1} max={selectedRack ? selectedRack.startingUnit + selectedRack.totalUnits - 1 : undefined} required value={startUnit} onChange={e => setStartUnit(Number(e.target.value))} /></Field><Field label="Height U"><input type="number" min="1" required value={heightUnits} onChange={e => setHeightUnits(Number(e.target.value))} /></Field><div className="full"><Field label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} /></Field></div><div className="form-actions"><button className="secondary" type="button" onClick={() => setEditing(null)}>Cancel</button><button disabled={busy || !rackId}>Save placement</button></div></form>}
  </section>
}
