import React, { useCallback, useEffect, useRef, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import {
  Alert, Clipboard, Modal, Pressable, ScrollView, Share, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useStore } from '../../store'
import { Colors, Fonts, Shadows } from '../../constants/theme'

interface Order {
  id: number; invoice_no?: string; status: number; total_amount: string
  created_at: string
  items: { name: string; quantity: number; price: string; image?: string }[]
}
interface Address {
  id: number; street: string; city: string; state: string; pincode: string
  type?: string; is_default?: boolean; email?: string
}

const ORDER_STATUS: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
  0: { label: 'Pending',          color: '#92400e', bg: '#fffbeb', emoji: '🕐' },
  1: { label: 'Confirmed',        color: '#1d4ed8', bg: '#eff6ff', emoji: '✅' },
  2: { label: 'Processing',       color: '#6d28d9', bg: '#f5f3ff', emoji: '⚙️' },
  3: { label: 'Shipped',          color: '#0e7490', bg: '#ecfeff', emoji: '📦' },
  4: { label: 'Out for Delivery', color: '#c2410c', bg: '#fff7ed', emoji: '🚚' },
  5: { label: 'Delivered',        color: '#065f46', bg: '#ecfdf5', emoji: '🎉' },
  6: { label: 'Cancelled',        color: '#991b1b', bg: '#fef2f2', emoji: '❌' },
  7: { label: 'Return Requested', color: '#92400e', bg: '#fffbeb', emoji: '↩️' },
  8: { label: 'Refund',           color: '#6d28d9', bg: '#f5f3ff', emoji: '💰' },
  9: { label: 'Refunded',         color: '#065f46', bg: '#ecfdf5', emoji: '✔️' },
}

const TABS = ['Profile', 'Orders', 'Addresses']

// ─── NOT LOGGED IN ────────────────────────────────────────────────────────────
function NotLoggedIn() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 }}>
      <LinearGradient colors={[Colors.mint, '#fff']} style={nl.orb}>
        <Text style={{ fontSize: 52 }}>👤</Text>
      </LinearGradient>
      <Text style={nl.title}>Sign in to your account</Text>
      <Text style={nl.sub}>Access orders, wishlist, addresses and more</Text>
      <TouchableOpacity onPress={() => router.push('/auth')} style={{ borderRadius: 16, overflow: 'hidden', marginTop: 24, width: '100%' }}>
        <LinearGradient colors={[Colors.forest, Colors.moss]} style={nl.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={nl.btnText}>🌿  Sign In / Register</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/')} style={{ marginTop: 14 }}>
        <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim }}>← Browse as guest</Text>
      </TouchableOpacity>
    </View>
  )
}

const nl = StyleSheet.create({
  orb: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: '#bbf7d0' },
  title: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.forest, marginBottom: 8, textAlign: 'center' },
  sub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 21 },
  btn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
})

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
function OrderCard({ order, index }: { order: Order; index: number }) {
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS[0]
  return (
    <TouchableOpacity
      onPress={() => router.push(`/order/${order.id}` as any)}
      activeOpacity={0.88}
    >
      <Animated.View entering={FadeInDown.delay(index * 70)} style={oc.card}>
        <View style={oc.header}>
          <View>
            <Text style={oc.orderNo}>#{order.invoice_no || `ORD-${order.id}`}</Text>
            <Text style={oc.date}>
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={[oc.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '33' }]}>
            <Text style={{ fontSize: 12 }}>{status.emoji}</Text>
            <Text style={[oc.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={oc.divider} />

        {order.items.slice(0, 2).map((item, j) => (
          <View key={j} style={oc.itemRow}>
            <View style={oc.itemDot} />
            <Text style={oc.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={oc.itemQty}>×{item.quantity}</Text>
            <Text style={oc.itemPrice}>₹{item.price}</Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text style={oc.moreItems}>+{order.items.length - 2} more items</Text>
        )}

        <View style={oc.footer}>
          <Text style={oc.totalLabel}>Total Paid</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={oc.total}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
            <Text style={{ color: Colors.textDim, fontSize: 16 }}>›</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

const oc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  orderNo: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  date: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5 },
  statusText: { fontFamily: Fonts.bold, fontSize: 10 },
  divider: { height: 0.5, backgroundColor: Colors.border, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  itemDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.sage },
  itemName: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.forest },
  itemQty: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  itemPrice: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest },
  moreItems: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, paddingLeft: 13, paddingTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: Colors.border },
  totalLabel: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  total: { fontFamily: Fonts.displayBold, fontSize: 20, color: Colors.forest },
})

