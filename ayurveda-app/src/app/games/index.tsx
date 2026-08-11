import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'

const { width: W } = Dimensions.get('window')

type ScratchCard = {
  id: number; title: string; description: string
  reward_type: string; reward_value: number
  max_claims_per_user: number; user_claims: number
  max_claims_per_day: number; user_claims_today: number
  expires_at: string | null
}
type Segment = { id: number; label: string; reward_type: string; reward_value: number; color: string; probability_weight: number }
type SpinWheel = { id: number; title: string; spins_per_user_per_day: number; spins_today: number; segments: Segment[] }
type HistoryItem = { type: string; description: string; reward_type: string; reward_value: number; reward_ref: string | null; date: string }


export default function GamesScreen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<'scratch' | 'spin' | 'history'>('scratch')
  const [cards, setCards] = useState<ScratchCard[]>([])
  const [wheels, setWheels] = useState<SpinWheel[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [c, w, h] = await Promise.allSettled([
        api.get('/games/scratch/active'),
        api.get('/games/spin/active'),
        api.get('/games/my-history'),
      ])
      if (c.status === 'fulfilled') setCards(c.value.data?.data || [])
      if (w.status === 'fulfilled') setWheels(w.value.data?.data || [])
      if (h.status === 'fulfilled') {
        const hist: HistoryItem[] = []
        ;(h.value.data?.scratch || []).forEach((s: any) => hist.push({ type: 'scratch', description: s.card_title, reward_type: s.reward_type, reward_value: s.reward_value, reward_ref: s.reward_ref, date: s.claimed_at }))
        ;(h.value.data?.spins || []).forEach((s: any) => hist.push({ type: 'spin', description: `${s.wheel_title} → ${s.segment_label}`, reward_type: s.reward_type, reward_value: s.reward_value, reward_ref: s.reward_ref, date: s.played_at }))
        hist.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setHistory(hist)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1e14' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f1e14', '#1a3020']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Games Hub 🎮</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Play & win real rewards!</Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 4 }}>
          {([['scratch', '🎟', 'Scratch'], ['spin', '🎡', 'Spin'], ['history', '📜', 'History']] as const).map(([t, icon, label]) => (
            <TouchableOpacity key={t} onPress={() => setTab(t as any)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: tab === t ? '#34d399' : 'transparent' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? '#0f1e14' : 'rgba(255,255,255,0.6)' }}>{icon} {label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#34d399" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, paddingTop: 8 }}>
            {tab === 'scratch' && <ScratchTab cards={cards} onClaim={load} />}
            {tab === 'spin' && <SpinTab wheels={wheels} onSpin={load} />}
            {tab === 'history' && <HistoryTab history={history} />}
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  )
}

/* ── SCRATCH CARDS ── */
function ScratchTab({ cards, onClaim }: { cards: ScratchCard[]; onClaim: () => void }) {
  if (!cards.length) return (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>🎟</Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>No scratch cards available right now.</Text>
    </View>
  )
  return (
    <View style={{ gap: 14 }}>
      {cards.map(card => <ScratchCardItem key={card.id} card={card} onClaim={onClaim} />)}
    </View>
  )
}

function ScratchCardItem({ card, onClaim }: { card: ScratchCard; onClaim: () => void }) {
  const [claiming, setClaiming] = useState(false)
  const [result, setResult] = useState<any>(null)
  const alreadyClaimed = card.max_claims_per_user > 0 && card.user_claims >= card.max_claims_per_user
  const dailyLimitReached = card.max_claims_per_day > 0 && card.user_claims_today >= card.max_claims_per_day
  const disabled = alreadyClaimed || dailyLimitReached
  const scaleAnim = useRef(new Animated.Value(1)).current

  const claim = async () => {
    if (claiming || disabled || result) return
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start()
    setClaiming(true)
    try {
      const r = await api.post(`/games/scratch/${card.id}/claim`)
      setResult(r.data)
      onClaim()
      if (r.data?.reward?.type && r.data.reward.type !== 'none') {
        Alert.alert('🎉 You Won!',
          r.data.reward.type === 'wallet' ? `₹${r.data.reward.value} added to your wallet!` :
          r.data.reward.type === 'points' ? `${r.data.reward.value} loyalty points added!` :
          `Coupon code: ${r.data.reward.ref}`, [{ text: 'Awesome!' }])
      } else {
        Alert.alert('😔 Better Luck Next Time!', 'Try again with another scratch card.', [{ text: 'OK' }])
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not claim')
    } finally { setClaiming(false) }
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.cardWrapper}>
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{card.title}</Text>
          {!!card.description && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>{card.description}</Text>}
        </View>
        <LinearGradient colors={['#34d399', '#059669']} style={{ padding: 20, alignItems: 'center' }}>
          {result ? (
            result.reward?.type && result.reward.type !== 'none' ? (
              <>
                <Text style={{ fontSize: 32 }}>🎉</Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 6 }}>
                  {result.reward.type === 'wallet' && `₹${result.reward.value} Won!`}
                  {result.reward.type === 'points' && `${result.reward.value} Points!`}
                  {result.reward.type === 'coupon' && `Code: ${result.reward.ref}`}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 32 }}>😔</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 6 }}>Better luck next time!</Text>
              </>
            )
          ) : (
            <TouchableOpacity onPress={claim} disabled={disabled || claiming}
              style={{ backgroundColor: disabled ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.25)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' }}>
              {claiming ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={{ fontSize: 24 }}>{disabled ? '✓' : '👆'}</Text>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 4 }}>
                    {alreadyClaimed ? 'Limit Reached' : dailyLimitReached ? 'Come Back Tomorrow' : 'Tap to Scratch!'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </LinearGradient>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              {card.max_claims_per_user > 0 ? `${card.user_claims}/${card.max_claims_per_user} total` : 'Unlimited'}
            </Text>
            {card.max_claims_per_day > 0 && (
              <Text style={{ color: dailyLimitReached ? '#f87171' : 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                {card.user_claims_today}/{card.max_claims_per_day} today
              </Text>
            )}
          </View>
          {card.expires_at && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Expires {new Date(card.expires_at).toLocaleDateString('en-IN')}</Text>}
        </View>
      </View>
    </Animated.View>
  )
}

/* ── SPIN WHEEL ── */
function SpinTab({ wheels, onSpin }: { wheels: SpinWheel[]; onSpin: () => void }) {
  if (!wheels.length) return (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>🎡</Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>No spin wheels available right now.</Text>
    </View>
  )
  return (
    <View style={{ gap: 20 }}>
      {wheels.map(wheel => <SpinWheelItem key={wheel.id} wheel={wheel} onSpin={onSpin} />)}
    </View>
  )
}

function SpinWheelItem({ wheel, onSpin }: { wheel: SpinWheel; onSpin: () => void }) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<any>(null)
  // Accumulate rotation in a ref so it survives re-renders without causing snap
  const totalRotation = useRef(0)
  const spinAnim = useRef(new Animated.Value(0)).current
  // Stable 1:1 interpolation — never recalculated, never causes position snap
  const rotateStyle = spinAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend' })

  const canSpin = wheel.spins_per_user_per_day === 0 || wheel.spins_today < wheel.spins_per_user_per_day
  const segs = wheel.segments || []
  const N = segs.length
  const SIZE = W - 80
  const R = SIZE / 2
  const A = N > 0 ? 360 / N : 0 // degrees per segment

  const spin = async () => {
    if (spinning || !canSpin || N === 0) return
    setSpinning(true); setResult(null)
    const extraRounds = 5 + Math.floor(Math.random() * 4)
    totalRotation.current += extraRounds * 360 + Math.random() * 360
    Animated.timing(spinAnim, {
      toValue: totalRotation.current,
      duration: 4000,
      useNativeDriver: true,
    }).start(async () => {
      try {
        const r = await api.post(`/games/spin/${wheel.id}/play`)
        setResult(r.data)
        onSpin()
        if (r.data?.reward?.type && r.data.reward.type !== 'none') {
          Alert.alert('🎉 You Won!',
            r.data.reward.type === 'wallet' ? `₹${r.data.reward.value} added to wallet!` :
            r.data.reward.type === 'points' ? `${r.data.reward.value} points added!` :
            `Coupon: ${r.data.reward.ref}`, [{ text: 'Amazing!' }])
        } else {
          Alert.alert('😔 Better Luck!', 'Try again tomorrow!', [{ text: 'OK' }])
        }
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || 'Could not spin')
      } finally { setSpinning(false) }
    })
  }

  return (
    <View style={styles.cardWrapper}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{wheel.title}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
          {wheel.spins_today}/{wheel.spins_per_user_per_day} spins used today
        </Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        {/* Pointer — sits above wheel, outside overflow:hidden */}
        <View style={{ width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 26, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#f97316', marginBottom: -2, zIndex: 10 }} />

        {/* Wheel — overflow:hidden clips segments to circle shape */}
        <View style={{ width: SIZE, height: SIZE, borderRadius: R, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ rotate: rotateStyle }] }}>

            {segs.map((seg, i) => {
              const startDeg = i * A
              const midDeg = startDeg + A / 2
              return (
                <View key={seg.id} style={{ position: 'absolute', width: SIZE, height: SIZE }}>

                  {/* Pie slice — overflow:hidden right-half clip technique:
                      Rotate container to segment start, then clip to right half,
                      then rotate inner colored circle by (A-180)° around its own
                      center (which aligns with the wheel center). Result: a perfect
                      wedge of exactly A degrees. Works for any N >= 3 segments. */}
                  <View style={{ position: 'absolute', width: SIZE, height: SIZE, transform: [{ rotate: `${startDeg}deg` }] }}>
                    <View style={{ overflow: 'hidden', position: 'absolute', width: R, height: SIZE, left: R, top: 0 }}>
                      <View style={{
                        position: 'absolute', width: SIZE, height: SIZE,
                        borderRadius: R, backgroundColor: seg.color,
                        left: -R, top: 0,
                        transform: [{ rotate: `${A - 180}deg` }],
                      }} />
                    </View>
                  </View>

                  {/* Label — pivot at wheel center, offset outward along segment midline */}
                  <View style={{ position: 'absolute', top: R, left: R, width: 0, height: 0, transform: [{ rotate: `${midDeg}deg` }] }}>
                    <View style={{ position: 'absolute', left: -28, top: -(R * 0.63), width: 56, alignItems: 'center' }}>
                      <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: Math.max(8, Math.min(11, 120 / N)), textAlign: 'center' }}>
                        {seg.label}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}

            {/* Center dot */}
            <View style={{ position: 'absolute', top: R - 14, left: R - 14, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a3020' }} />
            </View>
          </Animated.View>
        </View>

        <TouchableOpacity onPress={spin} disabled={spinning || !canSpin}
          style={{ marginTop: 20, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 50, backgroundColor: canSpin && !spinning ? '#34d399' : 'rgba(255,255,255,0.1)' }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: canSpin && !spinning ? '#0f1e14' : 'rgba(255,255,255,0.4)' }}>
            {spinning ? 'Spinning…' : !canSpin ? `Used ${wheel.spins_today}/${wheel.spins_per_user_per_day} today` : '🎡 Spin!'}
          </Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={{ margin: 16, marginTop: 0, padding: 16, borderRadius: 16, backgroundColor: result.reward ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
          <Text style={{ color: '#34d399', fontWeight: '800', fontSize: 18 }}>
            {!result.reward ? '😔 Better luck next time!' : `🎉 ${result.segment?.label}`}
          </Text>
          {result.reward && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
              {result.reward.type === 'wallet' && `₹${result.reward.value} added to your wallet`}
              {result.reward.type === 'points' && `${result.reward.value} points added`}
              {result.reward.type === 'coupon' && `Code: ${result.reward.ref}`}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

/* ── HISTORY ── */
function HistoryTab({ history }: { history: HistoryItem[] }) {
  if (!history.length) return (
    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>📜</Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>No game history yet. Start playing!</Text>
    </View>
  )
  return (
    <View style={{ gap: 10 }}>
      {history.map((h, i) => (
        <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 24 }}>{h.type === 'scratch' ? '🎟' : '🎡'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{h.description}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{new Date(h.date).toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {h.reward_type !== 'none' ? (
              <>
                <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 13 }}>
                  {h.reward_type === 'wallet' && `+₹${h.reward_value}`}
                  {h.reward_type === 'points' && `+${h.reward_value}pts`}
                  {h.reward_type === 'coupon' && '🎟'}
                </Text>
                {!!h.reward_ref && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 }}>{h.reward_ref}</Text>}
              </>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No reward</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
})
