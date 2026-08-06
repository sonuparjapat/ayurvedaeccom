'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Gift, Plus, X, Check, Copy } from 'lucide-react'

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', issued_to_email: '', expires_at: '' })

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/gift-cards/admin/list')
      setCards(r.data?.data || [])
    } catch { toast.error('Failed to load gift cards') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setCreating(true)
    try {
      await axios.post('/gift-cards/admin/create', form)
      toast.success('Gift card created!')
      setShowForm(false)
      setForm({ amount: '', issued_to_email: '', expires_at: '' })
      load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create') }
    finally { setCreating(false) }
  }

  const deactivate = async (id: number) => {
    if (!confirm('Deactivate this gift card?')) return
    try {
      await axios.put(`/gift-cards/admin/${id}/deactivate`)
      toast.success('Gift card deactivated')
      setCards(p => p.map(c => c.id === id ? { ...c, is_active: false } : c))
    } catch { toast.error('Failed to deactivate') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift size={22} className="text-emerald-600" /> Gift Cards
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage digital gift cards</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">
          <Plus size={16} /> Create Gift Card
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Gift Card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="500" min={1}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Recipient Email</label>
              <input type="email" value={form.issued_to_email} onChange={e => setForm(p => ({ ...p, issued_to_email: e.target.value }))}
                placeholder="customer@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Expires At</label>
              <input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} disabled={creating}
              className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2">
              <Check size={15} /> {creating ? 'Creating…' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : cards.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No gift cards yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Amount', 'Balance', 'Issued To', 'Expires', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cards.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-emerald-700">{c.code}</span>
                        <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!') }}
                          className="text-gray-400 hover:text-gray-600">
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${Number(c.balance) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ₹{Number(c.balance).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.issued_to_email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : 'No expiry'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.is_active && (
                        <button onClick={() => deactivate(c.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                          <X size={12} /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
