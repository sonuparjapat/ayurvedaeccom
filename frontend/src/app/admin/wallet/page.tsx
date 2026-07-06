'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  Wallet, Plus, Minus, Download, Users, IndianRupee, Award, Search,
  X, ArrowUpRight, ArrowDownLeft, Star, Eye, ChevronLeft, Settings, Save
} from 'lucide-react'

type ModalType = 'credit_wallet' | 'debit_wallet' | 'credit_loyalty' | 'debit_loyalty' | null

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AmountForm({
  title, subtitle, label, prefix, placeholder, actionLabel, actionColor, onSubmit, onClose
}: any) {
  const [form, setForm] = useState({ user_id: '', amount: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    axios.get('/wallet/admin/list').then(r => setUsers(r.data.users || [])).catch(() => {})
  }, [])

  const submit = async () => {
    if (!form.user_id || !form.amount) return notify.error('User and amount required')
    try {
      setSaving(true)
      await onSubmit(form)
      notify.success('Done!')
      onClose(true)
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`px-6 py-5 ${actionColor}`}>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-white/75 text-sm mt-0.5">{subtitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">User</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="">Select user…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{prefix}</span>
              <input
                type="number" min="1"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Note (optional)</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Refund for order #123"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={submit} disabled={saving}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 ${actionColor}`}>
            {saving ? 'Processing…' : actionLabel}
          </button>
          <button onClick={() => onClose(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function UserDetailDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'wallet' | 'loyalty'>('wallet')

  useEffect(() => {
    axios.get(`/wallet/admin/user/${userId}`)
      .then(r => setData(r.data))
      .catch(() => notify.error('Load failed'))
      .finally(() => setLoading(false))
  }, [userId])

  const txItems = tab === 'wallet' ? (data?.transactions || []) : (data?.loyalty_history || [])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-violet-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-white/75 hover:text-white transition">
              <ChevronLeft size={22} />
            </button>
            <div className="text-center flex-1">
              <h2 className="font-bold text-white text-lg">{data?.user?.name || '…'}</h2>
              <p className="text-purple-200 text-xs mt-0.5">{data?.user?.email}</p>
            </div>
            <div className="w-6" />
          </div>
          {data && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-white font-black text-xl">₹{Number(data.user.wallet_balance || 0).toFixed(2)}</p>
                <p className="text-purple-200 text-xs mt-0.5">Wallet Balance</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3 text-center">
                <p className="text-white font-black text-xl">{data.user.loyalty_points_balance || 0}</p>
                <p className="text-purple-200 text-xs mt-0.5">Loyalty Points</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-gray-100 bg-gray-50">
          {(['wallet', 'loyalty'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${tab === t ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'wallet' ? '💳 Wallet History' : '⭐ Loyalty History'}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" /></div>
          ) : txItems.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Wallet size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No history yet</p>
            </div>
          ) : txItems.map((tx: any, i: number) => {
            const isCredit = tab === 'wallet' ? tx.type === 'credit' : tx.type === 'earn'
            return (
              <div key={tx.id || i} className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {isCredit
                    ? <ArrowDownLeft size={16} className="text-emerald-600" />
                    : <ArrowUpRight size={16} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {tx.description || (isCredit ? 'Credited' : 'Debited')}
                  </p>
                  {tx.invoice_no && <p className="text-xs text-gray-400">{tx.invoice_no}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-black shrink-0 ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isCredit ? '+' : '-'}
                  {tab === 'wallet'
                    ? `₹${Number(tx.amount).toFixed(2)}`
                    : `${tx.points} pts`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Keys and their human-readable config
const SETTING_META: Record<string, { label: string; description: string; type: 'toggle' | 'number'; unit?: string; min?: number; max?: number; step?: number }> = {
  loyalty_enabled:           { label: 'Loyalty Program', description: 'Enable/disable loyalty points earning and redemption', type: 'toggle' },
  wallet_enabled:            { label: 'Store Wallet',    description: 'Enable/disable store wallet at checkout', type: 'toggle' },
  loyalty_earn_rate:         { label: 'Earn Rate', description: 'Points earned per ₹1 spent (e.g. 0.1 = 1 pt per ₹10, 1 = 1 pt per ₹1)', type: 'number', unit: 'pts / ₹1', min: 0.01, max: 10, step: 0.01 },
  loyalty_redeem_rate:       { label: 'Redeem Rate', description: '₹ value of each point (e.g. 0.1 = 10 pts = ₹1, 0.5 = 2 pts = ₹1)', type: 'number', unit: '₹ per pt', min: 0.01, max: 10, step: 0.01 },
  loyalty_min_redeem_points: { label: 'Minimum Redeem Points', description: 'User must have at least this many points before they can redeem', type: 'number', unit: 'pts', min: 0, max: 10000, step: 1 },
  loyalty_max_redeem_percent:{ label: 'Max Redeem % of Order', description: 'Maximum % of order value that can be paid via loyalty points', type: 'number', unit: '% of order', min: 1, max: 100, step: 1 },
}

function LoyaltySettingsPanel() {
  const [settings, setSettings] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    axios.get('/wallet/admin/loyalty-settings')
      .then(r => {
        const rows = r.data.settings || []
        setSettings(rows)
        const initial: Record<string, string> = {}
        rows.forEach((s: any) => { initial[s.key] = s.value })
        setForm(initial)
      })
      .catch(() => notify.error('Failed to load settings'))
  }, [open])

  const save = async () => {
    try {
      setSaving(true)
      const updates = Object.entries(form).map(([key, value]) => ({ key, value }))
      await axios.put('/wallet/admin/loyalty-settings', { settings: updates })
      notify.success('Settings saved!')
      setOpen(false)
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  // Live preview of earn/redeem rates
  const earnRate = Number(form['loyalty_earn_rate'] || 0.1)
  const redeemRate = Number(form['loyalty_redeem_rate'] || 0.1)
  const earnExample = Math.floor(100 * earnRate)
  const redeemExample = Math.floor(1 / redeemRate)

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 text-white border border-white/25 rounded-xl text-xs font-medium hover:bg-white/25 transition">
        <Settings size={13} /> Settings
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-linear-to-r from-purple-600 to-violet-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18} /> Loyalty & Wallet Settings</h2>
                <p className="text-purple-200 text-xs mt-0.5">All rates are applied live on new orders</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Live Preview */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Earn preview</p>
                  <p className="font-bold text-gray-900 mt-1">₹100 spent → <span className="text-purple-700">{earnExample} pts</span></p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Redeem preview</p>
                  <p className="font-bold text-gray-900 mt-1"><span className="text-amber-700">{redeemExample > 0 ? redeemExample : '—'} pts</span> = ₹1 off</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Features</p>
                {['loyalty_enabled', 'wallet_enabled'].map(key => {
                  const meta = SETTING_META[key]
                  const val = form[key] === 'true'
                  return (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                      </div>
                      <button
                        onClick={() => setForm(f => ({ ...f, [key]: val ? 'false' : 'true' }))}
                        className={`relative w-11 h-6 rounded-full transition-all ${val ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${val ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Number inputs */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rates & Limits</p>
                {['loyalty_earn_rate', 'loyalty_redeem_rate', 'loyalty_min_redeem_points', 'loyalty_max_redeem_percent'].map(key => {
                  const meta = SETTING_META[key]
                  return (
                    <div key={key} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                          <p className="text-xs text-gray-500">{meta.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <input
                            type="number" min={meta.min} max={meta.max} step={meta.step}
                            value={form[key] ?? ''}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-right font-bold outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                          />
                          <span className="text-xs text-gray-400 whitespace-nowrap">{meta.unit}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
              </button>
              <button onClick={() => setOpen(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminWalletPage() {
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalType>(null)
  const [detailUserId, setDetailUserId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`/wallet/admin/list?search=${encodeURIComponent(search)}`)
      setUsers(r.data.users || [])
      setStats(r.data.stats || {})
    } catch { notify.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  const modalConfig: Record<string, any> = {
    credit_wallet: {
      title: 'Credit Wallet', subtitle: 'Add funds to a user wallet',
      label: 'Amount (₹)', prefix: '₹', placeholder: '100', actionLabel: 'Credit Wallet',
      actionColor: 'bg-emerald-600 hover:bg-emerald-700',
      onSubmit: (f: any) => axios.post('/wallet/admin/credit', f),
    },
    debit_wallet: {
      title: 'Debit Wallet', subtitle: 'Deduct funds from a user wallet',
      label: 'Amount (₹)', prefix: '₹', placeholder: '100', actionLabel: 'Debit Wallet',
      actionColor: 'bg-red-500 hover:bg-red-600',
      onSubmit: (f: any) => axios.post('/wallet/admin/debit', f),
    },
    credit_loyalty: {
      title: 'Award Loyalty Points', subtitle: 'Grant points to a user',
      label: 'Points', prefix: '⭐', placeholder: '50', actionLabel: 'Award Points',
      actionColor: 'bg-amber-500 hover:bg-amber-600',
      onSubmit: (f: any) => axios.post('/wallet/admin/loyalty/credit', { ...f, points: f.amount }),
    },
    debit_loyalty: {
      title: 'Deduct Loyalty Points', subtitle: 'Remove points from a user',
      label: 'Points', prefix: '⭐', placeholder: '50', actionLabel: 'Deduct Points',
      actionColor: 'bg-red-500 hover:bg-red-600',
      onSubmit: (f: any) => axios.post('/wallet/admin/loyalty/debit', { ...f, points: f.amount }),
    },
  }

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Wallet Balance', 'Loyalty Points']
    const rows = users.map(u => [u.id, u.name, u.email, u.wallet_balance, u.loyalty_points_balance])
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'wallet-export.csv'; a.click()
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-linear-to-r from-purple-600 to-violet-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Wallet & Loyalty</h1>
              <p className="text-purple-100 text-sm mt-0.5">Manage store credits and loyalty points</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LoyaltySettingsPanel />
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 text-white border border-white/25 rounded-xl text-xs font-medium hover:bg-white/25 transition">
              <Download size={13} /> Export
            </button>
            <button onClick={() => setModal('credit_wallet')} className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-50 transition shadow-sm">
              <Plus size={13} /> Credit Wallet
            </button>
            <button onClick={() => setModal('debit_wallet')} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition shadow-sm">
              <Minus size={13} /> Debit Wallet
            </button>
            <button onClick={() => setModal('credit_loyalty')} className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 text-amber-900 rounded-xl text-xs font-semibold hover:bg-amber-300 transition shadow-sm">
              <Star size={13} /> Award Points
            </button>
            <button onClick={() => setModal('debit_loyalty')} className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 transition shadow-sm">
              <Minus size={13} /> Deduct Points
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Wallet Balance', value: `₹${Number(stats.total_wallet || 0).toFixed(2)}`, icon: <IndianRupee size={18} className="text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Users with Balance', value: stats.users_with_balance || 0, icon: <Users size={18} className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { label: 'Total Loyalty Points', value: (stats.total_loyalty || 0).toLocaleString(), icon: <Award size={18} className="text-amber-600" />, bg: 'bg-amber-50' },
          { label: 'Total Users', value: stats.total_users || 0, icon: <Wallet size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Wallet size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Customer', 'Email', 'Wallet Balance', 'Loyalty Points', 'Transactions', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-linear-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-sm">{(u.name || '?')[0].toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${Number(u.wallet_balance) > 0 ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400'}`}>
                        ₹{Number(u.wallet_balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold ${Number(u.loyalty_points_balance) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
                        ⭐ {u.loyalty_points_balance || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.tx_count || 0} txns</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setDetailUserId(u.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition">
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <AmountForm
          {...modalConfig[modal]}
          onClose={(reload: boolean) => { setModal(null); if (reload) load() }}
        />
      )}

      {/* Per-user detail drawer */}
      {detailUserId && (
        <UserDetailDrawer userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}
    </div>
  )
}
