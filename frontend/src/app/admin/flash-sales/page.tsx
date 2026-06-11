'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { Plus, Edit, Trash2, Zap, Clock, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

const empty = {
  title: '', description: '', discount_type: 'percent', discount_value: '',
  starts_at: '', ends_at: '', max_uses: '', banner_image: '', is_active: true, products: []
}

export default function FlashSalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(empty)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [salesRes, prodRes] = await Promise.all([
        axios.get('/flash-sales/admin'),
        axios.get('/admin/products?limit=200')
      ])
      setSales(salesRes.data.sales || [])
      setAllProducts(prodRes.data.data || [])
    } catch { notify.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true) }
  const openEdit = async (sale: any) => {
    const r = await axios.get(`/flash-sales/admin/${sale.id}`)
    setEditing(r.data.sale)
    setForm({ ...r.data.sale, products: r.data.sale.products || [] })
    setShowForm(true)
  }

  const save = async () => {
    try {
      setSaving(true)
      if (editing) await axios.put(`/flash-sales/admin/${editing.id}`, form)
      else await axios.post('/flash-sales/admin', form)
      notify.success(editing ? 'Updated' : 'Created')
      setShowForm(false)
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this flash sale?')) return
    await axios.delete(`/flash-sales/admin/${id}`)
    notify.success('Deleted')
    load()
  }

  const toggleProduct = (pid: number) => {
    const existing = form.products.find((p: any) => p.product_id === pid)
    if (existing) {
      setForm({ ...form, products: form.products.filter((p: any) => p.product_id !== pid) })
    } else {
      setForm({ ...form, products: [...form.products, { product_id: pid, special_price: '', stock_limit: '' }] })
    }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleString('en-IN') : '—'
  const isActive = (sale: any) => sale.is_active && new Date(sale.starts_at) <= new Date() && new Date(sale.ends_at) > new Date()

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Zap className="text-amber-500" size={22} /> Flash Sales</h1>
          <p className="text-gray-500 text-sm mt-1">Create limited-time offers with countdown timers</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 gap-2"><Plus size={16} /> New Flash Sale</Button>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sales.map(sale => (
            <div key={sale.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${isActive(sale) ? 'border-amber-300' : 'border-gray-100'}`}>
              {isActive(sale) && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                  <Zap size={11} /> LIVE
                </span>
              )}
              <h3 className="font-bold text-gray-900 mb-1">{sale.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {sale.discount_type === 'percent' ? `${sale.discount_value}% OFF` : `₹${sale.discount_value} OFF`}
                {' · '}{sale.product_count || 0} products
              </p>
              <div className="text-xs text-gray-400 space-y-1 mb-4">
                <div className="flex items-center gap-1"><Clock size={11} /> {formatDate(sale.starts_at)} → {formatDate(sale.ends_at)}</div>
                {sale.max_uses && <div><Package size={11} className="inline mr-1" />Max uses: {sale.max_uses} · Used: {sale.uses_count}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(sale)} className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1"><Edit size={14} />Edit</button>
                <button onClick={() => remove(sale.id)} className="flex-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1"><Trash2 size={14} />Delete</button>
              </div>
            </div>
          ))}
          {!sales.length && <div className="col-span-3 text-center py-20 text-gray-400">No flash sales yet. Create one!</div>}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold">{editing ? 'Edit Flash Sale' : 'New Flash Sale'}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Title *</label>
                <input className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Big Ayurveda Sale" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Discount Type</label>
                <select className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Discount Value *</label>
                <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} placeholder="e.g. 20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Starts At *</label>
                <input type="datetime-local" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.starts_at?.slice(0,16)} onChange={e => setForm({...form, starts_at: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Ends At *</label>
                <input type="datetime-local" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.ends_at?.slice(0,16)} onChange={e => setForm({...form, ends_at: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Max Uses (optional)</label>
                <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} placeholder="Leave blank for unlimited" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Banner Image URL</label>
                <input className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.banner_image} onChange={e => setForm({...form, banner_image: e.target.value})} placeholder="https://..." />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                <label htmlFor="is_active" className="text-sm font-semibold">Active</label>
              </div>
            </div>

            {/* PRODUCT SELECTION */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Select Products ({form.products.length} selected)</label>
              <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1">
                {allProducts.map((p: any) => {
                  const selected = form.products.find((fp: any) => fp.product_id === p.id)
                  return (
                    <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selected ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}
                         onClick={() => toggleProduct(p.id)}>
                      <input type="checkbox" readOnly checked={!!selected} />
                      {p.images?.[0] && <img src={p.images[0]} className="w-8 h-8 rounded object-cover" alt={p.name} />}
                      <div className="flex-1 text-sm">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">₹{p.price}</p>
                      </div>
                      {selected && (
                        <input type="number" placeholder="Special price" value={selected.special_price || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            const updated = form.products.map((fp: any) => fp.product_id === p.id ? {...fp, special_price: e.target.value} : fp)
                            setForm({...form, products: updated})
                          }}
                          className="w-24 border rounded px-2 py-1 text-xs" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={save} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
