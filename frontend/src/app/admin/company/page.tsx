'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  Building2, Save, Upload, X, Globe, Instagram, Facebook,
  Twitter, Youtube, Image as ImageIcon, Loader2, Plus, Trash2,
  Layout, Palette, Star, Megaphone,
} from 'lucide-react'

const FALLBACK_LOGO = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/mainayurvedalogo.png'

const emptyForm = {
  company_name: '', email: '', phone: '', website: '',
  gst_number: '', pan_number: '', address_line1: '', city: '', state: '',
  country: 'India', pincode: '', support_email: '',
  logo_url: '',
  fssai_number: '', bank_name: '', bank_account: '', bank_ifsc: '', bank_branch: '',
  social_links: { facebook: '', instagram: '', twitter: '', youtube: '' },
  privacy_policy: '', terms_conditions: '', shipping_policy: '', return_policy: '',
}

const defaultPlatformConfig = {
  hero: {
    eyebrow: 'Authentic Ayurvedic Products',
    title_line1: 'Discover the',
    title_line2: 'Ancient Wisdom',
    title_line3: 'of Ayurveda',
    subtitle: 'Experience the healing power of nature with our premium collection of Ayurvedic herbs, dry fruits, dehydrated foods, and fresh tofu. Sourced directly from Indian farms and delivered to your doorstep.',
    cta_primary: 'Shop Now',
    cta_secondary: 'Watch Our Story',
  },
  stats: [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '50+', label: 'Premium Products' },
    { value: '4.8★', label: 'Customer Rating' },
  ],
  trust_items: [
    { icon: '🌿', label: 'USDA Organic Certified' },
    { icon: '🧪', label: 'Lab Tested & Verified' },
    { icon: '🚚', label: 'Free Delivery Over ₹499' },
    { icon: '↩️', label: 'Easy 7-Day Returns' },
    { icon: '🔒', label: 'Secure Payments' },
  ],
  ticker: [
    '100% Certified Organic', 'Lab-Tested Purity', 'Farm to Doorstep',
    'No Preservatives', 'Ayurvedic Heritage', '10,000+ Happy Customers',
    'Chemical-Free Promise', 'Direct from Indian Farms',
  ],
  features: [
    { title: 'Free shipping', description: 'On all orders above ₹499. Fast, tracked delivery across every corner of India.', tag: 'Pan-India' },
    { title: '100% authentic', description: 'Genuine Ayurvedic products sourced directly from certified, trusted suppliers.', tag: 'Certified' },
    { title: 'Organic & natural', description: 'No preservatives, no additives, no artificial anything. Just pure, honest food.', tag: 'No additives' },
    { title: 'Quality assured', description: 'Rigorous lab testing and certification by relevant Indian food authorities.', tag: 'Lab tested' },
    { title: 'Customer support', description: 'Dedicated wellness advisors to guide you at every step of your health journey.', tag: '7 days a week' },
    { title: 'Easy returns', description: 'Hassle-free 30-day return policy. Not satisfied? We make it right, no questions asked.', tag: '30-day policy' },
  ],
  brand: { primary_color: '#1a5c38' },
  banners: [] as { image_url: string; link: string; alt: string }[],
}

type PlatformConfig = typeof defaultPlatformConfig

function inp(cls?: string) {
  return `w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${cls || ''}`
}

