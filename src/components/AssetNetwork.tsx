import { useEffect, useState } from 'react'
import AssetInterfaces from './AssetInterfaces'
import AssetPorts from './AssetPorts'
import { ErrorNotice, Loading } from './ui'
import { api } from '../services/api'
import type { Asset, AssetDetailModel, NetworkConnection, NetworkPort } from '../types/api'

export default function AssetNetwork({ asset, assets, onRefresh }: { asset: AssetDetailModel; assets: Asset[]; onRefresh: () => Promise<void> }) {
  const [ports, setPorts] = useState<NetworkPort[]>([])
  const [connections, setConnections] = useState<NetworkConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void Promise.all([api.network.ports.list(), api.network.connections.list()]).then(([allPorts, allConnections]) => { if (active) { setPorts(allPorts); setConnections(allConnections) } }).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [asset.id])
  async function refresh() { const [allPorts, allConnections] = await Promise.all([api.network.ports.list(), api.network.connections.list(), onRefresh()]); setPorts(allPorts); setConnections(allConnections) }
  return <><h2 className="inventory-heading">Network</h2><AssetInterfaces asset={asset} onRefresh={refresh} />{loading ? <Loading /> : <><ErrorNotice error={error} /><AssetPorts asset={asset} assets={assets} allPorts={ports} connections={connections} onRefresh={refresh} /></>}</>
}
