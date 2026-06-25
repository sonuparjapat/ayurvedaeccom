'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  Eye, Users, Monitor, Smartphone, Globe, Clock, TrendingUp,
  RefreshCw, Activity, Laptop, Tablet,
} from 'lucide-react'

interface Stats {
  totalViews: number
  uniqueVisitors: number
  todayViews: number
  todayUnique: number
  liveVisitors: number
  topPages: { path: string; views: string; unique_visitors: string }[]
  deviceBreakdown: { device_type: string; count: string }[]
  browserBreakdown: { browser: string; count: string }[]
  dailyChart: { date: string; views: string; visitors: string }[]
  period: string
}

const PERIODS = [
  { val: '24h', label: 'Last 24h' },
  { val: '7d', label: 'Last 7 days' },
  { val: '30d', label: 'Last 30 days' },
  { val: '90d', label: 'Last 90 days' },
]

const DEVICE_ICONS: Record<string, any> = {
  desktop: <Laptop size={16} />,
  mobile: <Smartphone size={16} />,
  tablet: <Tablet size={16} />,
  unknown: <Monitor size={16} />,
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: 'bg-blue-50 text-blue-700',
  mobile: 'bg-green-50 text-green-700',
  tablet: 'bg-purple-50 text-purple-700',
  unknown: 'bg-gray-50 text-gray-700',
}

export default function AdminVisitorsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('7d')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/analytics/visitors', { params: { period } })
      setStats(res.data.data)
    } catch { notify.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  useEffect(() => {
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [period])

  const maxViews = stats?.dailyChart?.length
    ? Math.max(...stats.dailyChart.map(d => Number(d.views)), 1)
    : 1

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Visitor Analytics</h1>
              <p className="text-white/70 text-sm">Track website traffic and user behavior</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                <Activity size={14} className="text-green-300 animate-pulse" />
                <span className="text-sm font-semibold">{stats.liveVisitors} live now</span>
              </div>
            )}
            <button onClick={load} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.val}
            onClick={() => setPeriod(p.val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p.val
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: <Eye size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Unique Visitors', value: stats.uniqueVisitors.toLocaleString(), icon: <Users size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Today Views', value: stats.todayViews.toLocaleString(), icon: <TrendingUp size={18} />, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Today Unique', value: stats.todayUnique.toLocaleString(), icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Live Now', value: String(stats.liveVisitors), icon: <Activity size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart + Top Pages */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Daily Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Traffic</h3>
            {stats.dailyChart.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="flex items-end gap-1 h-48">
                {stats.dailyChart.map((d, i) => {
                  const pct = (Number(d.views) / maxViews) * 100
                  const dateStr = new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {d.views} views · {d.visitors} visitors
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-sm hover:from-blue-600 hover:to-cyan-500 transition-all cursor-pointer"
                        style={{ height: `${Math.max(pct, 2)}%`, minHeight: 4 }}
                      />
                      <span className="text-[9px] text-gray-400 transform -rotate-45 origin-top-left mt-1">{dateStr}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Pages</h3>
            <div className="space-y-2">
              {stats.topPages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
              ) : stats.topPages.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <span className="flex-1 text-gray-700 truncate font-mono text-xs">{p.path}</span>
                  <span className="text-gray-900 font-semibold text-xs">{p.views}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Device + Browser */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Device Breakdown */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Device Breakdown</h3>
            <div className="space-y-3">
              {stats.deviceBreakdown.map((d, i) => {
                const total = stats.deviceBreakdown.reduce((s, x) => s + Number(x.count), 0)
                const pct = total > 0 ? Math.round((Number(d.count) / total) * 100) : 0
                const colorClass = DEVICE_COLORS[d.device_type] || DEVICE_COLORS.unknown
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded ${colorClass}`}>{DEVICE_ICONS[d.device_type] || DEVICE_ICONS.unknown}</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">{d.device_type}</span>
                      </div>
                      <span className="text-sm text-gray-500">{d.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {stats.deviceBreakdown.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No data yet</p>}
            </div>
          </div>

          {/* Browser Breakdown */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Browser Breakdown</h3>
            <div className="space-y-3">
              {stats.browserBreakdown.map((b, i) => {
                const total = stats.browserBreakdown.reduce((s, x) => s + Number(x.count), 0)
                const pct = total > 0 ? Math.round((Number(b.count) / total) * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{b.browser}</span>
                      </div>
                      <span className="text-sm text-gray-500">{b.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {stats.browserBreakdown.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No data yet</p>}
            </div>
          </div>
        </div>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
      )}
    </div>
  )
}
