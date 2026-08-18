import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, Easing, PanResponder, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert,
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
    <View style={{ flex: 1, backgroundColor: '#0b1a12' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0b1a12', '#162a1d']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Games Hub 🎮</Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 3 }}>Play & win real rewards!</Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 14, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 4 }}>
          {([['scratch', '🎟', 'Scratch'], ['spin', '🎡', 'Spin'], ['history', '📜', 'History']] as const).map(([t, icon, label]) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t as any)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 14, backgroundColor: tab === t ? '#34d399' : 'transparent' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? '#0b1a12' : 'rgba(255,255,255,0.55)' }}>
                {icon} {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#34d399" size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, paddingTop: 4 }}>
            {tab === 'scratch' && <ScratchTab cards={cards} onClaim={load} />}
            {tab === 'spin'    && <SpinTab wheels={wheels} onSpin={load} />}
            {tab === 'history' && <HistoryTab history={history} />}
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  )
}

/* ═══════════════════════════════════════════
   SCRATCH CARDS
═══════════════════════════════════════════ */

function ScratchTab({ cards, onClaim }: { cards: ScratchCard[]; onClaim: () => void }) {
  if (!cards.length) return (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>🎟</Text>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center' }}>No scratch cards available right now.</Text>
    </View>
  )
  return (
    <View style={{ gap: 16 }}>
      {cards.map(card => <ScratchCardItem key={card.id} card={card} onClaim={onClaim} />)}
    </View>
  )
}

const COLS = 7
const ROWS = 4
const TOTAL_TILES = COLS * ROWS          // 28 tiles
const SCRATCH_H = 150                    // height of scratch area
const REVEAL_THRESH = 0.55              // 55% → auto-complete

