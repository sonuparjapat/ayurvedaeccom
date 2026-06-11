'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Search, Download, Upload } from 'lucide-react'

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

  return (
    <div style={{ padding: '24px', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a3a2a', margin: 0 }}>Serviceable Pincodes</h1>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Manage delivery coverage — pincodes not listed get a generic 6-day estimate</p>
          </div>
          <button
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px', height: 42, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={15} /> Add Pincode
          </button>
        </div>

        {/* Search + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search pincode, city, state..."
              style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: 12, border: '1.5px solid rgba(26,58,42,0.15)', borderRadius: 10, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>{total} pincodes total</span>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(26,58,42,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No pincodes found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(26,58,42,0.08)', background: '#f8faf8' }}>
                  {['Pincode', 'City', 'State', 'Delivery Days', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: idx < rows.length - 1 ? '1px solid rgba(26,58,42,0.06)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1a3a2a', fontFamily: 'monospace' }}>{r.pincode}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a3a2a' }}>{r.city}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{r.state}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#e8f5ee', color: '#2d5a3d', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                        {r.delivery_days} {r.delivery_days === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: r.is_active ? '#e8f5ee' : '#f0f0f0', color: r.is_active ? '#2d5a3d' : '#888', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(r)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(26,58,42,0.2)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a3a2a' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => deletePincode(r.id, r.pincode)} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: '#fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e05252' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(pg => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid rgba(26,58,42,0.2)', background: pg === page ? '#1a3a2a' : 'white', color: pg === page ? 'white' : '#1a3a2a', fontSize: 13, fontWeight: pg === page ? 600 : 400, cursor: 'pointer' }}
              >
                {pg}
              </button>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a3a2a', marginBottom: 20, marginTop: 0 }}>
                {editingId ? 'Edit Pincode' : 'Add Pincode'}
              </h2>

              <Field label="Pincode * (6 digits)">
                <input
                  value={form.pincode}
                  onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="400001"
                  maxLength={6}
                  style={inp}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="City *">
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" style={inp} />
                </Field>
                <Field label="State">
                  <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" style={inp} />
                </Field>
              </div>
              <Field label="Delivery Days">
                <input type="number" value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} min={1} max={30} style={inp} />
              </Field>
              <Field label="Status">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                  <span style={{ fontSize: 13, color: '#1a3a2a' }}>Active</span>
                </label>
              </Field>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, height: 44, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Pincode'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', height: 40, border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 8,
  padding: '0 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none',
  boxSizing: 'border-box', color: '#1a3a2a',
}
