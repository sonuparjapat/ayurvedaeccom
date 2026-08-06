'use client'

import { useEffect, useRef, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Gamepad2, Trophy, History, RefreshCw } from 'lucide-react'

type ScratchCard = {
  id: number; title: string; description: string
  reward_type: string; reward_value: number
  starts_at: string | null; expires_at: string | null
  max_claims_per_user: number; user_claims: number
}

type Segment = {
  id: number; label: string; reward_type: string; reward_value: number
  probability_weight: number; color: string; sort_order: number
}

type SpinWheel = {
  id: number; title: string; spins_per_user_per_day: number
  spins_today: number; segments: Segment[]
}

type HistoryItem = { type: 'scratch' | 'spin'; description: string; reward_type: string; reward_value: number; reward_ref: string | null; date: string }

const REWARD_LABELS: Record<string, string> = { wallet: 'Wallet Credit', points: 'Loyalty Points', coupon: 'Coupon', none: 'No Reward' }

export default function GamesPage() {
  const [tab, setTab] = useState<'scratch' | 'spin' | 'history'>('scratch')
  const [cards, setCards] = useState<ScratchCard[]>([])
  const [wheels, setWheels] = useState<SpinWheel[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [c, w, h] = await Promise.allSettled([
        axios.get('/games/scratch/active'),
        axios.get('/games/spin/active'),
        axios.get('/games/my-history'),
      ])
      if (c.status === 'fulfilled') setCards(c.value.data?.data || [])
      if (w.status === 'fulfilled') setWheels(w.value.data?.data || [])
      if (h.status === 'fulfilled') {
        const hist: HistoryItem[] = []
        ;(h.value.data?.scratch || []).forEach((s: any) => hist.push({ type: 'scratch', description: s.card_title, reward_type: s.reward_type, reward_value: s.reward_value, reward_ref: s.reward_ref, date: s.claimed_at }))
        ;(h.value.data?.spins || []).forEach((s: any) => hist.push({ type: 'spin', description: s.wheel_title + ' → ' + s.segment_label, reward_type: s.reward_type, reward_value: s.reward_value, reward_ref: s.reward_ref, date: s.played_at }))
        hist.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setHistory(hist)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1e14 0%, #1a3020 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(52,211,153,0.12)', borderRadius: 50, padding: '8px 20px', marginBottom: 12 }}>
            <Gamepad2 size={18} style={{ color: '#34d399' }} />
            <span style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>Play & Win Rewards</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>Games Hub</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 }}>Scratch cards, spin wheels, and more. Real rewards for every win!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/10 rounded-2xl p-1">
          {([['scratch', '🎟', 'Scratch Cards'], ['spin', '🎡', 'Spin Wheel'], ['history', '📜', 'My History']] as const).map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t as any)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 14, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t ? '#34d399' : 'transparent', color: tab === t ? '#0f1e14' : 'rgba(255,255,255,0.6)' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {loading ? <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '60px 0' }}>Loading…</div> : (
          <>
            {tab === 'scratch' && <ScratchTab cards={cards} onClaim={load} />}
            {tab === 'spin' && <SpinTab wheels={wheels} onSpin={load} />}
            {tab === 'history' && <HistoryTab history={history} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ── SCRATCH CARD TAB ── */
function ScratchTab({ cards, onClaim }: { cards: ScratchCard[]; onClaim: () => void }) {
  if (!cards.length) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0' }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🎟</p>
      <p>No scratch cards available right now. Check back soon!</p>
    </div>
  )
  return (
    <div className="space-y-4">
      {cards.map(card => <ScratchCardItem key={card.id} card={card} onClaim={onClaim} />)}
    </div>
  )
}

function ScratchCardItem({ card, onClaim }: { card: ScratchCard; onClaim: () => void }) {
  const [scratched, setScratched] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [result, setResult] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const coverageRef = useRef(0)
  const alreadyClaimed = card.max_claims_per_user > 0 && card.user_claims >= card.max_claims_per_user

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.fillStyle = '#2d6a4f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = `bold ${Math.floor(canvas.width * 0.07)}px sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.textAlign = 'center'
    ctx.fillText('✦  SCRATCH HERE  ✦', canvas.width / 2, canvas.height / 2 + 8)
    ctx.globalCompositeOperation = 'destination-out'
  }, [])

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || scratched || alreadyClaimed) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    ctx.globalCompositeOperation = 'destination-out'
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.fill()

    // Calculate coverage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparent = 0
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++
    }
    const total = canvas.width * canvas.height
    coverageRef.current = transparent / total
    if (coverageRef.current > 0.5 && !scratched) {
      setScratched(true)
      claimCard()
    }
  }

  const claimCard = async () => {
    if (claiming || result) return
    setClaiming(true)
    try {
      const r = await axios.post(`/games/scratch/${card.id}/claim`)
      setResult(r.data)
      if (r.data?.reward?.type && r.data.reward.type !== 'none') {
        toast.success(`You won: ${REWARD_LABELS[r.data.reward.type]}!`)
      } else {
        toast('Better luck next time!', { icon: '🎟' })
      }
      onClaim()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not claim')
    } finally { setClaiming(false) }
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>{card.title}</p>
        {card.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{card.description}</p>}
        {card.expires_at && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>Expires {new Date(card.expires_at).toLocaleDateString('en-IN')}</p>}
      </div>

      {/* Scratch area */}
      <div style={{ position: 'relative', height: 120, background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Prize underneath */}
        <div style={{ textAlign: 'center', zIndex: 0 }}>
          {result ? (
            result.reward?.type && result.reward.type !== 'none' ? (
              <>
                <p style={{ fontSize: 32, margin: 0 }}>🎉</p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: '4px 0 0' }}>
                  {result.reward.type === 'wallet' && `₹${result.reward.value} Wallet Credit!`}
                  {result.reward.type === 'points' && `${result.reward.value} Loyalty Points!`}
                  {result.reward.type === 'coupon' && `Coupon: ${result.reward.ref}`}
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 32, margin: 0 }}>😔</p>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: '4px 0 0' }}>Better luck next time!</p>
              </>
            )
          ) : (
            card.reward_type !== 'none' && !alreadyClaimed && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 600 }}>Scratch to reveal your prize!</p>
            )
          )}
        </div>

        {/* Scratch overlay */}
        {!alreadyClaimed && !result && (
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', touchAction: 'none', zIndex: 1, borderRadius: 0 }}
            onMouseDown={() => isDrawing.current = true}
            onMouseUp={() => isDrawing.current = false}
            onMouseMove={e => { if (isDrawing.current) scratch(e) }}
            onTouchMove={scratch}
          />
        )}

        {alreadyClaimed && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 14 }}>Already claimed</p>
          </div>
        )}
        {claiming && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <RefreshCw size={24} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>

      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {card.max_claims_per_user > 0 ? `${card.user_claims}/${card.max_claims_per_user} used` : 'Unlimited claims'}
        </span>
        {alreadyClaimed && <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>✓ Claimed</span>}
      </div>
    </div>
  )
}

