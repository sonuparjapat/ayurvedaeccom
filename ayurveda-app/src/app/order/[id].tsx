import { useEffect, useState } from 'react'
import { toast } from '../../components/ui/Toast'
import {
  KeyboardAvoidingView, Modal, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ReviewImageViewer } from '../../components/ui/ReviewImageViewer'
import Animated, {
  FadeIn, FadeInDown, FadeInRight, ZoomIn,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import api from '../../api/axios'
import { Image as ExpoImage } from 'expo-image'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const LOGO_URL = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

const CARRIER_URLS: Record<string, (n: string) => string> = {
  'delhivery': n => `https://www.delhivery.com/track/package/${n}`,
  'bluedart': _n => `https://www.bluedart.com/tracking`,
  'blue dart': _n => `https://www.bluedart.com/tracking`,
  'ekart': n => `https://ekartlogistics.com/track/${n}`,
  'xpressbees': n => `https://www.xpressbees.com/shipment/tracking/?awb=${n}`,
  'xpressbee': n => `https://www.xpressbees.com/shipment/tracking/?awb=${n}`,
  'dtdc': n => `https://www.dtdc.in/tracking/tracking_results.asp?track_type=consignment&strCnno=${n}`,
  'shadowfax': _n => `https://www.shadowfax.in/`,
  'ecom express': n => `https://ecomexpress.in/tracking/?awb_field=${n}`,
  'india post': _n => `https://www.indiapost.gov.in/vas/pages/AnonymousTracking.aspx`,
  'speed post': _n => `https://www.indiapost.gov.in/vas/pages/AnonymousTracking.aspx`,
  'amazon': n => `https://track.amazon.in/tracking/${n}`,
  'fedex': n => `https://www.fedex.com/en-in/tracking.html?trknbr=${n}`,
  'dhl': n => `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${n}`,
}

function getCarrierUrl(courier: string, tracking: string): string | null {
  const key = courier.toLowerCase().trim()
  for (const [name, fn] of Object.entries(CARRIER_URLS)) {
    if (key.includes(name)) return fn(tracking)
  }
  return null
}


interface OrderItem {
  product_id: number; name: string; quantity: number; price: string; image?: string; variant_label?: string
}

interface OrderDetail {
  id: number; invoice_no?: string; status: number; payment_method: string; payment_status: string
  total_amount: string; created_at: string; tracking_number?: string; shipped_at?: string
  shipping_address: any; razorpay_payment_id?: string; cancel_reason?: string; return_reason?: string
  invoice_id?: number; invoice_number?: string; invoice_date?: string; pdf_url?: string
  coupon_code?: string; discount_amount?: string
  refund_id?: string; refund_amount?: string; refund_status?: string
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
function StatusTimeline({ currentStatus, logs, estimatedDelivery }: { currentStatus: number; logs: TimelineLog[]; estimatedDelivery: string | null }) {
  if ([6, 7, 8, 9].includes(currentStatus)) return null

  const getLogDate = (status: number): string | null => {
    const log = logs.find(l => Number(l.new_status) === status)
    if (!log) return null
    const d = new Date(log.created_at)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <View style={tl.wrap}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = currentStatus >= step.status
        const active = currentStatus === step.status
        const isLast = i === TIMELINE_STEPS.length - 1
        const dateStr = getLogDate(step.status)
        const isDelivery = step.status === 5
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
              {dateStr
                ? <Text style={tl.dateNote}>{dateStr}</Text>
                : active && <Text style={tl.activeNote}>Current Status</Text>
              }
              {isDelivery && !done && estimatedDelivery && (
                <Text style={tl.etaNote}>
                  ETA: {new Date(estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              )}
            </Animated.View>
          </View>
        )
      })}
    </View>
  )
}

