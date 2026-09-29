import { useState, type FormEvent } from 'react'
import { itemStatuses, type CreateProjectItem, type ItemStatus, type ItemType, type ProjectItem, type UpdateProjectItem } from '../types/api'
import { amount, ErrorNotice, Field, optional } from './ui'

function localDateTime(value: string | null | undefined) { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
function iso(value: string) { return value ? new Date(value).toISOString() : null }

export default function ItemForm({ item, onSave, onCancel }: { item?: ProjectItem; onSave: (input: CreateProjectItem | UpdateProjectItem) => Promise<void>; onCancel: () => void }) {
  const [type, setType] = useState<ItemType>(item?.type ?? 'work')
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? 'planned')
  const [targetDate, setTargetDate] = useState(item?.targetDate ?? '')
  const [vendor, setVendor] = useState(item?.vendor ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [estimatedCost, setEstimatedCost] = useState(item?.estimatedCost?.toString() ?? '')
  const [actualCost, setActualCost] = useState(item?.actualCost?.toString() ?? '')
  const [shippingCost, setShippingCost] = useState(item?.shippingCost?.toString() ?? '')
  const [orderedAt, setOrderedAt] = useState(localDateTime(item?.orderedAt))
  const [receivedAt, setReceivedAt] = useState(localDateTime(item?.receivedAt))
  const [completedAt, setCompletedAt] = useState(localDateTime(item?.completedAt))
  const [sortOrder, setSortOrder] = useState(item?.sortOrder?.toString() ?? '0')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    const input = { type, title: title.trim(), description: optional(description), status, targetDate: optional(targetDate), vendor: optional(vendor), url: optional(url), estimatedCost: amount(estimatedCost), actualCost: amount(actualCost), shippingCost: amount(shippingCost), orderedAt: iso(orderedAt), receivedAt: iso(receivedAt), completedAt: iso(completedAt), notes: optional(notes), sortOrder: Number(sortOrder) }
    setBusy(true); setError(null)
    try { await onSave(input) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save item.') } finally { setBusy(false) }
  }
  return <form className="form-grid" onSubmit={submit}><ErrorNotice error={error} />
    <Field label="Type *"><select value={type} onChange={e => setType(e.target.value as ItemType)}><option value="work">Work</option><option value="purchase">Purchase</option></select></Field>
    <Field label="Title *"><input required value={title} onChange={e => setTitle(e.target.value)} /></Field>
    <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value as ItemStatus)}>{itemStatuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></Field>
    <Field label="Target date"><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></Field>
    <Field label="Sort order"><input type="number" step="0.01" min="-99999999.99" max="99999999.99" required value={sortOrder} onChange={e => setSortOrder(e.target.value)} /></Field>
    <Field label="Description"><textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
    {type === 'purchase' && <><Field label="Vendor"><input value={vendor} onChange={e => setVendor(e.target.value)} /></Field><Field label="URL"><input type="url" value={url} onChange={e => setUrl(e.target.value)} /></Field>
      <Field label="Estimated cost"><input type="number" min="0" max="9999999999.99" step="0.01" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} /></Field>
      <Field label="Actual cost"><input type="number" min="0" max="9999999999.99" step="0.01" value={actualCost} onChange={e => setActualCost(e.target.value)} /></Field>
      <Field label="Shipping cost"><input type="number" min="0" max="9999999999.99" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} /></Field>
      <Field label="Ordered at"><input type="datetime-local" value={orderedAt} onChange={e => setOrderedAt(e.target.value)} /></Field>
      <Field label="Received at"><input type="datetime-local" value={receivedAt} onChange={e => setReceivedAt(e.target.value)} /></Field></>}
    <Field label="Completed at"><input type="datetime-local" value={completedAt} onChange={e => setCompletedAt(e.target.value)} /></Field>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button disabled={busy}>{busy ? 'Saving…' : 'Save item'}</button></div>
  </form>
}
