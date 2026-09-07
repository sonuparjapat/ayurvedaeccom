'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Zap, Clock, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageInfoBanner, LabelWithInfo } from '@/components/admin/FieldInfo'

const empty = {
  title: '', description: '', discount_type: 'percent', discount_value: '',
  starts_at: '', ends_at: '', max_uses: '', banner_image: '', is_active: true, products: [],
  notify_newsletter: true,
}
type BannerMode = 'url' | 'upload'

export default function FlashSalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(empty)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [bannerMode, setBannerMode] = useState<BannerMode>('upload')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const load = async () => {
    try {
      const [salesRes, prodRes] = await Promise.all([
        axios.get('/flash-sales/admin'),
        axios.get('/admin/products?limit=200')
      ])
      setSales(salesRes.data.sales || [])
      setAllProducts(prodRes.data.products || prodRes.data.data || [])
    } catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setBannerFile(null); setBannerPreview(null); setShowForm(true) }
  const openEdit = async (sale: any) => {
    try {
    const r = await axios.get(`/flash-sales/admin/${sale.id}`)
    const s = r.data.sale
    setEditing(s)
    setForm({
      ...s,
      starts_at: toLocalInput(s.starts_at),
      ends_at: toLocalInput(s.ends_at),
      products: s.products || []
    })
    setBannerPreview(s.banner_image || null)
    setBannerFile(null)
    setShowForm(true)
    } catch { toast.error('Failed to load sale details') }
  }

  const save = async () => {
    try {
      setSaving(true)
      if (bannerFile) {
        const fd = new FormData()
        fd.append('banner', bannerFile)
        fd.append('title', form.title)
        fd.append('description', form.description || '')
        fd.append('discount_type', form.discount_type)
        fd.append('discount_value', String(form.discount_value))
        fd.append('starts_at', toUTC(form.starts_at))
        fd.append('ends_at', toUTC(form.ends_at))
        if (form.max_uses) fd.append('max_uses', String(form.max_uses))
        fd.append('is_active', String(form.is_active))
        fd.append('products', JSON.stringify(form.products))
        if (!editing) fd.append('notify_newsletter', String((form as any).notify_newsletter ?? true))
        if (editing) await axios.put(`/flash-sales/admin/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        else await axios.post('/flash-sales/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        const payload = { ...form, starts_at: toUTC(form.starts_at), ends_at: toUTC(form.ends_at) }
        if (editing) await axios.put(`/flash-sales/admin/${editing.id}`, payload)
        else await axios.post('/flash-sales/admin', payload)
      }
      toast.success(editing ? 'Updated' : 'Created')
      setShowForm(false)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this flash sale?')) return
    try {
      await axios.delete(`/flash-sales/admin/${id}`)
      toast.success('Deleted')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Delete failed') }
  }

  const toggleProduct = (pid: number) => {
    const existing = form.products.find((p: any) => p.product_id === pid)
    if (existing) {
      setForm({ ...form, products: form.products.filter((p: any) => p.product_id !== pid) })
    } else {
      setForm({ ...form, products: [...form.products, { product_id: pid, special_price: '', stock_limit: '' }] })
    }
  }

  // Convert UTC ISO string → "YYYY-MM-DDTHH:mm" in user's local timezone (for datetime-local input)
  const toLocalInput = (utcStr: string) => {
    if (!utcStr) return ''
    const d = new Date(utcStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  // Convert datetime-local value (local time) → UTC ISO string for API
  const toUTC = (localStr: string) => localStr ? new Date(localStr).toISOString() : ''

  const formatDate = (d: string) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) : '—'
  const isActive = (sale: any) => sale.is_active && new Date(sale.starts_at) <= new Date() && new Date(sale.ends_at) > new Date()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Zap className="text-amber-500" size={22} /> Flash Sales</h1>
          <p className="text-gray-500 text-sm mt-1">Create limited-time offers with countdown timers</p>
          <PageInfoBanner
            title="Flash Sales"
            description="Create time-limited discount events with countdown timers on the storefront. Products in a flash sale show a special price and a live countdown. Optionally notify newsletter subscribers when a new sale launches."
            tips={[
              "A flash sale is only LIVE when it is active AND the current time is between Starts At and Ends At.",
              "Discount applies to the Special Price you set per product — leave Special Price blank to use the sitewide discount value.",
              "Banner Image is shown on the flash sale banner on the home page — recommended 1200x400px.",
              "Max Uses limits how many orders can use flash sale pricing — leave blank for unlimited.",
              "Check 'Notify newsletter subscribers' on creation to auto-email your mailing list about the sale.",
              "Use IST (your local time) when entering start/end times — the system converts to UTC automatically.",
            ]}
          />
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
                <label className="text-xs font-semibold text-gray-500 uppercase"><LabelWithInfo label="Title *" required what="The display name of the flash sale shown on the storefront banner and sale listing." why="A compelling title like 'Monsoon Wellness Sale' drives curiosity and urgency." example="Big Ayurveda Sale, Summer Immunity Bundle, Festive Herbal Deals" /></label>
                <input className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Big Ayurveda Sale" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase"><LabelWithInfo label="Discount Type" what="Whether the sitewide flash sale discount is a percentage or flat rupee amount." why="The discount type applies to products that don't have a specific Special Price set." example="Percent: 20% off all products; Flat: ₹100 off each product" /></label>
                <select className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase"><LabelWithInfo label="Discount Value *" required what="The numeric value of the discount (% or ₹ based on type selected)." why="Applied to products that don't have a Special Price override." example="20 (for 20% off), 100 (for ₹100 flat off)" /></label>
                <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} placeholder="e.g. 20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase"><LabelWithInfo label="Starts At *" required what="The date and time when the flash sale becomes active (IST, your local time)." why="The sale countdown starts from this time on the storefront." example="Today at 10:00 AM IST" note="Enter in your local time — the system converts to UTC." /></label>
                <input type="datetime-local" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase"><LabelWithInfo label="Ends At *" required what="The date and time when the flash sale ends and discounts stop applying (IST)." why="The countdown timer on the storefront ticks down to this time." example="Today at 11:59 PM IST" note="Enter in your local time — the system converts to UTC." /></label>
                <input type="datetime-local" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase"><LabelWithInfo label="Max Uses (optional)" what="The maximum number of orders that can use flash sale pricing before it stops." why="Useful for limited-stock deals — automatically stops discounting once the limit is reached." example="100 (first 100 orders get the deal), leave blank for unlimited" /></label>
                <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1 text-sm" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} placeholder="Leave blank for unlimited" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block"><LabelWithInfo label="Banner Image" what="A wide banner image shown on the home page or sale landing page during the flash sale." why="A visual banner immediately communicates the sale event to shoppers browsing the site." example="1200x400px JPG showing the sale offer and products" note="Supports both file upload and URL paste." /></label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setBannerMode('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${bannerMode === 'upload' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Upload File</button>
                  <button type="button" onClick={() => setBannerMode('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${bannerMode === 'url' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Paste URL</button>
                </div>
                {bannerMode === 'upload' ? (
                  <input type="file" accept="image/*" className="w-full border rounded-xl px-3 py-2 text-sm"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)) }
                    }} />
                ) : (
                  <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.banner_image || ''}
                    onChange={e => { setForm({...form, banner_image: e.target.value}); setBannerPreview(e.target.value) }}
                    placeholder="https://your-image-url.com/banner.jpg" />
                )}
                {bannerPreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={bannerPreview} alt="Banner preview" className="h-24 rounded-lg border object-cover" />
                    <button type="button" onClick={() => { setBannerPreview(null); setBannerFile(null); setForm({...form, banner_image: ''}) }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">×</button>
                  </div>
                )}
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                  <label htmlFor="is_active" className="text-sm font-semibold">Active</label>
                </div>
                {!editing && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="notify_newsletter" checked={(form as any).notify_newsletter} onChange={e => setForm({...form, notify_newsletter: e.target.checked} as any)} />
                    <label htmlFor="notify_newsletter" className="text-sm font-semibold text-emerald-700">📧 Notify newsletter subscribers</label>
                  </div>
                )}
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
