import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, Dimensions, FlatList,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { toast } from '../../components/ui/Toast'
import { Image as ExpoImage } from 'expo-image'
import Animated, {
  FadeIn, FadeInDown, FadeOutLeft, Layout, interpolate, Extrapolation, runOnJS,
  useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Colors, Fonts, Shadows, Radius } from '../../constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getGuestSession } from '@/utils/guestSession'

const { width: W } = Dimensions.get('window')

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skel({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  const op = useSharedValue(0.45)
  useEffect(() => { op.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.45, { duration: 700 })), -1, true) }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: '#d1e8dc' }, style]} />
}

function CartSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f0', padding: 16, gap: 12 }}>
      {[1, 2, 3].map(k => (
        <View key={k} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12 }}>
          <Skel w={90} h={90} r={12} />
          <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
            <Skel w={'60%'} h={9} />
            <Skel w={'85%'} h={13} />
            <Skel w={'40%'} h={11} />
            <Skel w={'50%'} h={18} />
          </View>
        </View>
      ))}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, marginTop: 8 }}>
        <Skel w={'50%'} h={14} />
        <Skel w={'100%'} h={1} />
        <Skel w={'80%'} h={12} />
        <Skel w={'70%'} h={12} />
        <Skel w={'100%'} h={44} r={12} />
      </View>
    </View>
  )
}

// ─── DELIVERY PROGRESS BAR ────────────────────────────────────────────────────
function DeliveryProgress({ subtotal, freeLimit }: { subtotal: number; freeLimit: number }) {
  const progress = Math.min(subtotal / freeLimit, 1)
  const barWidth = useSharedValue(0)

  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 800 })
  }, [progress])

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
  }))

  const remaining = freeLimit - subtotal
  const achieved = subtotal >= freeLimit

  return (
    <View style={dp.wrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={dp.label}>
          {achieved
            ? '🎉 You unlocked FREE delivery!'
            : `Add ₹${remaining.toFixed(0)} more for free delivery`}
        </Text>
        <Text style={dp.pct}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={dp.track}>
        <Animated.View style={[dp.fill, barStyle]}>
          <LinearGradient
            colors={achieved ? ['#059669', '#0d9488'] : [Colors.gold, '#a07830']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </Animated.View>
        {!achieved && (
          <View style={dp.milestone}>
            <Text style={dp.milestoneText}>🚚 FREE</Text>
          </View>
        )}
      </View>
      {!achieved && (
        <Text style={dp.hint}>Free delivery on orders above ₹{freeLimit}</Text>
      )}
    </View>
  )
}

const dp = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(240,253,244,0.9)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: '#c8e6d0' },
  label: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, flex: 1 },
  pct: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.sage },
  track: { height: 8, backgroundColor: '#e8f0e8', borderRadius: 4, overflow: 'visible', position: 'relative' },
  fill: { height: '100%', borderRadius: 4, overflow: 'hidden', minWidth: 8 },
  milestone: { position: 'absolute', right: 0, top: -10, backgroundColor: Colors.mint, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  milestoneText: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.sage },
  hint: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, marginTop: 6 },
})

// ─── CART ITEM ────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = -90
const { width: SW } = Dimensions.get('window')