/* ── SPIN WHEEL TAB ── */
function SpinTab({ wheels, onSpin }: { wheels: SpinWheel[]; onSpin: () => void }) {
  if (!wheels.length) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0' }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🎡</p>
      <p>No spin wheels available right now. Check back soon!</p>
    </div>
  )
  return (
    <div className="space-y-8">
      {wheels.map(wheel => <SpinWheelItem key={wheel.id} wheel={wheel} onSpin={onSpin} />)}
    </div>
  )
}

function SpinWheelItem({ wheel, onSpin }: { wheel: SpinWheel; onSpin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const currentAngleRef = useRef(0)
  const SIZE = 300
  const canSpin = wheel.spins_today < wheel.spins_per_user_per_day

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 8
    const segs = wheel.segments || []
    if (!segs.length) return
    const sliceAngle = (Math.PI * 2) / segs.length
    ctx.clearRect(0, 0, SIZE, SIZE)

    segs.forEach((seg, i) => {
      const start = angle + i * sliceAngle
      const end = start + sliceAngle
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.fillStyle = seg.color || '#10b981'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5; ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.max(10, Math.min(13, 200 / segs.length))}px sans-serif`
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3
      ctx.fillText(seg.label, r - 12, 4)
      ctx.restore()
    })

    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.fill()
    ctx.fillStyle = '#1a3020'
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('●', cx, cy)

    // Pointer
    ctx.beginPath()
    ctx.moveTo(cx - 10, 4)
    ctx.lineTo(cx + 10, 4)
    ctx.lineTo(cx, 30)
    ctx.fillStyle = '#f97316'; ctx.fill()
  }

  useEffect(() => { drawWheel(currentAngleRef.current) }, [wheel])

  const spin = async () => {
    if (spinning || !canSpin) return
    setSpinning(true); setResult(null)
    // Start animation
    const totalRotation = (Math.PI * 2) * (5 + Math.random() * 5)
    const duration = 4000
    const start = performance.now()
    const startAngle = currentAngleRef.current
    const animate = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      currentAngleRef.current = startAngle + totalRotation * eased
      drawWheel(currentAngleRef.current)
      if (t < 1) { requestAnimationFrame(animate) }
      else { callApi() }
    }
    requestAnimationFrame(animate)
  }

  const callApi = async () => {
    try {
      const r = await axios.post(`/games/spin/${wheel.id}/play`)
      setResult(r.data)
      // Snap to winning segment
      const segs = wheel.segments || []
      const winSeg = segs.find(s => s.id === r.data?.segment?.id)
      if (winSeg) {
        const idx = segs.indexOf(winSeg)
        const sliceAngle = (Math.PI * 2) / segs.length
        const targetMid = idx * sliceAngle + sliceAngle / 2
        const snapAngle = -targetMid + Math.PI * 1.5
        const fullRotations = Math.ceil((snapAngle - currentAngleRef.current) / (Math.PI * 2)) * Math.PI * 2
        currentAngleRef.current = snapAngle + fullRotations
        drawWheel(currentAngleRef.current)
      }
      if (r.data?.reward?.type && r.data.reward.type !== 'none') {
        toast.success(`You won: ${REWARD_LABELS[r.data.reward.type]}!`, { duration: 4000 })
      } else {
        toast('Better luck next time! 🎡')
      }
      onSpin()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not spin')
    } finally { setSpinning(false) }
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>{wheel.title}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
          {wheel.spins_today}/{wheel.spins_per_user_per_day} spins used today
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
        </div>
        <button onClick={spin} disabled={spinning || !canSpin}
          style={{
            marginTop: 20, padding: '12px 36px', borderRadius: 50, border: 'none', cursor: canSpin && !spinning ? 'pointer' : 'not-allowed',
            background: canSpin && !spinning ? 'linear-gradient(90deg, #34d399, #059669)' : 'rgba(255,255,255,0.1)',
            color: canSpin && !spinning ? '#0f1e14' : 'rgba(255,255,255,0.4)',
            fontWeight: 800, fontSize: 15, transition: 'all 0.2s'
          }}>
          {spinning ? '🎡 Spinning…' : !canSpin ? `Daily limit reached (${wheel.spins_per_user_per_day}/day)` : '🎡 Spin Now!'}
        </button>
        {result && (
          <div style={{ marginTop: 16, background: result.reward ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 24px', textAlign: 'center', border: `1px solid ${result.reward ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
            <p style={{ color: '#34d399', fontWeight: 800, fontSize: 18, margin: 0 }}>
              {!result.reward ? '😔 Better luck next time!' : `🎉 ${result.segment?.label}`}
            </p>
            {result.reward && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
                {result.reward.type === 'wallet' && `₹${result.reward.value} added to your wallet`}
                {result.reward.type === 'points' && `${result.reward.value} points added`}
                {result.reward.type === 'coupon' && `Coupon code: ${result.reward.ref}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── HISTORY TAB ── */
function HistoryTab({ history }: { history: HistoryItem[] }) {
  if (!history.length) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0' }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>📜</p>
      <p>No game history yet. Play a game to see your rewards here!</p>
    </div>
  )
  return (
    <div className="space-y-3">
      {history.map((h, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{h.type === 'scratch' ? '🎟' : '🎡'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.description}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{new Date(h.date).toLocaleString('en-IN')}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {h.reward_type !== 'none' ? (
              <>
                <p style={{ color: '#34d399', fontWeight: 700, fontSize: 13, margin: 0 }}>
                  {h.reward_type === 'wallet' && `+₹${h.reward_value}`}
                  {h.reward_type === 'points' && `+${h.reward_value} pts`}
                  {h.reward_type === 'coupon' && '🎟 Coupon'}
                </p>
                {h.reward_ref && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>{h.reward_ref}</p>}
              </>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No reward</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
