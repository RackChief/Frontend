import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorNotice, Field, optional } from './ui'
import { api } from '../services/api'
import { relationshipTypes, type Asset, type AssetDetailModel, type AssetRelationship, type RelationshipType } from '../types/api'

const label = (type: string) => type.replaceAll('_', ' ')
export default function AssetRelationships({ asset, assets, onRefresh }: { asset: AssetDetailModel; assets: Asset[]; onRefresh: () => Promise<void> }) {
  const [editing, setEditing] = useState<AssetRelationship | 'new' | null>(null)
  const [direction, setDirection] = useState<'outgoing' | 'incoming'>('outgoing')
  const [otherId, setOtherId] = useState('')
  const [type, setType] = useState<RelationshipType>('depends_on')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  function open(row: AssetRelationship | 'new') { setEditing(row); setDirection(row === 'new' || row.sourceAssetId === asset.id ? 'outgoing' : 'incoming'); setOtherId(row === 'new' ? assets.find(item => item.id !== asset.id)?.id || '' : row.sourceAssetId === asset.id ? row.targetAssetId : row.sourceAssetId); setType(row === 'new' ? 'depends_on' : row.relationshipType); setNotes(row === 'new' ? '' : row.notes || '') }
  async function save(event: FormEvent) { event.preventDefault(); setBusy(true); setError(null); try { const input = { sourceAssetId: direction === 'outgoing' ? asset.id : otherId, targetAssetId: direction === 'outgoing' ? otherId : asset.id, relationshipType: type, notes: optional(notes) }; if (editing === 'new') await api.relationships.create(input); else await api.relationships.update((editing as AssetRelationship).id, input); await onRefresh(); setEditing(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save relationship.') } finally { setBusy(false) } }
  async function remove(row: AssetRelationship) { if (!window.confirm('Delete this relationship?')) return; setError(null); try { await api.relationships.delete(row.id); await onRefresh(); setEditing(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete relationship.') } }
  function rowView(row: AssetRelationship) { const other = assets.find(item => item.id === (row.sourceAssetId === asset.id ? row.targetAssetId : row.sourceAssetId)); return <li key={row.id}><span>{label(row.relationshipType)} {row.sourceAssetId === asset.id ? '→' : '←'} </span>{other ? <Link to={`/assets/${other.id}`}>{other.name}</Link> : 'Unknown asset'}<div className="inline"><button className="secondary small" onClick={() => open(row)}>Edit</button><button className="danger-outline small" onClick={() => void remove(row)}>Delete</button></div>{row.notes && <p className="muted">{row.notes}</p>}</li> }
  const outgoing = asset.relationships.filter(row => row.sourceAssetId === asset.id)
  const incoming = asset.relationships.filter(row => row.targetAssetId === asset.id)
  return <section className="panel"><div className="section-heading"><h2>Relationships</h2><button className="small" disabled={assets.length < 2} onClick={() => open('new')}>+ Add relationship</button></div><ErrorNotice error={error} /><div className="two-column"><div><h3>Outgoing</h3>{outgoing.length ? <ul className="relationship-list">{outgoing.map(rowView)}</ul> : <Empty>No outgoing relationships.</Empty>}</div><div><h3>Incoming</h3>{incoming.length ? <ul className="relationship-list">{incoming.map(rowView)}</ul> : <Empty>No incoming relationships.</Empty>}</div></div>
    {editing && <form className="form-grid subpanel" onSubmit={e => void save(e)}><Field label="Direction"><select value={direction} onChange={e => setDirection(e.target.value as typeof direction)}><option value="outgoing">From this asset</option><option value="incoming">To this asset</option></select></Field><Field label="Other asset"><select required value={otherId} onChange={e => setOtherId(e.target.value)}>{assets.filter(row => row.id !== asset.id).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Relationship"><select value={type} onChange={e => setType(e.target.value as RelationshipType)}>{relationshipTypes.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></Field><Field label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} /></Field><div className="form-actions"><button className="secondary" type="button" onClick={() => setEditing(null)}>Cancel</button><button disabled={busy || !otherId}>Save relationship</button></div></form>}
  </section>
}
