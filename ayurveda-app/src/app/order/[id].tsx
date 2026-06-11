import React, { useEffect, useRef, useState } from 'react'
import {
  Alert, Dimensions, Image, Modal, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import Animated, {
  FadeIn, FadeInDown, FadeInRight, ZoomIn,
  useSharedValue, withSpring, useAnimatedStyle,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

interface OrderItem {
  product_id: number; name: string; quantity: number; price: string; image?: string; variant_label?: string
}

interface OrderDetail {
  id: number; invoice_no?: string; status: number; payment_method: string; payment_status: string
  total_amount: string; created_at: string; tracking_number?: string; shipped_at?: string
  shipping_address: any; razorpay_payment_id?: string; cancel_reason?: string; return_reason?: string
  invoice_id?: number; invoice_number?: string; invoice_date?: string; pdf_url?: string
  items: OrderItem[]
}

const STATUS_MAP: Record<number, { label: string; color: string; bg: string; emoji: string; grad: [string, string] }> = {
  0: { label: 'Pending',          color: '#92400e', bg: '#fffbeb', emoji: '🕐', grad: ['#92400e','#f59e0b'] },
  1: { label: 'Confirmed',        color: '#1d4ed8', bg: '#eff6ff', emoji: '✅', grad: ['#1d4ed8','#3b82f6'] },
  2: { label: 'Processing',       color: '#6d28d9', bg: '#f5f3ff', emoji: '⚙️', grad: ['#6d28d9','#8b5cf6'] },
  3: { label: 'Shipped',          color: '#0e7490', bg: '#ecfeff', emoji: '📦', grad: ['#0e7490','#06b6d4'] },
  4: { label: 'Out for Delivery', color: '#c2410c', bg: '#fff7ed', emoji: '🚚', grad: ['#c2410c','#f97316'] },
  5: { label: 'Delivered',        color: '#065f46', bg: '#ecfdf5', emoji: '🎉', grad: ['#065f46','#10b981'] },
  6: { label: 'Cancelled',        color: '#991b1b', bg: '#fef2f2', emoji: '❌', grad: ['#991b1b','#ef4444'] },
  7: { label: 'Return Requested', color: '#92400e', bg: '#fffbeb', emoji: '↩️', grad: ['#92400e','#f59e0b'] },
  8: { label: 'Refund Initiated', color: '#6d28d9', bg: '#f5f3ff', emoji: '💰', grad: ['#6d28d9','#8b5cf6'] },
  9: { label: 'Refunded',         color: '#065f46', bg: '#ecfdf5', emoji: '✔️', grad: ['#065f46','#10b981'] },
}

const TIMELINE_STEPS = [
  { status: 0, label: 'Order Placed' },
  { status: 1, label: 'Confirmed' },
  { status: 2, label: 'Processing' },
  { status: 3, label: 'Shipped' },
  { status: 4, label: 'Out for Delivery' },
  { status: 5, label: 'Delivered' },
]

// ─── SHIMMER LOADING ─────────────────────────────────────────────────────────
function ShimmerBox({ h, w, r }: { h: number; w?: number | string; r?: number }) {
  return (
    <View style={{ height: h, width: w as any || '100%', borderRadius: r ?? 12, backgroundColor: Colors.shimmer1, marginBottom: 8 }} />
  )
}

function LoadingSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      <ShimmerBox h={120} r={20} />
      <ShimmerBox h={20} w="60%" />
      <ShimmerBox h={16} w="40%" />
      <ShimmerBox h={80} r={16} />
      <ShimmerBox h={80} r={16} />
      <ShimmerBox h={80} r={16} />
    </View>
  )
}

// ─── STATUS TIMELINE ─────────────────────────────────────────────────────────
function StatusTimeline({ currentStatus }: { currentStatus: number }) {
  if ([6, 7, 8, 9].includes(currentStatus)) return null
  return (
    <View style={tl.wrap}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = currentStatus >= step.status
        const active = currentStatus === step.status
        const isLast = i === TIMELINE_STEPS.length - 1
        return (
          <View key={step.status} style={tl.stepRow}>
            <View style={tl.leftCol}>
              <Animated.View
                entering={done ? ZoomIn.delay(i * 80).springify() : FadeIn.delay(i * 60)}
                style={[tl.dot, done && tl.dotDone, active && tl.dotActive]}
              >
                {done
                  ? <Text style={{ fontSize: active ? 14 : 11, color: '#fff' }}>{STATUS_MAP[step.status].emoji}</Text>
                  : <View style={tl.dotInner} />
                }
              </Animated.View>
              {!isLast && <View style={[tl.line, done && currentStatus > step.status && tl.lineDone]} />}
            </View>
            <Animated.View entering={FadeInRight.delay(i * 80)} style={tl.labelCol}>
              <Text style={[tl.label, done && tl.labelDone, active && tl.labelActive]}>{step.label}</Text>
              {active && <Text style={tl.activeNote}>Current Status</Text>}
            </Animated.View>
          </View>
        )
      })}
    </View>
  )
}

