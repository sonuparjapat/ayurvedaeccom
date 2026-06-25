'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Search, ChevronDown } from 'lucide-react'

interface Variant {
  id: number
  product_id: number
  label: string
  sku: string | null
  price: number
  compareprice: number | null
  cost_price: number | null
  weight_grams: number | null
  barcode: string | null
  image_url: string | null
  inventory: number
  is_active: boolean
  attributes: Record<string, string> | null
  sort_order: number
}

const EMPTY_VARIANT = { label: '', sku: '', price: 0, compareprice: '', cost_price: '', weight_grams: '', barcode: '', image_url: '', inventory: 0, is_active: true, attributes: '', sort_order: 0 }

export default function AdminVariantsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ ...EMPTY_VARIANT })
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    axios.get('/admin/products').then(r => setProducts(r.data?.products || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProductId) { setVariants([]); return }
    loadVariants()
  }, [selectedProductId])

  const loadVariants = async () => {
    if (!selectedProductId) return
    setLoading(true)
    try {
      const r = await axios.get(`/admin/variants/${selectedProductId}`)
      setVariants(r.data?.variants || [])
    } catch {
      toast.error('Failed to load variants')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_VARIANT })
    setShowForm(true)
  }

  const openEdit = (v: Variant) => {
    setEditingId(v.id)
    setForm({
      label: v.label,
      sku: v.sku || '',
      price: v.price,
      compareprice: v.compareprice != null ? String(v.compareprice) : '',
      cost_price: v.cost_price != null ? String(v.cost_price) : '',
      weight_grams: v.weight_grams != null ? String(v.weight_grams) : '',
      barcode: v.barcode || '',
      image_url: v.image_url || '',
      inventory: v.inventory,
      is_active: v.is_active,
      attributes: v.attributes ? JSON.stringify(v.attributes) : '',
      sort_order: v.sort_order,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!selectedProductId) { toast.error('Select a product first'); return }
    if (!form.label.trim()) { toast.error('Label is required'); return }
    setSaving(true)
    const payload: any = {
      label: form.label.trim(),
      sku: form.sku || null,
      price: Number(form.price),
      compareprice: form.compareprice ? Number(form.compareprice) : null,
      cost_price: form.cost_price ? Number(form.cost_price) : null,
      weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      barcode: form.barcode || null,
      image_url: form.image_url || null,
      inventory: Number(form.inventory),
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
      attributes: form.attributes ? (() => { try { return JSON.parse(form.attributes) } catch { return null } })() : null,
    }
    try {
      if (editingId) {
        await axios.put(`/admin/variants/${editingId}`, payload)
        toast.success('Variant updated')
      } else {
        await axios.post(`/admin/variants/${selectedProductId}`, payload)
        toast.success('Variant created')
      }
      setShowForm(false)
      loadVariants()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteVariant = async (id: number) => {
    if (!confirm('Delete this variant? This action cannot be undone.')) return
    try {
      await axios.delete(`/admin/variants/${id}`)
      toast.success('Variant deleted')
      loadVariants()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = variants.filter(v =>
    v.label.toLowerCase().includes(search.toLowerCase()) ||
    (v.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedProduct = products.find((p: any) => p.id === Number(selectedProductId))

  return (
    <div style={{ padding: '24px', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Product Variants</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Manage size, weight, and other variants for each product</p>
        </div>

        {/* Product selector */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(26,58,42,0.1)', padding: '20px', marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Select Product</label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
              style={{ width: '100%', height: 44, border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 10, padding: '0 36px 0 12px', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', appearance: 'none', color: '#1a3a2a', background: 'white' }}
            >
              <option value="">— Choose a product —</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }} />
          </div>
          {selectedProduct && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#4a7c5e' }}>
              Base price: ₹{selectedProduct.price} · Base inventory: {selectedProduct.inventory}
            </div>
          )}
        </div>

        {selectedProductId && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search variants..."
                  style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: 12, border: '1.5px solid rgba(26,58,42,0.15)', borderRadius: 10, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={openCreate}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px', height: 40, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={15} /> Add Variant
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading variants...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888', background: 'white', borderRadius: 14 }}>
                No variants yet. Click "Add Variant" to create one.
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(26,58,42,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(26,58,42,0.08)', background: '#f8faf8' }}>
                      {['Label', 'SKU', 'Price', 'Compare', 'Stock', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v, idx) => (
                      <tr key={v.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(26,58,42,0.06)' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1a3a2a' }}>{v.label}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{v.sku || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#2d5a3d' }}>₹{v.price}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#aaa', textDecoration: v.compareprice ? 'line-through' : 'none' }}>{v.compareprice ? `₹${v.compareprice}` : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>
                          <span style={{ background: v.inventory > 0 ? '#e8f5ee' : '#fee2e2', color: v.inventory > 0 ? '#2d5a3d' : '#e05252', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                            {v.inventory}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: v.is_active ? '#e8f5ee' : '#f0f0f0', color: v.is_active ? '#2d5a3d' : '#888', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                            {v.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => openEdit(v)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(26,58,42,0.2)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a3a2a' }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteVariant(v.id)} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: '#fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e05252' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2a', marginBottom: 20, marginTop: 0 }}>
                {editingId ? 'Edit Variant' : 'New Variant'}
              </h2>

              <FormField label="Label *" hint="e.g. 500g, 1kg, Small, Large">
                <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="500g" style={inp} />
              </FormField>
              <FormField label="SKU">
                <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="SKU-001" style={inp} />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Price (₹) *">
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} min={0} style={inp} />
                </FormField>
                <FormField label="Compare Price (₹)">
                  <input type="number" value={form.compareprice} onChange={e => set('compareprice', e.target.value)} min={0} placeholder="MRP" style={inp} />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Cost Price (₹)">
                  <input type="number" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} min={0} placeholder="Cost" style={inp} />
                </FormField>
                <FormField label="Weight (g)">
                  <input type="number" value={form.weight_grams} onChange={e => set('weight_grams', e.target.value)} min={0} placeholder="Weight in grams" style={inp} />
                </FormField>
              </div>
              <FormField label="Barcode">
                <input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="e.g. 8901234567890" style={inp} />
              </FormField>
              <FormField label="Image URL">
                <input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." style={inp} />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Inventory">
                  <input type="number" value={form.inventory} onChange={e => set('inventory', e.target.value)} min={0} style={inp} />
                </FormField>
                <FormField label="Sort Order">
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} min={0} style={inp} />
                </FormField>
              </div>
              <FormField label="Attributes (JSON)" hint='e.g. {"size":"500g","unit":"grams"}'>
                <input value={form.attributes} onChange={e => set('attributes', e.target.value)} placeholder='{"size":"500g"}' style={inp} />
              </FormField>
              <FormField label="Status">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                  <span style={{ fontSize: 13, color: '#1a3a2a' }}>Active</span>
                </label>
              </FormField>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, height: 44, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : editingId ? 'Update Variant' : 'Create Variant'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ height: 44, padding: '0 20px', background: 'transparent', border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#888' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>{label}</label>
      {hint && <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{hint}</div>}
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', height: 40, border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 8,
  padding: '0 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none',
  boxSizing: 'border-box', color: '#1a3a2a',
}
