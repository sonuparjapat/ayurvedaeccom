'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { Wallet, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminWalletPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCredit, setShowCredit] = useState(false)
  const [creditForm, setCreditForm] = useState({ user_id: '', amount: '', description: '' })
  const [saving, setSaving] = useState(false)

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

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wallet className="text-purple-500" size={22} /> Wallet Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user wallet balances and loyalty points</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2"><Download size={15} /> Export</Button>
          <Button onClick={() => setShowCredit(true)} className="bg-purple-600 hover:bg-purple-700 gap-2"><Plus size={16} /> Credit Wallet</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-purple-600">₹{totalWallet.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Wallet Balance (all users)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-emerald-600">{users.length}</p>
          <p className="text-sm text-gray-500 mt-1">Users with Wallet</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Customer','Email','Wallet Balance','Loyalty Points'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-sm text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-5 py-3 font-bold text-purple-600">₹{Number(u.wallet_balance || 0).toFixed(2)}</td>
                  <td className="px-5 py-3 font-bold text-amber-600">{u.loyalty_points_balance || 0} pts</td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={4} className="text-center py-16 text-gray-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showCredit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">Credit User Wallet</h2>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">User</label>
              <select className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={creditForm.user_id} onChange={e => setCreditForm({...creditForm, user_id: e.target.value})}>
                <option value="">Select user</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Amount (₹)</label>
              <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={creditForm.amount} onChange={e => setCreditForm({...creditForm, amount: e.target.value})} placeholder="e.g. 100" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
              <input className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={creditForm.description} onChange={e => setCreditForm({...creditForm, description: e.target.value})} placeholder="e.g. Refund for order #123" />
            </div>
            <div className="flex gap-3">
              <Button onClick={credit} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">{saving ? 'Crediting...' : 'Credit Wallet'}</Button>
              <Button variant="outline" onClick={() => setShowCredit(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
