import { useState, type FormEvent } from 'react'
import { ErrorNotice, Field, optional } from './ui'
import { componentStatuses, type Asset, type Component, type ComponentFields, type ComponentType, type Location } from '../types/api'

type AttributeRow = { key: string; value: string; original?: unknown; originalText?: string }
const localDate = (value: string | null | undefined) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
interface Props {
  component?: Component
  types: ComponentType[]
  assets: Asset[]
  locations: Location[]
  defaultAssetId?: string
  onSave: (input: ComponentFields) => Promise<void>
  onCancel: () => void
}
export default function ComponentForm({ component, types, assets, locations, defaultAssetId, onSave, onCancel }: Props) {
  const [name, setName] = useState(component?.name || '')
  const [componentTypeId, setType] = useState(component?.componentTypeId || types[0]?.id || '')
  const [assetId, setAsset] = useState(component?.assetId || defaultAssetId || '')
  const [locationId, setLocation] = useState(component?.locationId || '')
  const [status, setStatus] = useState(component?.status || (defaultAssetId ? 'installed' : 'spare'))
  const [quantity, setQuantity] = useState(component?.quantity || 1)
  const [manufacturer, setManufacturer] = useState(component?.manufacturer || '')
  const [model, setModel] = useState(component?.model || '')
  const [partNumber, setPartNumber] = useState(component?.partNumber || '')
  const [serialNumber, setSerialNumber] = useState(component?.serialNumber || '')
  const [storageLocation, setStorageLocation] = useState(component?.storageLocation || '')
  const [installedAt, setInstalledAt] = useState(localDate(component?.installedAt))
  const [removedAt, setRemovedAt] = useState(localDate(component?.removedAt))
  const [notes, setNotes] = useState(component?.notes || '')
  const [attributes, setAttributes] = useState<AttributeRow[]>(Object.entries(component?.attributes || {}).map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value), original: value, originalText: typeof value === 'string' ? value : JSON.stringify(value) })))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setBusy(true)
    try {
      const entries = attributes.filter(row => row.key.trim()).map(row => [row.key.trim(), row.originalText === row.value ? row.original : row.value] as const)
      if (new Set(entries.map(row => row[0])).size !== entries.length) throw new Error('Attribute names must be unique.')
      await onSave({ name: name.trim(), componentTypeId, assetId: assetId || null, locationId: locationId || null, status, quantity, manufacturer: optional(manufacturer), model: optional(model), partNumber: optional(partNumber), serialNumber: optional(serialNumber), storageLocation: optional(storageLocation), installedAt: installedAt ? new Date(installedAt).toISOString() : null, removedAt: removedAt ? new Date(removedAt).toISOString() : null, notes: optional(notes), attributes: Object.fromEntries(entries) })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save component.') }
    finally { setBusy(false) }
  }
  return <form className="form-grid" onSubmit={e => void submit(e)}>
    <ErrorNotice error={error} />
    <Field label="Name"><input required maxLength={255} value={name} onChange={e => setName(e.target.value)} /></Field>
    <Field label="Component type"><select required value={componentTypeId} onChange={e => setType(e.target.value)}>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
    <Field label="Installed in asset"><select value={assetId} onChange={e => { setAsset(e.target.value); setStatus(e.target.value ? 'installed' : 'spare') }}><option value="">Unassigned / spare</option>{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></Field>
    <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value as typeof status)}>{componentStatuses.map(value => <option key={value} value={value}>{value}</option>)}</select></Field>
    <Field label="Location"><select value={locationId} onChange={e => setLocation(e.target.value)}><option value="">No location</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field>
    <Field label="Storage spot"><input value={storageLocation} onChange={e => setStorageLocation(e.target.value)} placeholder="Shelf or drawer" /></Field>
    <Field label="Quantity"><input type="number" min="1" step="1" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></Field>
    <Field label="Manufacturer"><input value={manufacturer} onChange={e => setManufacturer(e.target.value)} /></Field>
    <Field label="Model"><input value={model} onChange={e => setModel(e.target.value)} /></Field>
    <Field label="Part number"><input value={partNumber} onChange={e => setPartNumber(e.target.value)} /></Field>
    <Field label="Serial number"><input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} /></Field>
    <Field label="Installed at"><input type="datetime-local" value={installedAt} onChange={e => setInstalledAt(e.target.value)} /></Field>
    <Field label="Removed at"><input type="datetime-local" value={removedAt} onChange={e => setRemovedAt(e.target.value)} /></Field>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <div className="full"><h3>Additional attributes</h3><p className="muted">Store simple custom details as names and values.</p>{attributes.map((row, index) => <div className="attribute-row" key={index}><input aria-label={`Attribute ${index + 1} name`} placeholder="Name" value={row.key} onChange={e => setAttributes(rows => rows.map((item, i) => i === index ? { ...item, key: e.target.value } : item))} /><input aria-label={`Attribute ${index + 1} value`} placeholder="Value" value={row.value} onChange={e => setAttributes(rows => rows.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} /><button className="secondary small" type="button" onClick={() => setAttributes(rows => rows.filter((_, i) => i !== index))}>Remove</button></div>)}<button className="secondary small" type="button" onClick={() => setAttributes(rows => [...rows, { key: '', value: '' }])}>Add attribute</button></div>
    <div className="form-actions"><button className="secondary" type="button" onClick={onCancel}>Cancel</button><button disabled={busy || !types.length} type="submit">{busy ? 'Saving…' : component ? 'Save component' : 'Create component'}</button></div>
  </form>
}
