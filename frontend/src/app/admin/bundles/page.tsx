'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { Plus, Edit, Trash2, Package, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const empty = {
  name: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  is_active: true,
  product_ids: [] as number[],
  image: null as File | null,
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({ ...empty })
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const load = async () => {
    try {
      const [bundlesRes, prodRes] = await Promise.all([
        axios.get('/bundles/admin'),
        axios.get('/admin/products?limit=200'),
      ])
      setBundles(bundlesRes.data.bundles || [])
      setAllProducts(prodRes.data.products || [])
    } catch {
      notify.error('Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...empty })
    setShowForm(true)
  }

  const openEdit = async (bundle: any) => {
    try {
      const r = await axios.get(`/bundles/public/${bundle.id}`)
      const b = r.data.bundle
      setEditing(b)
      setForm({
        name: b.name || '',
        description: b.description || '',
        discount_type: b.discount_type || 'percent',
        discount_value: b.discount_value || '',
        is_active: b.is_active,
        product_ids: (b.products || []).map((p: any) => p.product_id),
        image: null,
      })
      setShowForm(true)
    } catch {
      notify.error('Failed to load bundle details')
    }
  }

  const save = async () => {
    if (!form.name?.trim()) {
      notify.error('Bundle name is required')
      return
    }

    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description || '')
      fd.append('discount_type', form.discount_type)
      fd.append('discount_value', String(form.discount_value || 0))
      fd.append('is_active', String(form.is_active))
      fd.append('product_ids', JSON.stringify(form.product_ids))
      if (form.image) fd.append('image', form.image)

      if (editing) {
        await axios.put(`/bundles/admin/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await axios.post('/bundles/admin', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      notify.success(editing ? 'Bundle updated' : 'Bundle created')
      setShowForm(false)
      load()
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this bundle?')) return
    try {
      await axios.delete(`/bundles/admin/${id}`)
      notify.success('Bundle deleted')
      load()
    } catch {
      notify.error('Delete failed')
    }
  }

  const toggleProduct = (pid: number) => {
    const ids = form.product_ids as number[]
    if (ids.includes(pid)) {
      setForm({ ...form, product_ids: ids.filter((id: number) => id !== pid) })
    } else {
      setForm({ ...form, product_ids: [...ids, pid] })
    }
  }

  const filteredProducts = allProducts.filter(
    (p: any) =>
      !productSearch ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={22} /> Product Bundles
          </h1>
          <p className="text-pink-100 text-sm mt-1">
            Create product bundles with special discounts
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-white text-pink-600 hover:bg-pink-50 gap-2"
        >
          <Plus size={16} /> New Bundle
        </Button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-pink-500 border-t-transparent rounded-full" />
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center text-gray-400 shadow-sm">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bundles yet. Create one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bundles.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {b.image_url ? (
                          <img
                            src={b.image_url}
                            alt={b.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                            <Package size={18} className="text-pink-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{b.name}</p>
                          {b.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">
                              {b.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {b.product_count || 0} products
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {b.discount_type === 'percent'
                        ? `${b.discount_value}%`
                        : `₹${b.discount_value}`}
                    </td>
                    <td className="px-5 py-4">
                      {b.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          <X size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => remove(b.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold">
              {editing ? 'Edit Bundle' : 'New Bundle'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Name *
                </label>
                <input
                  className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Immunity Bundle"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Description
                </label>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short description of the bundle"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Discount Type
                </label>
                <select
                  className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({ ...form, discount_type: e.target.value })
                  }
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Discount Value *
                </label>
                <input
                  type="number"
                  className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                  placeholder="e.g. 15"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Bundle Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full border rounded-xl px-3 py-2 mt-1 text-sm"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image: e.target.files?.[0] || null,
                    })
                  }
                />
                {editing?.image_url && !form.image && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current image will be kept if no new file is selected
                  </p>
                )}
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bundle_active"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <label htmlFor="bundle_active" className="text-sm font-semibold">
                  Active
                </label>
              </div>
            </div>

            {/* PRODUCT SELECTION */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">
                Select Products ({form.product_ids.length} selected)
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 mb-2 text-sm outline-none focus:border-pink-400"
              />
              <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1">
                {filteredProducts.map((p: any) => {
                  const selected = form.product_ids.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                        selected
                          ? 'bg-pink-50 border border-pink-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleProduct(p.id)}
                    >
                      <input type="checkbox" readOnly checked={selected} />
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          className="w-8 h-8 rounded object-cover"
                          alt={p.name}
                        />
                      )}
                      <div className="flex-1 text-sm">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">₹{p.price}</p>
                      </div>
                    </div>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">
                    No products found
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-pink-500 hover:bg-pink-600"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
