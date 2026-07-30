'use client'

import { useState, useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import { io, Socket } from 'socket.io-client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Users, Package, ShoppingCart, BarChart3, AlertTriangle, TrendingUp, Clock, ArrowUpRight, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'

/* ─── TYPES ─────────────────────────────────────────────── */
interface DashboardStats {
  totalRevenue: number; totalOrders: number; totalUsers: number
  totalProducts: number; pendingOrders: number; lowStockItems: number
}
interface ChartPoint { label: string; revenue: number; orders: number }
interface Order { id: string; order_number: string; customer: string; amount: number; status: string }
interface TopProduct { name: string; sales: number; revenue: number; stock: number }
interface NewOrderToast { id: number; order_id: number; user_id: number; at: number }

/* ─── HELPERS ────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<number, string> = {
  0: 'bg-yellow-100 text-yellow-800', 1: 'bg-blue-100 text-blue-800',
  2: 'bg-purple-100 text-purple-800', 3: 'bg-cyan-100 text-cyan-800',
  4: 'bg-teal-100 text-teal-800',    5: 'bg-green-100 text-green-800',
  6: 'bg-red-100 text-red-800',      7: 'bg-orange-100 text-orange-800',
}

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0, pendingOrders: 0, lowStockItems: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [chartLoading, setChartLoading] = useState(false)
  const [toasts, setToasts] = useState<NewOrderToast[]>([])
  const socketRef = useRef<Socket | null>(null)
  const { statusList } = useAuth()

  /* ─── load ─── */
  useEffect(() => { loadDashboard() }, [])

  useEffect(() => {
    loadChart(chartPeriod)
  }, [chartPeriod])

  /* ─── Socket.io — real-time new order toast ─── */
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.emit('join_admin')
    socket.on('new_order', (data: { order_id: number; user_id: number }) => {
      const toast: NewOrderToast = { id: Date.now(), order_id: data.order_id, user_id: data.user_id, at: Date.now() }
      setToasts(prev => [toast, ...prev].slice(0, 5))
      axios.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
      axios.get('/admin/recent-orders').then(r => setRecentOrders(r.data)).catch(() => {})
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 6000)
    })
    socket.on('order_status_changed', () => {
      axios.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
      axios.get('/admin/recent-orders').then(r => setRecentOrders(r.data)).catch(() => {})
    })
    return () => { socket.disconnect() }
  }, [])

  const loadDashboard = async () => {
    try {
      const [s, o, p, l] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/recent-orders'),
        axios.get('/admin/top-products'),
        axios.get('/admin/low-stock'),
      ])
      setStats(s.data)
      setRecentOrders(o.data)
      setTopProducts(p.data)
      setLowStockProducts(l.data?.products || [])
    } catch { } finally { setLoading(false) }
  }

  const loadChart = async (period: string) => {
    setChartLoading(true)
    try {
      const r = await axios.get(`/admin/revenue-chart?period=${period}`)
      setChartData(r.data?.data || [])
    } catch { } finally { setChartLoading(false) }
  }

  /* ─── loading ─── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="w-full space-y-6 relative">

      {/* ── Real-time order toasts ── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              style={{
                background: 'linear-gradient(135deg, #0f2d1e, #1a4a28)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: 16, padding: '14px 18px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', gap: 12,
                minWidth: 280, pointerEvents: 'all', cursor: 'pointer',
              }}
              onClick={() => window.open(`/admin/orders?id=${t.order_id}`, '_blank')}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={18} color="#10b981" />
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>🎉 New Order #{t.order_id}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0, marginTop: 2 }}>Click to view order details</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Revenue" value={fmt(stats.totalRevenue)} icon={<DollarSign size={18} />} gradient="from-emerald-600 to-teal-600" sub="All time" />
        <KpiCard title="Orders" value={String(stats.totalOrders)} icon={<ShoppingCart size={18} />} gradient="from-blue-600 to-indigo-600" sub="Total" />
        <KpiCard title="Users" value={String(stats.totalUsers)} icon={<Users size={18} />} gradient="from-violet-600 to-purple-600" sub="Registered" />
        <KpiCard title="Products" value={String(stats.totalProducts)} icon={<Package size={18} />} gradient="from-orange-500 to-amber-500" sub="Active" />
        <KpiCard title="Pending" value={String(stats.pendingOrders)} icon={<Clock size={18} />} gradient="from-yellow-500 to-orange-500" sub="Awaiting" alert={stats.pendingOrders > 0} pulse={stats.pendingOrders > 0} />
        <KpiCard title="Low Stock" value={String(stats.lowStockItems)} icon={<AlertTriangle size={18} />} gradient="from-red-500 to-rose-600" sub="Products" alert={stats.lowStockItems > 0} pulse={stats.lowStockItems > 0} />
      </div>

      {/* ── Revenue Chart ── */}
      <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#1a2e1e', margin: 0 }}>Revenue & Orders</p>
              <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Performance over time</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)}
                style={{ padding: '5px 14px', borderRadius: 99, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                  background: chartPeriod === p ? 'linear-gradient(135deg,#059669,#0d9488)' : 'transparent',
                  borderColor: chartPeriod === p ? 'transparent' : '#e5e7eb',
                  color: chartPeriod === p ? '#fff' : '#6b7280',
                }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {chartLoading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>No data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(value: any, name: string) => [name === 'revenue' ? fmt(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} name="revenue" />
              <Area yAxisId="ord" type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} fill="url(#ordGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} name="orders" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-5">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Orders */}
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1e', margin: 0 }}>Recent Orders</p>
                <Link href="/admin/orders" style={{ fontSize: 12, color: '#059669', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  View all <ArrowUpRight size={13} />
                </Link>
              </div>
              <div style={{ padding: '8px 0', maxHeight: 360, overflowY: 'auto' }}>
                {recentOrders.map((o, i) => (
                  <motion.div key={o.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f9fafb', gap: 12 }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#1a2e1e', margin: 0 }}>#{o.order_number}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{o.customer}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge className={STATUS_COLOR[o?.status as any] || 'bg-gray-100 text-gray-700'}>
                        {statusList?.find((item: any) => item.code == o.status)?.label || `Status ${o.status}`}
                      </Badge>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#059669', whiteSpace: 'nowrap' }}>{fmt(o.amount)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1e', margin: 0 }}>Top Products</p>
                <Link href="/admin/products" style={{ fontSize: 12, color: '#059669', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  View all <ArrowUpRight size={13} />
                </Link>
              </div>
              <div style={{ padding: '8px 0', maxHeight: 360, overflowY: 'auto' }}>
                {topProducts.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f9fafb', gap: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: '#1a2e1e', margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{p.sales} sold · Stock: {p.stock}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#059669', whiteSpace: 'nowrap' }}>{fmt(p.revenue)}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="lg:col-span-2" style={{ background: '#fffbeb', borderRadius: 18, border: '1px solid #fde68a', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#92400e', margin: 0 }}>Low Stock Alert — {lowStockProducts.length} products</p>
                </div>
                <div style={{ padding: '8px 12px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {lowStockProducts.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, padding: '8px 12px', border: '1px solid #fde68a' }}>
                      {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 12, color: '#1a2e1e', margin: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <span style={{ fontSize: 11, color: p.inventory === 0 ? '#dc2626' : '#d97706', fontWeight: 600 }}>{p.inventory === 0 ? 'Out of stock' : `${p.inventory} left`}</span>
                      </div>
                      <Link href={`/admin/products?edit=${p.id}`} style={{ fontSize: 11, color: '#059669', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}>Update</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders"><AdminLinkCard title="Order Management" desc="Manage orders, shipping and status." href="/admin/orders" icon={<ShoppingCart />} /></TabsContent>
        <TabsContent value="products"><AdminLinkCard title="Product Management" desc="Manage all products and stock." href="/admin/products" icon={<Package />} /></TabsContent>
        <TabsContent value="users"><AdminLinkCard title="User Management" desc="Manage registered customers." href="/admin/users" icon={<Users />} /></TabsContent>
        <TabsContent value="analytics"><AdminLinkCard title="Analytics" desc="View reports and performance." href="/admin/analytics" icon={<BarChart3 />} /></TabsContent>
      </Tabs>
    </div>
  )
}

/* ─── COUNT UP HOOK ──────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    const start = Date.now()
    const from = 0
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])
  return display
}

/* ─── KPI CARD ───────────────────────────────────────────── */
function KpiCard({ title, value, icon, gradient, sub, alert, pulse }: { title: string; value: string; icon: React.ReactNode; gradient: string; sub: string; alert?: boolean; pulse?: boolean }) {
  const rawNum = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
  const isMonetary = value.startsWith('₹')
  const counted = useCountUp(rawNum)
  const displayValue = isMonetary
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(counted)
    : String(counted)
  const gradColor = gradient.includes('emerald') ? '#059669,#0d9488' : gradient.includes('blue') ? '#2563eb,#6366f1' : gradient.includes('violet') ? '#7c3aed,#9333ea' : gradient.includes('orange') ? '#f97316,#f59e0b' : gradient.includes('yellow') ? '#eab308,#f97316' : '#ef4444,#f43f5e'

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'white', borderRadius: 18, padding: '16px', border: alert ? '1px solid #fca5a5' : '1px solid #e5e7eb', boxShadow: alert ? '0 0 0 3px rgba(239,68,68,0.06)' : '0 1px 6px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${gradColor})` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, marginTop: 6 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${gradColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          {icon}
        </div>
        {alert && (
          <motion.span
            animate={pulse ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', display: 'inline-block', boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }}
          />
        )}
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color: '#1a2e1e', margin: 0, lineHeight: 1.1 }}>{displayValue}</p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sub}</p>
    </motion.div>
  )
}

/* ─── LINK CARD ──────────────────────────────────────────── */
function AdminLinkCard({ title, desc, href, icon }: { title: string; desc: string; href: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e5e7eb', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#1a2e1e', margin: 0 }}>{title}</p>
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{desc}</p>
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
        Go to {title} <ArrowUpRight size={14} />
      </Link>
    </div>
  )
}