const tl = StyleSheet.create({
  wrap: { paddingLeft: 8, paddingVertical: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  leftCol: { alignItems: 'center', width: 36 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: 'rgba(16,185,129,0.25)', borderColor: '#10b981' },
  dotActive: { backgroundColor: Colors.gold, borderColor: Colors.gold, width: 36, height: 36, borderRadius: 18 },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  line: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, minHeight: 16 },
  lineDone: { backgroundColor: '#10b981' },
  labelCol: { flex: 1, paddingLeft: 12, paddingBottom: 14, justifyContent: 'center' },
  label: { fontFamily: Fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  labelDone: { color: 'rgba(255,255,255,0.7)' },
  labelActive: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  activeNote: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.gold, marginTop: 2 },
})

// ─── ORDER ITEM CARD ──────────────────────────────────────────────────────────
function OrderItemCard({ item, index }: { item: OrderItem; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={ic.card}>
      <View style={ic.imgWrap}>
        {item.image
          ? <Image source={{ uri: item.image }} style={ic.img} resizeMode="cover" />
          : <View style={[ic.img, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 22 }}>🌿</Text>
          </View>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ic.name} numberOfLines={2}>{item.name}</Text>
        {item.variant_label ? <Text style={ic.variant}>{item.variant_label}</Text> : null}
        <Text style={ic.qty}>Qty: {item.quantity}</Text>
      </View>
      <Text style={ic.price}>₹{(+item.price * item.quantity).toFixed(2)}</Text>
    </Animated.View>
  )
}

const ic = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  imgWrap: { width: 62, height: 62, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.mint },
  img: { width: 62, height: 62 },
  name: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 19 },
  variant: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.emerald, marginTop: 2 },
  qty: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 3 },
  price: { fontFamily: Fonts.displayBold, fontSize: 18, color: Colors.forest },
})

