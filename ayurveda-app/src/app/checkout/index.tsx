import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView,
  Linking, Platform, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { toast } from '../../components/ui/Toast'
import * as WebBrowser from 'expo-web-browser'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, {
  FadeIn, FadeInDown, FadeInUp, SlideInRight, ZoomIn,
  useSharedValue, withTiming, withSpring, useAnimatedStyle,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Colors, Fonts, Shadows, Radius } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

interface Address {
  id: number; street: string; city: string; state: string; pincode: string; isDefault?: boolean
}
interface Setting { key: string; value: string; type: string }
type PayMethod = 'cod' | 'online'
type Step = 1 | 2 | 3

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Address', icon: '📍' },
    { n: 2, label: 'Payment', icon: '💳' },
    { n: 3, label: 'Confirm', icon: '✅' },
  ]
  return (
    <View style={si.wrap}>
      {steps.map((s, i) => {
        const done = step > s.n
        const active = step === s.n
        return (
          <React.Fragment key={s.n}>
            <View style={si.stepCol}>
              <Animated.View
                entering={FadeIn.delay(i * 100)}
                style={[si.circle, done && si.circleDone, active && si.circleActive]}
              >
                <Text style={[si.circleText, (done || active) && si.circleTextActive]}>
                  {done ? '✓' : s.icon}
                </Text>
              </Animated.View>
              <Text style={[si.label, (done || active) && si.labelActive]}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[si.line, step > s.n && si.lineDone]} />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

const si = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  stepCol: { alignItems: 'center', gap: 5 },
  circle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  circleActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  circleDone: { backgroundColor: Colors.emerald, borderColor: Colors.emerald },
  circleText: { fontSize: 16, color: 'rgba(255,255,255,0.5)' },
  circleTextActive: { color: '#fff' },
  label: { color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.medium, fontSize: 10 },
  labelActive: { color: '#fff', fontFamily: Fonts.bold },
  line: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, marginBottom: 16, marginHorizontal: 6 },
  lineDone: { backgroundColor: Colors.emerald },
})

// ─── SUMMARY ROW ──────────────────────────────────────────────────────────────
function SummaryRow({ label, val, bold, valColor, highlight }: {
  label: string; val: string; bold?: boolean; valColor?: string; highlight?: boolean
}) {
  return (
    <View style={[sr.row, highlight && sr.rowHighlight]}>
      <Text style={[sr.label, bold && sr.labelBold]}>{label}</Text>
      <Text style={[sr.val, bold && sr.valBold, valColor ? { color: valColor } : {}]}>{val}</Text>
    </View>
  )
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  rowHighlight: { backgroundColor: 'rgba(201,168,76,0.06)', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  label: { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  labelBold: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
  val: { fontFamily: Fonts.medium, fontSize: 13, color: '#fff' },
  valBold: { fontFamily: Fonts.displayBold, fontSize: 22, color: Colors.gold },
})

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SuccessScreen({ orderNo, amount, insets }: { orderNo: string; amount: number; insets: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <LinearGradient colors={['#0a1f14', Colors.forest]} style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text style={{ color: '#fff', fontFamily: Fonts.displayBold, fontSize: 24 }}>Checkout</Text>
        <StepIndicator step={3} />
      </LinearGradient>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={suc.orb}>
          <LinearGradient colors={['#059669', '#0d9488']} style={StyleSheet.absoluteFill} />
          <Text style={{ fontSize: 44 }}>✅</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(200)} style={suc.title}>
          Order Confirmed!
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(280)} style={suc.orderBadge}>
          <Text style={{ fontSize: 14 }}>📦</Text>
          <Text style={suc.orderNo}>#{orderNo}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360)} style={suc.amountBox}>
          <LinearGradient colors={['#0d120d', '#111711']} style={StyleSheet.absoluteFill} />
          <Text style={suc.amountLabel}>TOTAL PAID</Text>
          <Text style={suc.amount}>₹{amount.toFixed(2)}</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(440)} style={suc.sub}>
          Your Ayurvedic essentials are being lovingly prepared and will arrive soon. 🌿
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(520)} style={{ width: '100%', gap: 12 }}>
          <TouchableOpacity onPress={() => router.replace('/')} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={[Colors.gold, '#a07830']} style={suc.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={suc.primaryBtnText}>✨  Continue Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/account')} style={suc.secondaryBtn}>
            <Text style={suc.secondaryBtnText}>📦  Track My Order</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  )
}