// ─── FIELD ────────────────────────────────────────────────────────────────────
function ModalField({ label, ...props }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={mf.label}>{label}</Text>
      <TextInput style={mf.input} placeholderTextColor={Colors.textDim} autoCapitalize="none" {...props} />
    </View>
  )
}
const mf = StyleSheet.create({
  label: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 14, color: Colors.forest, borderWidth: 0.5, borderColor: Colors.border },
})

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const user = useStore(s => s.user)
  const cartCount = useStore(s => s.cartCount)
  const { setUser, setCartData } = useStore()
  const params = useLocalSearchParams<{ tab?: string }>()

  const [activeTab, setActiveTab] = useState(() => {
    const requested = params.tab
    return TABS.includes(requested as string) ? (requested as string) : 'Profile'
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Edit Profile modal
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Change Password modal
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPwd, setSavingPwd] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // Add Address modal
  const [showAddAddr, setShowAddAddr] = useState(false)
  const [addrForm, setAddrForm] = useState({ street: '', city: '', state: '', pincode: '', type: 'Home', email: '' })
  const [savingAddr, setSavingAddr] = useState(false)

  // Edit Address modal
  const [editingAddr, setEditingAddr] = useState<Address | null>(null)
  const [editAddrForm, setEditAddrForm] = useState({ street: '', city: '', state: '', pincode: '', type: 'Home', email: '' })
  const [savingEditAddr, setSavingEditAddr] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!user) return
    fetchOrders()
    fetchAddresses()
    api.get('/users/me').then(res => {
      const fullUser = res.data?.user
      if (fullUser) {
        setUser(fullUser)
        AsyncStorage.setItem('stored_user', JSON.stringify(fullUser)).catch(() => {})
      }
    }).catch(() => {})
  }, [user?.id]))

  useEffect(() => {
    if (!user) return
    if (activeTab === 'Orders') fetchOrders()
    if (activeTab === 'Addresses') fetchAddresses()
  }, [activeTab])

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name, email: user.email, phone: user.phone || '' })
      setAddrForm(p => ({ ...p, email: p.email || user.email }))
    }
  }, [user])

  const fetchOrders = async () => {
    setLoading(true)
    try { const res = await api.get('/orders/my-orders'); setOrders(res.data?.data || []) }
    catch { }
    finally { setLoading(false) }
  }

  const fetchAddresses = async () => {
    setLoading(true)
    try { const res = await api.get('/users/address'); setAddresses(res.data?.data || []) }
    catch { }
    finally { setLoading(false) }
  }

  const saveProfile = async () => {
    if (!editForm.name || !editForm.email) { Alert.alert('Required', 'Name and email are required'); return }
    setSavingProfile(true)
    try {
      const res = await api.put('/users/profile', editForm)
      // Use server-returned data so store reflects what backend actually saved
      const updated = res.data?.user || res.data
      const merged = { ...user!, name: updated?.name || editForm.name, email: updated?.email || editForm.email, phone: updated?.phone || editForm.phone || '' }
      setUser(merged)
      await AsyncStorage.setItem('stored_user', JSON.stringify(merged))
      setShowEditProfile(false)
      Alert.alert('Updated', 'Profile updated successfully')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  const changePassword = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword) { Alert.alert('Required', 'Fill all fields'); return }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match'); return }
    if (pwdForm.newPassword.length < 6) { Alert.alert('Too Short', 'Password must be at least 6 characters'); return }
    setSavingPwd(true)
    try {
      await api.put('/users/change-password', { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
      setShowChangePwd(false)
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      Alert.alert('Success', 'Password changed successfully')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to change password')
    } finally { setSavingPwd(false) }
  }

  const addAddress = async () => {
    if (!addrForm.street || !addrForm.city || !addrForm.state || !addrForm.pincode) {
      Alert.alert('Required', 'Please fill all fields'); return
    }
    setSavingAddr(true)
    try {
      await api.post('/users/address', addrForm)
      setShowAddAddr(false)
      setAddrForm({ street: '', city: '', state: '', pincode: '', type: 'Home' })
      fetchAddresses()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save address')
    } finally { setSavingAddr(false) }
  }

  const openEditAddr = (addr: Address) => {
    setEditingAddr(addr)
    setEditAddrForm({ street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, type: addr.type || 'Home', email: user?.email || '' })
  }

  const saveEditAddr = async () => {
    if (!editingAddr) return
    if (!editAddrForm.street || !editAddrForm.city || !editAddrForm.state || !editAddrForm.pincode) {
      Alert.alert('Required', 'Please fill all fields'); return
    }
    setSavingEditAddr(true)
    try {
      await api.put(`/users/address/${editingAddr.id}`, editAddrForm)
      setEditingAddr(null)
      fetchAddresses()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update address')
    } finally { setSavingEditAddr(false) }
  }

  const setDefaultAddress = async (id: number) => {
    try {
      await api.put(`/users/address/default/${id}`)
      fetchAddresses()
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to set default')
    }
  }

  const deleteAddress = (id: number) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/users/address/${id}`); fetchAddresses() } catch { }
        },
      },
    ])
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true)
          try { await api.post('/users/logout') } catch { }
          await AsyncStorage.removeItem('auth_token')
          await AsyncStorage.removeItem('user')
          await AsyncStorage.removeItem('stored_user')
          setCartData({ items: [], subtotal: 0, totalItems: 0 })
          // Navigate FIRST before clearing user to avoid showing NotLoggedIn briefly
          router.replace('/')
          setUser(null)
          setLoggingOut(false)
        },
      },
    ])
  }

  if (!user) return <NotLoggedIn />

  const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const completionItems = [!!user.name, !!user.email, !!user.phone, user.is_verified]
  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f0' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0a1f14', Colors.forest]} style={[ss.header, { paddingTop: insets.top + 8 }]}>
        <View style={ss.headerBlob} />

        <Animated.View entering={FadeIn.delay(100)} style={ss.avatarRow}>
          <LinearGradient colors={[Colors.sage, Colors.gold]} style={ss.avatar}>
            <Text style={ss.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={ss.userName}>{user.name}</Text>
            <Text style={ss.userEmail}>{user.email}</Text>
            {user.phone && <Text style={ss.userPhone}>📱 {user.phone}</Text>}
            {user.is_verified && (
              <View style={ss.verifiedBadge}>
                <Text style={ss.verifiedText}>✓ Verified Account</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/cart')} style={ss.cartIcon}>
            <Text style={{ fontSize: 20 }}>🛍️</Text>
            {cartCount > 0 && (
              <View style={ss.cartBadge}>
                <Text style={{ fontSize: 8, fontFamily: Fonts.bold, color: Colors.forest }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Completion Bar */}
        {completion < 100 && (
          <Animated.View entering={FadeInDown.delay(130)} style={ss.completionBar}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={ss.completionLabel}>Profile Completion</Text>
              <Text style={ss.completionPct}>{completion}%</Text>
            </View>
            <View style={ss.progressTrack}>
              <View style={[ss.progressFill, { width: `${completion}%` as any }]} />
            </View>
          </Animated.View>
        )}

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(150)} style={ss.statsRow}>
          {[
            { label: 'Orders', val: orders.length > 0 ? String(orders.length) : '—', emoji: '📦' },
            { label: 'Addresses', val: addresses.length > 0 ? String(addresses.length) : '—', emoji: '📍' },
            { label: 'Wishlist', val: '❤️', emoji: '' },
          ].map((s, i) => (
            <View key={i} style={ss.statItem}>
              <Text style={ss.statVal}>{s.emoji ? s.emoji + ' ' : ''}{s.val}</Text>
              <Text style={ss.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Tab bar */}
        <View style={ss.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[ss.tab, activeTab === t && ss.tabActive]}>
              <Text style={[ss.tabText, activeTab === t && ss.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>

        {/* ── PROFILE ── */}
        {activeTab === 'Profile' && (
          <Animated.View entering={FadeInDown.duration(350)} style={ss.tabContent}>
            <View style={ss.section}>
              {[
                { emoji: '👤', label: 'Full Name', value: user.name },
                { emoji: '📧', label: 'Email', value: user.email },
                { emoji: '📱', label: 'Phone', value: user.phone || 'Not set' },
                { emoji: '🔐', label: 'Account Status', value: user.is_verified ? '✓ Verified' : '⚠ Not Verified' },
              ].map((row, i) => (
                <Animated.View key={i} entering={FadeInRight.delay(i * 60)} style={ss.infoRow}>
                  <View style={ss.infoIconWrap}>
                    <Text style={{ fontSize: 18 }}>{row.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.infoLabel}>{row.label}</Text>
                    <Text style={ss.infoValue}>{row.value}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Edit Profile & Change Password */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setShowEditProfile(true)}
                style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}
              >
                <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.halfBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={ss.halfBtnText}>✏️  Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowChangePwd(true)}
                style={[ss.halfBtnOutline, { flex: 1 }]}
              >
                <Text style={ss.halfBtnOutlineText}>🔒  Change Password</Text>
              </TouchableOpacity>
            </View>

            <Text style={ss.sectionTitle}>Quick Access</Text>
            <View style={ss.section}>
              {[
                { emoji: '📦', label: 'My Orders', sub: 'Track & manage orders', onPress: () => setActiveTab('Orders') },
                { emoji: '❤️', label: 'My Wishlist', sub: 'Saved products', onPress: () => router.push('/wishlist') },
                { emoji: '🛍️', label: 'My Cart', sub: `${cartCount} items`, onPress: () => router.push('/cart') },
                { emoji: '💳', label: 'My Wallet', sub: 'Balance & transactions', onPress: () => router.push('/account/wallet' as any) },
                { emoji: '🔔', label: 'Notifications', sub: 'Order updates & alerts', onPress: () => router.push('/account/notifications' as any) },
                { emoji: '📍', label: 'Manage Addresses', sub: 'Delivery addresses', onPress: () => setActiveTab('Addresses') },
                { emoji: '💬', label: 'Support', sub: 'Raise a ticket or enquiry', onPress: () => router.push('/support' as any) },
              ].map((l, i) => (
                <TouchableOpacity key={i} onPress={l.onPress} style={ss.linkRow} activeOpacity={0.7}>
                  <View style={ss.linkIconWrap}>
                    <Text style={{ fontSize: 20 }}>{l.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.linkLabel}>{l.label}</Text>
                    <Text style={ss.linkSub}>{l.sub}</Text>
                  </View>
                  <Text style={{ color: Colors.textDim, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Referral Code Card */}
            {(user as any)?.referral_code && (
              <View style={{ backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>🎁 Your Referral Code</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, marginBottom: 10 }}>Share with friends — they get a discount and you earn wallet credits.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#d1fae5' }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest, letterSpacing: 2, textAlign: 'center' }}>{(user as any).referral_code}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { Clipboard.setString((user as any).referral_code); Alert.alert('Copied!', 'Referral code copied to clipboard.') }}
                    style={{ backgroundColor: Colors.forest, borderRadius: 10, padding: 10 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.bold }}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Share.share({ message: `Use my code ${(user as any).referral_code} on AyurVeda Desi Foods to get a discount on your first order!` })}
                    style={{ backgroundColor: Colors.sage, borderRadius: 10, padding: 10 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.bold }}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity onPress={handleLogout} disabled={loggingOut} style={ss.logoutBtn}>
              <Text style={ss.logoutText}>{loggingOut ? 'Logging out...' : '🚪  Sign Out'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'Orders' && (
          <Animated.View entering={FadeInDown.duration(350)} style={ss.tabContent}>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>📦</Text>
                <Text style={{ fontFamily: Fonts.medium, color: Colors.textDim, fontSize: 13 }}>Loading orders...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={ss.emptyState}>
                <Text style={{ fontSize: 52, marginBottom: 14 }}>📦</Text>
                <Text style={ss.emptyTitle}>No orders yet</Text>
                <Text style={ss.emptySub}>Your orders will appear here once you place one</Text>
                <TouchableOpacity onPress={() => router.push('/products')} style={{ marginTop: 22, borderRadius: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ paddingHorizontal: 30, paddingVertical: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 14 }}>🌿  Shop Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : orders.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)
            }
          </Animated.View>
        )}

        {/* ── ADDRESSES ── */}
        {activeTab === 'Addresses' && (
          <Animated.View entering={FadeInDown.duration(350)} style={ss.tabContent}>
            <TouchableOpacity onPress={() => setShowAddAddr(true)} style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
              <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.addAddrBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={{ fontSize: 18, color: '#fff' }}>+</Text>
                <Text style={ss.addAddrText}>Add New Address</Text>
              </LinearGradient>
            </TouchableOpacity>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontFamily: Fonts.medium, color: Colors.textDim }}>Loading...</Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={ss.emptyState}>
                <Text style={{ fontSize: 52, marginBottom: 14 }}>📍</Text>
                <Text style={ss.emptyTitle}>No saved addresses</Text>
                <Text style={ss.emptySub}>Add your first delivery address</Text>
              </View>
            ) : addresses.map((addr, i) => (
              <Animated.View key={addr.id} entering={FadeInDown.delay(i * 70)} style={ss.addrCard}>
                <View style={ss.addrIconWrap}>
                  <Text style={{ fontSize: 20 }}>{addr.type === 'Work' ? '🏢' : '🏠'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {addr.is_default && (
                      <View style={ss.defaultBadge}><Text style={ss.defaultBadgeText}>⭐ Default</Text></View>
                    )}
                    {addr.type && (
                      <View style={ss.typeBadge}><Text style={ss.typeBadgeText}>{addr.type}</Text></View>
                    )}
                  </View>
                  <Text style={ss.addrStreet}>{addr.street}</Text>
                  <Text style={ss.addrLine}>{addr.city}, {addr.state} — {addr.pincode}</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity onPress={() => openEditAddr(addr)} style={ss.addrActionBtn}>
                    <Text style={{ fontSize: 14 }}>✏️</Text>
                  </TouchableOpacity>
                  {!addr.is_default && (
                    <TouchableOpacity onPress={() => setDefaultAddress(addr.id)} style={[ss.addrActionBtn, { backgroundColor: Colors.mint }]}>
                      <Text style={{ fontSize: 12, color: Colors.sage, fontFamily: Fonts.bold }}>★</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => deleteAddress(addr.id)} style={[ss.addrActionBtn, { backgroundColor: '#fef2f2' }]}>
                    <Text style={{ fontSize: 14 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={showEditProfile} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={ms.bg} onPress={() => setShowEditProfile(false)} />
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={ms.handle} />
          <Text style={ms.title}>Edit Profile</Text>
          <ModalField label="Full Name" placeholder="Your full name" value={editForm.name} onChangeText={(t: string) => setEditForm(p => ({ ...p, name: t }))} />
          <ModalField label="Email Address" placeholder="you@example.com" value={editForm.email} keyboardType="email-address" onChangeText={(t: string) => setEditForm(p => ({ ...p, email: t }))} />
          <ModalField label="Phone Number" placeholder="+91 98765 43210" value={editForm.phone} keyboardType="phone-pad" onChangeText={(t: string) => setEditForm(p => ({ ...p, phone: t }))} />
          <TouchableOpacity onPress={saveProfile} disabled={savingProfile} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={ms.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={ms.confirmText}>{savingProfile ? 'Saving...' : '✓  Save Changes'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal visible={showChangePwd} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={ms.bg} onPress={() => setShowChangePwd(false)} />
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={ms.handle} />
          <Text style={ms.title}>Change Password</Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={mf.label}>Current Password</Text>
            <View style={ms.pwdRow}>
              <TextInput
                style={[mf.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Current password"
                placeholderTextColor={Colors.textDim}
                secureTextEntry={!showOld}
                value={pwdForm.oldPassword}
                onChangeText={t => setPwdForm(p => ({ ...p, oldPassword: t }))}
              />
              <TouchableOpacity onPress={() => setShowOld(s => !s)} style={ms.eyeBtn}>
                <Text style={{ fontSize: 16 }}>{showOld ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={mf.label}>New Password</Text>
            <View style={ms.pwdRow}>
              <TextInput
                style={[mf.input, { flex: 1, marginBottom: 0 }]}
                placeholder="New password (min 6 chars)"
                placeholderTextColor={Colors.textDim}
                secureTextEntry={!showNew}
                value={pwdForm.newPassword}
                onChangeText={t => setPwdForm(p => ({ ...p, newPassword: t }))}
              />
              <TouchableOpacity onPress={() => setShowNew(s => !s)} style={ms.eyeBtn}>
                <Text style={{ fontSize: 16 }}>{showNew ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ModalField label="Confirm New Password" placeholder="Repeat new password" secureTextEntry value={pwdForm.confirmPassword} onChangeText={(t: string) => setPwdForm(p => ({ ...p, confirmPassword: t }))} />
          <TouchableOpacity onPress={changePassword} disabled={savingPwd} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={ms.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={ms.confirmText}>{savingPwd ? 'Updating...' : '🔒  Update Password'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── ADD ADDRESS MODAL ── */}
      <Modal visible={showAddAddr} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={ms.bg} onPress={() => setShowAddAddr(false)} />
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={ms.handle} />
          <Text style={ms.title}>Add Delivery Address</Text>

          <Text style={mf.label}>Address Type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {['Home', 'Work', 'Other'].map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setAddrForm(p => ({ ...p, type: t }))}
                style={[ms.typePill, addrForm.type === t && ms.typePillActive]}
              >
                <Text style={[ms.typePillText, addrForm.type === t && ms.typePillTextActive]}>
                  {t === 'Home' ? '🏠' : t === 'Work' ? '🏢' : '📌'} {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {[
            { label: 'Street / House No.', key: 'street', placeholder: '12A, MG Road', multi: true },
            { label: 'City', key: 'city', placeholder: 'Mumbai' },
            { label: 'State', key: 'state', placeholder: 'Maharashtra' },
            { label: 'PIN Code', key: 'pincode', placeholder: '400001', keyboard: 'numeric' },
          ].map(f => (
            <View key={f.key} style={{ marginBottom: 12 }}>
              <Text style={mf.label}>{f.label}</Text>
              <TextInput
                style={[mf.input, (f as any).multi && { height: 64, textAlignVertical: 'top' }]}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textDim}
                value={(addrForm as any)[f.key]}
                onChangeText={t => setAddrForm(prev => ({ ...prev, [f.key]: t }))}
                keyboardType={(f as any).keyboard || 'default'}
                multiline={(f as any).multi}
                autoCapitalize="none"
              />
            </View>
          ))}

          <TouchableOpacity onPress={addAddress} disabled={savingAddr} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 4 }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={ms.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={ms.confirmText}>{savingAddr ? 'Saving...' : '✓  Save Address'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── EDIT ADDRESS MODAL ── */}
      <Modal visible={!!editingAddr} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={ms.bg} onPress={() => setEditingAddr(null)} />
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={ms.handle} />
          <Text style={ms.title}>Edit Address</Text>

          <Text style={mf.label}>Address Type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {['Home', 'Work', 'Other'].map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setEditAddrForm(p => ({ ...p, type: t }))}
                style={[ms.typePill, editAddrForm.type === t && ms.typePillActive]}
              >
                <Text style={[ms.typePillText, editAddrForm.type === t && ms.typePillTextActive]}>
                  {t === 'Home' ? '🏠' : t === 'Work' ? '🏢' : '📌'} {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {[
            { label: 'Street / House No.', key: 'street', placeholder: '12A, MG Road', multi: true },
            { label: 'City', key: 'city', placeholder: 'Mumbai' },
            { label: 'State', key: 'state', placeholder: 'Maharashtra' },
            { label: 'PIN Code', key: 'pincode', placeholder: '400001', keyboard: 'numeric' },
          ].map(f => (
            <View key={f.key} style={{ marginBottom: 12 }}>
              <Text style={mf.label}>{f.label}</Text>
              <TextInput
                style={[mf.input, (f as any).multi && { height: 64, textAlignVertical: 'top' }]}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textDim}
                value={(editAddrForm as any)[f.key]}
                onChangeText={t => setEditAddrForm(prev => ({ ...prev, [f.key]: t }))}
                keyboardType={(f as any).keyboard || 'default'}
                multiline={(f as any).multi}
                autoCapitalize="none"
              />
            </View>
          ))}

          <TouchableOpacity onPress={saveEditAddr} disabled={savingEditAddr} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 4 }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={ms.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={ms.confirmText}>{savingEditAddr ? 'Saving...' : '✓  Update Address'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
      <BottomNav active="/account" />
    </View>
  )
}

const ss = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 0, overflow: 'hidden', position: 'relative' },
  headerBlob: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.08)' },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 22 },
  userName: { color: '#fff', fontFamily: Fonts.bold, fontSize: 17 },
  userEmail: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.regular, fontSize: 12, marginTop: 2 },
  userPhone: { color: 'rgba(255,255,255,0.45)', fontFamily: Fonts.regular, fontSize: 11, marginTop: 2 },
  verifiedBadge: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  verifiedText: { color: '#6ee7b7', fontFamily: Fonts.bold, fontSize: 9 },
  cartIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: Colors.gold, borderRadius: 8, width: 15, height: 15, alignItems: 'center', justifyContent: 'center' },

  completionBar: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, marginBottom: 14 },
  completionLabel: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  completionPct: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 11 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: Colors.gold, borderRadius: 2 },

  statsRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginBottom: 18 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { color: '#fff', fontFamily: Fonts.bold, fontSize: 16 },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontFamily: Fonts.regular, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 13, padding: 4, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.medium, fontSize: 13 },
  tabTextActive: { color: Colors.forest, fontFamily: Fonts.bold },

  tabContent: { padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textDim, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  infoIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },

  halfBtn: { paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  halfBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 13 },
  halfBtnOutline: { paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  halfBtnOutlineText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  linkIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  linkSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 1 },

  logoutBtn: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5', marginTop: 4 },
  logoutText: { color: Colors.red, fontFamily: Fonts.bold, fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 44 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },

  addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  addAddrText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  addrCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: Colors.border, gap: 12, ...Shadows.sm },
  addrIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  defaultBadge: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage },
  typeBadge: { backgroundColor: '#f0f4f0', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textDim },
  addrStreet: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 19, marginTop: 4 },
  addrLine: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 18 },
  addrActionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f0f4f0', alignItems: 'center', justifyContent: 'center' },
})

const ms = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: Colors.cream, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.14)', alignSelf: 'center', marginBottom: 18 },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 20 },
  confirmBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 0, backgroundColor: '#fff', borderRadius: 13, borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden' },
  eyeBtn: { paddingHorizontal: 12 },
  typePill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  typePillActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  typePillText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  typePillTextActive: { color: '#fff', fontFamily: Fonts.bold },
})
