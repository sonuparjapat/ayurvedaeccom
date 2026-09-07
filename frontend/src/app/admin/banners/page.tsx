'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import AppModal from '@/components/modal/AppModal'
import DynamicTable from '@/components/table/table'
import { Loader2, Plus, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { PageInfoBanner, LabelWithInfo } from '@/components/admin/FieldInfo'
import AdminPagination from '@/components/admin/AdminPagination'

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
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    setImageFile(null)
    setImagePreview(null)
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
    setImageFile(null)
    setImagePreview(row.image_url || null)
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

      if (imageFile) {
        const fd = new FormData()
        fd.append('image', imageFile)
        fd.append('tag', form.tag || '')
        fd.append('title', form.title)
        fd.append('subtitle', form.subtitle || '')
        fd.append('bg_color1', form.bg_color1)
        fd.append('bg_color2', form.bg_color2)
        fd.append('cta_text', form.cta_text)
        fd.append('cta_link', form.cta_link)
        fd.append('sort_order', String(form.sort_order))
        fd.append('is_active', String(form.is_active))

        if (editData) {
          await axios.put(`/banners/admin/${editData.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          await axios.post('/banners/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      } else {
        const payload = {
          ...form,
          tag: form.tag || null,
          subtitle: form.subtitle || null,
          image_url: form.image_url || null,
          sort_order: Number(form.sort_order),
        }
        if (editData) {
          await axios.put(`/banners/admin/${editData.id}`, payload)
        } else {
          await axios.post('/banners/admin', payload)
        }
      }
      toast.success(editData ? 'Banner updated' : 'Banner created')
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
      <div className="w-full px-4 sm:px-6 py-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Banner Management</h1>
            <p className="text-slate-400 text-sm mt-1">Manage hero carousel banners for home page</p>
            <PageInfoBanner
              title="Banner Management"
              description="Banners appear as slides in the hero carousel on the home page (both web and mobile app). Each banner has a gradient background, optional image overlay, a title, and a call-to-action button."
              tips={[
                "Use the ↑ ↓ arrows in the table to reorder banners — Sort Order controls the sequence in the carousel.",
                "Set a banner to 'Hidden' to keep it saved but temporarily remove it from the live site.",
                "Gradient colors (Background Color 1 & 2) create a nice look even without a photo — great for seasonal campaigns.",
                "The Tag/Label is a small badge shown above the title (e.g. 'NEW ARRIVAL' or 'SALE') — keep it under 15 characters.",
                "CTA Link should be a relative URL like /products?category=12 or /flash-sales to drive traffic to the right page.",
                "Images overlay the gradient — use a high-quality landscape photo (1200×400px recommended) for best results.",
              ]}
            />
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
        <AdminPagination page={page} pages={totalPages} total={total} limit={limit} onChange={setPage} />

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
                <label className={labelCls}><LabelWithInfo label="Tag / Label" what="A small badge shown above the banner title (e.g. NEW ARRIVAL, SALE)." why="Draws attention to the campaign type and helps customers quickly scan the carousel." example="NEW ARRIVAL" /></label>
                <input value={form.tag} onChange={e => set('tag', e.target.value)} maxLength={60} placeholder="NEW ARRIVAL" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}><LabelWithInfo label="Sort Order" what="Numeric position of this banner in the carousel." why="Lower numbers appear first — 0 is the lead slide customers see first." example="0 (lead slide), 1 (second slide)" /></label>
                <input type="number" min={0} value={form.sort_order} onChange={e => set('sort_order', e.target.value)} placeholder="e.g. 0 (lower = shows first in carousel)" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}><LabelWithInfo label="Title" required what="The main heading shown on the banner slide." why="First text customers read — must convey the campaign value quickly." example="Premium Ayurvedic Products" /></label>
              <input value={form.title} onChange={e => set('title', e.target.value)} maxLength={200} placeholder="Premium Ayurvedic Products" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}><LabelWithInfo label="Subtitle" what="A secondary line below the title giving more context." why="Optional but helps communicate the offer or brand promise concisely." example="Discover nature's healing power" /></label>
              <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Discover nature's healing power" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}><LabelWithInfo label="Banner Image" what="An optional photo that overlays the gradient background." why="A real product or lifestyle photo makes banners more engaging and trustworthy." example="Upload a JPEG of your flagship product or use a CDN URL" /></label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setImageMode('upload')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${imageMode === 'upload' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Upload File</button>
                <button type="button" onClick={() => setImageMode('url')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${imageMode === 'url' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Paste URL</button>
              </div>
              {imageMode === 'upload' ? (
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
                  }} />
              ) : (
                <input value={form.image_url} onChange={e => { set('image_url', e.target.value); setImagePreview(e.target.value) }} placeholder="https://your-image-url.com/banner.jpg" className={inputCls} />
              )}
              {(imagePreview || form.image_url) && (
                <div className="mt-2 relative inline-block">
                  <img src={imagePreview || form.image_url} alt="Preview" className="h-20 rounded-lg border object-cover" />
                  <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); set('image_url', '') }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">×</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><LabelWithInfo label="Background Color 1" what="The start colour of the banner's left-to-right gradient." why="The gradient shows behind the text (and behind any image overlay)." example="#1a3a22 (dark forest green)" /></label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={form.bg_color1} onChange={e => set('bg_color1', e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-slate-700 bg-transparent" />
                  <input value={form.bg_color1} onChange={e => set('bg_color1', e.target.value)} className={`${inputCls} mt-0 flex-1`} />
                </div>
              </div>
              <div>
                <label className={labelCls}><LabelWithInfo label="Background Color 2" what="The end colour of the banner's left-to-right gradient." why="Creates a smooth gradient effect from Color 1 to Color 2 across the banner." example="#0d1f15 (very dark green)" /></label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={form.bg_color2} onChange={e => set('bg_color2', e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-slate-700 bg-transparent" />
                  <input value={form.bg_color2} onChange={e => set('bg_color2', e.target.value)} className={`${inputCls} mt-0 flex-1`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><LabelWithInfo label="CTA Button Text" what="The label on the call-to-action button shown on the banner." why="A strong CTA drives clicks to your products or offers." example="Shop Now" /></label>
                <input value={form.cta_text} onChange={e => set('cta_text', e.target.value)} maxLength={80} placeholder="e.g. Shop Now, Explore, Buy Now" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}><LabelWithInfo label="CTA Link" what="The URL the CTA button leads to when clicked." why="Directs customers to the right landing page for this campaign." example="/products?category=5 or /flash-sales" /></label>
                <input value={form.cta_link} onChange={e => set('cta_link', e.target.value)} maxLength={200} placeholder="/products" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}><LabelWithInfo label="Status" what="Whether this banner is currently visible in the carousel." why="Set to Hidden to temporarily remove a banner without deleting it." example="Active (live) or Hidden (draft/paused)" /></label>
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