function ScratchCardItem({ card, onClaim }: { card: ScratchCard; onClaim: () => void }) {
  const [result, setResult] = useState<any>(null)
  const [revealed, setRevealed] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)

  const claimedRef   = useRef(false)
  const revealedRef  = useRef(false)
  const resultRef    = useRef<any>(null)
  const scratchedSet = useRef(new Set<number>())
  const areaWidth    = useRef(W - 40)   // updated by onLayout

  const alreadyClaimed  = card.max_claims_per_user > 0 && card.user_claims >= card.max_claims_per_user
  const dailyLimit      = card.max_claims_per_day > 0 && card.user_claims_today >= card.max_claims_per_day
  const disabled        = alreadyClaimed || dailyLimit

  // One Animated.Value per tile
  const tileAnims = useRef(
    Array.from({ length: TOTAL_TILES }, () => new Animated.Value(1))
  ).current
  // Hint pulse
  const hintOpacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (disabled) return
    Animated.loop(
      Animated.sequence([
        Animated.timing(hintOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(hintOpacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const fetchResult = async () => {
    if (claimedRef.current) return
    claimedRef.current = true
    try {
      const r = await api.post(`/games/scratch/${card.id}/claim`)
      resultRef.current = r.data
      setResult(r.data)
      onClaim()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not claim')
      claimedRef.current = false
    }
  }

  const showResultAlert = (r: any) => {
    if (!r) return
    if (r.reward?.type && r.reward.type !== 'none') {
      Alert.alert('🎉 You Won!',
        r.reward.type === 'wallet' ? `₹${r.reward.value} added to your wallet!` :
        r.reward.type === 'points' ? `${r.reward.value} loyalty points added!` :
        `Coupon code: ${r.reward.ref}`, [{ text: 'Awesome!' }])
    } else {
      Alert.alert('😔 Better Luck!', 'Try another scratch card.', [{ text: 'OK' }])
    }
  }

  const revealAll = () => {
    if (revealedRef.current) return
    revealedRef.current = true
    setRevealed(true)
    setHintVisible(false)
    hintOpacity.stopAnimation()
    const remaining = Array.from({ length: TOTAL_TILES }, (_, i) => i).filter(i => !scratchedSet.current.has(i))
    Animated.stagger(12, remaining.map(i =>
      Animated.timing(tileAnims[i], { toValue: 0, duration: 160, useNativeDriver: true })
    )).start(() => {
      setTimeout(() => showResultAlert(resultRef.current), 350)
    })
  }

  const scratchTileAt = (localX: number, localY: number) => {
    if (revealedRef.current) return
    const w = areaWidth.current
    const tileW = w / COLS
    const tileH = SCRATCH_H / ROWS
    // Scratch tile and neighbours for a wide finger stroke
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const col = Math.floor((localX + dc * tileW * 0.35) / w * COLS)
        const row = Math.floor((localY + dr * tileH * 0.35) / SCRATCH_H * ROWS)
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue
        const idx = row * COLS + col
        if (scratchedSet.current.has(idx)) continue
        scratchedSet.current.add(idx)
        Animated.timing(tileAnims[idx], { toValue: 0, duration: 100, useNativeDriver: true }).start()
      }
    }
    if (scratchedSet.current.size / TOTAL_TILES >= REVEAL_THRESH) revealAll()
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !revealedRef.current,
      onMoveShouldSetPanResponder:  () => !disabled && !revealedRef.current,
      onPanResponderGrant: (e) => {
        if (!claimedRef.current) fetchResult()
        setHintVisible(false)
        scratchTileAt(e.nativeEvent.locationX, e.nativeEvent.locationY)
      },
      onPanResponderMove: (e) => {
        scratchTileAt(e.nativeEvent.locationX, e.nativeEvent.locationY)
      },
    })
  ).current

  const tileW = (W - 40) / COLS

  return (
    <View style={styles.cardWrapper}>
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>🎟</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{card.title}</Text>
            {!!card.description && <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{card.description}</Text>}
          </View>
          {disabled && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' }}>
                {alreadyClaimed ? 'Limit Reached' : 'Come Back Tomorrow'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Scratch area */}
      {disabled ? (
        <View style={{ height: SCRATCH_H, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 30, marginBottom: 6 }}>{alreadyClaimed ? '✅' : '⏰'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>
            {alreadyClaimed ? 'Already claimed' : 'Daily limit reached'}
          </Text>
        </View>
      ) : (
        <View
          onLayout={e => { areaWidth.current = e.nativeEvent.layout.width }}
          style={{ height: SCRATCH_H, position: 'relative', overflow: 'hidden' }}
          {...panResponder.panHandlers}
        >
          {/* Bottom: reward content (visible through scratched tiles) */}
          <LinearGradient
            colors={['#064e3b', '#065f46', '#047857']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
          >
            {result ? (
              result.reward?.type && result.reward.type !== 'none' ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 44 }}>🎉</Text>
                  <Text style={{ color: '#fbbf24', fontWeight: '800', fontSize: 24, marginTop: 4 }}>
                    {result.reward.type === 'wallet' && `₹${result.reward.value} Won!`}
                    {result.reward.type === 'points' && `${result.reward.value} Points!`}
                    {result.reward.type === 'coupon' && '🎟 Coupon!'}
                  </Text>
                  {result.reward.type === 'coupon' && !!result.reward.ref && (
                    <Text style={{ color: '#86efac', fontWeight: '600', fontSize: 14, marginTop: 4 }}>{result.reward.ref}</Text>
                  )}
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 44 }}>😔</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 16, marginTop: 4 }}>Better luck next time!</Text>
                </View>
              )
            ) : (
              /* placeholder before API returns */
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 44, opacity: 0.25 }}>🎁</Text>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 4 }}>Your prize is hidden here</Text>
              </View>
            )}
          </LinearGradient>

          {/* Top: silver scratch tiles grid */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' }} pointerEvents="none">
            {tileAnims.map((anim, i) => {
              const row = Math.floor(i / COLS)
              const col = i % COLS
              const shade = (row + col) % 2 === 0
              return (
                <Animated.View
                  key={i}
                  style={{
                    width: tileW,
                    height: SCRATCH_H / ROWS,
                    opacity: anim,
                  }}
                >
                  <LinearGradient
                    colors={shade ? ['#b0b8c1', '#8d97a5'] : ['#9aa3ae', '#bcc2c9']}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              )
            })}
          </View>

          {/* Scratch hint — pulsing coin icon */}
          {hintVisible && !revealed && (
            <Animated.View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: hintOpacity }}
            >
              <Text style={{ fontSize: 32 }}>🪙</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                Scratch to reveal!
              </Text>
            </Animated.View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
          {card.max_claims_per_user > 0 ? `${card.user_claims}/${card.max_claims_per_user} uses` : 'Unlimited'}
          {card.max_claims_per_day > 0 ? `  ·  ${card.user_claims_today}/${card.max_claims_per_day} today` : ''}
        </Text>
        {card.expires_at && (
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
            Expires {new Date(card.expires_at).toLocaleDateString('en-IN')}
          </Text>
        )}
      </View>
    </View>
  )
}

