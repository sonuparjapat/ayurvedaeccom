'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Search, MapPin, Package, CheckCircle2, XCircle } from 'lucide-react'

interface Pincode {
  id: number
  pincode: string
  city: string
  state: string
  delivery_days: number
  is_active: boolean
  created_at: string
}

const EMPTY: Omit<Pincode, 'id' | 'created_at'> = {
  pincode: '', city: '', state: '', delivery_days: 3, is_active: true,
}

export default function AdminPincodesPage() {
  const [rows, setRows] = useState<Pincode[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const load = async (pg = page) => {
    setLoading(true)
    try {
      const r = await axios.get('/admin/pincodes', { params: { page: pg, limit, search } })
      setRows(r.data?.pincodes || [])
      setTotal(r.data?.total || 0)
    } catch {
      toast.error('Failed to load pincodes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [search])
  useEffect(() => { load(page) }, [page])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY })
    setShowForm(true)
  }

  const openEdit = (r: Pincode) => {
    setEditingId(r.id)
    setForm({ pincode: r.pincode, city: r.city, state: r.state, delivery_days: r.delivery_days, is_active: r.is_active })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) { toast.error('Enter a valid 6-digit pincode'); return }
    if (!form.city.trim()) { toast.error('City is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, pincode: form.pincode.trim(), city: form.city.trim(), state: form.state.trim(), delivery_days: Number(form.delivery_days) }
      if (editingId) {
        await axios.put(`/admin/pincodes/${editingId}`, payload)
        toast.success('Pincode updated')
      } else {
        await axios.post('/admin/pincodes', payload)
        toast.success('Pincode added')
      }
      setShowForm(false)
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deletePincode = async (id: number, pincode: string) => {
    if (!confirm(`Delete pincode ${pincode}?`)) return
    try {
      await axios.delete(`/admin/pincodes/${id}`)
      toast.success('Pincode deleted')
      load(1)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const totalPages = Math.ceil(total / limit)
  const activeCount = rows.filter(r => r.is_active).length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Serviceable Pincodes</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Manage delivery coverage — unlisted pincodes get a generic 6-day estimate</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition shadow-sm"
          >
            <Plus size={16} /> Add Pincode
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Package className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500 font-medium">Total Pincodes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500 font-medium">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rows.length - activeCount}</p>
              <p className="text-xs text-gray-500 font-medium">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search pincode, city, state..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm transition"
          />
        </div>
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{total} pincodes total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin size={40} className="mb-3 text-gray-300" />
            <p className="text-base font-medium">No pincodes found</p>
            <p className="text-sm mt-1">Try a different search or add a new pincode</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  {['Pincode', 'City', 'State', 'Delivery Days', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900 font-mono">{r.pincode}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{r.city}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{r.state}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {r.delivery_days} {r.delivery_days === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-gray-500 hover:text-amber-600 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deletePincode(r.id, r.pincode)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), page + 2)
            .map(pg => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  pg === page
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {pg}
              </button>
            ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Pincode' : 'Add New Pincode'}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingId ? 'Update pincode details' : 'Add a new serviceable pincode'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pincode * (6 digits)</label>
                <input
                  value={form.pincode}
                  onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="400001"
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City *</label>
                  <input
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Mumbai"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">State</label>
                  <input
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Days</label>
                <input
                  type="number"
                  value={form.delivery_days}
                  onChange={e => set('delivery_days', e.target.value)}
                  min={1}
                  max={30}
                  placeholder="e.g. 3 (estimated days to deliver to this pincode)"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Active</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Pincode' : 'Add Pincode'}
              </button>
              <button
                onClick={() => setShowForm(false)}
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