const tl = StyleSheet.create({
  wrap: { paddingLeft: 4, paddingVertical: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 52 },
  leftCol: { alignItems: 'center', width: 38 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.mint, borderColor: Colors.emerald },
  dotActive: { backgroundColor: Colors.forest, borderColor: Colors.forest, width: 36, height: 36, borderRadius: 18 },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d5db' },
  line: { width: 2, flex: 1, backgroundColor: '#e5e7eb', borderRadius: 1, minHeight: 16 },
  lineDone: { backgroundColor: Colors.emerald },
  labelCol: { flex: 1, paddingLeft: 12, paddingBottom: 14, justifyContent: 'center' },
  label: { fontFamily: Fonts.medium, fontSize: 13, color: '#9ca3af' },
  labelDone: { color: Colors.forest },
  labelActive: { color: Colors.forest, fontFamily: Fonts.bold, fontSize: 14 },
  activeNote: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.gold, marginTop: 2 },
  dateNote: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, marginTop: 2 },
  etaNote: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.gold, marginTop: 2 },
})

// ─── ORDER ITEM CARD ──────────────────────────────────────────────────────────
function OrderItemCard({ item, index }: { item: OrderItem; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={ic.card}>
      <View style={ic.imgWrap}>
        {item.image
          ? <ExpoImage source={{ uri: item.image }} style={ic.img} contentFit="cover" />
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable style={m.bg} onPress={onClose} />
        <View style={m.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── RETURN MODAL ─────────────────────────────────────────────────────────────
function ReturnModal({ visible, onClose, onConfirm, loading, canReplace }: any) {
  const [reason, setReason] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlImages, setUrlImages] = useState<string[]>([])
  const [fileImages, setFileImages] = useState<{ uri: string; name: string; type: string }[]>([])
  const [returnType, setReturnType] = useState<'refund' | 'replacement'>('refund')
  const REASONS = ['Product damaged', 'Wrong item received', 'Product not as described', 'Quality not satisfactory', 'Other']
  const [selected, setSelected] = useState('')
  const finalReason = selected === 'Other' ? reason : selected
  const totalImages = urlImages.length + fileImages.length

  // Reset all state when modal opens
  useEffect(() => {
    if (visible) {
      setReason(''); setUrlInput(''); setUrlImages([]); setFileImages([])
      setReturnType('refund'); setSelected('')
    }
  }, [visible])

  const pickImages = async () => {
    const remaining = 5 - totalImages
    if (remaining <= 0) { toast.error('Maximum 5 photos allowed'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remaining,
    })
    if (!result.canceled) {
      const picked = result.assets.slice(0, remaining).map(a => ({
        uri: a.uri,
        name: a.fileName || `return_${Date.now()}.jpg`,
        type: a.mimeType || 'image/jpeg',
      }))
      setFileImages(prev => [...prev, ...picked].slice(0, 5))
    }
  }

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (totalImages >= 5) { toast.error('Maximum 5 photos allowed'); return }
    if (!trimmed.startsWith('http')) { toast.error('Please enter a valid URL'); return }
    setUrlImages(prev => [...prev, trimmed])
    setUrlInput('')
  }

  const removeFile = (idx: number) => setFileImages(prev => prev.filter((_, i) => i !== idx))
  const removeUrl = (idx: number) => setUrlImages(prev => prev.filter((_, i) => i !== idx))

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable style={m.bg} onPress={onClose} />
        <View style={m.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
            <View style={m.handle} />
            <Text style={m.title}>Request Return</Text>
            <Text style={m.sub}>Tell us what went wrong</Text>

            {/* Return type selection */}
            <Text style={[m.sub, { marginBottom: 8, marginTop: 4 }]}>What would you prefer?</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setReturnType('refund')} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: returnType === 'refund' ? Colors.forest : 'rgba(0,0,0,0.1)', backgroundColor: returnType === 'refund' ? 'rgba(5,150,105,0.08)' : 'transparent' }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: returnType === 'refund' ? Colors.forest : Colors.textDim }}>💰 Refund</Text>
              </TouchableOpacity>
              {canReplace && (
                <TouchableOpacity onPress={() => setReturnType('replacement')} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: returnType === 'replacement' ? Colors.forest : 'rgba(0,0,0,0.1)', backgroundColor: returnType === 'replacement' ? 'rgba(5,150,105,0.08)' : 'transparent' }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: returnType === 'replacement' ? Colors.forest : Colors.textDim }}>🔄 Replacement</Text>
                </TouchableOpacity>
              )}
            </View>

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

            {/* Photo Evidence */}
            <Text style={[m.sub, { marginBottom: 8, marginTop: 4 }]}>📷 Photo Evidence (optional)</Text>

            {(fileImages.length > 0 || urlImages.length > 0) && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {fileImages.map((f, i) => (
                  <View key={`f-${i}`} style={{ position: 'relative' }}>
                    <ExpoImage source={{ uri: f.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} contentFit="cover" />
                    <TouchableOpacity onPress={() => removeFile(i)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {urlImages.map((u, i) => (
                  <View key={`u-${i}`} style={{ position: 'relative' }}>
                    <ExpoImage source={{ uri: u }} style={{ width: 72, height: 72, borderRadius: 8 }} contentFit="cover" />
                    <TouchableOpacity onPress={() => removeUrl(i)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {totalImages < 5 && (
              <TouchableOpacity onPress={pickImages} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.forest, borderStyle: 'dashed', marginBottom: 10 }}>
                <Text style={{ fontSize: 18 }}>📁</Text>
                <Text style={{ color: Colors.forest, fontSize: 14, fontWeight: '600' }}>Upload Photos</Text>
              </TouchableOpacity>
            )}

            {totalImages < 5 && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <TextInput
                  style={[m.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Or paste image URL..."
                  placeholderTextColor={Colors.textDim}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  onSubmitEditing={addUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity onPress={addUrl} style={{ backgroundColor: Colors.forest, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={{ color: Colors.textDim, fontSize: 12, marginBottom: 16 }}>Max 5 photos · JPG, PNG, WEBP</Text>

            <TouchableOpacity
              onPress={() => { if (finalReason) onConfirm(finalReason, urlImages, fileImages, returnType) }}
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── WRITE REVIEW MODAL ──────────────────────────────────────────────────────
interface ReviewItemState {
  product_id: number; name: string; image?: string
  rating: number; comment: string
  images: { uri: string; name: string; type: string }[]
  existingImages: string[]
  submitting: boolean; submitted: boolean
}

function StarRow({ rating, onChange }: { rating: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={{ fontSize: 28, opacity: n <= rating ? 1 : 0.25 }}>⭐</Text>
        </TouchableOpacity>
      ))}
      {rating > 0 && (
        <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.gold, alignSelf: 'center', marginLeft: 4 }}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
        </Text>
      )}
    </View>
  )
}

function WriteReviewModal({ visible, onClose, orderId, orderItems }: {
  visible: boolean; onClose: () => void; orderId: number; orderItems: OrderItem[]
}) {
  const [items, setItems] = useState<ReviewItemState[]>([])
  const [viewer, setViewer] = useState<{ images: string[]; start: number } | null>(null)

  useEffect(() => {
    if (visible) {
      setItems(orderItems.map(i => ({
        product_id: i.product_id, name: i.name, image: i.image,
        rating: 0, comment: '', images: [], existingImages: [], submitting: false, submitted: false,
      })))
      loadExistingReviews()
    }
  }, [visible])

  const loadExistingReviews = async () => {
    try {
      const results = await Promise.allSettled(
        orderItems.map(item => api.get(`/shop/reviews/product/${item.product_id}`, { params: { me: 1 } }))
      )
      setItems(prev => prev.map((it, idx) => {
        const r = results[idx]
        if (r.status !== 'fulfilled') return it
        const mine = (r.value.data?.data || [])[0]
        if (!mine) return it
        return { ...it, rating: mine.rating || 0, comment: mine.comment || '', existingImages: mine.images || [] }
      }))
    } catch { }
  }

  const update = (idx: number, patch: Partial<ReviewItemState>) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))

  const pickImages = async (idx: number) => {
    const item = items[idx]
    const remaining = 5 - item.existingImages.length - item.images.length
    if (remaining <= 0) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { toast.error('Gallery permission needed'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: remaining,
    })
    if (!result.canceled) {
      const newImgs = result.assets.map(a => ({
        uri: a.uri, name: a.fileName || `photo_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg',
      }))
      setItems(prev => prev.map((it, i) => {
        if (i !== idx) return it
        return { ...it, images: [...it.images, ...newImgs].slice(0, 5 - it.existingImages.length) }
      }))
    }
  }

  const submitItem = async (idx: number) => {
    const item = items[idx]
    if (!item.rating) { toast.error('Please select a star rating'); return }
    update(idx, { submitting: true })
    try {
      const form = new FormData()
      form.append('rating', String(item.rating))
      form.append('comment', item.comment)
      form.append('oldImages', JSON.stringify(item.existingImages))
      item.images.forEach(img => form.append('images', { uri: img.uri, type: img.type, name: img.name } as any))
      await api.post(`/shop/reviews/order/${orderId}/product/${item.product_id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      update(idx, { submitting: false, submitted: true })
      toast.success('Review submitted!')
    } catch (e: any) {
      update(idx, { submitting: false })
      toast.error(e?.response?.data?.message || 'Failed to submit review')
    }
  }

  const allDone = items.length > 0 && items.every(i => i.submitted)

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable style={m.bg} onPress={onClose} />
        {viewer && <ReviewImageViewer images={viewer.images} startIndex={viewer.start} onClose={() => setViewer(null)} />}
        <View style={[m.sheet, { maxHeight: '92%', padding: 0 }]}>

          {/* ── Fixed header ─────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
            <View style={m.handle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={m.title}>Rate Your Order</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={{ padding: 6, borderRadius: 18, backgroundColor: '#f3f4f6' }}>
                <Text style={{ fontSize: 15, color: Colors.textDim, fontFamily: Fonts.bold }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[m.sub, { marginBottom: 0 }]}>Share your experience for each product</Text>
          </View>

          {/* ── Scrollable item cards ─────────────────────────────── */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}
          >
            {items.map((item, idx) => (
              <View key={item.product_id} style={rv2.card}>
                {/* Product info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {item.image
                    ? <ExpoImage source={{ uri: item.image }} style={rv2.thumb} contentFit="cover" />
                    : <View style={[rv2.thumb, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 18 }}>🌿</Text>
                      </View>
                  }
                  <Text style={rv2.itemName} numberOfLines={2}>{item.name}</Text>
                </View>

                {item.submitted ? (
                  <View style={rv2.doneRow}>
                    <Text style={{ fontSize: 20 }}>✅</Text>
                    <Text style={rv2.doneText}>Review submitted!</Text>
                  </View>
                ) : (
                  <>
                    <StarRow rating={item.rating} onChange={r => update(idx, { rating: r })} />

                    <TextInput
                      style={m.input}
                      placeholder="Share your experience with this product..."
                      placeholderTextColor={Colors.textDim}
                      value={item.comment}
                      onChangeText={t => update(idx, { comment: t })}
                      multiline
                      numberOfLines={3}
                      maxLength={300}
                    />
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, textAlign: 'right', marginTop: -6, marginBottom: 10 }}>
                      {item.comment.length}/300
                    </Text>

                    {/* Previously uploaded images (from backend) */}
                    {item.existingImages.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        {item.existingImages.map((url, i2) => (
                          <View key={`ex-${i2}`} style={rv2.imgPreview}>
                            <TouchableOpacity onPress={() => setViewer({ images: [...item.existingImages, ...item.images.map(i => i.uri)], start: i2 })} activeOpacity={0.85} style={{ width: '100%', height: '100%' }}>
                              <ExpoImage source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => update(idx, { existingImages: item.existingImages.filter((_, j) => j !== i2) })}
                              style={rv2.imgRemove}
                            >
                              <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.bold }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Newly picked images */}
                    {item.images.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {item.images.map((img, i2) => (
                          <View key={i2} style={rv2.imgPreview}>
                            <TouchableOpacity onPress={() => setViewer({ images: [...item.existingImages, ...item.images.map(i => i.uri)], start: item.existingImages.length + i2 })} activeOpacity={0.85} style={{ width: '100%', height: '100%' }}>
                              <ExpoImage source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => update(idx, { images: item.images.filter((_, j) => j !== i2) })}
                              style={rv2.imgRemove}
                            >
                              <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.bold }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Add photos button */}
                    {(item.existingImages.length + item.images.length) < 5 && (
                      <TouchableOpacity onPress={() => pickImages(idx)} style={[rv2.addPhotoBtn, { marginBottom: 10 }]}>
                        <Text style={{ fontSize: 14 }}>📷</Text>
                        <Text style={rv2.addPhotoText}>
                          Add Photos ({item.existingImages.length + item.images.length}/5)
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => submitItem(idx)}
                      disabled={item.submitting || !item.rating}
                      style={{ borderRadius: 12, overflow: 'hidden', marginTop: 4 }}
                    >
                      <LinearGradient
                        colors={!item.rating ? ['#9ca3af', '#6b7280'] : [Colors.forest, Colors.moss]}
                        style={{ paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      >
                        {item.submitting
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 13 }}>⭐  Submit Review</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          {/* ── Fixed footer ─────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, borderTopWidth: 0.5, borderTopColor: Colors.border }}>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Text style={m.closeBtnText}>{allDone ? '✓ All Done — Close' : 'Skip for Now'}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const rv2 = StyleSheet.create({
  card: { backgroundColor: '#f8f9f8', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: Colors.border },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  itemName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, flex: 1, lineHeight: 18 },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.mint, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, marginBottom: 10, alignSelf: 'flex-start' },
  addPhotoText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.sage },
  imgPreview: { width: 68, height: 68, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  imgRemove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.mint, borderRadius: 10, padding: 10 },
  doneText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.sage },
})

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

interface TimelineLog {
  id: number; old_status: number; new_status: number; note?: string
  created_at: string; old_label?: string; new_label?: string
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [timelineLogs, setTimelineLogs] = useState<TimelineLog[]>([])
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null)
  const [showAddressChange, setShowAddressChange] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [returnEligibility, setReturnEligibility] = useState<any>(null)
  const [returnEligibilityLoading, setReturnEligibilityLoading] = useState(false)

  useEffect(() => { if (id) fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const [orderRes, timelineRes] = await Promise.allSettled([
        api.get(`/orders/${id}`),
        api.get(`/orders/${id}/timeline`),
      ])
      if (orderRes.status === 'fulfilled') {
        const ord = orderRes.value.data?.data || null
        setOrder(ord)
        if (ord?.status === 5) {
          setReturnEligibilityLoading(true)
          api.get(`/orders/${id}/return-eligibility`)
            .then(r => setReturnEligibility(r.data))
            .catch(() => {})
            .finally(() => setReturnEligibilityLoading(false))
        }
      } else {
        toast.error('Order not found')
        router.back()
        return
      }
      if (timelineRes.status === 'fulfilled') {
        setTimelineLogs(timelineRes.value.data?.timeline || [])
        setEstimatedDelivery(timelineRes.value.data?.tracking?.estimated_delivery || null)
      }
    } finally { setLoading(false) }
  }

  const handleCancel = async (reason: string) => {
    setActionLoading(true)
    try {
      await api.post(`/orders/${id}/cancel`, { reason })
      setShowCancel(false)
      toast.success('Your order has been cancelled.')
      fetchOrder()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cancellation failed')
    } finally { setActionLoading(false) }
  }

  const handleReorder = async () => {
    setActionLoading(true)
    try {
      await api.post(`/orders/${id}/reorder`)
      toast.success('Items added to cart!')
      router.push('/cart')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add items to cart')
    } finally { setActionLoading(false) }
  }

  const handleReturn = async (reason: string, urlImages: string[] = [], fileImages: { uri: string; name: string; type: string }[] = [], returnType: string = 'refund') => {
    setActionLoading(true)
    try {
      const form = new FormData()
      form.append('reason', reason)
      form.append('return_type', returnType)
      fileImages.forEach(f => form.append('images', f as any))
      form.append('imageUrls', JSON.stringify(urlImages))
      await api.post(`/orders/${id}/return`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowReturn(false)
      toast.success('Return request submitted. We will contact you within 24 hours.')
      fetchOrder()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Return request failed')
    } finally { setActionLoading(false) }
  }

  const handleRetryPayment = async () => {
    if (!order) return
    setActionLoading(true)
    try {
      const res = await api.post(`/orders/${id}/retry-payment`)
      const payUrl = res.data?.payment_url || res.data?.short_url
      if (payUrl) {
        const result = await WebBrowser.openAuthSessionAsync(payUrl, 'oroganix://')
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url).searchParams
          if (params.get('razorpay_payment_id')) {
            await api.post('/orders/verify', {
              orderId: order.id,
              razorpay_order_id: params.get('razorpay_order_id'),
              razorpay_payment_id: params.get('razorpay_payment_id'),
              razorpay_signature: params.get('razorpay_signature'),
            })
            toast.success('Payment verified successfully.')
            fetchOrder()
          }
        }
      } else {
        toast.error('Could not get payment link')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Payment retry failed')
    } finally { setActionLoading(false) }
  }

  const handleDownloadInvoice = async () => {
    if (!order?.pdf_url) return
    try {
      await Linking.openURL(order.pdf_url)
    } catch {
      toast.error('Could not open invoice')
    }
  }

  const openAddressChange = async () => {
    try {
      const res = await api.get('/users/address')
      setSavedAddresses(res.data?.data || [])
      setSelectedAddressId(null)
      setShowAddressChange(true)
    } catch { toast.error('Could not load addresses') }
  }

  const handleChangeAddress = async () => {
    if (!selectedAddressId) { toast.error('Please select an address'); return }
    setAddressLoading(true)
    try {
      await api.patch(`/orders/${id}/address`, { address_id: selectedAddressId })
      setShowAddressChange(false)
      toast.success('Delivery address updated')
      fetchOrder()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update address')
    } finally { setAddressLoading(false) }
  }

  if (!order && !loading) return null

  const statusInfo = order ? (STATUS_MAP[order.status] ?? STATUS_MAP[0]) : STATUS_MAP[0]
  const canCancel = order && [0, 1].includes(order.status)
  const canReturn = order && order.status === 5 && returnEligibility?.is_eligible === true
  const canReplace = returnEligibility?.can_replace === true
  const canRetryPayment = order && order.payment_method === 'online' && order.payment_status === 'unpaid' && order.status !== 6
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
            <TouchableOpacity onPress={handleDownloadInvoice} style={ss.invoiceBtn}>
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
                  {order.payment_method === 'cod' ? '💵 COD' : '💳 Online'} · {order.payment_status === 'paid' ? '✓ Paid' : order.payment_status === 'pending' && order.payment_method === 'cod' ? '⏳ Pay on Delivery' : order.payment_status === 'refunded' ? '↩ Refunded' : 'Unpaid'}
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
                <StatusTimeline currentStatus={order.status} logs={timelineLogs} estimatedDelivery={estimatedDelivery} />
              </Animated.View>
            )}

            {/* ── SPECIAL STATUS BANNER ── */}
            {[6, 7, 8, 9].includes(order.status) && (
              <Animated.View entering={ZoomIn.springify()} style={[ss.specialBanner, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '33' }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{statusInfo.emoji}</Text>
                <Text style={[ss.specialTitle, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                {order.cancel_reason && <Text style={ss.specialSub}>Reason: {order.cancel_reason}</Text>}
                {order.return_reason && <Text style={ss.specialSub}>Reason: {order.return_reason}</Text>}
                {/* Refund tracking */}
                {order.refund_amount && (
                  <View style={{ marginTop: 12, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: 12, width: '100%' }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#065f46', marginBottom: 4 }}>💰 Refund: ₹{parseFloat(order.refund_amount).toFixed(2)}</Text>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: '#6b7280' }}>
                      Status: {order.refund_status === 'processed' ? '✓ Processed' : order.refund_status === 'failed' ? '✗ Failed' : order.refund_status === 'cod_manual' ? 'COD Manual' : '⏳ Pending'}
                    </Text>
                    {order.refund_id && <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Ref: {order.refund_id}</Text>}
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Credited to original payment within 5–7 business days.</Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── TRACKING ── */}
            {order.tracking_number && (() => {
              const carrierUrl = (order as any).courier_name ? getCarrierUrl((order as any).courier_name, order.tracking_number!) : null
              return (
              <Animated.View entering={FadeInDown.delay(140)} style={ss.card}>
                <Text style={ss.cardTitle}>Tracking Info</Text>
                {(order as any).courier_name && (
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim, marginBottom: 8 }}>
                    Courier: {(order as any).courier_name}
                  </Text>
                )}
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
                  <TouchableOpacity
                    onPress={() => { if (carrierUrl) Linking.openURL(carrierUrl) }}
                    style={[ss.trackingBadge, !carrierUrl && { opacity: 0.5 }]}
                    disabled={!carrierUrl}
                  >
                    <Text style={ss.trackingBadgeText}>Track ›</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
              )
            })()}

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
                      {order.coupon_code && Number(order.discount_amount) > 0 && (
                        <View style={ss.priceRow}>
                          <Text style={[ss.priceLabel, { color: '#6ee7b7' }]}>🎁 Coupon ({order.coupon_code})</Text>
                          <Text style={[ss.priceVal, { color: '#6ee7b7' }]}>−₹{Number(order.discount_amount).toFixed(2)}</Text>
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
            {order.status === 5 && returnEligibilityLoading && (
              <Animated.View entering={FadeInDown.delay(260)} style={{ paddingHorizontal: 16, marginTop: 4 }}>
                <View style={{ backgroundColor: 'rgba(249,115,22,0.06)', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color="#fb923c" />
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Checking return eligibility…</Text>
                </View>
              </Animated.View>
            )}
            {(canCancel || canReturn || (order.status === 5 && returnEligibility && !returnEligibility.is_eligible)) && (
              <Animated.View entering={FadeInDown.delay(260)} style={{ paddingHorizontal: 16, gap: 10, marginTop: 4 }}>
                {canReturn && (
                  <>
                    <TouchableOpacity onPress={() => setShowReturn(true)} style={{ borderRadius: 16, overflow: 'hidden' }}>
                      <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={ss.actionBtnText}>↩️  Request Return / Refund</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {returnEligibility?.return_by && (
                      <Text style={{ textAlign: 'center', fontFamily: Fonts.medium, fontSize: 11, color: Colors.textDim }}>
                        Return by {new Date(returnEligibility.return_by).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {returnEligibility.days_left} day{returnEligibility.days_left !== 1 ? 's' : ''} left
                      </Text>
                    )}
                  </>
                )}
                {order.status === 5 && returnEligibility && !returnEligibility.is_eligible && (
                  <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14 }}>⛔</Text>
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: '#dc2626', flex: 1 }}>{returnEligibility.reason || 'Return window has expired'}</Text>
                  </View>
                )}
                {canCancel && (
                  <>
                    <TouchableOpacity onPress={() => setShowCancel(true)} style={ss.cancelBtn}>
                      <Text style={ss.cancelBtnText}>❌  Cancel Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openAddressChange}
                      style={[ss.cancelBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                      <Text style={[ss.cancelBtnText, { color: '#1d4ed8' }]}>📍  Change Delivery Address</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            )}

            {/* ── WRITE REVIEW (Delivered orders) ── */}
            {order?.status === 5 && (
              <Animated.View entering={FadeInDown.delay(270)} style={{ paddingHorizontal: 16, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowReview(true)}
                  style={{ borderRadius: 16, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={{ fontSize: 24 }}>⭐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff' }}>Rate This Order</Text>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                        Review {order.items.length === 1 ? 'the product' : `all ${order.items.length} products`}
                      </Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 18 }}>›</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── RETRY PAYMENT ── */}
            {canRetryPayment && (
              <Animated.View entering={FadeInDown.delay(270)} style={{ paddingHorizontal: 16, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handleRetryPayment}
                  disabled={actionLoading}
                  style={{ borderRadius: 16, overflow: 'hidden' }}
                >
                  <LinearGradient colors={['#7c3aed', '#6d28d9']} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ fontSize: 18 }}>💳</Text>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff' }}>{actionLoading ? 'Processing...' : 'Retry Payment'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, textAlign: 'center', marginTop: 6 }}>Complete your pending online payment</Text>
              </Animated.View>
            )}

            {/* ── RE-ORDER ── */}
            {[5, 6].includes(order.status) && (
              <Animated.View entering={FadeInDown.delay(275)} style={{ paddingHorizontal: 16, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handleReorder}
                  disabled={actionLoading}
                  style={{ borderRadius: 16, overflow: 'hidden' }}
                >
                  <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ fontSize: 18 }}>🛒</Text>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff' }}>Re-order These Items</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── HELP ── */}
            <Animated.View entering={FadeInDown.delay(280)} style={[ss.card, { marginTop: 10 }]}>
              <View style={ss.helpRow}>
                <View style={{ width: 52, height: 32, overflow: 'hidden' }}>
                  <ExpoImage source={{ uri: LOGO_URL }} style={{ width: 64, height: 32, marginLeft: -6 }} contentFit="cover" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ss.helpTitle}>Need help?</Text>
                  <Text style={ss.helpSub}>Contact our support team for any order related queries</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/support' as any)} style={ss.helpBtn}>
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
        canReplace={canReplace}
      />
      {order && (
        <WriteReviewModal
          visible={showReview}
          onClose={() => setShowReview(false)}
          orderId={order.id}
          orderItems={order.items}
        />
      )}

      {/* ── Address Change Modal ── */}
      <Modal visible={showAddressChange} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={m.bg} onPress={() => setShowAddressChange(false)} />
        <View style={[m.sheet, { maxHeight: '75%' }]}>
          <View style={m.handle} />
          <Text style={m.title}>Change Delivery Address</Text>
          <Text style={m.sub}>Only available before the order is shipped</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {savedAddresses.length === 0 ? (
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', paddingVertical: 20 }}>
                No saved addresses found
              </Text>
            ) : savedAddresses.map((a: any) => (
              <TouchableOpacity key={a.id} onPress={() => setSelectedAddressId(a.id)}
                style={[m.optionRow, selectedAddressId === a.id && m.optionRowActive, { marginBottom: 10, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <View style={[m.radio, selectedAddressId === a.id && m.radioActive]}>
                    {selectedAddressId === a.id && <View style={m.radioDot} />}
                  </View>
                  <Text style={[m.optionText, selectedAddressId === a.id && m.optionTextActive, { fontFamily: Fonts.bold }]}>
                    {a.name} · {a.phone}
                  </Text>
                </View>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, paddingLeft: 30 }}>
                  {a.street}, {a.city}, {a.state} – {a.pincode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={handleChangeAddress} disabled={addressLoading || !selectedAddressId}
            style={[m.confirmBtn, { backgroundColor: selectedAddressId ? '#1d4ed8' : Colors.border }]}>
            {addressLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={m.confirmText}>Update Address</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
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
