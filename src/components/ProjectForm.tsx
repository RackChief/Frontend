import { useState, type FormEvent } from 'react'
import { priorities, projectStatuses, type Asset, type CreateProject, type EditableProjectStatus, type Priority, type Project, type UpdateProject } from '../types/api'
import { amount, ErrorNotice, Field, optional } from './ui'

export default function ProjectForm({ project, assets, onSave, onCancel }: { project?: Project; assets: Asset[]; onSave: (input: CreateProject | UpdateProject) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<EditableProjectStatus>(project?.status === 'archived' ? 'planned' : project?.status ?? 'idea')
  const [priority, setPriority] = useState<Priority>(project?.priority ?? 'normal')
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? '')
  const [estimatedCost, setEstimatedCost] = useState(project?.estimatedCost?.toString() ?? '')
  const [actualCost, setActualCost] = useState(project?.actualCost?.toString() ?? '')
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [assetIds, setAssetIds] = useState<string[]>(project?.assets.map(asset => asset.id) ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  function toggle(id: string) { setAssetIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    const input = { name: name.trim(), description: optional(description), status, priority, targetDate: optional(targetDate), estimatedCost: amount(estimatedCost), actualCost: amount(actualCost), notes: optional(notes), assetIds }
    setBusy(true); setError(null)
    try { await onSave(input) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save project.') } finally { setBusy(false) }
  }
  return <form className="form-grid" onSubmit={submit}><ErrorNotice error={error} />
    <Field label="Name *"><input required value={name} onChange={e => setName(e.target.value)} /></Field>
    <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value as EditableProjectStatus)}>{projectStatuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></Field>
    <Field label="Priority"><select value={priority} onChange={e => setPriority(e.target.value as Priority)}>{priorities.map(value => <option key={value} value={value}>{value}</option>)}</select></Field>
    <Field label="Target date"><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></Field>
    <Field label="Estimated cost"><input type="number" min="0" max="9999999999.99" step="0.01" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} /></Field>
    <Field label="Actual cost"><input type="number" min="0" max="9999999999.99" step="0.01" value={actualCost} onChange={e => setActualCost(e.target.value)} /></Field>
    <Field label="Description"><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <fieldset className="full"><legend>Associated assets</legend><div className="check-list">{assets.length ? assets.map(asset => <label key={asset.id}><input type="checkbox" checked={assetIds.includes(asset.id)} onChange={() => toggle(asset.id)} /><span>{asset.name} <small>({asset.assetType.name})</small></span></label>) : <span className="muted">No assets available.</span>}</div></fieldset>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button disabled={busy}>{busy ? 'Saving…' : 'Save project'}</button></div>
  </form>
}
