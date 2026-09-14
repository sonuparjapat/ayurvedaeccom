'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Shield, RefreshCw, Unlock, Lock, Loader2, Search, Activity, AlertTriangle, CheckCircle, XCircle, LogIn, LogOut, Key } from 'lucide-react'

/* ─── Types ─── */
interface IpBlock {
  ip: string; blocked_until: string; violation_count: number; reason: string; created_at: string
}
interface SecEvent {
  id: number; user_id: number | null; event_type: string; email: string | null
  ip: string | null; user_agent: string | null; metadata: Record<string, any>
  created_at: string; user_name: string | null
}

/* ─── Helpers ─── */
function timeLeft(until: string) {
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.ceil(h / 24)}d`
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const EVENT_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  login_success:           { label: 'Login Success',       icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  login_failed:            { label: 'Login Failed',        icon: XCircle,     color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  logout:                  { label: 'Logout',              icon: LogOut,      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  new_ip_login:            { label: 'New IP Login',        icon: AlertTriangle,color:'#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  account_warned:          { label: '3× Warning',          icon: AlertTriangle,color:'#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  account_soft_locked:     { label: 'Soft Locked',         icon: Lock,        color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  account_hard_locked:     { label: 'Hard Locked',         icon: Lock,        color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
  account_unlocked_email:  { label: 'Unlocked (Email)',    icon: Unlock,      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  account_unlocked_cron:   { label: 'Unlocked (Auto)',     icon: Unlock,      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  otp_requested:           { label: 'OTP Requested',       icon: Key,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  otp_verified:            { label: 'OTP Verified',        icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  otp_failed:              { label: 'OTP Failed',          icon: XCircle,     color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  password_reset_requested:{ label: 'Reset Requested',     icon: Key,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  password_reset_completed:{ label: 'Reset Completed',     icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  password_changed:        { label: 'Password Changed',    icon: Key,         color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  user_registered:         { label: 'Registered',          icon: LogIn,       color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  admin_login_success:     { label: 'Admin Login OK',      icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  admin_login_failed:      { label: 'Admin Login Failed',  icon: XCircle,     color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  admin_2fa_verified:      { label: 'Admin 2FA OK',        icon: Shield,      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  admin_logout:            { label: 'Admin Logout',        icon: LogOut,      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  ip_blocked:              { label: 'IP Blocked',          icon: Shield,      color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
}

function EventBadge({ type }: { type: string }) {
  const m = EVENT_META[type] || { label: type, icon: Activity, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  const Icon = m.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <Icon size={10} />{m.label}
    </span>
  )
}

/* ════════════════ IP BLOCKS TAB ════════════════ */
function IpBlocksTab() {
  const [blocks, setBlocks]     = useState<IpBlock[]>([])
  const [loading, setLoading]   = useState(false)
  const [activeOnly, setActiveOnly] = useState(true)
  const [search, setSearch]     = useState('')
  const [manualIp, setManualIp] = useState('')
  const [manualHours, setManualHours] = useState(24)
  const [blocking, setBlocking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/admin/security/ip-blocks?active=${activeOnly}&limit=200`)
      setBlocks(res.data?.data || [])
    } catch { toast.error('Failed to load IP blocks') }
    finally { setLoading(false) }
  }, [activeOnly])

  useEffect(() => { load() }, [load])

  const unblock = async (ip: string) => {
    if (!confirm(`Unblock ${ip}?`)) return
    try { await axios.delete(`/admin/security/ip-blocks/${encodeURIComponent(ip)}`); toast.success(`${ip} unblocked`); load() }
    catch { toast.error('Failed to unblock') }
  }

  const manualBlock = async () => {
    if (!manualIp.trim()) return toast.error('Enter an IP address')
    setBlocking(true)
    try {
      await axios.post('/admin/security/ip-blocks/block', { ip: manualIp.trim(), hours: manualHours, reason: 'manual_admin_block' })
      toast.success(`${manualIp} blocked for ${manualHours}h`); setManualIp(''); load()
    } catch { toast.error('Block failed') }
    finally { setBlocking(false) }
  }

  const filtered = blocks.filter(b => b.ip.includes(search) || b.reason.includes(search))

  return (
    <div className="space-y-5">
      {/* Manual block */}
      <div style={{ background: '#141821', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Block an IP manually</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>IP ADDRESS</label>
            <input value={manualIp} onChange={e => setManualIp(e.target.value)} placeholder="e.g. 192.168.1.1"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0f1623', color: '#f1f5f9', fontSize: 13 }} />
          </div>
          <div style={{ minWidth: 110 }}>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>HOURS</label>
            <input type="number" value={manualHours} onChange={e => setManualHours(Number(e.target.value) || 24)} min={1}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0f1623', color: '#f1f5f9', fontSize: 13 }} />
          </div>
          <button onClick={manualBlock} disabled={blocking}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: blocking ? 'not-allowed' : 'pointer', opacity: blocking ? 0.6 : 1 }}>
            {blocking ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Block IP
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by IP or reason..."
            style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#141821', color: '#f1f5f9', fontSize: 13, width: 220 }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Active only</span>
        </label>
        <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{filtered.length} block{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ background: '#141821', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}>
            <Loader2 size={26} style={{ color: '#34d399' }} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px 24px', color: '#475569' }}>
            <Shield size={30} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>{activeOnly ? 'No active IP blocks' : 'No blocks recorded'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f1623', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['IP Address', 'Violations', 'Reason', 'Time Left', 'Blocked Until', 'Action'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const expired = new Date(b.blocked_until) <= new Date()
                  return (
                    <tr key={b.ip} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: expired ? '#475569' : '#f87171' }}>{b.ip}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: b.violation_count >= 6 ? 'rgba(239,68,68,0.15)' : b.violation_count >= 3 ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.15)', color: b.violation_count >= 6 ? '#f87171' : b.violation_count >= 3 ? '#fbbf24' : '#94a3b8' }}>{b.violation_count}×</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{b.reason.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: expired ? '#334155' : '#fbbf24', background: expired ? 'rgba(100,116,139,0.08)' : 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 6 }}>{expired ? 'Expired' : timeLeft(b.blocked_until)}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{new Date(b.blocked_until).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {!expired && (
                          <button onClick={() => unblock(b.ip)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.3)', background: 'transparent', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <Unlock size={11} /> Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════ SECURITY EVENTS TAB ════════════════ */
const EVENT_TYPES = [
  'login_success','login_failed','logout','new_ip_login',
  'account_warned','account_soft_locked','account_hard_locked',
  'account_unlocked_email','account_unlocked_cron',
  'otp_requested','otp_verified','otp_failed',
  'password_reset_requested','password_reset_completed','password_changed',
  'user_registered',
  'admin_login_success','admin_login_failed','admin_2fa_verified','admin_logout',
  'ip_blocked',
]

function SecurityEventsTab() {
  const [events, setEvents]   = useState<SecEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [filterType, setFilterType] = useState('')
  const [filterIp, setFilterIp]     = useState('')
  const [filterEmail, setFilterEmail] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: 50 }
      if (filterType) params.event_type = filterType
      if (filterIp)   params.ip         = filterIp
      const res = await axios.get('/admin/security/events', { params })
      setEvents(res.data.events || [])
      setTotal(res.data.total || 0)
    } catch { toast.error('Failed to load security events') }
    finally { setLoading(false) }
  }, [page, filterType, filterIp])

  useEffect(() => { load() }, [load])

  const filtered = filterEmail
    ? events.filter(e => (e.email || '').toLowerCase().includes(filterEmail.toLowerCase()) || (e.user_name || '').toLowerCase().includes(filterEmail.toLowerCase()))
    : events

  const pages = Math.ceil(total / 50)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>EVENT TYPE</label>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#141821', color: '#f1f5f9', fontSize: 13, minWidth: 180 }}>
            <option value="">All events</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_META[t]?.label || t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>IP ADDRESS</label>
          <input value={filterIp} onChange={e => { setFilterIp(e.target.value); setPage(1) }} placeholder="Filter by IP..."
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#141821', color: '#f1f5f9', fontSize: 13, width: 160 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>USER / EMAIL</label>
          <input value={filterEmail} onChange={e => setFilterEmail(e.target.value)} placeholder="Filter by email..."
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#141821', color: '#f1f5f9', fontSize: 13, width: 200 }} />
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
        <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto', alignSelf: 'center' }}>{total.toLocaleString()} total events</span>
      </div>

      {/* Table */}
      <div style={{ background: '#141821', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}>
            <Loader2 size={26} style={{ color: '#34d399' }} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px 24px', color: '#475569' }}>
            <Activity size={30} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>No events found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f1623', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Time', 'Event', 'User', 'IP Address', 'Details'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <EventBadge type={e.event_type} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {e.user_name && <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{e.user_name}</div>}
                      {e.email && <div style={{ fontSize: 11, color: '#64748b' }}>{e.email}</div>}
                      {!e.user_name && !e.email && <span style={{ fontSize: 11, color: '#334155' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                      {e.ip || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', maxWidth: 240 }}>
                      {e.metadata && Object.keys(e.metadata).length > 0
                        ? Object.entries(e.metadata).map(([k, v]) => (
                            <span key={k} style={{ marginRight: 8 }}>
                              <span style={{ color: '#475569' }}>{k}:</span>{' '}
                              <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{String(v)}</span>
                            </span>
                          ))
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? '#334155' : '#94a3b8', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#475569' }}>Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === pages ? '#334155' : '#94a3b8', fontSize: 13, cursor: page === pages ? 'not-allowed' : 'pointer' }}>Next →</button>
        </div>
      )}
    </div>
  )
}

/* ════════════════ PAGE ════════════════ */
type Tab = 'ip-blocks' | 'events'

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>('events')

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} style={{ color: '#f87171' }} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Security Centre</h1>
            <p className="text-slate-400 text-sm">Audit log, IP blocks, and login monitoring</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
          {([['events', 'Security Events', Activity], ['ip-blocks', 'IP Blocks', Shield]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: '8px 8px 0 0', border: 'none', borderBottom: tab === id ? '2px solid #34d399' : '2px solid transparent', background: tab === id ? 'rgba(52,211,153,0.08)' : 'transparent', color: tab === id ? '#34d399' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {tab === 'events'    && <SecurityEventsTab />}
        {tab === 'ip-blocks' && <IpBlocksTab />}

      </div>
    </div>
  )
}
