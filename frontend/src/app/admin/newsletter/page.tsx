'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  Mail, Users, Trash2, Download, RefreshCw, CheckCircle, XCircle,
  Search, Send, Tag, Megaphone, ChevronDown, ChevronUp, Eye, X,
} from 'lucide-react'
import { PageInfoBanner, LabelWithInfo } from '@/components/admin/FieldInfo'
import AdminPagination from '@/components/admin/AdminPagination'

type CampaignType = 'custom' | 'coupon'

const BLANK_CAMPAIGN = {
  type: 'custom' as CampaignType,
  subject: '',
  heading: '',
  body: '',
  ctaText: '',
  ctaUrl: '',
  couponCode: '',
  discountType: 'percent' as 'percent' | 'flat',
  discountValue: '',
  minOrder: '',
  validTo: '',
  description: '',
}

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Campaign state
  const [showCampaign, setShowCampaign] = useState(false)
  const [campaign, setCampaign] = useState({ ...BLANK_CAMPAIGN })
  const [sending, setSending] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/newsletter/admin', { params: { page, limit: 30, status: filter } })
      setSubs(res.data.data || [])
      setTotal(res.data.total || 0)
      setActiveCount(res.data.activeCount || 0)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subscriber?')) return
    try {
      await axios.delete(`/newsletter/admin/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const handleExport = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/newsletter/admin/export`, '_blank')
  }

  const setCamp = (k: string, v: any) => setCampaign(p => ({ ...p, [k]: v }))

  const handleSendCampaign = async () => {
    if (!activeCount) return toast.error('No active subscribers to send to')
    if (!confirm(`Send this campaign to all ${activeCount} active subscribers?`)) return
    setSending(true)
    try {
      const payload: any = { type: campaign.type }
      if (campaign.type === 'custom') {
        if (!campaign.subject.trim() || !campaign.body.trim()) {
          toast.error('Subject and body are required')
          setSending(false)
          return
        }
        payload.subject = campaign.subject
        payload.heading = campaign.heading
        payload.body = campaign.body
        payload.ctaText = campaign.ctaText
        payload.ctaUrl = campaign.ctaUrl
      } else {
        if (!campaign.couponCode.trim()) {
          toast.error('Coupon code is required')
          setSending(false)
          return
        }
        payload.subject = campaign.subject
        payload.couponCode = campaign.couponCode.toUpperCase()
        payload.discountType = campaign.discountType
        payload.discountValue = Number(campaign.discountValue) || 0
        payload.minOrder = Number(campaign.minOrder) || 0
        payload.validTo = campaign.validTo || null
        payload.description = campaign.description
      }
      const res = await axios.post('/newsletter/admin/send-campaign', payload)
      toast.success(res.data.message || 'Campaign sent!')
      setCampaign({ ...BLANK_CAMPAIGN })
      setShowCampaign(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to send campaign')
    } finally { setSending(false) }
  }

  const filtered = subs.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Newsletter</h1>
              <p className="text-white/70 text-sm">{activeCount} active subscribers</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">

            <button
              onClick={() => setShowCampaign(v => !v)}
              className="flex items-center gap-2 bg-white text-emerald-700 font-semibold text-sm px-4 py-2 rounded-xl transition hover:bg-emerald-50 shadow"
            >
              <Send size={14} /> Send Campaign
              {showCampaign ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={handleExport} className="bg-white/20 hover:bg-white/30 text-white font-medium text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={load} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <PageInfoBanner
        title="Newsletter"
        description="Manage email subscribers and send broadcast campaigns. Use Custom Message for general announcements or Coupon Campaign to send a discount code to all active subscribers at once."
        tips={[
          "Only 'active' subscribers receive campaigns — unsubscribed users are automatically excluded.",
          "Custom Message campaigns: write subject, heading, body text, and optionally add a CTA button.",
          "Coupon Campaign: the system emails a discount code with the offer details — no manual design needed.",
          "Export CSV to get a full list of subscribers for use in external tools like Mailchimp.",
          "Subject line is the most important factor for open rate — keep it under 60 characters.",
          "Campaigns are sent immediately on clicking Send — there is no scheduled send feature yet.",
        ]}
      />

      {/* ── Send Campaign Panel ── */}
      {showCampaign && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Megaphone size={18} />
              <span className="font-semibold">Send Campaign to {activeCount} subscribers</span>
            </div>
            <button onClick={() => setShowCampaign(false)} className="text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Campaign type tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
              {([['custom', 'Custom Message', Megaphone], ['coupon', 'Coupon Campaign', Tag]] as const).map(([t, label, Icon]) => (
                <button key={t} onClick={() => setCamp('type', t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${campaign.type === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {campaign.type === 'custom' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Email Subject *" required what="The subject line of the email shown to subscribers in their inbox." why="The subject line is the #1 factor for open rate — make it specific and action-oriented." example="Your Ayurvedic starter kit is waiting! 🌿" /></label>
                    <input value={campaign.subject} onChange={e => setCamp('subject', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="e.g. 🔥 New arrivals this week!" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Heading (optional)" what="A large heading shown at the top of the email body." why="Adds visual hierarchy — leave blank to use the subject line as the heading." example="This Week's Ayurvedic Picks" /></label>
                    <input value={campaign.heading} onChange={e => setCamp('heading', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="Leave blank to use subject as heading" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Message Body *" required what="The main text of the email — use line breaks to separate paragraphs." why="This is the core message customers will read. Keep it concise and action-focused." example="We've just added 20 new Ayurvedic products. Shop now to discover remedies for stress, digestion, and immunity." /></label>
                  <textarea value={campaign.body} onChange={e => setCamp('body', e.target.value)} rows={5}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                    placeholder="Write your message here. You can use line breaks for formatting." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Button Text (optional)" what="The label on the call-to-action button in the email." why="A clear CTA button increases click-through rates significantly." example="Shop Now, View New Arrivals, Claim Your Offer" /></label>
                    <input value={campaign.ctaText} onChange={e => setCamp('ctaText', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="e.g. Shop Now" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Button URL (optional)" what="The URL the CTA button links to when clicked." why="Send customers directly to the relevant product page or category for best conversion." example="https://oroganix.com/products?category=immunity" /></label>
                    <input value={campaign.ctaUrl} onChange={e => setCamp('ctaUrl', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="https://oroganix.com/products" />
                  </div>
                </div>
              </div>
            )}

            {campaign.type === 'coupon' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Coupon Code *" required what="The discount code subscribers will enter at checkout." why="The code must already exist (or will be communicated here) — the email just announces it." example="SAVE20, WELCOME10, MONSOON15" note="Uppercase only — auto-converted." /></label>
                    <input value={campaign.couponCode} onChange={e => setCamp('couponCode', e.target.value.toUpperCase())}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="SAVE20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Discount Type" what="Whether the discount is a percentage or a fixed rupee amount." why="Percent discounts feel more dynamic; flat discounts work better for high-value orders." example="Percent: 20% off; Flat: ₹100 off" /></label>
                    <select value={campaign.discountType} onChange={e => setCamp('discountType', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                      <option value="percent">Percent (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Discount Value" what="The numeric value of the discount (% or ₹ based on type)." why="This is shown in the email to motivate subscribers to use the code." example="20 (for 20% off), 100 (for ₹100 flat off)" /></label>
                    <input type="number" value={campaign.discountValue} onChange={e => setCamp('discountValue', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder={campaign.discountType === 'percent' ? '20' : '100'} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Min Order (₹, optional)" what="The minimum cart value required to use the coupon." why="Displayed in the email so subscribers know if they qualify." example="499 (minimum ₹499 cart to use the code)" /></label>
                    <input type="number" value={campaign.minOrder} onChange={e => setCamp('minOrder', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Valid Until (optional)" what="The expiry date of the coupon shown in the email." why="Creating urgency with an expiry date increases redemption rates." example="2026-12-31 (set a week from now for urgency)" /></label>
                    <input type="date" value={campaign.validTo} onChange={e => setCamp('validTo', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Email Subject (optional)" what="Custom subject line for the coupon campaign email." why="Leave blank to auto-generate a subject like 'Your exclusive code: SAVE20'." example="Exclusive offer just for you — SAVE20" /></label>
                  <input value={campaign.subject} onChange={e => setCamp('subject', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Leave blank to auto-generate from coupon code" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1"><LabelWithInfo label="Description (optional)" what="A short line displayed in the email below the coupon code." why="Explains how to use the code so there is no friction at checkout." example="Use this code at checkout to save on your next Ayurvedic order." /></label>
                  <input value={campaign.description} onChange={e => setCamp('description', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="e.g. Use this code at checkout for your next order" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                📧 Will be sent to <strong>{activeCount}</strong> active subscribers
              </p>
              <button
                onClick={handleSendCampaign}
                disabled={sending || !activeCount}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition"
              >
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending...' : `Send to ${activeCount} Subscribers`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, icon: <Users size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: activeCount, icon: <CheckCircle size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Unsubscribed', value: total - activeCount, icon: <XCircle size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={s.color}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Search by email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === f ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Unsubscribed'}
          </button>
        ))}
      </div>

      {/* Subscriber table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['#', 'Email', 'Status', 'Subscribed', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                <Mail size={32} className="mx-auto mb-2 text-gray-300" />
                No subscribers found
              </td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50/80 transition">
                <td className="px-4 py-3 text-gray-400">{(page - 1) * 30 + i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                <td className="px-4 py-3">
                  {s.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <CheckCircle size={11} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                      <XCircle size={11} /> Unsubscribed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(s.subscribed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <AdminPagination page={page} pages={Math.ceil(total / 30)} total={total} limit={30} onChange={setPage} />
      </div>
    </div>
  )
}
