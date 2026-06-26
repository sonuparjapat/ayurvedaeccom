import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import Animated, {
  FadeIn, FadeInDown, FadeOutLeft, Layout,
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
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
const FREE_DELIVERY_MIN = 499

// ─── DELIVERY PROGRESS BAR ────────────────────────────────────────────────────
function DeliveryProgress({ subtotal }: { subtotal: number }) {
  const progress = Math.min(subtotal / FREE_DELIVERY_MIN, 1)
  const barWidth = useSharedValue(0)

  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 800 })
  }, [progress])

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
  }))

  const remaining = FREE_DELIVERY_MIN - subtotal
  const achieved = subtotal >= FREE_DELIVERY_MIN

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
        <Text style={dp.hint}>Free delivery on orders above ₹{FREE_DELIVERY_MIN}</Text>
      )}
    </View>
  )
}

const dp = StyleSheet.create({
  wrap: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: Colors.border },
  label: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, flex: 1 },
  pct: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.sage },
  track: { height: 8, backgroundColor: '#e8f0e8', borderRadius: 4, overflow: 'visible', position: 'relative' },
  fill: { height: '100%', borderRadius: 4, overflow: 'hidden', minWidth: 8 },
  milestone: { position: 'absolute', right: 0, top: -10, backgroundColor: Colors.mint, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  milestoneText: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.sage },
  hint: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, marginTop: 6 },
})

// ─── CART ITEM ────────────────────────────────────────────────────────────────
function CartItem({ item, onUpdate, onRemove, updating }: {
  item: any; onUpdate: (id: number, qty: number, stock: number) => void
  onRemove: (id: number) => void; updating: boolean
}) {
  const scale = useSharedValue(1)
  const removeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handleRemovePress = () => {
    scale.value = withSpring(0.9, { damping: 10 })
    setTimeout(() => onRemove(item.product_id), 100)
  }

  const disc = item.compare_price
    ? Math.round(((item.compare_price - item.price) / item.compare_price) * 100)
    : null

  return (
    <Animated.View style={ss.cartCard}>
      <TouchableOpacity onPress={() => router.push(`/product/${item.product_id}`)} activeOpacity={0.9}>
        <ExpoImage source={{ uri: item.images?.[0] || '' }} style={ss.cartImg} contentFit="cover" transition={200} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={ss.cartName} numberOfLines={2}>{item.name}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
          <Text style={ss.cartPrice}>₹{item.price}</Text>
          {disc && (
            <View style={ss.discPill}>
              <Text style={ss.discPillText}>{disc}% OFF</Text>
            </View>
          )}
        </View>

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

      <Animated.View style={removeStyle}>
        <TouchableOpacity onPress={handleRemovePress} style={ss.delBtn} hitSlop={6}>
          <LinearGradient colors={['#fee2e2', '#fecaca']} style={ss.delBtnInner}>
            <Text style={{ fontSize: 15 }}>🗑️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={ss.emptyWrap}>
      <View style={ss.emptyOrb}>
        <Text style={{ fontSize: 52 }}>🛒</Text>
      </View>
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

  useEffect(() => { fetchCart() }, [])

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
    if (newQty < minQty) { Alert.alert('Minimum Qty', `Minimum order quantity is ${minQty}`); return }
    if (newQty > maxQty) { Alert.alert('Maximum Qty', `Maximum order quantity is ${maxQty}`); return }
    if (newQty < 1) { removeItem(productId); return }
    const finalQty = Math.min(newQty, stock)
    setUpdatingId(productId)
    try {
      const payload: any = { productId, quantity: finalQty }
      if (!user?.id) payload.sessionId = await AsyncStorage.getItem('guest_session_id')
      await api.put('/cart', payload)
      fetchCart()
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Failed') }
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
  const delivery = subtotal >= FREE_DELIVERY_MIN ? 0 : 49
  const total = subtotal + delivery

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.forest} size="large" />
    </View>
  )

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
                <DeliveryProgress subtotal={subtotal} />
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
  emptyOrb: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#bbf7d0' },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.forest, marginBottom: 8 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 21 },
  shopBtn: { paddingHorizontal: 32, paddingVertical: 15, borderRadius: 14 },
  shopBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  homeLink: { marginTop: 12, padding: 8 },
  homeLinkText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },

  cartCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 0.5, borderColor: Colors.border,
    ...Shadows.sm,
  },
  cartImg: { width: 88, height: 88, borderRadius: 14, backgroundColor: Colors.mint },
  cartName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 18, marginBottom: 4, flex: 1, paddingRight: 4 },
  cartPrice: { fontFamily: Fonts.displayBold, fontSize: 20, color: Colors.forest },
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