const suc = StyleSheet.create({
  orb: { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center', marginBottom: 22, overflow: 'hidden', ...Shadows.xl },
  title: { fontFamily: Fonts.displayBold, fontSize: 34, color: Colors.forest, marginBottom: 12, textAlign: 'center' },
  orderBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 0.5, borderColor: '#bbf7d0', marginBottom: 22 },
  orderNo: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  amountBox: { borderRadius: 20, padding: 22, alignItems: 'center', marginBottom: 22, width: '100%', overflow: 'hidden' },
  amountLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  amount: { color: Colors.gold, fontFamily: Fonts.displayBold, fontSize: 42 },
  sub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  primaryBtn: { paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.forest, fontFamily: Fonts.bold, fontSize: 15 },
  secondaryBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(26,46,30,0.2)' },
  secondaryBtnText: { color: Colors.forest, fontFamily: Fonts.bold, fontSize: 14 },
})

// ─── MAIN CHECKOUT SCREEN ────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const insets = useSafeAreaInsets()
  const { user, cartData, setCartData, setAuthOpen } = useStore()

  const [step, setStep] = useState<Step>(1)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null)
  const [settings, setSettings] = useState<Setting[]>([])
  const [payMethod, setPayMethod] = useState<PayMethod>('cod')
  const [processing, setProcessing] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [orderNo, setOrderNo] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  // Wallet & Loyalty state
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletApplied, setWalletApplied] = useState(false)
  const [walletDiscount, setWalletDiscount] = useState(0)
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [loyaltyApplied, setLoyaltyApplied] = useState(false)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)

  useEffect(() => {
    if (!user) { setAuthOpen(true); router.back(); return }
    init()
    api.get('/coupons/public').then(r => setAvailableCoupons(r.data?.coupons || [])).catch(() => {})
    api.get('/wallet/').then(r => {
      setWalletBalance(Number(r.data?.wallet_balance || 0))
      setLoyaltyBalance(Number(r.data?.loyalty_points || 0))
    }).catch(() => {})
  }, [user?.id])

  const init = async () => {
    setLoadingInit(true)
    try {
      const [addrRes, settingRes] = await Promise.allSettled([
        api.get('/users/address'),
        api.get('/admin/settings'),
      ])
      if (addrRes.status === 'fulfilled') {
        const list: Address[] = addrRes.value.data?.data || []
        setAddresses(list)
        const def = list.find(a => a.isDefault) || list[0]
        if (def) setSelectedAddr(def)
        if (list.length === 0) {
          Alert.alert('No Address', 'Please add a delivery address to continue.', [
            { text: 'Add Address', onPress: () => router.replace('/account?tab=Addresses') }
          ])
        }
      }
      if (settingRes.status === 'fulfilled') {
        setSettings(settingRes.value.data?.data || [])
      }
    } catch { } finally { setLoadingInit(false) }
  }

  const chargesMap = useMemo(() => {
    return (settings || []).reduce((acc: any, item: Setting) => {
      let value: any = item.value
      if (item.type === 'number') value = Number(value)
      if (item.type === 'boolean') value = value === 'true'
      acc[item.key] = value
      return acc
    }, {})
  }, [settings])

  const { subtotal, tax, delivery, platformFee, discount, total } = useMemo(() => {
    let cartSubtotal = 0; let cartTax = 0
    ;(cartData.items || []).forEach(item => {
      const price = Number(item.price) || 0
      const qty = Number(item.quantity) || 1
      const gst = Number((item as any).gst_percent || 0)
      cartSubtotal += price * qty
      cartTax += (price * qty * gst) / 100
    })
    const deliveryCharge = Number(chargesMap.delivery_charge || 0)
    const platformCharge = Number(chargesMap.platform_fee || 0)
    const freeLimit = Number(chargesMap.free_delivery_limit || 499)
    const finalDelivery = cartSubtotal >= freeLimit ? 0 : deliveryCharge
    const couponDiscount = appliedCoupon?.discount || 0
    const finalTotal = Math.max(0, cartSubtotal + cartTax + finalDelivery + platformCharge - couponDiscount - walletDiscount - loyaltyDiscount)
    return {
      subtotal: +cartSubtotal.toFixed(2), tax: +cartTax.toFixed(2),
      delivery: +finalDelivery.toFixed(2), platformFee: +platformCharge.toFixed(2),
      discount: +couponDiscount.toFixed(2),
      total: +finalTotal.toFixed(2),
    }
  }, [cartData, chargesMap, appliedCoupon, walletDiscount, loyaltyDiscount])

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponApplying(true); setCouponError('')
    try {
      const res = await api.post('/coupons/apply', { code: couponInput.trim(), cartTotal: subtotal + tax })
      setAppliedCoupon({ code: res.data.coupon.code, discount: res.data.discount })
      setCouponInput(res.data.coupon.code)
      toast.success(res.data.message)
    } catch (e: any) {
      setCouponError(e?.response?.data?.message || 'Invalid coupon')
      setAppliedCoupon(null)
    } finally { setCouponApplying(false) }
  }

  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(''); setCouponError('') }

  const placeOrder = async () => {
    if (!selectedAddr) { toast.warning('Select a delivery address'); return }
    if (processing) return
    setProcessing(true)
    try {
      const shipping = {
        name: user?.name || '',
        phone: user?.phone || '',
        address: `${selectedAddr.street}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`,
      }
      const res = await api.post('/orders/create', {
        shipping, addressId: selectedAddr.id,
        paymentMethod: payMethod,
        pricing: { subtotal, tax, delivery, platformFee, total },
        couponCode: appliedCoupon?.code || undefined,
        walletDiscount: walletDiscount > 0 ? walletDiscount : undefined,
        loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
        loyaltyPointsUsed: loyaltyDiscount > 0 ? Math.ceil(loyaltyDiscount * 10) : undefined,
      })
      if (!res.data?.success) throw new Error(res.data?.message || 'Order failed')
      const orderId = res.data.orderId

      if (payMethod === 'cod') {
        setPaidAmount(total)
        setOrderNo(res.data.invoice_no || `ORD-${orderId}`)
        setStep(3)
        setCartData({ items: [], subtotal: 0, totalItems: 0 })
        return
      }

      // Online payment via Razorpay web page
      setProcessing(false)
      const apiBase = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || ''
      const authToken = await AsyncStorage.getItem('auth_token')
      const paymentPageUrl = `${apiBase}/api/orders/${orderId}/payment-page?returnUrl=oroganix://payment&token=${encodeURIComponent(authToken || '')}`

      const result = await WebBrowser.openAuthSessionAsync(paymentPageUrl, 'oroganix://')

      if (result.type === 'success' && result.url) {
        const url = result.url
        const params = new URLSearchParams(url.split('?')[1] || '')
        const status = params.get('status')

        if (status === 'success') {
          setProcessing(true)
          try {
            await api.post('/orders/verify', {
              orderId,
              razorpay_order_id: params.get('razorpay_order_id'),
              razorpay_payment_id: params.get('razorpay_payment_id'),
              razorpay_signature: params.get('razorpay_signature'),
            })
            setCartData({ items: [], subtotal: 0, totalItems: 0 })
            setPaidAmount(total)
            setOrderNo(`ORD-${orderId}`)
            setStep(3)
          } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Payment verification failed')
          } finally { setProcessing(false) }
        } else {
          toast.warning('Payment cancelled. You can try again.')
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        toast.warning('Payment not completed. Your order is pending.')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Something went wrong')
      setProcessing(false)
    }
  }

  if (loadingInit) return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.forest} size="large" />
    </View>
  )

  if (step === 3) return <SuccessScreen orderNo={orderNo} amount={paidAmount} insets={insets} />

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">

        {/* Header */}
        <LinearGradient colors={['#0a1f14', Colors.forest]} style={[ss.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => step === 1 ? router.back() : setStep(s => (s - 1) as Step)}
            style={ss.backBtn}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ss.headerTitle}>Checkout</Text>
            <Text style={ss.headerSub}>🔒 Secure · SSL Encrypted</Text>
          </View>
          <View style={ss.stepPill}>
            <Text style={ss.stepPillText}>Step {step} of 2</Text>
          </View>
          <StepIndicator step={step} />
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        >
          {/* ── STEP 1: ADDRESS ── */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={ss.stepTitle}>Select Delivery Address</Text>

              {addresses.length === 0 ? (
                <View style={ss.noAddrBox}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>📍</Text>
                  <Text style={ss.noAddrTitle}>No saved addresses</Text>
                  <Text style={ss.noAddrSub}>Please add a delivery address from your account</Text>
                  <TouchableOpacity onPress={() => router.replace('/account?tab=Addresses')} style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ paddingHorizontal: 24, paddingVertical: 12 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={{ color: '#fff', fontFamily: Fonts.bold }}>Add Address</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 10, marginBottom: 16 }}>
                  {addresses.map(addr => (
                    <TouchableOpacity
                      key={addr.id}
                      onPress={() => setSelectedAddr(addr)}
                      style={[ss.addrCard, selectedAddr?.id === addr.id && ss.addrCardActive]}
                      activeOpacity={0.85}
                    >
                      <View style={[ss.addrRadio, selectedAddr?.id === addr.id && ss.addrRadioActive]}>
                        {selectedAddr?.id === addr.id && <View style={ss.addrRadioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        {addr.isDefault && (
                          <View style={ss.defaultBadge}><Text style={ss.defaultBadgeText}>⭐ Default</Text></View>
                        )}
                        <Text style={ss.addrStreet}>{addr.street}</Text>
                        <Text style={ss.addrLine}>{addr.city}, {addr.state} — {addr.pincode}</Text>
                      </View>
                      {selectedAddr?.id === addr.id && (
                        <View style={ss.selectedMark}><Text style={{ color: Colors.sage, fontSize: 16 }}>✓</Text></View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Order summary */}
              <LinearGradient colors={['#0d120d', '#111711']} style={ss.summaryCard}>
                <Text style={ss.summaryCardTitle}>Order Summary</Text>
                {cartData.items.map((item, i) => (
                  <View key={i} style={ss.summaryItemRow}>
                    <View style={ss.summaryDot} />
                    <Text style={ss.summaryItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={ss.summaryItemQty}>×{item.quantity}</Text>
                    <Text style={ss.summaryItemPrice}>₹{item.price}</Text>
                  </View>
                ))}
                <View style={ss.summaryDivider} />
                <SummaryRow label="Subtotal" val={`₹${subtotal}`} />
                {tax > 0 && <SummaryRow label="GST" val={`₹${tax.toFixed(2)}`} />}
                {platformFee > 0 && <SummaryRow label="Platform Fee" val={`₹${platformFee}`} />}
                <SummaryRow
                  label="Delivery"
                  val={delivery === 0 ? 'FREE ✓' : `₹${delivery}`}
                  valColor={delivery === 0 ? '#6ee7b7' : undefined}
                />
                <View style={ss.summaryDivider} />
                <SummaryRow label="Total" val={`₹${total}`} bold highlight />
              </LinearGradient>

              <TouchableOpacity
                onPress={() => {
                  if (!selectedAddr) { toast.warning('Select a delivery address'); return }
                  setStep(2)
                }}
                disabled={addresses.length === 0}
                style={{ borderRadius: 16, overflow: 'hidden', marginTop: 8 }}
              >
                <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={ss.nextBtnText}>Continue to Payment →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 2: PAYMENT ── */}
          {step === 2 && (
            <Animated.View entering={SlideInRight.duration(320)}>
              {/* Selected address chip */}
              {selectedAddr && (
                <View style={ss.addrChip}>
                  <Text style={{ fontSize: 16 }}>📍</Text>
                  <Text style={ss.addrChipText} numberOfLines={1}>
                    {selectedAddr.street}, {selectedAddr.city} — {selectedAddr.pincode}
                  </Text>
                  <TouchableOpacity onPress={() => setStep(1)} style={ss.addrChipEdit}>
                    <Text style={ss.addrChipEditText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={ss.stepTitle}>Choose Payment Method</Text>

              <View style={{ gap: 12, marginBottom: 20 }}>
                {[
                  { key: 'cod', emoji: '💵', title: 'Cash on Delivery', sub: 'Pay when your order arrives', badge: 'Popular' },
                  { key: 'online', emoji: '💳', title: 'Online Payment', sub: 'UPI, Cards, NetBanking via Razorpay', badge: 'Secure' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setPayMethod(opt.key as PayMethod)}
                    style={[ss.payOption, payMethod === opt.key && ss.payOptionActive]}
                    activeOpacity={0.85}
                  >
                    <View style={[ss.payRadio, payMethod === opt.key && ss.payRadioActive]}>
                      {payMethod === opt.key && <View style={ss.payRadioDot} />}
                    </View>
                    <Text style={{ fontSize: 30 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={ss.payTitle}>{opt.title}</Text>
                        <View style={ss.payBadge}><Text style={ss.payBadgeText}>{opt.badge}</Text></View>
                      </View>
                      <Text style={ss.paySub}>{opt.sub}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── COUPON SECTION ── */}
              <Animated.View entering={FadeInDown.delay(100)} style={ss.couponBox}>
                <Text style={ss.couponTitle}>🎁 Apply Coupon / Offer</Text>

                {/* Available coupons list */}
                {availableCoupons.length > 0 && !appliedCoupon && (() => {
                  const cartBase = subtotal + tax
                  const usable = availableCoupons.filter((c: any) => cartBase >= Number(c.min_order || 0))
                  const locked = availableCoupons.filter((c: any) => cartBase < Number(c.min_order || 0))
                  return (
                    <>
                      {usable.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 8 }}>
                          {usable.map((c: any) => (
                            <TouchableOpacity key={c.id} onPress={() => { setCouponInput(c.code); setCouponError('') }} style={ss.couponChip}>
                              <Text style={ss.couponChipCode}>{c.code}</Text>
                              <Text style={ss.couponChipVal}>{c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}</Text>
                              {c.valid_to && <Text style={ss.couponChipExpiry}>Till {new Date(c.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                      {locked.map((c: any) => {
                        const need = (Number(c.min_order) - cartBase).toFixed(2)
                        return (
                          <View key={c.id} style={ss.couponLocked}>
                            <Text style={ss.couponLockedCode}>🔒 {c.code}</Text>
                            <Text style={ss.couponLockedHint}>Add ₹{need} more · {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}</Text>
                          </View>
                        )
                      })}
                    </>
                  )
                })()}

                {appliedCoupon ? (
                  <View style={ss.couponApplied}>
                    <View style={{ flex: 1 }}>
                      <Text style={ss.couponAppliedCode}>✓ {appliedCoupon.code} applied</Text>
                      <Text style={ss.couponAppliedSave}>You save ₹{appliedCoupon.discount.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity onPress={removeCoupon} style={ss.couponRemoveBtn}>
                      <Text style={ss.couponRemoveText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={ss.couponRow}>
                    <TextInput
                      style={ss.couponInput}
                      value={couponInput}
                      onChangeText={t => { setCouponInput(t.toUpperCase()); setCouponError('') }}
                      placeholder="Enter coupon code"
                      placeholderTextColor={Colors.textDim}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity onPress={applyCoupon} disabled={couponApplying || !couponInput.trim()} style={ss.couponApplyBtn}>
                      {couponApplying
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={ss.couponApplyText}>Apply</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
                {couponError ? <Text style={ss.couponError}>⚠ {couponError}</Text> : null}
              </Animated.View>

              {/* ── WALLET CREDIT ── */}
              {walletBalance > 0 && (
                <View style={{ backgroundColor: '#f5f0ff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#c4b5fd' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16 }}>💳</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#4c1d95' }}>Wallet: ₹{walletBalance.toFixed(2)}</Text>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: '#6d28d9' }}>
                          {walletApplied ? `₹${walletDiscount.toFixed(2)} applied` : 'Use credits to reduce bill'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (walletApplied) { setWalletApplied(false); setWalletDiscount(0) }
                        else { const use = Math.min(walletBalance, total); setWalletDiscount(use); setWalletApplied(true) }
                      }}
                      style={{ backgroundColor: walletApplied ? '#fee2e2' : '#7c3aed', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}
                    >
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: walletApplied ? '#dc2626' : '#fff' }}>
                        {walletApplied ? 'Remove' : 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── LOYALTY POINTS ── */}
              {loyaltyBalance > 0 && (
                <View style={{ backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#fcd34d' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#d97706', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16 }}>⭐</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#78350f' }}>{loyaltyBalance} Points = ₹{(loyaltyBalance * 0.1).toFixed(2)}</Text>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: '#92400e' }}>
                          {loyaltyApplied ? `₹${loyaltyDiscount.toFixed(2)} discount applied` : '1 point = ₹0.10'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (loyaltyApplied) { setLoyaltyApplied(false); setLoyaltyDiscount(0) }
                        else { const max = loyaltyBalance * 0.1; const use = Math.min(max, total); setLoyaltyDiscount(+use.toFixed(2)); setLoyaltyApplied(true) }
                      }}
                      style={{ backgroundColor: loyaltyApplied ? '#fee2e2' : '#d97706', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}
                    >
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: loyaltyApplied ? '#dc2626' : '#fff' }}>
                        {loyaltyApplied ? 'Remove' : 'Redeem'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Price breakdown */}
              <LinearGradient colors={['#0d120d', '#111711']} style={[ss.finalBox, { marginBottom: 12 }]}>
                <Text style={[ss.couponTitle, { color: 'rgba(255,255,255,0.6)', marginBottom: 10 }]}>Price Breakdown</Text>
                <SummaryRow label="Subtotal" val={`₹${subtotal}`} />
                {tax > 0 && <SummaryRow label="GST" val={`+₹${tax.toFixed(2)}`} />}
                {delivery === 0
                  ? <SummaryRow label="Delivery" val="FREE ✓" valColor="#6ee7b7" />
                  : <SummaryRow label="Delivery" val={`+₹${delivery}`} />}
                {platformFee > 0 && <SummaryRow label="Platform Fee" val={`+₹${platformFee}`} />}
                {discount > 0 && <SummaryRow label="Coupon Discount" val={`-₹${discount.toFixed(2)}`} valColor="#6ee7b7" />}
                {walletDiscount > 0 && <SummaryRow label="💳 Wallet Credit" val={`-₹${walletDiscount.toFixed(2)}`} valColor="#6ee7b7" />}
                {loyaltyDiscount > 0 && <SummaryRow label="⭐ Loyalty Points" val={`-₹${loyaltyDiscount.toFixed(2)}`} valColor="#6ee7b7" />}
                <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={ss.finalLabel}>Total to Pay</Text>
                  <Text style={ss.finalAmount}>₹{total.toFixed(2)}</Text>
                </View>
              </LinearGradient>

              <TouchableOpacity
                onPress={placeOrder}
                disabled={processing}
                style={{ borderRadius: 16, overflow: 'hidden', marginTop: 4 }}
              >
                <LinearGradient
                  colors={payMethod === 'cod' ? [Colors.forest, Colors.moss] : [Colors.gold, '#a07830']}
                  style={ss.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {processing
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={ss.nextBtnText}>
                      {payMethod === 'cod' ? '📦  Place Order' : '🔒  Pay ₹' + total.toFixed(0) + ' Securely'}
                    </Text>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <Text style={ss.secureNote}>
                🔒 Your payment is secured with 256-bit SSL encryption
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const ss = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 22 },
  headerSub: { color: 'rgba(255,255,255,0.45)', fontFamily: Fonts.regular, fontSize: 11, marginTop: 2 },
  stepPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 16 },
  stepPillText: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.bold, fontSize: 11 },

  stepTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 16 },

  noAddrBox: { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', marginBottom: 20, borderWidth: 0.5, borderColor: Colors.border },
  noAddrTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest },
  noAddrSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, marginTop: 4, textAlign: 'center' },

  addrCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm },
  addrCardActive: { borderColor: Colors.forest, backgroundColor: '#f0f9f4' },
  addrRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textDim, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addrRadioActive: { borderColor: Colors.forest },
  addrRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.forest },
  defaultBadge: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 5 },
  defaultBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage },
  addrStreet: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 19 },
  addrLine: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 18 },
  selectedMark: { justifyContent: 'center' },

  summaryCard: { borderRadius: 20, padding: 18, marginBottom: 16 },
  summaryCardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', marginBottom: 14, letterSpacing: 0.3 },
  summaryItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  summaryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.gold },
  summaryItemName: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  summaryItemQty: { fontFamily: Fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  summaryItemPrice: { fontFamily: Fonts.bold, fontSize: 12, color: '#fff' },
  summaryDivider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 },

  nextBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', minHeight: 54 },
  nextBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },

  addrChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.mint, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: '#bbf7d0' },
  addrChipText: { flex: 1, fontFamily: Fonts.medium, fontSize: 12, color: Colors.forest },
  addrChipEdit: { backgroundColor: Colors.forest, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  addrChipEditText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 11 },

  payOption: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm },
  payOptionActive: { borderColor: Colors.forest, backgroundColor: '#f0f9f4' },
  payRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textDim, alignItems: 'center', justifyContent: 'center' },
  payRadioActive: { borderColor: Colors.forest },
  payRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.forest },
  payTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  paySub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 3 },
  payBadge: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  payBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage },

  finalBox: { borderRadius: 20, padding: 18, marginBottom: 16 },
  finalLabel: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.medium, fontSize: 13 },
  finalAmount: { color: Colors.gold, fontFamily: Fonts.displayBold, fontSize: 30 },
  finalBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  finalBadgeText: { color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.regular, fontSize: 10 },
  secureNote: { textAlign: 'center', marginTop: 14, fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim },

  couponBox: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  couponTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 10 },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#f5f9f6', borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontFamily: Fonts.medium, fontSize: 13, color: Colors.forest, letterSpacing: 1 },
  couponApplyBtn: { backgroundColor: Colors.forest, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', height: 44 },
  couponApplyText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.gold },
  couponError: { fontFamily: Fonts.regular, fontSize: 11, color: '#dc2626', marginTop: 8 },
  couponApplied: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, gap: 10 },
  couponAppliedCode: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },
  couponAppliedSave: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.sage, marginTop: 2 },
  couponRemoveBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  couponRemoveText: { fontFamily: Fonts.bold, fontSize: 11, color: '#dc2626' },
  couponChip: { backgroundColor: Colors.mint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  couponChipCode: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, letterSpacing: 1 },
  couponChipVal: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.sage, marginTop: 2 },
  couponChipExpiry: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textDim, marginTop: 1 },
  couponLocked: { backgroundColor: '#fffbeb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#fcd34d', borderStyle: 'dashed', marginBottom: 6 },
  couponLockedCode: { fontFamily: Fonts.bold, fontSize: 12, color: '#92400e', letterSpacing: 0.5 },
  couponLockedHint: { fontFamily: Fonts.regular, fontSize: 10, color: '#b45309', marginTop: 2 },
})
