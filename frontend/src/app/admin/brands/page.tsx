'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  Tag, Plus, Pencil, Trash2, Search, RefreshCw, ArrowUpDown,
  CheckCircle, XCircle, Image as ImageIcon,
} from 'lucide-react'
import AppModal from '@/components/modal/AppModal'

interface Brand {
  id: number
  name: string
  slug: string
  logo_url?: string | null
  description?: string | null
  is_active: boolean
  sort_order: number
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', description: '', is_active: true, sort_order: 0 })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/admin/brands', { params: { page, limit: 20, search } })
      setBrands(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch { notify.error('Failed to load brands') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', is_active: true, sort_order: 0 })
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogo(false)
    setModalOpen(true)
  }

  const openEdit = (b: Brand) => {
    setEditing(b)
    setForm({ name: b.name, description: b.description || '', is_active: b.is_active, sort_order: b.sort_order })
    setLogoFile(null)
    setLogoPreview(b.logo_url || null)
    setRemoveLogo(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return notify.error('Brand name is required')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('description', form.description)
      fd.append('is_active', String(form.is_active))
      fd.append('sort_order', String(form.sort_order))
      if (logoFile) fd.append('logo', logoFile)
      if (removeLogo) fd.append('remove_logo', 'true')

      if (editing) {
        await axios.put(`/admin/brands/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Brand updated')
      } else {
        await axios.post('/admin/brands', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Brand created')
      }
      setModalOpen(false)
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete brand "${name}"?`)) return
    try {
      await axios.delete(`/admin/brands/${id}`)
      notify.success('Brand deleted')
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Brand Management</h1>
              <p className="text-white/70 text-sm">{total} brands total</p>
            </div>
          </div>
          <button onClick={openCreate} className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition flex items-center gap-2">
            <Plus size={16} /> Add Brand
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Search brands..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <button onClick={load} className="p-2 text-gray-500 hover:text-indigo-600"><RefreshCw size={16} /></button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Logo', 'Name', 'Slug', 'Status', 'Sort', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                <Tag size={32} className="mx-auto mb-2 text-gray-300" />
                No brands found
              </td></tr>
            ) : brands.map(b => (
              <tr key={b.id} className="hover:bg-gray-50/80 transition">
                <td className="px-4 py-3">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-10 h-10 object-contain rounded-lg border" />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <ImageIcon size={16} className="text-indigo-400" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{b.slug}</td>
                <td className="px-4 py-3">
                  {b.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <CheckCircle size={11} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      <XCircle size={11} /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{b.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(b.id, b.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 20 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AppModal open={modalOpen} onClose={() => { if (!saving) setModalOpen(false) }} title={editing ? 'Edit Brand' : 'Create Brand'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Brand Name *</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Patanjali" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none" rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional brand description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sort Order</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) || 0 }))} placeholder="e.g. 0 (lower = appears first in brand filter)" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Logo</label>
            {(logoPreview && !removeLogo) ? (
              <div className="flex items-center gap-3">
                <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" />
                <button onClick={() => { setRemoveLogo(true); setLogoPreview(null); setLogoFile(null) }}
                  className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ) : (
              <input type="file" accept="image/*" className="text-sm"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); setRemoveLogo(false) }
                }} />
            )}
            <p className="text-xs text-gray-400 mt-1">PNG or JPG, recommended 200x200px. Shows on product cards.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition">
              {saving ? 'Saving...' : editing ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
