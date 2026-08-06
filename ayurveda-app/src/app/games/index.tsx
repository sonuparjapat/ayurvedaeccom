import React, { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import api from '../../api/axios'

const { width: W } = Dimensions.get('window')

type ScratchCard = {
  id: number; title: string; description: string
  reward_type: string; reward_value: number
  per_user_limit: number; user_claims: number
  expires_at: string | null
}
type Segment = { id: number; label: string; reward_type: string; reward_value: number; color: string; probability_weight: number }
type SpinWheel = { id: number; title: string; daily_spin_limit: number; spins_today: number; segments: Segment[] }
type HistoryItem = { type: string; description: string; reward_type: string; reward_value: number; reward_ref: string | null; date: string }

const REWARD_COLOR: Record<string, string> = { wallet: '#10b981', points: '#f59e0b', coupon: '#8b5cf6', none: '#6b7280' }
const REWARD_LABEL: Record<string, string> = { wallet: 'Wallet', points: 'Points', coupon: 'Coupon', none: 'No Reward' }

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
        ;(h.value.data?.spin || []).forEach((s: any) => hist.push({ type: 'spin', description: `${s.wheel_title} → ${s.segment_label}`, reward_type: s.reward_type, reward_value: s.reward_value, reward_ref: s.reward_ref, date: s.played_at }))
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
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
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
  const alreadyClaimed = card.per_user_limit > 0 && card.user_claims >= card.per_user_limit
  const scaleAnim = useRef(new Animated.Value(1)).current

  const claim = async () => {
    if (claiming || alreadyClaimed || result) return
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start()
    setClaiming(true)
    try {
      const r = await api.post(`/games/scratch/${card.id}/claim`)
      setResult(r.data)
      onClaim()
      if (r.data?.reward_type && r.data.reward_type !== 'none') {
        Alert.alert('🎉 You Won!',
          r.data.reward_type === 'wallet' ? `₹${r.data.reward_value} added to your wallet!` :
          r.data.reward_type === 'points' ? `${r.data.reward_value} loyalty points added!` :
          `Coupon code: ${r.data.reward_ref}`, [{ text: 'Awesome!' }])
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
            result.reward_type !== 'none' ? (
              <>
                <Text style={{ fontSize: 32 }}>🎉</Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 6 }}>
                  {result.reward_type === 'wallet' && `₹${result.reward_value} Won!`}
                  {result.reward_type === 'points' && `${result.reward_value} Points!`}
                  {result.reward_type === 'coupon' && `Code: ${result.reward_ref}`}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 32 }}>😔</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 6 }}>Better luck next time!</Text>
              </>
            )
          ) : (
            <TouchableOpacity onPress={claim} disabled={alreadyClaimed || claiming}
              style={{ backgroundColor: alreadyClaimed ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.25)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' }}>
              {claiming ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={{ fontSize: 24 }}>{alreadyClaimed ? '✓' : '👆'}</Text>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 4 }}>
                    {alreadyClaimed ? 'Already Claimed' : 'Tap to Scratch!'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </LinearGradient>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            {card.per_user_limit > 0 ? `${card.user_claims}/${card.per_user_limit} used` : 'Unlimited'}
          </Text>
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
  const spinAnim = useRef(new Animated.Value(0)).current
  const currentRotation = useRef(0)
  const canSpin = wheel.spins_today < wheel.daily_spin_limit
  const segs = wheel.segments || []
  const SIZE = W - 80

  const spin = async () => {
    if (spinning || !canSpin) return
    setSpinning(true); setResult(null)
    const extraRounds = 5 + Math.random() * 5
    const randomFinal = Math.random() * 360
    const totalDeg = extraRounds * 360 + randomFinal
    currentRotation.current += totalDeg
    spinAnim.setValue(currentRotation.current - totalDeg)
    Animated.timing(spinAnim, { toValue: currentRotation.current, duration: 4000, useNativeDriver: true }).start(async () => {
      try {
        const r = await api.post(`/games/spin/${wheel.id}/play`)
        setResult(r.data)
        onSpin()
        if (r.data?.reward_type && r.data.reward_type !== 'none') {
          Alert.alert('🎉 You Won!',
            r.data.reward_type === 'wallet' ? `₹${r.data.reward_value} added to wallet!` :
            r.data.reward_type === 'points' ? `${r.data.reward_value} points added!` :
            `Coupon: ${r.data.reward_ref}`, [{ text: 'Amazing!' }])
        } else {
          Alert.alert('😔 Better Luck!', 'Try again tomorrow!', [{ text: 'OK' }])
        }
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || 'Could not spin')
      } finally { setSpinning(false) }
    })
  }

  const spin_interpolate = spinAnim.interpolate({ inputRange: [currentRotation.current - 360 * 10, currentRotation.current + 360 * 10], outputRange: ['-3600deg', '3600deg'], extrapolate: 'clamp' })

  return (
    <View style={styles.cardWrapper}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{wheel.title}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
          {wheel.spins_today}/{wheel.daily_spin_limit} spins used today
        </Text>
      </View>

      {/* Wheel visual */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <View style={{ position: 'relative', width: SIZE, height: SIZE }}>
          {/* Pointer */}
          <View style={{ position: 'absolute', top: -10, left: SIZE / 2 - 12, width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 28, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#f97316', zIndex: 10 }} />
          <Animated.View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden', transform: [{ rotate: spin_interpolate }] }}>
            {segs.map((seg, i) => {
              const angle = (360 / segs.length)
              const rotation = angle * i
              return (
                <View key={seg.id} style={{ position: 'absolute', width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${rotation + angle / 2}deg` }] }}>
                  <View style={{ position: 'absolute', top: 0, left: SIZE / 2 - 2, width: SIZE / 2, height: SIZE, backgroundColor: seg.color, transformOrigin: 'left center', transform: [{ rotate: `${angle / 2}deg` }, { skewY: `${90 - angle / 2}deg` }] }} />
                  <Text numberOfLines={1} style={{ position: 'absolute', right: 16, color: '#fff', fontWeight: '700', fontSize: Math.max(8, Math.min(12, 140 / segs.length)), transform: [{ rotate: `${rotation + angle / 2}deg` }] }}>
                    {seg.label}
                  </Text>
                </View>
              )
            })}
          </Animated.View>
          {/* Center dot */}
          <View style={{ position: 'absolute', top: SIZE / 2 - 16, left: SIZE / 2 - 16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#1a3020' }} />
          </View>
        </View>

        <TouchableOpacity onPress={spin} disabled={spinning || !canSpin}
          style={{ marginTop: 20, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 50, backgroundColor: canSpin && !spinning ? '#34d399' : 'rgba(255,255,255,0.1)' }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: canSpin && !spinning ? '#0f1e14' : 'rgba(255,255,255,0.4)' }}>
            {spinning ? 'Spinning…' : !canSpin ? `Limit: ${wheel.daily_spin_limit}/day` : '🎡 Spin!'}
          </Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={{ margin: 16, marginTop: 0, padding: 16, borderRadius: 16, backgroundColor: result.reward_type !== 'none' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
          <Text style={{ color: '#34d399', fontWeight: '800', fontSize: 18 }}>
            {result.reward_type === 'none' ? '😔 Better luck next time!' : `🎉 ${result.segment_label}`}
          </Text>
          {result.reward_type !== 'none' && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
              {result.reward_type === 'wallet' && `₹${result.reward_value} added to your wallet`}
              {result.reward_type === 'points' && `${result.reward_value} points added`}
              {result.reward_type === 'coupon' && `Code: ${result.reward_ref}`}
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
