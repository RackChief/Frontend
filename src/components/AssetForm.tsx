import { useState, type FormEvent } from 'react'
import { assetStatuses, type Asset, type AssetType, type CreateAsset, type EditableAssetStatus, type Location, type UpdateAsset } from '../types/api'
import { ErrorNotice, Field } from './ui'

export default function AssetForm({ asset, types, locations = [], onSave, onCancel }: { asset?: Asset; types: AssetType[]; locations?: Location[]; onSave: (input: CreateAsset | UpdateAsset) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(asset?.name ?? '')
  const [assetTypeId, setAssetTypeId] = useState(asset?.assetTypeId ?? types[0]?.id ?? '')
  const [status, setStatus] = useState<EditableAssetStatus>(asset?.status === 'archived' ? 'active' : asset?.status ?? 'active')
  const [locationId, setLocationId] = useState(asset?.locationId ?? '')
  const [hostname, setHostname] = useState(asset?.hostname ?? '')
  const [ipAddress, setIpAddress] = useState(asset?.ipAddress ?? '')
  const [manufacturer, setManufacturer] = useState(asset?.manufacturer ?? '')
  const [model, setModel] = useState(asset?.model ?? '')
  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber ?? '')
  const [notes, setNotes] = useState(asset?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !assetTypeId) { setError('Name and asset type are required.'); return }
    const fields = { name: name.trim(), assetTypeId, status, locationId: locationId || null, hostname: hostname.trim(), ipAddress: ipAddress.trim(), manufacturer: manufacturer.trim(), model: model.trim(), serialNumber: serialNumber.trim(), notes: notes.trim() }
    const input: CreateAsset | UpdateAsset = asset
      ? { ...fields, hostname: fields.hostname || null, ipAddress: fields.ipAddress || null, manufacturer: fields.manufacturer || null, model: fields.model || null, serialNumber: fields.serialNumber || null, notes: fields.notes || null }
      : fields
    setBusy(true); setError(null)
    try { await onSave(input) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save asset.') } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="form-grid"><ErrorNotice error={error} />
    <Field label="Name *"><input required value={name} onChange={e => setName(e.target.value)} /></Field>
    <Field label="Asset type *"><select required value={assetTypeId} onChange={e => setAssetTypeId(e.target.value)}><option value="">Select type</option>{types.map(type => <option value={type.id} key={type.id}>{type.name}</option>)}</select></Field>
    <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value as EditableAssetStatus)}>{assetStatuses.map(value => <option key={value} value={value}>{value}</option>)}</select></Field>
    <Field label="Location"><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">No location</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field>
    <Field label="Hostname"><input value={hostname} onChange={e => setHostname(e.target.value)} /></Field>
    <Field label="IP address"><input value={ipAddress} onChange={e => setIpAddress(e.target.value)} placeholder="IPv4 or IPv6" /></Field>
    <Field label="Manufacturer"><input value={manufacturer} onChange={e => setManufacturer(e.target.value)} /></Field>
    <Field label="Model"><input value={model} onChange={e => setModel(e.target.value)} /></Field>
    <Field label="Serial number"><input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} /></Field>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button disabled={busy || !types.length}>{busy ? 'Saving…' : 'Save asset'}</button></div>
  </form>
}