export default function CompanyPage() {
  const [record, setRecord] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(defaultPlatformConfig)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [logoMode, setLogoMode] = useState<'url' | 'file'>('url')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'company' | 'platform'>('company')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/company?limit=1')
      const row = res.data.data?.[0]
      if (row) {
        setRecord(row)
        setForm({
          company_name: row.company_name || '',
          email: row.email || '',
          phone: row.phone || '',
          website: row.website || '',
          gst_number: row.gst_number || '',
          pan_number: row.pan_number || '',
          fssai_number: row.fssai_number || '',
          bank_name: row.bank_name || '',
          bank_account: row.bank_account || '',
          bank_ifsc: row.bank_ifsc || '',
          bank_branch: row.bank_branch || '',
          address_line1: row.address_line1 || '',
          city: row.city || '',
          state: row.state || '',
          country: row.country || 'India',
          pincode: row.pincode || '',
          support_email: row.support_email || '',
          logo_url: row.logo_url || '',
          social_links: {
            facebook: row.social_links?.facebook || '',
            instagram: row.social_links?.instagram || '',
            twitter: row.social_links?.twitter || '',
            youtube: row.social_links?.youtube || '',
          },
          privacy_policy: row.privacy_policy || '',
          terms_conditions: row.terms_conditions || '',
          shipping_policy: row.shipping_policy || '',
          return_policy: row.return_policy || '',
        })
        setLogoPreview(row.logo_url || '')
        // Merge saved extra_data with defaults (so new keys have defaults)
        const saved = row.extra_data || {}
        setPlatformConfig({
          hero: { ...defaultPlatformConfig.hero, ...(saved.hero || {}) },
          stats: saved.stats?.length ? saved.stats : defaultPlatformConfig.stats,
          trust_items: saved.trust_items?.length ? saved.trust_items : defaultPlatformConfig.trust_items,
          ticker: saved.ticker?.length ? saved.ticker : defaultPlatformConfig.ticker,
          features: saved.features?.length ? saved.features : defaultPlatformConfig.features,
          brand: { ...defaultPlatformConfig.brand, ...(saved.brand || {}) },
          banners: saved.banners || [],
        })
      }
    } catch { notify.error('Failed to load company settings') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleLogoFile = (file: File) => {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))
  const setSocial = (key: string, val: string) =>
    setForm(f => ({ ...f, social_links: { ...f.social_links, [key]: val } }))

  const setHero = (key: string, val: string) =>
    setPlatformConfig(p => ({ ...p, hero: { ...p.hero, [key]: val } }))

  const setStat = (i: number, key: 'value' | 'label', val: string) =>
    setPlatformConfig(p => {
      const stats = [...p.stats]
      stats[i] = { ...stats[i], [key]: val }
      return { ...p, stats }
    })

  const setTrustItem = (i: number, key: 'icon' | 'label', val: string) =>
    setPlatformConfig(p => {
      const items = [...p.trust_items]
      items[i] = { ...items[i], [key]: val }
      return { ...p, trust_items: items }
    })

  const setTickerItem = (i: number, val: string) =>
    setPlatformConfig(p => {
      const t = [...p.ticker]; t[i] = val
      return { ...p, ticker: t }
    })

  const setFeature = (i: number, key: 'title' | 'description' | 'tag', val: string) =>
    setPlatformConfig(p => {
      const f = [...p.features]; f[i] = { ...f[i], [key]: val }
      return { ...p, features: f }
    })

  const setBanner = (i: number, key: 'image_url' | 'link' | 'alt', val: string) =>
    setPlatformConfig(p => {
      const b = [...p.banners]; b[i] = { ...b[i], [key]: val }
      return { ...p, banners: b }
    })

  const handleSave = async () => {
    if (!form.company_name.trim()) return notify.error('Company name is required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'social_links') fd.append(k, JSON.stringify(v))
        else fd.append(k, v as string)
      })
      fd.append('extra_data', JSON.stringify(platformConfig))
      if (logoFile) fd.append('logo', logoFile)

      if (record) {
        await axios.put(`/company/${record.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Settings saved')
      } else {
        await axios.post('/company', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Company settings created')
      }
      setLogoFile(null)
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-indigo-500" />
    </div>
  )

  const currentLogo = logoPreview || form.logo_url || FALLBACK_LOGO

  const TABS = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'platform', label: 'Platform Config', icon: Layout },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Company Settings</h1>
              <p className="text-white/70 text-sm">Logo, contact info, policies & platform content</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-slate-800 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mt-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === id ? 'bg-white text-slate-800' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════ COMPANY INFO TAB ════════════ */}
      {tab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Logo + Social */}
          <div className="space-y-6">

            {/* Logo Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-500" /> Company Logo
              </h3>
              <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 h-24 flex items-center justify-center">
                {currentLogo
                  ? <img src={currentLogo} alt="Logo" className="max-h-20 max-w-full object-contain" />
                  : <div className="text-gray-400 text-xs">No logo set</div>}
              </div>
              <div className="flex gap-2 mb-3">
                {(['url', 'file'] as const).map(m => (
                  <button key={m} onClick={() => setLogoMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${logoMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {m === 'url' ? '🔗 URL' : '📁 Upload File'}
                  </button>
                ))}
              </div>
              {logoMode === 'url' ? (
                <div>
                  <input type="url" placeholder="https://..." className={inp()}
                    value={form.logo_url}
                    onChange={e => { setField('logo_url', e.target.value); setLogoPreview(e.target.value) }} />
                  <p className="text-xs text-gray-400 mt-1.5">Paste direct image URL</p>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                    <Upload size={18} className="mx-auto mb-1 text-indigo-400" />
                    <p className="text-xs text-gray-500">Click to upload logo</p>
                    <p className="text-xs text-gray-400">PNG (transparent bg ideal)</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />
                </label>
              )}
              {logoFile && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                  <Upload size={12} /> {logoFile.name}
                  <button onClick={() => { setLogoFile(null); setLogoPreview(form.logo_url) }} className="ml-auto"><X size={12} /></button>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-500" /> Social Links
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'facebook', icon: Facebook, color: '#1877f2', placeholder: 'https://facebook.com/yourpage' },
                  { key: 'instagram', icon: Instagram, color: '#e1306c', placeholder: 'https://instagram.com/yourhandle' },
                  { key: 'twitter', icon: Twitter, color: '#1da1f2', placeholder: 'https://twitter.com/yourhandle' },
                  { key: 'youtube', icon: Youtube, color: '#ff0000', placeholder: 'https://youtube.com/yourchannel' },
                ].map(({ key, icon: Icon, color, placeholder }) => (
                  <div key={key}>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                      <Icon size={12} style={{ color }} /> {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input type="url" placeholder={placeholder} className={inp()}
                      value={(form.social_links as any)[key]}
                      onChange={e => setSocial(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'company_name', label: 'Company Name *', placeholder: 'Oroganix Pvt Ltd' },
                  { key: 'gst_number', label: 'GST Number', placeholder: '27AAAAA0000A1Z5' },
                  { key: 'email', label: 'Primary Email', placeholder: 'info@oroganix.com' },
                  { key: 'support_email', label: 'Support Email', placeholder: 'support@oroganix.com' },
                  { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
                  { key: 'website', label: 'Website', placeholder: 'https://oroganix.com' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input placeholder={placeholder} className={inp()} value={(form as any)[key]}
                      onChange={e => setField(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Address</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address Line</label>
                  <input placeholder="e.g. 123 MG Road, Sector 5" className={inp()}
                    value={form.address_line1} onChange={e => setField('address_line1', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'city', placeholder: 'Mumbai' },
                    { key: 'state', placeholder: 'Maharashtra' },
                    { key: 'country', placeholder: 'India' },
                    { key: 'pincode', placeholder: '400001' },
                  ].map(({ key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{key}</label>
                      <input placeholder={placeholder} className={inp()} value={(form as any)[key]}
                        onChange={e => setField(key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Compliance & Banking</h3>
              <p className="text-xs text-gray-500 mb-4">These fields appear on every generated tax invoice.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'pan_number', label: 'PAN Number', placeholder: 'AAAAA0000A' },
                  { key: 'fssai_number', label: 'FSSAI Licence Number', placeholder: '10020011000123' },
                  { key: 'bank_name', label: 'Bank Name', placeholder: 'State Bank of India' },
                  { key: 'bank_branch', label: 'Bank Branch', placeholder: 'Main Branch, Mumbai' },
                  { key: 'bank_account', label: 'Bank Account Number', placeholder: '1234567890123' },
                  { key: 'bank_ifsc', label: 'Bank IFSC Code', placeholder: 'SBIN0001234' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input placeholder={placeholder} className={inp()} value={(form as any)[key]}
                      onChange={e => setField(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Policy Pages</h3>
              <div className="space-y-4">
                {[
                  { key: 'privacy_policy', label: 'Privacy Policy' },
                  { key: 'terms_conditions', label: 'Terms & Conditions' },
                  { key: 'shipping_policy', label: 'Shipping Policy' },
                  { key: 'return_policy', label: 'Return Policy' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <textarea rows={4} placeholder={`Enter ${label} content...`}
                      className={inp('resize-y')} value={(form as any)[key]}
                      onChange={e => setField(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PLATFORM CONFIG TAB ════════════ */}
      {tab === 'platform' && (
        <div className="space-y-6">

          {/* Info banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-800">
            <strong>Platform Config</strong> — these settings drive the homepage, hero section, and trust badges on the web and mobile app.
            Defaults are shown below. You only need to change what you want to customise.
            Click <strong>Save Changes</strong> at the top when done.
          </div>

          {/* Brand Colors */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Palette size={16} className="text-indigo-500" /> Brand Colors
            </h3>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={platformConfig.brand.primary_color}
                    onChange={e => setPlatformConfig(p => ({ ...p, brand: { ...p.brand, primary_color: e.target.value } }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={platformConfig.brand.primary_color} className={inp('w-36')}
                    onChange={e => setPlatformConfig(p => ({ ...p, brand: { ...p.brand, primary_color: e.target.value } }))} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used in hero gradient, buttons, and accents</p>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layout size={16} className="text-indigo-500" /> Hero Section
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Eyebrow Text (small tag above headline)</label>
                <input placeholder="Authentic Ayurvedic Products" className={inp()}
                  value={platformConfig.hero.eyebrow} onChange={e => setHero('eyebrow', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { key: 'title_line1', label: 'Headline Line 1', placeholder: 'Discover the' },
                  { key: 'title_line2', label: 'Headline Line 2 (gradient)', placeholder: 'Ancient Wisdom' },
                  { key: 'title_line3', label: 'Headline Line 3', placeholder: 'of Ayurveda' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input placeholder={placeholder} className={inp()}
                      value={(platformConfig.hero as any)[key]} onChange={e => setHero(key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle / Description</label>
                <textarea rows={3} className={inp('resize-y')} value={platformConfig.hero.subtitle}
                  onChange={e => setHero('subtitle', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Primary CTA Button</label>
                  <input placeholder="Shop Now" className={inp()} value={platformConfig.hero.cta_primary}
                    onChange={e => setHero('cta_primary', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Secondary CTA Button</label>
                  <input placeholder="Watch Our Story" className={inp()} value={platformConfig.hero.cta_secondary}
                    onChange={e => setHero('cta_secondary', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Star size={16} className="text-indigo-500" /> Hero Stats (3 numbers shown in the hero)
            </h3>
            <div className="space-y-3">
              {platformConfig.stats.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Value {i + 1}</label>
                    <input placeholder="10,000+" className={inp()} value={s.value}
                      onChange={e => setStat(i, 'value', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label {i + 1}</label>
                    <input placeholder="Happy Customers" className={inp()} value={s.label}
                      onChange={e => setStat(i, 'label', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                🌿 Trust Strip Items (hero bottom row + mobile stats)
              </h3>
              <button onClick={() => setPlatformConfig(p => ({ ...p, trust_items: [...p.trust_items, { icon: '✅', label: 'New Feature' }] }))}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {platformConfig.trust_items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-16 text-center"
                    value={item.icon} onChange={e => setTrustItem(i, 'icon', e.target.value)} placeholder="🌿" />
                  <input className={inp('flex-1')} value={item.label}
                    onChange={e => setTrustItem(i, 'label', e.target.value)} placeholder="USDA Organic Certified" />
                  <button onClick={() => setPlatformConfig(p => ({ ...p, trust_items: p.trust_items.filter((_, idx) => idx !== i) }))}
                    className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Ticker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Megaphone size={16} className="text-indigo-500" /> Ticker / Scrolling Banner Text
              </h3>
              <button onClick={() => setPlatformConfig(p => ({ ...p, ticker: [...p.ticker, 'New item'] }))}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {platformConfig.ticker.map((item, i) => (
                <div key={i} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  <input className="px-3 py-1.5 text-sm bg-transparent focus:outline-none w-40"
                    value={item} onChange={e => setTickerItem(i, e.target.value)} />
                  <button onClick={() => setPlatformConfig(p => ({ ...p, ticker: p.ticker.filter((_, idx) => idx !== i) }))}
                    className="px-2 text-gray-400 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Features / Why Choose Us */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Feature Cards ("Why Choose Us" section)</h3>
              <button onClick={() => setPlatformConfig(p => ({ ...p, features: [...p.features, { title: 'New feature', description: 'Description here', tag: 'Tag' }] }))}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="space-y-4">
              {platformConfig.features.map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2 relative">
                  <button onClick={() => setPlatformConfig(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                      <input className={inp()} value={f.title} onChange={e => setFeature(i, 'title', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tag Badge</label>
                      <input className={inp()} value={f.tag} onChange={e => setFeature(i, 'tag', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea rows={2} className={inp('resize-none')} value={f.description}
                      onChange={e => setFeature(i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banners */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ImageIcon size={16} className="text-indigo-500" /> Homepage Promotional Banners
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">These will show as a carousel / slide on the homepage when at least one is added.</p>
              </div>
              <button onClick={() => setPlatformConfig(p => ({ ...p, banners: [...p.banners, { image_url: '', link: '/products', alt: 'Sale banner' }] }))}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800">
                <Plus size={13} /> Add Banner
              </button>
            </div>
            {platformConfig.banners.length === 0 && (
              <p className="text-sm text-gray-400 italic">No banners added yet. Click "Add Banner" to create promotional slides for your homepage.</p>
            )}
            <div className="space-y-3">
              {platformConfig.banners.map((b, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">Banner {i + 1}</span>
                    <button onClick={() => setPlatformConfig(p => ({ ...p, banners: p.banners.filter((_, idx) => idx !== i) }))}
                      className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                  {b.image_url && (
                    <img src={b.image_url} alt={b.alt || 'Banner preview'} className="w-full h-24 object-cover rounded-lg" />
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                    <input type="url" placeholder="https://..." className={inp()}
                      value={b.image_url} onChange={e => setBanner(i, 'image_url', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Link (on click)</label>
                      <input placeholder="/products" className={inp()} value={b.link}
                        onChange={e => setBanner(i, 'link', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Alt text</label>
                      <input placeholder="Sale banner" className={inp()} value={b.alt}
                        onChange={e => setBanner(i, 'alt', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Bottom Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="bg-slate-800 text-white font-semibold px-8 py-3 rounded-xl hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