/* ═══════════════════════════════════════════
   SPIN WHEEL
═══════════════════════════════════════════ */

function SpinTab({ wheels, onSpin }: { wheels: SpinWheel[]; onSpin: () => void }) {
  if (!wheels.length) return (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>🎡</Text>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center' }}>No spin wheels available right now.</Text>
    </View>
  )
  return (
    <View style={{ gap: 24 }}>
      {wheels.map(wheel => <SpinWheelItem key={wheel.id} wheel={wheel} onSpin={onSpin} />)}
    </View>
  )
}

function SpinWheelItem({ wheel, onSpin }: { wheel: SpinWheel; onSpin: () => void }) {
  const [spinning, setSpinning]   = useState(false)
  const [result, setResult]       = useState<any>(null)
  const totalRotation             = useRef(0)
  const spinAnim                  = useRef(new Animated.Value(0)).current
  const canSpin = wheel.spins_per_user_per_day === 0 || wheel.spins_today < wheel.spins_per_user_per_day
  const segs    = wheel.segments || []
  const N       = segs.length
  const SIZE    = W - 64
  const R       = SIZE / 2
  const A       = N > 0 ? 360 / N : 0

  const rotateStyle = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  })

  const spin = async () => {
    if (spinning || !canSpin || N === 0) return
    setSpinning(true)
    setResult(null)
    const extraRounds = 5 + Math.floor(Math.random() * 3)
    totalRotation.current += extraRounds * 360 + Math.random() * 360
    Animated.timing(spinAnim, {
      toValue: totalRotation.current,
      duration: 4500,
      easing: Easing.out(Easing.cubic),
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
      {/* Title */}
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{wheel.title}</Text>
        <Text style={{ color: canSpin ? '#34d399' : '#f87171', fontSize: 12, marginTop: 3, fontWeight: '600' }}>
          {wheel.spins_per_user_per_day === 0
            ? 'Unlimited spins'
            : `${wheel.spins_per_user_per_day - wheel.spins_today} of ${wheel.spins_per_user_per_day} spins left today`}
        </Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        {/* Pointer arrow */}
        <View style={{ alignItems: 'center', marginBottom: 4, zIndex: 10 }}>
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 30,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            borderBottomColor: '#f97316',
            shadowColor: '#f97316', shadowOpacity: 0.6, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
          }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f97316', marginTop: -3 }} />
        </View>

        {/* Outer shadow ring */}
        <View style={{
          width: SIZE + 16, height: SIZE + 16, borderRadius: (SIZE + 16) / 2,
          backgroundColor: 'rgba(0,0,0,0.4)',
          position: 'absolute',
          top: 24 + 34,  // header + pointer height
          alignSelf: 'center',
        }} />

        {/* Wheel container */}
        <View style={{
          width: SIZE, height: SIZE, borderRadius: R,
          overflow: 'hidden',
          borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
        }}>
          <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ rotate: rotateStyle }] }}>
            {/* Pie segments */}
            {segs.map((seg, i) => {
              const startDeg = i * A
              const midDeg   = startDeg + A / 2
              return (
                <View key={seg.id} style={{ position: 'absolute', width: SIZE, height: SIZE }}>
                  {/* Pie slice */}
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

                  {/* Separator line at segment start */}
                  <View style={{ position: 'absolute', width: SIZE, height: SIZE, transform: [{ rotate: `${startDeg}deg` }] }}>
                    <View style={{
                      position: 'absolute',
                      top: R - 1,
                      left: R,
                      width: R - 4,
                      height: 2,
                      backgroundColor: 'rgba(255,255,255,0.55)',
                    }} />
                  </View>

                  {/* Label */}
                  <View style={{ position: 'absolute', top: R, left: R, width: 0, height: 0, transform: [{ rotate: `${midDeg}deg` }] }}>
                    <View style={{ position: 'absolute', left: -30, top: -(R * 0.64), width: 60, alignItems: 'center' }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: Math.max(7, Math.min(12, 140 / N)),
                          textAlign: 'center',
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {seg.label}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}

            {/* Center hub */}
            <View style={{
              position: 'absolute',
              top: R - 20, left: R - 20,
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#fff',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
              shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
            }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#162a1d' }} />
            </View>
          </Animated.View>
        </View>

        {/* Spin button */}
        <TouchableOpacity
          onPress={spin}
          disabled={spinning || !canSpin}
          style={{
            marginTop: 24,
            paddingVertical: 16, paddingHorizontal: 56,
            borderRadius: 50,
            backgroundColor: spinning || !canSpin ? 'rgba(255,255,255,0.08)' : '#34d399',
          }}
        >
          <Text style={{
            fontWeight: '800', fontSize: 17,
            color: spinning || !canSpin ? 'rgba(255,255,255,0.35)' : '#0b1a12',
          }}>
            {spinning ? '🎡  Spinning…' : !canSpin ? 'No spins left today' : '🎡  Spin!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result banner */}
      {result && (
        <View style={{
          marginHorizontal: 16, marginBottom: 16, padding: 16,
          borderRadius: 16,
          backgroundColor: result.reward?.type && result.reward.type !== 'none'
            ? 'rgba(52,211,153,0.15)'
            : 'rgba(255,255,255,0.05)',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: result.reward?.type && result.reward.type !== 'none'
            ? 'rgba(52,211,153,0.3)'
            : 'rgba(255,255,255,0.08)',
        }}>
          <Text style={{ color: result.reward?.type && result.reward.type !== 'none' ? '#34d399' : 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 18 }}>
            {result.reward?.type && result.reward.type !== 'none'
              ? `🎉 ${result.segment?.label}`
              : '😔 Better luck next time!'}
          </Text>
          {result.reward && result.reward.type !== 'none' && (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 5 }}>
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

/* ═══════════════════════════════════════════
   HISTORY
═══════════════════════════════════════════ */

function HistoryTab({ history }: { history: HistoryItem[] }) {
  if (!history.length) return (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>📜</Text>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center' }}>No game history yet. Start playing!</Text>
    </View>
  )
  return (
    <View style={{ gap: 10 }}>
      {history.map((h, i) => (
        <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>{h.type === 'scratch' ? '🎟' : '🎡'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{h.description}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{new Date(h.date).toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {h.reward_type !== 'none' ? (
              <>
                <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 13 }}>
                  {h.reward_type === 'wallet' && `+₹${h.reward_value}`}
                  {h.reward_type === 'points' && `+${h.reward_value} pts`}
                  {h.reward_type === 'coupon' && '🎟 Coupon'}
                </Text>
                {!!h.reward_ref && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 }}>{h.reward_ref}</Text>}
              </>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>No reward</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
})
