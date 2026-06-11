'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

/* ── SVG Bar Chart ── */
function RevenueChart({ data: chartData, loading }: { data: any[]; loading: boolean }) {
  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
  if (!chartData.length) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for selected period</div>

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const W = 600, H = 180, PAD = 40, BAR_GAP = 4

  const barW = Math.max(8, (W - PAD * 2 - BAR_GAP * (chartData.length - 1)) / chartData.length)
  const step = W / chartData.length

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={PAD} y1={PAD + (1 - f) * (H - PAD)} x2={W - PAD} y2={PAD + (1 - f) * (H - PAD)}
          stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* Bars */}
      {chartData.map((d, i) => {
        const barH = Math.max(2, ((d.revenue / maxRevenue) * (H - PAD)))
        const x = PAD + i * step + (step - barW) / 2
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill="url(#barGrad)" opacity="0.9" />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#6b7280">{d.label}</text>
          </g>
        )
      })}
      {/* Y-axis label */}
      <text x={PAD - 4} y={PAD} textAnchor="end" fontSize="9" fill="#9ca3af">
        ₹{(maxRevenue / 1000).toFixed(0)}k
      </text>
    </svg>
  )
}

export default function AnalyticsPage() {

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [chartData, setChartData] = useState<any[]>([])
  const [chartLoading, setChartLoading] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      const query = from && to
        ? `?from=${from}&to=${to}`
        : ''

      const res = await axios.get(`/admin/overview${query}`)
      setData(res.data.data)

    } catch (err: any) {
      console.log(err,"err")
      toast.error(err?.response?.data?.message || "Analytics failed")
    } finally {
      setLoading(false)
    }
  }

  const fetchChart = async (period: string) => {
    setChartLoading(true)
    try {
      const r = await axios.get(`/admin/revenue-chart?period=${period}`)
      setChartData(r.data.data || [])
    } catch { }
    finally { setChartLoading(false) }
  }

  useEffect(() => { fetchAnalytics() }, [])
  useEffect(() => { fetchChart(chartPeriod) }, [chartPeriod])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0)
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ background: 'linear-gradient(135deg, #f0f1ff 0%, #faf5ff 100%)', minHeight: '100vh' }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -400px 0 }
            100% { background-position: 400px 0 }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 4px 20px rgba(99,102,241,0.1) }
            50% { box-shadow: 0 4px 32px rgba(99,102,241,0.22) }
          }
        `}</style>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse h-24 rounded-xl" style={{
            background: 'linear-gradient(90deg, rgba(226,228,255,0.8) 25%, rgba(238,240,255,1) 50%, rgba(226,228,255,0.8) 75%)',
            backgroundSize: '400px 100%',
            animation: `shimmer 1.4s ease infinite ${i * 0.1}s, pulse-glow 2s ease infinite`,
            borderRadius: '16px',
            border: '1px solid rgba(99,102,241,0.1)',
          }} />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6" style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f1ff 0%, #faf5ff 100%)',
      }}>
        No analytics available
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) }
          50%       { transform: translateY(-6px) }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }

        .analytics-page {
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          background: linear-gradient(145deg, #eef0ff 0%, #f7f5ff 40%, #fdf2ff 100%);
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .analytics-page::before {
          content: '';
          position: fixed;
          top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
          animation: float 8s ease-in-out infinite;
        }
        .analytics-page::after {
          content: '';
          position: fixed;
          bottom: -150px; left: -150px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .filter-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 18px;
          padding: 18px 22px;
          box-shadow:
            0 2px 8px rgba(99,102,241,0.08),
            0 12px 40px rgba(99,102,241,0.07),
            inset 0 1px 0 rgba(255,255,255,0.95);
          animation: fadeUp 0.4s cubic-bezier(0.34,1.3,0.64,1) both;
          position: relative;
          z-index: 1;
        }

        .filter-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 6px;
          display: block;
        }

        .filter-input {
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          color: #1e1b4b;
          background: linear-gradient(135deg, #fafbff, #f5f6ff);
          outline: none;
          transition: all 0.18s ease;
          display: block;
          box-shadow: inset 0 1px 3px rgba(99,102,241,0.06), 0 1px 0 rgba(255,255,255,0.8);
        }
        .filter-input:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1), inset 0 1px 3px rgba(99,102,241,0.06);
          background: #ffffff;
        }

        .apply-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 9px 22px;
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: all 0.2s cubic-bezier(0.34,1.4,0.64,1);
          box-shadow:
            0 4px 14px rgba(99,102,241,0.35),
            inset 0 1px 0 rgba(255,255,255,0.25);
          position: relative;
          overflow: hidden;
        }
        .apply-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.22), transparent);
          border-radius: 10px 10px 0 0;
          pointer-events: none;
        }
        .apply-btn:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 24px rgba(99,102,241,0.42), inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .apply-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .metric-card {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 18px;
          padding: 22px 22px 20px;
          box-shadow:
            0 2px 6px rgba(99,102,241,0.06),
            0 10px 36px rgba(99,102,241,0.09),
            inset 0 1px 0 rgba(255,255,255,0.98);
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .metric-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa);
          border-radius: 18px 18px 0 0;
        }
        .metric-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 45%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0));
          pointer-events: none;
        }
        .metric-card:hover {
          transform: translateY(-5px) scale(1.015);
          box-shadow:
            0 4px 8px rgba(99,102,241,0.1),
            0 20px 56px rgba(99,102,241,0.16),
            inset 0 1px 0 rgba(255,255,255,0.98);
          border-color: rgba(99,102,241,0.24);
        }

        .metric-icon {
          width: 40px; height: 40px;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem;
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
          box-shadow: 0 2px 8px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .metric-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #9ca3af;
          position: relative;
          z-index: 1;
        }

        .metric-value {
          font-size: 1.65rem;
          font-weight: 800;
          color: #1e1b4b;
          margin-top: 6px;
          letter-spacing: -0.03em;
          line-height: 1.1;
          position: relative;
          z-index: 1;
          font-family: 'DM Mono', 'DM Sans', monospace;
        }

        .section-label {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a5b4fc;
          margin-bottom: 12px;
          padding-left: 2px;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="p-4 md:p-6 space-y-6 analytics-page">

        {/* ================= FILTER ================= */}
        <div className="filter-card">
          <p className="filter-label" style={{ marginBottom: '12px', fontSize: '0.8rem' }}>🔍 Filter by Date Range</p>
          <div className="flex flex-wrap gap-3 items-end">

            <div>
              <label className="text-sm filter-label">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border rounded-lg p-2 block filter-input"
              />
            </div>

            <div>
              <label className="text-sm filter-label">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border rounded-lg p-2 block filter-input"
              />
            </div>

            <button
              onClick={fetchAnalytics}
              className="bg-black text-white px-4 py-2 rounded-lg apply-btn"
            >
              Apply
            </button>

          </div>
        </div>

        {/* ================= OVERVIEW ================= */}
        <div>
          <p className="section-label">Overview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <MetricCard
              title="Total Revenue"
              value={formatCurrency(data.revenue.total_revenue)}
              icon="💰"
              iconBg="linear-gradient(135deg, #fef3c7, #fde68a)"
              delay={0}
            />

            <MetricCard
              title="Total Orders"
              value={data.orders.total_orders}
              icon="📦"
              iconBg="linear-gradient(135deg, #dbeafe, #bfdbfe)"
              delay={0.06}
            />

            <MetricCard
              title="Total Users"
              value={data.users.total_users}
              icon="👥"
              iconBg="linear-gradient(135deg, #d1fae5, #a7f3d0)"
              delay={0.12}
            />

            <MetricCard
              title="Active Products"
              value={data.products.active_products}
              icon="🛍️"
              iconBg="linear-gradient(135deg, #ede9fe, #ddd6fe)"
              delay={0.18}
            />

          </div>
        </div>

        {/* ================= SECOND ROW ================= */}
        <div>
          <p className="section-label">Performance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <MetricCard
              title="Today Revenue"
              value={formatCurrency(data.todayRevenue)}
              icon="📅"
              iconBg="linear-gradient(135deg, #fce7f3, #fbcfe8)"
              delay={0.24}
            />

            <MetricCard
              title="Month Revenue"
              value={formatCurrency(data.monthRevenue)}
              icon="📈"
              iconBg="linear-gradient(135deg, #e0f2fe, #bae6fd)"
              delay={0.3}
            />

            <GrowthCard
              title="Monthly Growth"
              value={data.monthlyGrowthPercent}
              delay={0.36}
            />

          </div>
        </div>

        {/* ── Revenue Chart ── */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-gray-900 text-lg">Revenue Overview</h2>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${chartPeriod === p ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={chartData} loading={chartLoading} />
          {chartData.length > 0 && (
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Total Revenue</p>
                <p className="font-black text-emerald-700 text-lg">₹{chartData.reduce((s,d)=>s+d.revenue,0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Total Orders</p>
                <p className="font-black text-gray-800 text-lg">{chartData.reduce((s,d)=>s+d.orders,0)}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}


/* ================= COMPONENTS ================= */

function MetricCard({ title, value, icon, iconBg, delay = 0 }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition metric-card"
      style={{ animation: `fadeUp 0.45s cubic-bezier(0.34,1.3,0.64,1) ${delay}s both` }}
    >
      {icon && (
        <div className="metric-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <p className="text-sm text-gray-500 metric-title">{title}</p>
      <h2 className="text-2xl font-bold mt-2 break-words metric-value">{value}</h2>
    </div>
  )
}

function GrowthCard({ title, value, delay = 0 }: any) {

  const isPositive = value >= 0

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition metric-card"
      style={{
        animation: `fadeUp 0.45s cubic-bezier(0.34,1.3,0.64,1) ${delay}s both`,
        background: isPositive
          ? 'linear-gradient(135deg, rgba(236,253,245,0.92), rgba(255,255,255,0.95))'
          : 'linear-gradient(135deg, rgba(254,242,242,0.92), rgba(255,255,255,0.95))',
      }}
    >
      <div className="metric-icon" style={{
        background: isPositive
          ? 'linear-gradient(135deg, #d1fae5, #6ee7b7)'
          : 'linear-gradient(135deg, #fee2e2, #fca5a5)',
      }}>
        {isPositive ? '🚀' : '📉'}
      </div>

      <p className="text-sm text-gray-500 metric-title">{title}</p>

      <h2
        className={`text-2xl font-bold mt-2 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        } metric-value`}
        style={{
          background: isPositive
            ? 'linear-gradient(135deg, #059669, #10b981)'
            : 'linear-gradient(135deg, #dc2626, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}% {isPositive ? '↑' : '↓'}
      </h2>

      <div style={{
        marginTop: '12px',
        height: '4px',
        borderRadius: '99px',
        background: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(Math.abs(value), 100)}%`,
          background: isPositive
            ? 'linear-gradient(90deg, #10b981, #6ee7b7)'
            : 'linear-gradient(90deg, #ef4444, #fca5a5)',
          borderRadius: '99px',
          transition: 'width 1s cubic-bezier(0.34,1.3,0.64,1)',
          boxShadow: isPositive
            ? '0 0 8px rgba(16,185,129,0.4)'
            : '0 0 8px rgba(239,68,68,0.4)',
        }} />
      </div>
    </div>
  )
}