// ─── CANCEL MODAL ─────────────────────────────────────────────────────────────
function CancelModal({ visible, onClose, onConfirm, loading }: any) {
  const [reason, setReason] = useState('')
  const REASONS = ['Changed my mind', 'Found a better price', 'Ordered by mistake', 'Delivery too slow', 'Other']
  const [selected, setSelected] = useState('')
  const finalReason = selected === 'Other' ? reason : selected

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <Pressable style={m.bg} onPress={onClose} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <Text style={m.title}>Cancel Order</Text>
        <Text style={m.sub}>Please tell us why you want to cancel</Text>

        <View style={{ gap: 8, marginBottom: 16 }}>
          {REASONS.map(r => (
            <TouchableOpacity key={r} onPress={() => setSelected(r)} style={[m.optionRow, selected === r && m.optionRowActive]}>
              <View style={[m.radio, selected === r && m.radioActive]}>
                {selected === r && <View style={m.radioDot} />}
              </View>
              <Text style={[m.optionText, selected === r && m.optionTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selected === 'Other' && (
          <TextInput
            style={m.input}
            placeholder="Describe your reason..."
            placeholderTextColor={Colors.textDim}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
        )}

        <TouchableOpacity
          onPress={() => { if (finalReason) onConfirm(finalReason) }}
          disabled={!finalReason || loading}
          style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
        >
          <LinearGradient
            colors={!finalReason ? ['#9ca3af','#6b7280'] : ['#dc2626','#b91c1c']}
            style={m.confirmBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={m.confirmText}>{loading ? 'Cancelling...' : '❌  Confirm Cancellation'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={m.closeBtn}>
          <Text style={m.closeBtnText}>Keep Order</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

// ─── RETURN MODAL ─────────────────────────────────────────────────────────────
function ReturnModal({ visible, onClose, onConfirm, loading }: any) {
  const [reason, setReason] = useState('')
  const REASONS = ['Product damaged', 'Wrong item received', 'Product not as described', 'Quality not satisfactory', 'Other']
  const [selected, setSelected] = useState('')
  const finalReason = selected === 'Other' ? reason : selected

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <Pressable style={m.bg} onPress={onClose} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <Text style={m.title}>Request Return</Text>
        <Text style={m.sub}>Tell us what went wrong</Text>

        <View style={{ gap: 8, marginBottom: 16 }}>
          {REASONS.map(r => (
            <TouchableOpacity key={r} onPress={() => setSelected(r)} style={[m.optionRow, selected === r && m.optionRowActive]}>
              <View style={[m.radio, selected === r && m.radioActive]}>
                {selected === r && <View style={m.radioDot} />}
              </View>
              <Text style={[m.optionText, selected === r && m.optionTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selected === 'Other' && (
          <TextInput
            style={m.input}
            placeholder="Describe your reason..."
            placeholderTextColor={Colors.textDim}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
        )}

        <TouchableOpacity
          onPress={() => { if (finalReason) onConfirm(finalReason) }}
          disabled={!finalReason || loading}
          style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
        >
          <LinearGradient
            colors={!finalReason ? ['#9ca3af','#6b7280'] : [Colors.forest, Colors.moss]}
            style={m.confirmBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={m.confirmText}>{loading ? 'Submitting...' : '↩️  Submit Return Request'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={m.closeBtn}>
          <Text style={m.closeBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const m = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: Colors.cream, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.14)', alignSelf: 'center', marginBottom: 18 },
  title: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.forest, marginBottom: 4 },
  sub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, marginBottom: 18 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.border },
  optionRowActive: { borderColor: Colors.forest, backgroundColor: '#f0f9f4' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.textDim, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.forest },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.forest },
  optionText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim, flex: 1 },
  optionTextActive: { color: Colors.forest, fontFamily: Fonts.bold },
  input: { backgroundColor: '#fff', borderRadius: 13, padding: 14, fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest, borderWidth: 0.5, borderColor: Colors.border, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 },
  confirmBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  closeBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  closeBtnText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },
})

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { if (id) fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data?.data || null)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Order not found')
      router.back()
    } finally { setLoading(false) }
  }

  const handleCancel = async (reason: string) => {
    setActionLoading(true)
    try {
      await api.post(`/orders/${id}/cancel`, { reason })
      setShowCancel(false)
      Alert.alert('Cancelled', 'Your order has been cancelled.', [
        { text: 'OK', onPress: fetchOrder }
      ])
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Cancellation failed')
    } finally { setActionLoading(false) }
  }

  const handleReturn = async (reason: string) => {
    setActionLoading(true)
    try {
      await api.post(`/orders/${id}/return`, { reason })
      setShowReturn(false)
      Alert.alert('Return Requested', 'Your return request has been submitted. We will contact you within 24 hours.', [
        { text: 'OK', onPress: fetchOrder }
      ])
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Return request failed')
    } finally { setActionLoading(false) }
  }

  if (!order && !loading) return null

  const statusInfo = order ? (STATUS_MAP[order.status] ?? STATUS_MAP[0]) : STATUS_MAP[0]
  const canCancel = order && [0, 1].includes(order.status)
  const canReturn = order && order.status === 5
  const shippingAddr = order?.shipping_address || {}
  const totalItems = order?.items.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f0' }}>
      <StatusBar barStyle="light-content" />

      {/* Hero Header */}
      <LinearGradient
        colors={['#0a1f14', Colors.forest]}
        style={[ss.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={ss.headerBlob} />

        <View style={ss.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
            <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={ss.headerTitle}>Order Details</Text>
            {order && <Text style={ss.headerSub}>#{order.invoice_no || `ORD-${order.id}`}</Text>}
          </View>
          {order?.pdf_url && (
            <TouchableOpacity style={ss.invoiceBtn}>
              <Text style={{ color: Colors.gold, fontSize: 13 }}>📄</Text>
              <Text style={ss.invoiceBtnText}>Invoice</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 20 }}>
            <ShimmerBox h={40} w="60%" r={10} />
            <ShimmerBox h={24} w="40%" r={8} />
          </View>
        ) : order && (
          <Animated.View entering={FadeInDown.delay(100)}>
            {/* Status badge */}
            <View style={ss.statusBadgeRow}>
              <LinearGradient colors={statusInfo.grad} style={ss.statusBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={{ fontSize: 18 }}>{statusInfo.emoji}</Text>
                <Text style={ss.statusBadgeText}>{statusInfo.label}</Text>
              </LinearGradient>
              <View style={ss.payBadge}>
                <Text style={ss.payBadgeText}>
                  {order.payment_method === 'cod' ? '💵 COD' : '💳 Online'} · {order.payment_status === 'paid' ? '✓ Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>

            {/* Meta row */}
            <View style={ss.metaRow}>
              <View style={ss.metaItem}>
                <Text style={ss.metaLabel}>DATE</Text>
                <Text style={ss.metaVal}>
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={ss.metaSep} />
              <View style={ss.metaItem}>
                <Text style={ss.metaLabel}>ITEMS</Text>
                <Text style={ss.metaVal}>{totalItems}</Text>
              </View>
              <View style={ss.metaSep} />
              <View style={ss.metaItem}>
                <Text style={ss.metaLabel}>TOTAL</Text>
                <Text style={[ss.metaVal, { color: Colors.gold }]}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {loading ? <LoadingSkeleton /> : order && (
          <>
            {/* ── STATUS TIMELINE ── */}
            {![6, 7, 8, 9].includes(order.status) && (
              <Animated.View entering={FadeInDown.delay(120)} style={ss.card}>
                <Text style={ss.cardTitle}>Order Progress</Text>
                <StatusTimeline currentStatus={order.status} />
              </Animated.View>
            )}

            {/* ── SPECIAL STATUS BANNER ── */}
            {[6, 7, 8, 9].includes(order.status) && (
              <Animated.View entering={ZoomIn.springify()} style={[ss.specialBanner, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '33' }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{statusInfo.emoji}</Text>
                <Text style={[ss.specialTitle, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                {order.cancel_reason && <Text style={ss.specialSub}>Reason: {order.cancel_reason}</Text>}
                {order.return_reason && <Text style={ss.specialSub}>Reason: {order.return_reason}</Text>}
              </Animated.View>
            )}

            {/* ── TRACKING ── */}
            {order.tracking_number && (
              <Animated.View entering={FadeInDown.delay(140)} style={ss.card}>
                <Text style={ss.cardTitle}>Tracking Info</Text>
                <View style={ss.trackingRow}>
                  <View style={ss.trackingIconWrap}>
                    <Text style={{ fontSize: 22 }}>🚚</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.trackingNo}>{order.tracking_number}</Text>
                    {order.shipped_at && (
                      <Text style={ss.trackingDate}>
                        Shipped: {new Date(order.shipped_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                  <View style={ss.trackingBadge}>
                    <Text style={ss.trackingBadgeText}>Track</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ── ORDER ITEMS ── */}
            <Animated.View entering={FadeInDown.delay(160)} style={ss.card}>
              <Text style={ss.cardTitle}>Items ({order.items.length})</Text>
              {order.items.map((item, i) => <OrderItemCard key={i} item={item} index={i} />)}
            </Animated.View>

            {/* ── PRICE BREAKDOWN ── */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <LinearGradient colors={['#0d120d', '#111711']} style={ss.priceCard}>
                <Text style={ss.priceCardTitle}>Price Breakdown</Text>
                {(() => {
                  const addr = order.shipping_address || {}
                  const breakup = addr.price_breakup || {}
                  return (
                    <>
                      {breakup.subtotal != null && (
                        <View style={ss.priceRow}>
                          <Text style={ss.priceLabel}>Subtotal</Text>
                          <Text style={ss.priceVal}>₹{(+breakup.subtotal).toFixed(2)}</Text>
                        </View>
                      )}
                      {breakup.gst != null && breakup.gst > 0 && (
                        <View style={ss.priceRow}>
                          <Text style={ss.priceLabel}>GST</Text>
                          <Text style={ss.priceVal}>₹{(+breakup.gst).toFixed(2)}</Text>
                        </View>
                      )}
                      {breakup.delivery != null && (
                        <View style={ss.priceRow}>
                          <Text style={ss.priceLabel}>Delivery</Text>
                          <Text style={[ss.priceVal, breakup.delivery === 0 && { color: '#6ee7b7' }]}>
                            {breakup.delivery === 0 ? 'FREE ✓' : `₹${(+breakup.delivery).toFixed(2)}`}
                          </Text>
                        </View>
                      )}
                      {breakup.platform_fee != null && breakup.platform_fee > 0 && (
                        <View style={ss.priceRow}>
                          <Text style={ss.priceLabel}>Platform Fee</Text>
                          <Text style={ss.priceVal}>₹{(+breakup.platform_fee).toFixed(2)}</Text>
                        </View>
                      )}
                      <View style={ss.priceDivider} />
                      <View style={ss.priceRow}>
                        <Text style={[ss.priceLabel, { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 }]}>Total Paid</Text>
                        <Text style={[ss.priceVal, { color: Colors.gold, fontFamily: Fonts.displayBold, fontSize: 22 }]}>
                          ₹{parseFloat(order.total_amount).toFixed(2)}
                        </Text>
                      </View>
                    </>
                  )
                })()}
              </LinearGradient>
            </Animated.View>

            {/* ── SHIPPING ADDRESS ── */}
            <Animated.View entering={FadeInDown.delay(220)} style={ss.card}>
              <Text style={ss.cardTitle}>Delivery Address</Text>
              <View style={ss.addrRow}>
                <View style={ss.addrIcon}>
                  <Text style={{ fontSize: 20 }}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {shippingAddr.name && <Text style={ss.addrName}>{shippingAddr.name}</Text>}
                  {shippingAddr.phone && <Text style={ss.addrPhone}>📱 {shippingAddr.phone}</Text>}
                  <Text style={ss.addrText}>{shippingAddr.address || 'Address not available'}</Text>
                </View>
              </View>
            </Animated.View>

            {/* ── PAYMENT INFO ── */}
            {order.razorpay_payment_id && (
              <Animated.View entering={FadeInDown.delay(240)} style={ss.card}>
                <Text style={ss.cardTitle}>Payment Info</Text>
                <View style={ss.payInfoRow}>
                  <Text style={ss.payInfoLabel}>Transaction ID</Text>
                  <Text style={ss.payInfoVal} numberOfLines={1}>{order.razorpay_payment_id}</Text>
                </View>
              </Animated.View>
            )}

            {/* ── ACTIONS ── */}
            {(canCancel || canReturn) && (
              <Animated.View entering={FadeInDown.delay(260)} style={{ paddingHorizontal: 16, gap: 10, marginTop: 4 }}>
                {canReturn && (
                  <TouchableOpacity onPress={() => setShowReturn(true)} style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={ss.actionBtnText}>↩️  Request Return / Refund</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {canCancel && (
                  <TouchableOpacity onPress={() => setShowCancel(true)} style={ss.cancelBtn}>
                    <Text style={ss.cancelBtnText}>❌  Cancel Order</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            {/* ── HELP ── */}
            <Animated.View entering={FadeInDown.delay(280)} style={[ss.card, { marginTop: 10 }]}>
              <View style={ss.helpRow}>
                <Text style={{ fontSize: 20 }}>🌿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={ss.helpTitle}>Need help?</Text>
                  <Text style={ss.helpSub}>Contact our support team for any order related queries</Text>
                </View>
                <TouchableOpacity style={ss.helpBtn}>
                  <Text style={ss.helpBtnText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <CancelModal
        visible={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        loading={actionLoading}
      />
      <ReturnModal
        visible={showReturn}
        onClose={() => setShowReturn(false)}
        onConfirm={handleReturn}
        loading={actionLoading}
      />
    </View>
  )
}

const ss = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 20, overflow: 'hidden', position: 'relative' },
  headerBlob: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.06)' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 18 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 11, marginTop: 2 },
  invoiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 0.5, borderColor: Colors.gold + '40' },
  invoiceBtnText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 11 },

  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  statusBadgeText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 13 },
  payBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' },
  payBadgeText: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.medium, fontSize: 11 },

  metaRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 },
  metaItem: { flex: 1, alignItems: 'center', gap: 4 },
  metaSep: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  metaLabel: { color: 'rgba(255,255,255,0.35)', fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  metaVal: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },

  card: { backgroundColor: '#fff', borderRadius: 20, margin: 16, marginBottom: 0, padding: 16, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 },

  specialBanner: { margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  specialTitle: { fontFamily: Fonts.bold, fontSize: 20, marginBottom: 6 },
  specialSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },

  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackingIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  trackingNo: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  trackingDate: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 2 },
  trackingBadge: { backgroundColor: Colors.forest, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  trackingBadgeText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 11 },

  priceCard: { margin: 16, marginBottom: 0, borderRadius: 20, padding: 18 },
  priceCardTitle: { fontFamily: Fonts.bold, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  priceLabel: { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  priceVal: { fontFamily: Fonts.medium, fontSize: 13, color: '#fff' },
  priceDivider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 },

  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addrIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  addrName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 2 },
  addrPhone: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, marginBottom: 4 },
  addrText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest, lineHeight: 20 },

  payInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payInfoLabel: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  payInfoVal: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.forest, flex: 1, textAlign: 'right', marginLeft: 12 },

  actionBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  cancelBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: '#fff' },
  cancelBtnText: { color: '#ef4444', fontFamily: Fonts.bold, fontSize: 14 },

  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  helpTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },
  helpSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 2 },
  helpBtn: { backgroundColor: Colors.forest, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  helpBtnText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 12 },
})
