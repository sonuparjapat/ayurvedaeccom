'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import AppModal from '@/components/modal/AppModal'
import DynamicTable from '@/components/table/table'
import { Loader2, Plus, Search, ArrowUp, ArrowDown } from 'lucide-react'

interface Banner {
  id: number
  tag: string | null
  title: string
  subtitle: string | null
  image_url: string | null
  bg_color1: string
  bg_color2: string
  cta_text: string
  cta_link: string
  sort_order: number
  is_active: boolean
}

const EMPTY = {
  tag: '', title: '', subtitle: '', image_url: '',
  bg_color1: '#1a3a22', bg_color2: '#0d1f15',
  cta_text: 'Explore Products', cta_link: '/products',
  sort_order: 0, is_active: true,
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const [total, setTotal] = useState(0)

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState<Banner | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/banners/admin', { params: { page, limit, search } })
      setBanners(res.data.banners || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, search])

  const openCreate = () => {
    setEditData(null)
    setForm({ ...EMPTY, sort_order: banners.length })
    setOpenModal(true)
  }

  const openEdit = (row: Banner) => {
    setEditData(row)
    setForm({
      tag: row.tag || '', title: row.title, subtitle: row.subtitle || '',
      image_url: row.image_url || '', bg_color1: row.bg_color1, bg_color2: row.bg_color2,
      cta_text: row.cta_text, cta_link: row.cta_link,
      sort_order: row.sort_order, is_active: row.is_active,
    })
    setOpenModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setOpenModal(false)
    setEditData(null)
    setForm({ ...EMPTY })
  }

  const validate = () => {
    if (!form.title.trim()) return 'Banner title is required'
    if (form.title.length > 200) return 'Title max 200 characters'
    return null
  }

  const save = async () => {
    const err = validate()
    if (err) return toast.error(err)
    try {
      setSaving(true)
      const payload = {
        ...form,
        tag: form.tag || null,
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        sort_order: Number(form.sort_order),
      }
      if (editData) {
        await axios.put(`/banners/admin/${editData.id}`, payload)
        toast.success('Banner updated')
      } else {
        await axios.post('/banners/admin', payload)
        toast.success('Banner created')
      }
      closeModal()
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteBanner = async (id: number) => {
    if (!confirm('Delete this banner?')) return
    try {
      await axios.delete(`/banners/admin/${id}`)
      toast.success('Banner deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    }
  }

  const moveOrder = async (id: number, dir: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === id)
    const swap = dir === 'up' ? banners[idx - 1] : banners[idx + 1]
    if (!swap) return
    try {
      await Promise.all([
        axios.put(`/banners/admin/${id}`, { sort_order: swap.sort_order }),
        axios.put(`/banners/admin/${swap.id}`, { sort_order: banners[idx].sort_order }),
      ])
      load()
    } catch {
      toast.error('Reorder failed')
    }
  }

  const totalPages = Math.ceil(total / limit)

  const columns = [
    { key: 'preview', label: 'Preview', align: 'center' },
    { key: 'tag', label: 'Tag' },
    { key: 'title', label: 'Title' },
    { key: 'cta_text', label: 'CTA' },
    { key: 'sort_order', label: 'Order', align: 'center' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' },
  ]

  const rows = banners.map((b, i) => ({
    ...b,
    preview: (
      <div
        className="w-20 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold"
        style={{ background: `linear-gradient(135deg, ${b.bg_color1}, ${b.bg_color2})` }}
      >
        {b.tag || 'Banner'}
      </div>
    ),
    tag: b.tag ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">{b.tag}</span> : '—',
    title: <span className="text-slate-200 font-medium line-clamp-1 max-w-[200px] block">{b.title}</span>,
    status: (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${b.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
        {b.is_active ? 'Active' : 'Hidden'}
      </span>
    ),
    actions: (
      <div className="flex justify-center items-center gap-2 flex-wrap">
        <button onClick={() => moveOrder(b.id, 'up')} disabled={i === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-20"><ArrowUp size={14} /></button>
        <button onClick={() => moveOrder(b.id, 'down')} disabled={i === banners.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-20"><ArrowDown size={14} /></button>
        <button onClick={() => openEdit(b)} className="px-3 py-1 text-xs font-semibold uppercase text-amber-400 border border-amber-400/40 rounded-md hover:bg-amber-400/10 transition">Edit</button>
        <button onClick={() => deleteBanner(b.id)} className="px-3 py-1 text-xs font-semibold uppercase text-rose-400 border border-rose-400/40 rounded-md hover:bg-rose-400/10 transition">Delete</button>
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
            <h1 className="text-3xl font-bold">Banner Management</h1>
            <p className="text-slate-400 text-sm mt-1">Manage hero carousel banners for home page</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => { setPage(1); setSearch(e.target.value) }} placeholder="Search banners..." className="pl-8 pr-4 py-2.5 w-full sm:w-56 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-slate-800 text-slate-100" />
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition">
              <Plus size={14} /> Add Banner
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
          <strong>Tip:</strong> Use the ↑↓ arrows to reorder banners. Active banners appear in the home page hero carousel on both web and mobile. Provide an image URL for a photo overlay, or use gradient colors for a clean look.
        </div>

        {/* TABLE */}
        <div className="bg-[#141821] border border-slate-700 rounded-xl overflow-x-auto">
          {loading
            ? <div className="flex justify-center items-center h-40"><Loader2 size={28} className="animate-spin text-emerald-400" /></div>
            : <DynamicTable columns={columns} rows={rows} emptyMessage="No banners found. Add your first banner!" />
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
          title={editData ? 'Edit Banner' : 'Add Banner'}
          description="Banners appear as slides in the hero carousel on the home page"
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
            {/* Live Preview */}
            <div
              className="w-full h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
              style={{ background: `linear-gradient(135deg, ${form.bg_color1}, ${form.bg_color2})` }}
            >
              {form.tag && <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{form.tag}</span>}
              <span className="text-white font-bold text-sm text-center px-4">{form.title || 'Banner Title'}</span>
              {form.subtitle && <span className="text-white/60 text-xs text-center px-4">{form.subtitle}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tag / Label</label>
                <input value={form.tag} onChange={e => set('tag', e.target.value)} maxLength={60} placeholder="NEW ARRIVAL" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sort Order</label>
                <input type="number" min={0} value={form.sort_order} onChange={e => set('sort_order', e.target.value)} placeholder="e.g. 0 (lower = shows first in carousel)" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} maxLength={200} placeholder="Premium Ayurvedic Products" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Subtitle</label>
              <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Discover nature's healing power" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Image URL <span className="normal-case text-slate-500 font-normal">(optional overlay)</span></label>
              <input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Background Color 1</label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={form.bg_color1} onChange={e => set('bg_color1', e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-slate-700 bg-transparent" />
                  <input value={form.bg_color1} onChange={e => set('bg_color1', e.target.value)} className={`${inputCls} mt-0 flex-1`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Background Color 2</label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={form.bg_color2} onChange={e => set('bg_color2', e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-slate-700 bg-transparent" />
                  <input value={form.bg_color2} onChange={e => set('bg_color2', e.target.value)} className={`${inputCls} mt-0 flex-1`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>CTA Button Text</label>
                <input value={form.cta_text} onChange={e => set('cta_text', e.target.value)} maxLength={80} placeholder="e.g. Shop Now, Explore, Buy Now" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CTA Link</label>
                <input value={form.cta_link} onChange={e => set('cta_link', e.target.value)} maxLength={200} placeholder="/products" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')} className={inputCls}>
                <option value="true">Active (visible)</option>
                <option value="false">Hidden</option>
              </select>
            </div>
          </div>
        </AppModal>
      </div>
    </div>
  )
}
