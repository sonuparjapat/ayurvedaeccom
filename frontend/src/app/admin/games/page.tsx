'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Gamepad2, Plus, Trash2, Edit3, X, Check, Ticket, RefreshCw, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

type ScratchCard = {
  id: number; title: string; description: string
  reward_type: string; reward_value: number; reward_is_percent: boolean
  starts_at: string | null; expires_at: string | null
  max_claims: number; claims_count: number; max_claims_per_user: number; max_claims_per_day: number
  is_active: boolean; created_by_name: string
}

type Segment = {
  id?: number; label: string; reward_type: string; reward_value: number
  probability_weight: number; color: string; sort_order: number
}

type SpinWheel = {
  id: number; title: string; spins_per_user_per_day: number; is_active: boolean
  expires_at: string | null
  segments: Segment[]
}

const REWARD_LABELS: Record<string, string> = { wallet: 'Wallet Credit', points: 'Loyalty Points', coupon: 'Coupon Code', none: 'No Reward' }

/* Defined at module level — NOT inside the page component — so React never unmounts it on re-render and focus is preserved */
function FieldInput({ label, value, onChange, type = 'text', min, step }: { label: string; value: any; onChange: (v: any) => void; type?: string; min?: number; step?: number }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{label}</label>
      <input type={type} min={min} step={step} value={value ?? ''}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
    </div>
  )
}
const SEGMENT_COLORS = ['#f97316', '#8b5cf6', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6']

const emptyCard = (): Partial<ScratchCard> => ({
  title: '', description: '', reward_type: 'wallet', reward_value: 50,
  starts_at: '', expires_at: '', max_claims: 100, max_claims_per_user: 1, max_claims_per_day: 0, is_active: true
})

const emptyWheel = () => ({
  title: '', spins_per_user_per_day: 1, is_active: true, starts_at: '', expires_at: '',
  segments: [
    { label: 'Better luck!', reward_type: 'none', reward_value: 0, probability_weight: 40, color: '#6b7280', sort_order: 0 },
    { label: '₹20 Wallet', reward_type: 'wallet', reward_value: 20, probability_weight: 30, color: '#10b981', sort_order: 1 },
    { label: '50 Points', reward_type: 'points', reward_value: 50, probability_weight: 20, color: '#8b5cf6', sort_order: 2 },
    { label: '₹100 Wallet', reward_type: 'wallet', reward_value: 100, probability_weight: 10, color: '#f97316', sort_order: 3 },
  ] as Segment[]
})

export default function AdminGamesPage() {
  const [tab, setTab] = useState<'scratch' | 'spin'>('scratch')
  const [cards, setCards] = useState<ScratchCard[]>([])
  const [wheels, setWheels] = useState<SpinWheel[]>([])
  const [loading, setLoading] = useState(true)

  const [showCardModal, setShowCardModal] = useState(false)
  const [editCard, setEditCard] = useState<Partial<ScratchCard> | null>(null)

  const [showWheelModal, setShowWheelModal] = useState(false)
  const [editWheel, setEditWheel] = useState<any>(null)
  const [expandedWheelId, setExpandedWheelId] = useState<number | null>(null)

  const loadCards = async () => { try { const r = await axios.get('/games/scratch/admin/list'); setCards(r.data?.data || []) } catch {} }
  const loadWheels = async () => { try { const r = await axios.get('/games/spin/admin/list'); setWheels(r.data?.data || []) } catch {} }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCards(), loadWheels()]).finally(() => setLoading(false))
  }, [])

  // ── Scratch Card CRUD ──
  const saveCard = async () => {
    if (!editCard?.title?.trim()) { toast.error('Title required'); return }
    try {
      if ((editCard as ScratchCard).id) {
        await axios.put(`/games/scratch/admin/${(editCard as ScratchCard).id}`, editCard)
        toast.success('Updated!')
      } else {
        await axios.post('/games/scratch/admin/create', editCard)
        toast.success('Scratch card created!')
      }
      setShowCardModal(false); setEditCard(null); loadCards()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const deleteCard = async (id: number) => {
    if (!confirm('Delete this scratch card campaign?')) return
    try { await axios.delete(`/games/scratch/admin/${id}`); toast.success('Deleted'); loadCards() }
    catch { toast.error('Failed to delete') }
  }

  // ── Spin Wheel CRUD ──
  const saveWheel = async () => {
    if (!editWheel?.title?.trim()) { toast.error('Title required'); return }
    if (!editWheel.segments?.length) { toast.error('Add at least one segment'); return }
    const totalWeight = editWheel.segments.reduce((s: number, seg: Segment) => s + Number(seg.probability_weight), 0)
    if (totalWeight !== 100) { toast.error(`Weights must total 100 (currently ${totalWeight})`); return }
    try {
      if (editWheel.id) {
        await axios.put(`/games/spin/admin/${editWheel.id}`, editWheel)
        toast.success('Wheel updated!')
      } else {
        await axios.post('/games/spin/admin/create', editWheel)
        toast.success('Spin wheel created!')
      }
      setShowWheelModal(false); setEditWheel(null); loadWheels()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const deleteWheel = async (id: number) => {
    if (!confirm('Delete this spin wheel?')) return
    try { await axios.delete(`/games/spin/admin/${id}`); toast.success('Deleted'); loadWheels() }
    catch { toast.error('Failed to delete') }
  }

  const updateSegment = (idx: number, field: keyof Segment, value: any) => {
    setEditWheel((p: any) => {
      const segs = [...(p.segments || [])]
      segs[idx] = { ...segs[idx], [field]: value }
      return { ...p, segments: segs }
    })
  }

  const addSegment = () => {
    setEditWheel((p: any) => ({
      ...p, segments: [...(p.segments || []), {
        label: 'New Prize', reward_type: 'none', reward_value: 0,
        probability_weight: 0, color: SEGMENT_COLORS[(p.segments?.length || 0) % SEGMENT_COLORS.length],
        sort_order: (p.segments?.length || 0)
      }]
    }))
  }

  const removeSegment = (idx: number) => {
    setEditWheel((p: any) => ({ ...p, segments: (p.segments || []).filter((_: any, i: number) => i !== idx) }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gamepad2 size={22} className="text-emerald-600" /> Games & Rewards
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage scratch card campaigns and spin-the-wheel games</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['scratch', 'spin'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'scratch' ? '🎟 Scratch Cards' : '🎡 Spin Wheel'}
          </button>
        ))}
      </div>

      {/* ── SCRATCH CARDS TAB ── */}
      {tab === 'scratch' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditCard(emptyCard()); setShowCardModal(true) }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">
              <Plus size={16} /> New Campaign
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400">Loading…</div> :
            cards.length === 0 ? <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">No scratch card campaigns yet.</div> :
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map(card => (
                <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{card.title}</p>
                      <p className="text-xs text-gray-500">{card.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditCard({ ...card }); setShowCardModal(true) }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit3 size={14} /></button>
                      <button onClick={() => deleteCard(card.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {card.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full font-semibold">
                      {REWARD_LABELS[card.reward_type]}: {card.reward_type === 'none' ? '—' : `₹${card.reward_value}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Claims', value: `${card.claims_count}/${card.max_claims || '∞'}` },
                      { label: 'Per User', value: card.max_claims_per_user || '∞' },
                      { label: 'Per Day', value: card.max_claims_per_day || '∞' },
                      { label: 'Expires', value: card.expires_at ? new Date(card.expires_at).toLocaleDateString('en-IN') : 'No limit' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                        <p className="text-sm font-bold text-gray-800">{s.value}</p>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        </>
      )}

      {/* ── SPIN WHEEL TAB ── */}
      {tab === 'spin' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditWheel(emptyWheel()); setShowWheelModal(true) }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">
              <Plus size={16} /> New Wheel
            </button>
          </div>
          {loading ? <div className="py-16 text-center text-gray-400">Loading…</div> :
            wheels.length === 0 ? <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">No spin wheels yet.</div> :
            <div className="space-y-4">
              {wheels.map(wheel => (
                <div key={wheel.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-bold text-gray-900">{wheel.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${wheel.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {wheel.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-400">{wheel.spins_per_user_per_day} spin/day · {wheel.segments?.length || 0} segments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditWheel({ ...wheel, segments: wheel.segments || [] }); setShowWheelModal(true) }}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit3 size={14} /></button>
                      <button onClick={() => deleteWheel(wheel.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      <button onClick={() => setExpandedWheelId(expandedWheelId === wheel.id ? null : wheel.id)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                        {expandedWheelId === wheel.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                  {expandedWheelId === wheel.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Segments</p>
                      <div className="flex flex-wrap gap-2">
                        {(wheel.segments || []).map((seg, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2">
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                            <span className="text-xs font-semibold text-gray-800">{seg.label}</span>
                            <span className="text-xs text-gray-400">{seg.probability_weight}%</span>
                            {seg.reward_type !== 'none' && <span className="text-xs text-violet-600">₹{seg.reward_value}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        </>
      )}

      {/* ── SCRATCH CARD MODAL ── */}
      {showCardModal && editCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { setShowCardModal(false); setEditCard(null) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{(editCard as ScratchCard).id ? 'Edit Scratch Card' : 'New Scratch Card'}</h2>
            <div className="space-y-3">
              <FieldInput label="Title *" value={editCard.title} onChange={(v: string) => setEditCard(p => ({ ...p!, title: v }))} />
              <FieldInput label="Description" value={editCard.description} onChange={(v: string) => setEditCard(p => ({ ...p!, description: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Reward Type</label>
                  <select value={editCard.reward_type || 'none'} onChange={e => setEditCard(p => ({ ...p!, reward_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    {Object.entries(REWARD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <FieldInput label="Reward Value (₹)" type="number" min={0} value={editCard.reward_value} onChange={(v: number) => setEditCard(p => ({ ...p!, reward_value: v }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FieldInput label="Max Claims (0=∞)" type="number" min={0} value={editCard.max_claims} onChange={(v: number) => setEditCard(p => ({ ...p!, max_claims: v }))} />
                <FieldInput label="Per User Limit (0=∞)" type="number" min={0} value={editCard.max_claims_per_user} onChange={(v: number) => setEditCard(p => ({ ...p!, max_claims_per_user: v }))} />
                <FieldInput label="Daily Limit / User (0=∞)" type="number" min={0} value={(editCard as any).max_claims_per_day ?? 0} onChange={(v: number) => setEditCard(p => ({ ...p!, max_claims_per_day: v } as any))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Starts At</label>
                  <input type="datetime-local" value={editCard.starts_at || ''} onChange={e => setEditCard(p => ({ ...p!, starts_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Expires At</label>
                  <input type="datetime-local" value={editCard.expires_at || ''} onChange={e => setEditCard(p => ({ ...p!, expires_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editCard.is_active} onChange={e => setEditCard(p => ({ ...p!, is_active: e.target.checked }))} />
                <span className="text-sm text-gray-700 font-medium">Active</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveCard} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">
                <Check size={15} /> Save
              </button>
              <button onClick={() => { setShowCardModal(false); setEditCard(null) }} className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SPIN WHEEL MODAL ── */}
      {showWheelModal && editWheel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { setShowWheelModal(false); setEditWheel(null) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editWheel.id ? 'Edit Spin Wheel' : 'New Spin Wheel'}</h2>
            <div className="space-y-3 mb-5">
              <FieldInput label="Title *" value={editWheel.title} onChange={(v: string) => setEditWheel((p: any) => ({ ...p, title: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Daily Spin Limit" type="number" min={1} value={editWheel.spins_per_user_per_day} onChange={(v: number) => setEditWheel((p: any) => ({ ...p, spins_per_user_per_day: v }))} />
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
                  <select value={editWheel.is_active ? 'true' : 'false'} onChange={e => setEditWheel((p: any) => ({ ...p, is_active: e.target.value === 'true' }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Starts At</label>
                  <input type="datetime-local" value={editWheel.starts_at || ''} onChange={e => setEditWheel((p: any) => ({ ...p, starts_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Expires At</label>
                  <input type="datetime-local" value={editWheel.expires_at || ''} onChange={e => setEditWheel((p: any) => ({ ...p, expires_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>

            {/* Segments */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">Segments</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${editWheel.segments?.reduce((s: number, seg: Segment) => s + Number(seg.probability_weight), 0) === 100 ? 'text-green-600' : 'text-red-500'}`}>
                  Total: {editWheel.segments?.reduce((s: number, seg: Segment) => s + Number(seg.probability_weight), 0)}% {editWheel.segments?.reduce((s: number, seg: Segment) => s + Number(seg.probability_weight), 0) === 100 ? '✓' : '(must be 100)'}
                </span>
                <button onClick={addSegment} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-1">
                  <Plus size={12} /> Add Segment
                </button>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {(editWheel.segments || []).map((seg: Segment, i: number) => (
                <div key={i} className="grid items-center gap-2 bg-gray-50 rounded-xl p-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                  <input value={seg.label} onChange={e => updateSegment(i, 'label', e.target.value)} placeholder="Label"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500" />
                  <select value={seg.reward_type} onChange={e => updateSegment(i, 'reward_type', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500">
                    {Object.entries(REWARD_LABELS).map(([v, l]) => <option key={v} value={v}>{l.split(' ')[0]}</option>)}
                  </select>
                  <input type="number" min={0} value={seg.reward_value} onChange={e => updateSegment(i, 'reward_value', Number(e.target.value))} placeholder="Value"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500" />
                  <div className="flex items-center gap-1.5">
                    <input type="number" min={0} max={100} value={seg.probability_weight} onChange={e => updateSegment(i, 'probability_weight', Number(e.target.value))} placeholder="%"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-14 focus:outline-none focus:border-emerald-500" />
                    <span className="text-xs text-gray-400">%</span>
                    <input type="color" value={seg.color || '#10b981'} onChange={e => updateSegment(i, 'color', e.target.value)}
                      className="w-7 h-7 border-0 rounded cursor-pointer" />
                  </div>
                  <button onClick={() => removeSegment(i)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={saveWheel} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">
                <Check size={15} /> Save Wheel
              </button>
              <button onClick={() => { setShowWheelModal(false); setEditWheel(null) }} className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
