'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Shield, RefreshCw, Unlock, Lock, Loader2, Search } from 'lucide-react'

interface IpBlock {
  ip: string
  blocked_until: string
  violation_count: number
  reason: string
  created_at: string
  updated_at: string
}

function timeLeft(until: string) {
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.ceil(h / 24)}d`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function reasonLabel(r: string) {
  const map: Record<string, string> = {
    auth_rate_limit: 'Rate limit exceeded',
    manual_admin_block: 'Manually blocked',
    rate_limit_exceeded: 'Rate limit exceeded',
  }
  return map[r] || r
}

export default function SecurityPage() {
  const [blocks, setBlocks]       = useState<IpBlock[]>([])
  const [loading, setLoading]     = useState(false)
  const [activeOnly, setActiveOnly] = useState(true)
  const [search, setSearch]       = useState('')

  // manual block form
  const [manualIp, setManualIp]     = useState('')
  const [manualHours, setManualHours] = useState(24)
  const [blocking, setBlocking]     = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/admin/security/ip-blocks?active=${activeOnly}&limit=200`)
      setBlocks(res.data?.data || [])
    } catch {
      toast.error('Failed to load IP blocks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeOnly])

  const unblock = async (ip: string) => {
    if (!confirm(`Unblock ${ip}?`)) return
    try {
      await axios.delete(`/admin/security/ip-blocks/${encodeURIComponent(ip)}`)
      toast.success(`${ip} unblocked`)
      load()
    } catch {
      toast.error('Failed to unblock')
    }
  }

  const manualBlock = async () => {
    if (!manualIp.trim()) return toast.error('Enter an IP address')
    setBlocking(true)
    try {
      await axios.post('/admin/security/ip-blocks/block', {
        ip: manualIp.trim(),
        hours: manualHours,
        reason: 'manual_admin_block',
      })
      toast.success(`${manualIp} blocked for ${manualHours}h`)
      setManualIp('')
      load()
    } catch {
      toast.error('Block failed')
    } finally {
      setBlocking(false)
    }
  }

  const filtered = blocks.filter(b =>
    b.ip.includes(search) || b.reason.includes(search)
  )

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 py-8 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} style={{ color: '#f87171' }} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold">Security — IP Blocks</h1>
            </div>
            <p className="text-slate-400 text-sm mt-2 ml-12">
              IPs are blocked automatically when they exceed login rate limits. Blocks escalate: 1st violation → 1h, 3rd → 24h, 6th → 7 days.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* MANUAL BLOCK */}
        <div style={{ background: '#141821', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 14 }}>Block an IP manually</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>IP ADDRESS</label>
              <input
                value={manualIp}
                onChange={e => setManualIp(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0f1623', color: '#f1f5f9', fontSize: 13 }}
              />
            </div>
            <div style={{ minWidth: 120 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>DURATION (HOURS)</label>
              <input
                type="number"
                value={manualHours}
                onChange={e => setManualHours(Number(e.target.value) || 24)}
                min={1}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0f1623', color: '#f1f5f9', fontSize: 13 }}
              />
            </div>
            <button
              onClick={manualBlock}
              disabled={blocking}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: blocking ? 'not-allowed' : 'pointer', opacity: blocking ? 0.6 : 1 }}
            >
              {blocking ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Block IP
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by IP or reason..."
              style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#141821', color: '#f1f5f9', fontSize: 13, width: 220 }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={e => setActiveOnly(e.target.checked)}
              style={{ width: 14, height: 14 }}
            />
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Active blocks only</span>
          </label>
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
            {filtered.length} {activeOnly ? 'active' : 'total'} block{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* TABLE */}
        <div style={{ background: '#141821', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
              <Loader2 size={26} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#475569' }}>
              <Shield size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>{activeOnly ? 'No active IP blocks' : 'No IP blocks recorded'}</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Blocks are created automatically when the rate limit is exceeded.</p>
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
                      <tr key={b.ip} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: expired ? '#0f1623' : '#141821' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: expired ? '#475569' : '#f87171' }}>{b.ip}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                            background: b.violation_count >= 6 ? 'rgba(239,68,68,0.15)' : b.violation_count >= 3 ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.15)',
                            color: b.violation_count >= 6 ? '#f87171' : b.violation_count >= 3 ? '#fbbf24' : '#94a3b8',
                          }}>
                            {b.violation_count}×
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{reasonLabel(b.reason)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: expired ? '#334155' : '#fbbf24', background: expired ? 'rgba(100,116,139,0.08)' : 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                            {expired ? 'Expired' : timeLeft(b.blocked_until)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                          {new Date(b.blocked_until).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {!expired && (
                            <button
                              onClick={() => unblock(b.ip)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.3)', background: 'transparent', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
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
    </div>
  )
}