function CartItem({ item, onUpdate, onRemove, updating }: {
  item: any; onUpdate: (id: number, qty: number, stock: number) => void
  onRemove: (id: number) => void; updating: boolean
}) {
  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)

  const triggerRemove = () => {
    translateX.value = withTiming(-SW, { duration: 250 }, () => {
      runOnJS(onRemove)(item.product_id)
    })
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate(e => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -SW * 0.5)
      }
    })
    .onEnd(e => {
      if (e.translationX < SWIPE_THRESHOLD) {
        runOnJS(triggerRemove)()
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 })
      }
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))
  const deleteRevealStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -60], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, -90], [0.7, 1], Extrapolation.CLAMP) }],
  }))

  const handleRemovePress = () => {
    scale.value = withSpring(0.9, { damping: 10 })
    setTimeout(() => onRemove(item.product_id), 100)
  }

  const disc = item.compareprice
    ? Math.round(((item.compareprice - item.price) / item.compareprice) * 100)
    : null

  return (
    <View style={{ marginBottom: 10, overflow: 'hidden', borderRadius: 16 }}>
      {/* Red delete zone revealed by swipe */}
      <Animated.View style={[{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 90, backgroundColor: '#ef4444', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, deleteRevealStyle]}>
        <Text style={{ fontSize: 22 }}>🗑️</Text>
        <Text style={{ fontSize: 10, color: '#fff', fontFamily: Fonts.bold, marginTop: 2 }}>Delete</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[ss.cartCard, { marginBottom: 0, borderRadius: 16 }, cardStyle]}>
          <TouchableOpacity onPress={() => router.push(`/product/${item.product_id}`)} activeOpacity={0.9}>
            <ExpoImage source={{ uri: item.images?.[0] || '' }} style={ss.cartImg} contentFit="cover" transition={200} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={ss.cartName} numberOfLines={2}>{item.name}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Text style={ss.cartPrice}>₹{item.price}</Text>
          {(item as any).original_price && (item as any).original_price > item.price && (
            <Text style={{ fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' }}>₹{(item as any).original_price}</Text>
          )}
          {disc && (
            <View style={ss.discPill}>
              <Text style={ss.discPillText}>{disc}% OFF</Text>
            </View>
          )}
        </View>
        {(item as any).is_flash_sale && (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 }}>
            <Text style={{ fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#dc2626' }}>⚡ Flash Sale Price</Text>
          </View>
        )}

        <View style={ss.qtyRow}>
          <TouchableOpacity
            onPress={() => onUpdate(item.product_id, item.quantity - 1, item.inventory)}
            style={ss.qtyBtn}
            activeOpacity={0.7}
          >
            <Text style={ss.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <View style={ss.qtyDisplay}>
            <Text style={ss.qtyVal}>{updating ? '·' : item.quantity}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onUpdate(item.product_id, item.quantity + 1, item.inventory)}
            style={[ss.qtyBtn, ss.qtyBtnPlus]}
            activeOpacity={0.7}
          >
            <Text style={[ss.qtyBtnText, { color: '#fff' }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

          <TouchableOpacity onPress={handleRemovePress} style={ss.delBtn} hitSlop={6}>
            <LinearGradient colors={['#fee2e2', '#fecaca']} style={ss.delBtnInner}>
              <Text style={{ fontSize: 15 }}>🗑️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={ss.emptyWrap}>
      <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.emptyOrb}>
        <Text style={{ fontSize: 52 }}>🛒</Text>
      </LinearGradient>
      <Text style={ss.emptyTitle}>Your cart is empty</Text>
      <Text style={ss.emptySub}>Looks like you haven't added anything yet. Explore our organic range!</Text>
      <TouchableOpacity onPress={() => router.push('/products')} activeOpacity={0.85} style={{ marginTop: 24 }}>
        <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.shopBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={ss.shopBtnText}>🌿  Explore Products</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/')} style={ss.homeLink}>
        <Text style={ss.homeLinkText}>← Back to Home</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function CartScreen() {
  const insets = useSafeAreaInsets()
  const { cartData, setCartData, user, setAuthOpen } = useStore()
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [freeLimit, setFreeLimit] = useState(500)
  const [deliveryCharge, setDeliveryCharge] = useState(0)

  useEffect(() => {
    fetchCart()
    api.get('/wallet/settings').then(res => {
      const d = res.data?.delivery || {}
      if (d.free_delivery_limit) setFreeLimit(Number(d.free_delivery_limit))
      if (d.delivery_charge) setDeliveryCharge(Number(d.delivery_charge))
    }).catch(() => {})
  }, [])

  const fetchCart = async () => {
    try {
      let url = '/cart'
      if (!user?.id) {
        const sessionId = await AsyncStorage.getItem('guest_session_id')
        if (sessionId) url = `/cart?sessionId=${sessionId}`
      }
      const res = await api.get(url)
      const items = res.data?.items || []
      setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
    } catch (e: any) {
      const code = e?.response?.data?.code
      if (code === 'SESSION_EXPIRED' || code === 'INVALID_SESSION') {
        await AsyncStorage.removeItem('guest_session_id')
        await getGuestSession(true)
        return fetchCart()
      }
      console.warn('[Cart fetch]', e?.response?.status, e?.message)
    } finally { setLoading(false) }
  }

  const updateQty = async (productId: number, newQty: number, stock: number) => {
    const cartItem = items.find(i => i.product_id === productId)
    const minQty = cartItem?.min_order_qty || 1
    const maxQty = cartItem?.max_order_qty || 100
    if (newQty < minQty) { toast.warning(`Minimum order quantity is ${minQty}`); return }
    if (newQty > maxQty) { toast.warning(`Maximum order quantity is ${maxQty}`); return }
    if (newQty < 1) { removeItem(productId); return }
    const finalQty = Math.min(newQty, stock)
    setUpdatingId(productId)
    try {
      const payload: any = { productId, quantity: finalQty }
      if (!user?.id) payload.sessionId = await AsyncStorage.getItem('guest_session_id')
      await api.put('/cart', payload)
      fetchCart()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setUpdatingId(null) }
  }

  const removeItem = async (productId: number) => {
    setUpdatingId(productId)
    try {
      let url = `/cart/${productId}`
      if (!user?.id) {
        const sessionId = await AsyncStorage.getItem('guest_session_id')
        if (sessionId) url += `?sessionId=${sessionId}`
      }
      await api.delete(url)
      fetchCart()
    } catch { } finally { setUpdatingId(null) }
  }

  const items = cartData.items
  const subtotal = cartData.subtotal
  const delivery = subtotal >= freeLimit ? 0 : deliveryCharge
  const total = subtotal + delivery

  if (loading) return <CartSkeleton />

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f0' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.forest, '#0f2018']} style={[ss.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>My Cart</Text>
          {items.length > 0 && <Text style={ss.headerSub}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>}
        </View>
        {items.length > 0 && (
          <View style={ss.headerBadge}>
            <Text style={ss.headerBadgeText}>₹{total.toFixed(0)}</Text>
          </View>
        )}
      </LinearGradient>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item, index) => String(item.product_id ?? item.id ?? index)}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 300 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Animated.View entering={FadeInDown.delay(100)}>
                <DeliveryProgress subtotal={subtotal} freeLimit={freeLimit} />
              </Animated.View>
            }
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 60)}
                exiting={FadeOutLeft}
                layout={Layout.springify()}
              >
                <CartItem
                  item={item}
                  onUpdate={updateQty}
                  onRemove={removeItem}
                  updating={updatingId === item.product_id}
                />
              </Animated.View>
            )}
          />

          {/* Summary + checkout */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={[ss.summaryWrap, { paddingBottom: insets.bottom + 12 }]}
          >
            <LinearGradient colors={['#0d120d', '#111711']} style={ss.summaryBox}>
              <View style={ss.summaryRow}>
                <Text style={ss.summaryLabel}>Subtotal ({items.length} items)</Text>
                <Text style={ss.summaryVal}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={ss.summaryRow}>
                <Text style={ss.summaryLabel}>Delivery</Text>
                {delivery === 0
                  ? <View style={ss.freePill}><Text style={ss.freePillText}>✓ FREE</Text></View>
                  : <Text style={ss.summaryVal}>₹{delivery}</Text>
                }
              </View>
              <View style={[ss.summaryRow, ss.totalRow]}>
                <Text style={ss.totalLabel}>Total Amount</Text>
                <Text style={ss.totalVal}>₹{total.toFixed(2)}</Text>
              </View>
            </LinearGradient>

            {items.some((i: any) => i.is_returnable === false) && (
              <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 0.5, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 13 }}>⚠️</Text>
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: '#be123c', flex: 1 }}>
                  Your cart contains non-returnable items. These cannot be returned or exchanged after delivery.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                if (!user) { setAuthOpen(true); return }
                router.push('/checkout')
              }}
              activeOpacity={0.87}
            >
              <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.checkoutBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={{ fontSize: 18 }}>🔒</Text>
                <Text style={ss.checkoutText}>Proceed to Checkout  ₹{total.toFixed(0)}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16 }}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/products')} style={ss.continueBtn}>
              <Text style={ss.continueText}>+ Continue Shopping</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 18 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 11, marginTop: 1 },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  headerBadgeText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 14 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, backgroundColor: Colors.cream },
  emptyOrb: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#bbf7d0', overflow: 'hidden' },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.forest, marginBottom: 8 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 21 },
  shopBtn: { paddingHorizontal: 32, paddingVertical: 15, borderRadius: 14 },
  shopBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  homeLink: { marginTop: 12, padding: 8 },
  homeLinkText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },

  cartCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 0.5, borderColor: '#c8e6d0',
    borderLeftWidth: 3, borderLeftColor: Colors.emerald,
    ...Shadows.md,
  },
  cartImg: { width: 88, height: 88, borderRadius: 14, backgroundColor: Colors.mint },
  cartName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 18, marginBottom: 4, flex: 1, paddingRight: 4 },
  cartPrice: { fontFamily: Fonts.displayBold, fontSize: 20, color: Colors.emerald },
  discPill: { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discPillText: { color: Colors.red, fontFamily: Fonts.bold, fontSize: 9 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#f0f4f0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: Colors.border,
  },
  qtyBtnPlus: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  qtyBtnText: { fontSize: 16, color: Colors.forest, fontFamily: Fonts.bold },
  qtyDisplay: { minWidth: 28, alignItems: 'center' },
  qtyVal: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest },
  delBtn: { alignSelf: 'flex-start' },
  delBtnInner: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  summaryWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingTop: 12, backgroundColor: Colors.cream,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    ...Shadows.xl,
  },
  summaryBox: { borderRadius: 18, padding: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  summaryVal: { fontFamily: Fonts.medium, fontSize: 13, color: '#fff' },
  freePill: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 2 },
  freePillText: { color: '#6ee7b7', fontFamily: Fonts.bold, fontSize: 11 },
  totalRow: { borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, marginBottom: 0 },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
  totalVal: { fontFamily: Fonts.displayBold, fontSize: 26, color: Colors.gold },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 10,
  },
  checkoutText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
  continueBtn: { alignItems: 'center', paddingVertical: 10 },
  continueText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },
})
