import type { ReactNode } from 'react'

export function ErrorNotice({ error }: { error: string | null }) { return error ? <div role="alert" className="notice error">{error}</div> : null }
export function Loading() { return <div className="notice" role="status" aria-live="polite">Loading…</div> }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div> }
export function Badge({ value }: { value: string }) { return <span className={`badge badge-${value}`}>{value.replaceAll('_', ' ')}</span> }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label> }
export function formatDate(value: string | null) { return value ? (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) ? value : new Date(value).toLocaleDateString()) : '—' }
export function formatMoney(value: number | null) { return value == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value) }
export function optional(value: string) { return value.trim() || null }
export function amount(value: string): number | null { return value.trim() === '' ? null : Number(value) }
export function confirmDelete(name: string) { return window.confirm(`Permanently delete “${name}”? This cannot be undone.`) }
