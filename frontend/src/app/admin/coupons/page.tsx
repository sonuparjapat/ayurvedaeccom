'use client'

import { useEffect, useRef, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import AppModal from '@/components/modal/AppModal'
import DynamicTable from '@/components/table/table'
import { Loader2, Plus, Search, User, X } from 'lucide-react'

interface Coupon {
  id: number
  code: string
  type: 'flat' | 'percent'
  value: number
  min_order: number
  max_discount: number
  usage_limit: number
  usage_per_user: number
  used_count: number
  valid_from: string | null
  valid_to: string | null
  description: string | null
  is_active: boolean
  user_id: number | null
  user_name?: string | null
  user_email?: string | null
}

interface UserResult { id: number; name: string; email: string }

const EMPTY: Omit<Coupon, 'id' | 'used_count' | 'user_name' | 'user_email'> = {
  code: '', type: 'flat', value: 0, min_order: 0, max_discount: 0,
  usage_limit: 0, usage_per_user: 1, valid_from: null, valid_to: null,
  description: '', is_active: true, user_id: null,
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const [total, setTotal] = useState(0)

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ ...EMPTY })

  // User search for user-specific coupons
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [userSearching, setUserSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const userDebounce = useRef<ReturnType<typeof setTimeout>>()

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/coupons/admin', { params: { page, limit, search } })
      setCoupons(res.data.coupons || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, search])

  const searchUsers = (q: string) => {
    setUserSearch(q)
    clearTimeout(userDebounce.current)
    if (!q.trim()) { setUserResults([]); return }
    userDebounce.current = setTimeout(async () => {
      setUserSearching(true)
      try {
        const res = await axios.get('/coupons/admin/users-search', { params: { q } })
        setUserResults(res.data.users || [])
      } catch { } finally { setUserSearching(false) }
    }, 350)
  }

  const selectUser = (u: UserResult) => {
    setSelectedUser(u)
    set('user_id', u.id)
    setUserSearch(`${u.name} (${u.email})`)
    setUserResults([])
  }

  const clearUser = () => {
    setSelectedUser(null)
    set('user_id', null)
    setUserSearch('')
    setUserResults([])
  }

  const openCreate = () => {
    setEditData(null)
    setForm({ ...EMPTY })
    setSelectedUser(null)
    setUserSearch('')
    setUserResults([])
    setOpenModal(true)
  }

  const openEdit = (row: Coupon) => {
    setEditData(row)
    setForm({
      code: row.code, type: row.type, value: row.value, min_order: row.min_order,
      max_discount: row.max_discount, usage_limit: row.usage_limit,
      usage_per_user: row.usage_per_user,
      valid_from: row.valid_from ? row.valid_from.slice(0, 10) : '',
      valid_to: row.valid_to ? row.valid_to.slice(0, 10) : '',
      description: row.description || '', is_active: row.is_active,
      user_id: row.user_id || null,
    })
    if (row.user_id && row.user_name) {
      setSelectedUser({ id: row.user_id, name: row.user_name, email: row.user_email || '' })
      setUserSearch(`${row.user_name} (${row.user_email})`)
    } else {
      setSelectedUser(null)
      setUserSearch('')
    }
    setUserResults([])
    setOpenModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setOpenModal(false)
    setEditData(null)
    setForm({ ...EMPTY })
    setSelectedUser(null)
    setUserSearch('')
    setUserResults([])
  }

  const validate = () => {
    if (!form.code.trim()) return 'Coupon code is required'
    if (form.code.length > 30) return 'Code max 30 characters'
    if (!['flat', 'percent'].includes(form.type)) return 'Invalid type'
    if (Number(form.value) <= 0) return 'Value must be > 0'
    if (form.type === 'percent' && Number(form.value) > 100) return 'Percent cannot exceed 100'
    return null
  }

  const save = async () => {
    const err = validate()
    if (err) return toast.error(err)
    try {
      setSaving(true)
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value),
        min_order: Number(form.min_order),
        max_discount: Number(form.max_discount),
        usage_limit: Number(form.usage_limit),
        usage_per_user: Number(form.usage_per_user),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        user_id: form.user_id || null,
      }
      if (editData) {
        await axios.put(`/coupons/admin/${editData.id}`, payload)
        toast.success('Coupon updated')
      } else {
        await axios.post('/coupons/admin', payload)
        toast.success('Coupon created')
      }
      closeModal()
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon? This cannot be undone.')) return
    try {
      await axios.delete(`/coupons/admin/${id}`)
      toast.success('Coupon deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(total / limit)

  const columns = [
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type', align: 'center' },
    { key: 'value', label: 'Value', align: 'center' },
    { key: 'min_order', label: 'Min Order', align: 'center' },
    { key: 'validity', label: 'Valid To', align: 'center' },
    { key: 'usage', label: 'Used / Limit', align: 'center' },
    { key: 'for_user', label: 'For User', align: 'center' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' },
  ]

  const rows = coupons.map(c => ({
    ...c,
    value: c.type === 'percent' ? `${c.value}%` : `₹${c.value}`,
    min_order: c.min_order > 0 ? `₹${c.min_order}` : '—',
    validity: c.valid_to ? new Date(c.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '∞',
    usage: `${c.used_count} / ${c.usage_limit > 0 ? c.usage_limit : '∞'}`,
    for_user: c.user_id ? (
      <span title={c.user_email || ''} className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 truncate max-w-30 block">
        👤 {c.user_name || `UID ${c.user_id}`}
      </span>
    ) : (
      <span className="text-slate-500 text-xs">All users</span>
    ),
    status: (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
        {c.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
    actions: (
      <div className="flex justify-center gap-3">
        <button onClick={() => openEdit(c)} className="px-3 py-1 text-xs font-semibold uppercase text-amber-400 border border-amber-400/40 rounded-md hover:bg-amber-400/10 transition">Edit</button>
        <button onClick={() => deleteCoupon(c.id)} className="px-3 py-1 text-xs font-semibold uppercase text-rose-400 border border-rose-400/40 rounded-md hover:bg-rose-400/10 transition">Delete</button>
      </div>
    ),
  }))

  const inputCls = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500'
  const labelCls = 'text-xs uppercase text-slate-400 font-semibold'

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Coupon Management</h1>
            <p className="text-slate-400 text-sm mt-1">Create global or user-specific discount coupons</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setPage(1); setSearch(e.target.value) }} placeholder="Search code..." className="pl-8 pr-4 py-2.5 w-full sm:w-56 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-slate-800 text-slate-100" />
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition">
              <Plus size={14} /> Add Coupon
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-[#141821] border border-slate-700 rounded-xl overflow-x-auto">
          {loading
            ? <div className="flex justify-center items-center h-40"><Loader2 size={28} className="animate-spin text-emerald-400" /></div>
            : <DynamicTable columns={columns} rows={rows} emptyMessage="No coupons found" />
          }
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-30">← Prev</button>
            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-30">Next →</button>
          </div>
        )}

        {/* MODAL */}
        <AppModal
          open={openModal}
          onClose={closeModal}
          title={editData ? 'Edit Coupon' : 'Add Coupon'}
          description="Coupon codes give customers a discount at checkout"
          width="max-w-2xl"
          footer={
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} disabled={saving} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400">Cancel</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-semibold flex items-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editData ? 'Update' : 'Create'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">

            {/* User-specific toggle */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <User size={12} /> User-Specific Coupon (optional)
              </p>
              <p className="text-xs text-slate-400 mb-3">Leave empty to make this coupon available to all users. Assign a user to create a personal offer.</p>
              <div className="relative">
                <input
                  value={userSearch}
                  onChange={e => searchUsers(e.target.value)}
                  placeholder="Search user by name or email…"
                  className={inputCls}
                  disabled={!!selectedUser}
                />
                {selectedUser && (
                  <button onClick={clearUser} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400">
                    <X size={14} />
                  </button>
                )}
                {userSearching && <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
                {userResults.length > 0 && !selectedUser && (
                  <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
                    {userResults.map(u => (
                      <button key={u.id} onClick={() => selectUser(u)} className="w-full text-left px-3 py-2 hover:bg-slate-700 transition">
                        <p className="text-sm text-slate-100 font-medium">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedUser && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                  <User size={12} />
                  <span>Assigned to: <strong>{selectedUser.name}</strong> ({selectedUser.email})</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Coupon Code *</label>
                <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} maxLength={30} placeholder="SAVE20" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Type *</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                  <option value="flat">Flat (₹)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Value * {form.type === 'percent' ? '(%)' : '(₹)'}</label>
                <input type="number" min={0} value={form.value} onChange={e => set('value', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Min Order Amount (₹)</label>
                <input type="number" min={0} value={form.min_order} onChange={e => set('min_order', e.target.value)} className={inputCls} placeholder="0 = no minimum" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Max Discount (₹) <span className="normal-case text-slate-500 font-normal">(0 = unlimited)</span></label>
                <input type="number" min={0} value={form.max_discount} onChange={e => set('max_discount', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Total Usage Limit <span className="normal-case text-slate-500 font-normal">(0 = unlimited)</span></label>
                <input type="number" min={0} value={form.usage_limit} onChange={e => set('usage_limit', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Uses per User</label>
                <input type="number" min={1} value={form.usage_per_user} onChange={e => set('usage_per_user', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')} className={inputCls}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Valid From</label>
                <input type="date" value={form.valid_from || ''} onChange={e => set('valid_from', e.target.value || null)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valid To</label>
                <input type="date" value={form.valid_to || ''} onChange={e => set('valid_to', e.target.value || null)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Get 20% off on orders above ₹500" className={`${inputCls} resize-none`} />
            </div>
          </div>
        </AppModal>

      </div>
    </div>
  )
}
