'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { Wallet, Plus, Download, Users, IndianRupee, Award, Search, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminWalletPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCredit, setShowCredit] = useState(false)
  const [creditForm, setCreditForm] = useState({ user_id: '', amount: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/wallet/admin/list')
      setUsers(r.data.users || [])
    } catch { notify.error('Load failed') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const credit = async () => {
    if (!creditForm.user_id || !creditForm.amount) return notify.error('User and amount required')
    try {
      setSaving(true)
      await axios.post('/wallet/admin/credit', creditForm)
      notify.success('Wallet credited!')
      setShowCredit(false)
      setCreditForm({ user_id: '', amount: '', description: '' })
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Wallet Balance', 'Loyalty Points']
    const rows = users.map(u => [u.id, u.name, u.email, u.wallet_balance, u.loyalty_points_balance])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'wallets.csv'; a.click()
  }

  const totalWallet = users.reduce((s, u) => s + Number(u.wallet_balance || 0), 0)
  const totalLoyalty = users.reduce((s, u) => s + Number(u.loyalty_points_balance || 0), 0)

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (u.name?.toLowerCase().includes(term)) || (u.email?.toLowerCase().includes(term))
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
              <p className="text-purple-100 text-sm mt-0.5">Manage user wallet balances and loyalty points</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 text-white border border-white/25 rounded-xl text-sm font-medium hover:bg-white/25 transition"
            >
              <Download size={15} /> Export
            </button>
            <button
              onClick={() => setShowCredit(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-50 transition shadow-sm"
            >
              <Plus size={16} /> Credit Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 truncate">{'₹'}{totalWallet.toFixed(2)}</p>
              <p className="text-xs text-gray-500 font-medium">Total Balance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
              <p className="text-xs text-gray-500 font-medium">Users with Wallet</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Award className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalLoyalty}</p>
              <p className="text-xs text-gray-500 font-medium">Total Loyalty Pts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <CreditCard className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{'₹'}{users.length > 0 ? (totalWallet / users.length).toFixed(0) : '0'}</p>
              <p className="text-xs text-gray-500 font-medium">Avg Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white shadow-sm transition"
          />
        </div>
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{filteredUsers.length} users</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Wallet size={40} className="mb-3 text-gray-300" />
              <p className="text-base font-medium text-gray-500">No users found</p>
              <p className="text-sm mt-1">{searchTerm ? 'Try a different search term' : 'No wallet users yet'}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50">
                      {['Customer', 'Email', 'Wallet Balance', 'Loyalty Points'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-purple-600 font-semibold text-sm">{(u.name || '?')[0].toUpperCase()}</span>
                            </div>
                            <span className="font-semibold text-sm text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-sm font-bold">
                            {'₹'}{Number(u.wallet_balance || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-sm font-bold">
                            {u.loyalty_points_balance || 0} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <div key={u.id} className="p-4 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">{(u.name || '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{'₹'}{Number(u.wallet_balance || 0).toFixed(2)}</span>
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{u.loyalty_points_balance || 0} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Credit Modal */}
      {showCredit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard size={20} /> Credit User Wallet
              </h2>
              <p className="text-purple-100 text-sm mt-0.5">Add funds to a user's wallet balance</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">User</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white"
                  value={creditForm.user_id}
                  onChange={e => setCreditForm({...creditForm, user_id: e.target.value})}
                >
                  <option value="">Select user</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">{'₹'}</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    value={creditForm.amount}
                    onChange={e => setCreditForm({...creditForm, amount: e.target.value})}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  value={creditForm.description}
                  onChange={e => setCreditForm({...creditForm, description: e.target.value})}
                  placeholder="e.g. Refund for order #123"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={credit}
                disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Crediting...' : 'Credit Wallet'}
              </button>
              <button
                onClick={() => setShowCredit(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
