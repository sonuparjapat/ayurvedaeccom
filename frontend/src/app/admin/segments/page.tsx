'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Users, TrendingUp, AlertTriangle, Crown, Zap, Star } from 'lucide-react'

interface Segments {
  new_users: number; loyal: number; high_value: number; inactive: number; vip: number
}
interface TopSpender {
  id: number; name: string; email: string; orders: number; total_spent: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function CustomerSegmentsPage() {
  const [segments, setSegments] = useState<Segments | null>(null)
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/admin/customer-segments')
      .then(r => {
        if (r.data?.success) {
          setSegments(r.data.segments)
          setTopSpenders(r.data.top_spenders || [])
        }
      }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const CARDS = [
    { key: 'new_users', label: 'New Users', sub: 'Registered in last 30 days, no orders', icon: <Users size={22} />, gradient: 'linear-gradient(135deg,#2563eb,#7c3aed)', bg: '#eff6ff' },
    { key: 'loyal', label: 'Loyal Customers', sub: '3+ delivered orders', icon: <Star size={22} />, gradient: 'linear-gradient(135deg,#059669,#0d9488)', bg: '#f0fdf4' },
    { key: 'high_value', label: 'High-Value Orders', sub: 'Single order > ₹5,000', icon: <TrendingUp size={22} />, gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', bg: '#fff7ed' },
    { key: 'vip', label: 'VIP Customers', sub: 'Lifetime spend > ₹10,000', icon: <Crown size={22} />, gradient: 'linear-gradient(135deg,#b45309,#d97706)', bg: '#fef3c7' },
    { key: 'inactive', label: 'At-Risk / Inactive', sub: 'No activity in 90+ days', icon: <AlertTriangle size={22} />, gradient: 'linear-gradient(135deg,#dc2626,#f97316)', bg: '#fef2f2' },
  ]

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a2e1e', margin: 0 }}>Customer Segments</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Understand your customer base and target the right segments.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CARDS.map(card => (
            <div key={card.key} style={{ background: '#fff', borderRadius: 18, padding: '20px 18px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 12 }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1a2e1e', lineHeight: 1.1, marginBottom: 4 }}>
                {segments ? segments[card.key as keyof Segments].toLocaleString('en-IN') : '–'}
              </div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#374151', margin: '0 0 3px' }}>{card.label}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Segmentation Tips ── */}
      <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '1px solid #a7f3d0', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Zap size={18} color="#059669" />
          <p style={{ fontWeight: 700, color: '#065f46', fontSize: 14, margin: 0 }}>Recommended Actions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Win Back Inactive', action: 'Send a special 20% discount coupon to inactive customers via Push Notifications or Newsletter.', link: '/admin/push-notifications' },
            { label: 'Reward VIPs', action: 'Create an exclusive coupon for customers with lifetime spend >₹10K and send via newsletter.', link: '/admin/newsletter' },
            { label: 'Convert New Users', action: 'Send a welcome email with a first-order coupon to users who haven\'t placed an order yet.', link: '/admin/newsletter' },
          ].map(tip => (
            <div key={tip.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #d1fae5' }}>
              <p style={{ fontWeight: 700, color: '#065f46', fontSize: 13, margin: '0 0 6px' }}>{tip.label}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>{tip.action}</p>
              <a href={tip.link} style={{ fontSize: 12, color: '#059669', fontWeight: 600, textDecoration: 'none' }}>→ Go there</a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Spenders ── */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown size={18} color="#d97706" />
          <h2 style={{ fontWeight: 700, fontSize: 16, color: '#1a2e1e', margin: 0 }}>Top 10 Spenders (All Time)</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['#', 'Customer', 'Email', 'Orders', 'Total Spent'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSpenders.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No data yet</td></tr>
              ) : topSpenders.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13, fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a2e1e', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `hsl(${(i * 47) % 360},60%,85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: `hsl(${(i * 47) % 360},60%,30%)`, flexShrink: 0 }}>
                        {s.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      {s.name}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{s.email}</td>
                  <td style={{ padding: '12px 16px', color: '#374151', fontSize: 13, textAlign: 'center' }}>{s.orders}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(s.total_spent))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
