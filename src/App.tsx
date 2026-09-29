import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { authConfigured, supabase } from './services/auth'
import { ErrorNotice, Loading } from './components/ui'
import Assets from './pages/Assets'
import AssetDetail from './pages/AssetDetail'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Components from './pages/Components'
import Locations from './pages/Locations'
import McpSettings from './pages/McpSettings'
import Racks from './pages/Racks'
import RackDetail from './pages/RackDetail'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const location = useLocation()
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null)
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }
  if (!authConfigured) return <main className="login"><div className="login-card"><img className="login-logo" src="/rackchief-horizontal.png" alt="RackChief" /><h1 className="sr-only">RackChief</h1><ErrorNotice error="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable login." /></div></main>
  return <main className="login"><form className="login-card" onSubmit={submit}>
    <img className="login-logo" src="/rackchief-horizontal.png" alt="RackChief" /><h1 className="sr-only">RackChief</h1><p>Sign in to manage your lab.</p>
    <ErrorNotice error={error} />
    <label className="field"><span>Email</span><input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
    <button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
    {location.state?.reason && <p className="muted">{location.state.reason}</p>}
  </form></main>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false) } })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false) })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  if (loading) return <Loading />
  if (!session) return location.pathname === '/login' ? <Login /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (location.pathname === '/login') return <Navigate to="/assets" replace />
  return <div className="shell">
    <aside className="sidebar"><Link className="brand" to="/assets"><img src="/rackchief-icon.png" alt="" /><span>RackChief</span></Link>
      <nav aria-label="Main navigation"><NavLink to="/assets" className={({ isActive }) => isActive ? 'active' : ''}>Assets</NavLink><NavLink to="/components" className={({ isActive }) => isActive ? 'active' : ''}>Components</NavLink><NavLink to="/locations" className={({ isActive }) => isActive ? 'active' : ''}>Locations</NavLink><NavLink to="/racks" className={({ isActive }) => isActive ? 'active' : ''}>Racks</NavLink><NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>Projects</NavLink><NavLink to="/settings/mcp" className={({ isActive }) => isActive ? 'active' : ''}>MCP settings</NavLink></nav>
      <div className="account"><span title={session.user.email}>{session.user.email}</span><button className="text-button" onClick={() => void supabase!.auth.signOut()}>Sign out</button></div>
    </aside>
    <main className="content"><Routes>
      <Route path="/" element={<Navigate to="/assets" replace />} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/assets/:id" element={<AssetDetail />} />
      <Route path="/components" element={<Components />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/racks" element={<Racks />} />
      <Route path="/racks/:id" element={<RackDetail />} />
      <Route path="/settings/mcp" element={<McpSettings />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="*" element={<div className="panel"><h1>Page not found</h1><Link to="/assets">Go to assets</Link></div>} />
    </Routes></main>
  </div>
}
