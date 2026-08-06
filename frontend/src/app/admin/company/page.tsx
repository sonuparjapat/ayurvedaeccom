'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  Building2, Save, Upload, X, Globe, Instagram, Facebook,
  Twitter, Youtube, Image as ImageIcon, Loader2, RefreshCw
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

export default function CompanyPage() {
  const [record, setRecord] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [logoMode, setLogoMode] = useState<'url' | 'file'>('url')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

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
      }
    } catch { notify.error('Failed to load company settings') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleLogoFile = (file: File) => {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))
  const setSocial = (key: string, val: string) =>
    setForm(f => ({ ...f, social_links: { ...f.social_links, [key]: val } }))

  const handleSave = async () => {
    if (!form.company_name.trim()) return notify.error('Company name is required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'social_links') fd.append(k, JSON.stringify(v))
        else fd.append(k, v as string)
      })
      if (logoFile) fd.append('logo', logoFile)

      if (record) {
        await axios.put(`/company/${record.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Company settings saved')
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
              <p className="text-white/70 text-sm">Logo, contact info, social links & policies</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Logo + Social */}
        <div className="space-y-6">

          {/* Logo Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-indigo-500" /> Company Logo
            </h3>

            {/* Preview */}
            <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 h-24 flex items-center justify-center">
              {currentLogo ? (
                <img src={currentLogo} alt="Logo preview" className="max-h-20 max-w-full object-contain" />
              ) : (
                <div className="text-gray-400 text-xs">No logo set</div>
              )}
            </div>

            {/* Mode toggle */}
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
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.logo_url}
                  onChange={e => { set('logo_url', e.target.value); setLogoPreview(e.target.value) }}
                />
                <p className="text-xs text-gray-400 mt-1.5">Paste direct image URL (S3, CDN, etc.)</p>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 text-center hover:border-indigo-400 transition">
                  <Upload size={18} className="mx-auto mb-1 text-indigo-400" />
                  <p className="text-xs text-gray-500">Click to upload logo</p>
                  <p className="text-xs text-gray-400">PNG recommended (transparent bg ideal)</p>
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
                { key: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877f2', placeholder: 'https://facebook.com/yourpage' },
                { key: 'instagram', icon: Instagram, label: 'Instagram', color: '#e1306c', placeholder: 'https://instagram.com/yourhandle' },
                { key: 'twitter', icon: Twitter, label: 'Twitter / X', color: '#1da1f2', placeholder: 'https://twitter.com/yourhandle' },
                { key: 'youtube', icon: Youtube, label: 'YouTube', color: '#ff0000', placeholder: 'https://youtube.com/yourchannel' },
              ].map(({ key, icon: Icon, label, color, placeholder }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <Icon size={12} style={{ color }} /> {label}
                  </label>
                  <input
                    type="url"
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={(form.social_links as any)[key]}
                    onChange={e => setSocial(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Company Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'company_name', label: 'Company Name *', placeholder: 'Oroganix Pvt Ltd' },
                { key: 'gst_number', label: 'GST Number (GSTIN)', placeholder: '27AAAAA0000A1Z5' },
                { key: 'email', label: 'Primary Email', placeholder: 'info@oroganix.com' },
                { key: 'support_email', label: 'Support Email', placeholder: 'support@oroganix.com' },
                { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
                { key: 'website', label: 'Website', placeholder: 'https://oroganix.com' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Address</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address Line</label>
                <input
                  placeholder="e.g. 123 MG Road, Sector 5"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.address_line1}
                  onChange={e => set('address_line1', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'city', label: 'City', placeholder: 'Mumbai' },
                  { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                  { key: 'country', label: 'Country', placeholder: 'India' },
                  { key: 'pincode', label: 'Pincode', placeholder: '400001' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={(form as any)[key]}
                      onChange={e => set(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance & Banking */}
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
                  <input
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Policy Pages */}
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
                  <textarea
                    rows={4}
                    placeholder={`Enter ${label} content...`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                    value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-800 text-white font-semibold px-8 py-3 rounded-xl hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
