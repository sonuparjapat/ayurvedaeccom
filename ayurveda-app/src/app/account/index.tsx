import React, { useCallback, useEffect, useRef, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { toast } from '../../components/ui/Toast'
import Animated, { FadeIn, FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useStore } from '../../store'
import { Colors, Fonts, Shadows } from '../../constants/theme'

let SecureStore: any = null
try { SecureStore = require('expo-secure-store') } catch {}

interface Order {
  id: number; invoice_no?: string; status: number; total_amount: string
  created_at: string; delivered_at?: string; return_window_days?: number; is_returnable?: boolean
  tracking_number?: string; courier_name?: string; tracking_url?: string
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
// console.log("Hii")
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

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skel({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  const op = useSharedValue(0.45)
  useEffect(() => { op.value = withRepeat(withTiming(1, { duration: 700 }), -1, true) }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: '#d1e8dc' }, style]} />
}

function OrderCardSkeleton() {
  return (
    <View style={[oc.card, { borderLeftWidth: 3, borderLeftColor: '#d1e8dc', gap: 10 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 6 }}><Skel w={110} h={12} /><Skel w={80} h={10} /></View>
        <Skel w={80} h={26} r={20} />
      </View>
      <Skel w={'100%'} h={1} r={0} />
      <View style={{ flexDirection: 'row', gap: 10 }}><Skel w={50} h={50} r={8} /><Skel w={50} h={50} r={8} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skel w={80} h={12} /><Skel w={60} h={30} r={10} />
      </View>
    </View>
  )
}

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
function OrderCard({ order, index }: { order: Order; index: number }) {
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS[0]
  return (
    <TouchableOpacity
      onPress={() => router.push(`/order/${order.id}` as any)}
      activeOpacity={0.88}
    >
      <Animated.View entering={FadeInDown.delay(index * 70)} style={[oc.card, { borderLeftWidth: 3, borderLeftColor: status.color }]}>
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

        {/* Courier info — shown for shipped/out-for-delivery */}
        {(order.status === 3 || order.status === 4) && (order.courier_name || order.tracking_number) && (
          <TouchableOpacity
            onPress={() => { if (order.tracking_url) { const { Linking } = require('react-native'); Linking.openURL(order.tracking_url) } }}
            activeOpacity={order.tracking_url ? 0.7 : 1}
            style={{ backgroundColor: '#ecfeff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, borderWidth: 0.5, borderColor: '#a5f3fc' }}
          >
            <Text style={{ fontSize: 14 }}>🚚</Text>
            <View style={{ flex: 1 }}>
              {order.courier_name ? (
                <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: '#0e7490' }}>{order.courier_name}</Text>
              ) : null}
              {order.tracking_number ? (
                <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: '#0891b2' }}>AWB: {order.tracking_number}</Text>
              ) : null}
            </View>
            {order.tracking_url ? (
              <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: '#0e7490' }}>Track →</Text>
            ) : null}
          </TouchableOpacity>
        )}

        {order.status === 5 && order.delivered_at && order.is_returnable !== false && (() => {
          const returnBy = new Date(new Date(order.delivered_at).getTime() + (order.return_window_days ?? 7) * 86400000)
          const daysLeft = Math.ceil((returnBy.getTime() - Date.now()) / 86400000)
          if (daysLeft > 0) return (
            <View style={{ backgroundColor: '#fff7ed', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 11 }}>↩️</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 10, color: '#c2410c' }}>
                Return by {returnBy.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {daysLeft}d left
              </Text>
            </View>
          )
          return null
        })()}

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
  total: { fontFamily: Fonts.displayBold, fontSize: 20, color: Colors.gold },
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
  const wishlistTotal = useStore(s => s.wishlistData.totalItems ?? s.wishlistData.items.length)
  const { setUser, setCartData } = useStore()
  const params = useLocalSearchParams<{ tab?: string }>()

  const [activeTab, setActiveTab] = useState(() => {
    const requested = params.tab
    return TABS.includes(requested as string) ? (requested as string) : 'Profile'
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersMeta, setOrdersMeta] = useState<{ total: number; pages: number } | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersRefreshing, setOrdersRefreshing] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Edit Profile modal
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

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

  // Location detection (shared for both add & edit modals)
  const [locating, setLocating] = useState(false)

  const detectLocation = async (setForm: (fn: (p: any) => any) => void) => {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow location access to auto-fill your address.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const results = await Location.reverseGeocodeAsync(pos.coords)
      if (results.length > 0) {
        const r = results[0]
        setForm(prev => ({
          ...prev,
          city: r.city || r.subregion || '',
          state: r.region || '',
          pincode: r.postalCode || '',
        }))
      } else {
        Alert.alert('Not Found', 'Could not detect address. Please fill in manually.')
      }
    } catch {
      Alert.alert('Error', 'Failed to get location. Please fill in manually.')
    } finally {
      setLocating(false)
    }
  }

  const [referralStats, setReferralStats] = useState<{
    total: number; rewarded: number; earned: number;
    referrals: { referred_name: string; status: string; created_at: string; reward_amount: number }[]
  } | null>(null)
  const [walletData, setWalletData] = useState<{ balance: number; points: number } | null>(null)

  useFocusEffect(useCallback(() => {
    if (!user) return
    fetchOrders(1)
    fetchAddresses()
    api.get('/users/me').then(res => {
      const fullUser = res.data?.user
      if (fullUser) {
        setUser(fullUser)
        AsyncStorage.setItem('stored_user', JSON.stringify(fullUser)).catch(() => {})
      }
    }).catch(() => {})
    api.get('/users/referral').then(res => {
      if (res.data?.success) setReferralStats(res.data)
    }).catch(() => {})
    api.get('/wallet').then(res => {
      setWalletData({ balance: Number(res.data?.wallet_balance ?? 0), points: Number(res.data?.loyalty_points ?? 0) })
    }).catch(() => {})
  }, [user?.id]))

  useEffect(() => {
    if (!user) return
    if (activeTab === 'Orders') fetchOrders(1)
    if (activeTab === 'Addresses') fetchAddresses()
  }, [activeTab])

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name, email: user.email, phone: user.phone || '' })
      setAddrForm(p => ({ ...p, email: p.email || user.email }))
    }
  }, [user])

  const fetchOrders = async (page = 1) => {
    setOrdersLoading(true)
    try {
      const res = await api.get(`/orders/my-orders?page=${page}&limit=5`)
      setOrders(res.data?.data || [])
      setOrdersMeta(res.data?.meta || null)
      setOrdersPage(page)
    } catch { }
    finally { setOrdersLoading(false) }
  }

  const fetchAddresses = async () => {
    setLoading(true)
    try { const res = await api.get('/users/address'); setAddresses(res.data?.data || []) }
    catch { }
    finally { setLoading(false) }
  }

  const pickAvatar = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync()
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to take a profile photo.')
            return
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
          if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri)
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Photo library access is needed to select a profile picture.')
            return
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
          if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri)
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const saveProfile = async () => {
    if (!editForm.name || !editForm.email) { toast.warning('Name and email are required'); return }
    setSavingProfile(true)
    try {
      let res
      if (avatarUri) {
        const formData = new FormData()
        formData.append('name', editForm.name)
        formData.append('email', editForm.email)
        formData.append('phone', editForm.phone)
        formData.append('avatar', { uri: avatarUri, type: 'image/jpeg', name: 'avatar.jpg' } as any)
        res = await api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        res = await api.put('/users/profile', editForm)
      }
      const updated = res.data?.user || res.data
      const merged = {
        ...user!,
        name: updated?.name || editForm.name,
        email: updated?.email || editForm.email,
        phone: updated?.phone || editForm.phone || '',
        avatar: updated?.avatar || (user as any)?.avatar || null,
      }
      setUser(merged)
      await AsyncStorage.setItem('stored_user', JSON.stringify(merged))
      setAvatarUri(null)
      setShowEditProfile(false)
      toast.success('Profile updated successfully')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  const changePassword = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword) { toast.warning('Fill all fields'); return }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.warning('Passwords do not match'); return }
    if (pwdForm.newPassword.length < 6) { toast.warning('Password must be at least 6 characters'); return }
    setSavingPwd(true)
    try {
      await api.put('/users/change-password', { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
      setShowChangePwd(false)
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to change password')
    } finally { setSavingPwd(false) }
  }

  const addAddress = async () => {
    if (!addrForm.street || !addrForm.city || !addrForm.state || !addrForm.pincode) {
      toast.warning('Please fill all address fields'); return
    }
    setSavingAddr(true)
    // Pre-fill email with logged-in user's email — backend requires it
    const payload = { ...addrForm, email: addrForm.email || user?.email || '' }
    try {
      await api.post('/users/address', payload)
      setShowAddAddr(false)
      setAddrForm(prev => ({ street: '', city: '', state: '', pincode: '', type: 'Home', email: user?.email || '' }))
      fetchAddresses()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save address')
    } finally { setSavingAddr(false) }
  }

  const openEditAddr = (addr: Address) => {
    setEditingAddr(addr)
    setEditAddrForm({ street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, type: addr.type || 'Home', email: user?.email || '' })
  }

  const saveEditAddr = async () => {
    if (!editingAddr) return
    if (!editAddrForm.street || !editAddrForm.city || !editAddrForm.state || !editAddrForm.pincode) {
      toast.warning('Please fill all address fields'); return
    }
    setSavingEditAddr(true)
    try {
      await api.put(`/users/address/${editingAddr.id}`, editAddrForm)
      setEditingAddr(null)
      fetchAddresses()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update address')
    } finally { setSavingEditAddr(false) }
  }

  const setDefaultAddress = async (id: number) => {
    try {
      await api.put(`/users/address/default/${id}`)
      fetchAddresses()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to set default')
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
          await AsyncStorage.removeItem('biometric_enabled')
          if (SecureStore) await SecureStore.deleteItemAsync('biometric_token').catch(() => {})
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
          <TouchableOpacity onPress={() => { setShowEditProfile(true) }} activeOpacity={0.8} style={{ position: 'relative' }}>
            {(user as any)?.avatar ? (
              <Image source={{ uri: (user as any).avatar }} style={ss.avatarImg} />
            ) : (
              <LinearGradient colors={[Colors.sage, Colors.gold]} style={ss.avatar}>
                <Text style={ss.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={ss.avatarEditBadge}>
              <Text style={{ fontSize: 10 }}>📷</Text>
            </View>
          </TouchableOpacity>
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
            { label: 'Orders', val: String(ordersMeta?.total ?? orders.length), emoji: '📦' },
            { label: 'Addresses', val: String(addresses.length || 0), emoji: '📍' },
            { label: 'Wishlist', val: String(wishlistTotal), emoji: '❤️' },
          ].map((s, i) => (
            <View key={i} style={ss.statPill}>
              <Text style={ss.statEmoji}>{s.emoji}</Text>
              <Text style={ss.statNum}>{s.val}</Text>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        refreshControl={
          activeTab === 'Orders'
            ? <RefreshControl
                refreshing={ordersRefreshing}
                onRefresh={async () => { setOrdersRefreshing(true); await fetchOrders(1); setOrdersRefreshing(false) }}
                tintColor={Colors.forest} colors={[Colors.forest]}
              />
            : undefined
        }
      >

        {/* ── PROFILE ── */}
        {activeTab === 'Profile' && (
          <Animated.View entering={FadeInDown.duration(350)} style={ss.tabContent}>
            <View style={ss.section}>
              {[
                { emoji: '👤', label: 'Full Name', value: user.name, gradient: [Colors.forest, Colors.moss] as [string, string] },
                { emoji: '📧', label: 'Email', value: user.email, gradient: ['#0369a1', '#0ea5e9'] as [string, string] },
                { emoji: '📱', label: 'Phone', value: user.phone || 'Not set', gradient: ['#7c3aed', '#8b5cf6'] as [string, string] },
                { emoji: '🔐', label: 'Account Status', value: user.is_verified ? '✓ Verified' : '⚠ Not Verified', gradient: [Colors.gold, '#a07830'] as [string, string] },
              ].map((row, i) => (
                <Animated.View key={i} entering={FadeInRight.delay(i * 60)} style={ss.infoRow}>
                  <LinearGradient colors={row.gradient} style={ss.infoIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={{ fontSize: 18 }}>{row.emoji}</Text>
                  </LinearGradient>
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

            {/* Wallet & Loyalty mini-card */}
            {walletData !== null && (
              <TouchableOpacity onPress={() => router.push('/account/wallet' as any)} activeOpacity={0.87} style={{ marginBottom: 16 }}>
                <LinearGradient colors={['#065f46', '#0f766e']} style={ss.walletCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={ss.walletIconWrap}>
                      <Text style={{ fontSize: 22 }}>💳</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ss.walletLabel}>Wallet Balance</Text>
                      <Text style={ss.walletBalance}>₹{walletData.balance.toFixed(2)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={ss.pointsBadge}>
                        <Text style={{ fontSize: 10 }}>⭐</Text>
                        <Text style={ss.pointsText}>{walletData.points} pts</Text>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: Fonts.medium }}>Loyalty Points</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginLeft: 4 }}>›</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <Text style={ss.sectionTitle}>Quick Access</Text>
            <View style={ss.section}>
              {[
                { emoji: '📦', label: 'My Orders', sub: 'Track & manage orders', onPress: () => setActiveTab('Orders'), gradient: [Colors.forest, Colors.moss] as [string, string] },
                { emoji: '❤️', label: 'My Wishlist', sub: 'Saved products', onPress: () => router.push('/wishlist'), gradient: ['#e11d48', '#be123c'] as [string, string] },
                { emoji: '🛍️', label: 'My Cart', sub: `${cartCount} items`, onPress: () => router.push('/cart'), gradient: ['#7c3aed', '#6d28d9'] as [string, string] },
                { emoji: '💳', label: 'My Wallet', sub: 'Balance & transactions', onPress: () => router.push('/account/wallet' as any), gradient: ['#d97706', '#b45309'] as [string, string] },
                { emoji: '🔔', label: 'Notifications', sub: 'Order updates & alerts', onPress: () => router.push('/account/notifications' as any), gradient: ['#0369a1', '#0e7490'] as [string, string] },
                { emoji: '📍', label: 'Manage Addresses', sub: 'Delivery addresses', onPress: () => setActiveTab('Addresses'), gradient: ['#059669', '#065f46'] as [string, string] },
                { emoji: '🔁', label: 'Subscriptions', sub: 'Manage repeat orders', onPress: () => router.push('/account/subscriptions' as any), gradient: ['#0891b2', '#0e7490'] as [string, string] },
                { emoji: '📖', label: 'Wellness Blog', sub: 'Ayurvedic tips & articles', onPress: () => router.push('/blog' as any), gradient: ['#065f46', '#0f766e'] as [string, string] },
                { emoji: '❓', label: 'FAQ', sub: 'Common questions answered', onPress: () => router.push('/faq' as any), gradient: ['#7c3aed', '#6d28d9'] as [string, string] },
                { emoji: '💬', label: 'Support', sub: 'Raise a ticket or enquiry', onPress: () => router.push('/support' as any), gradient: ['#4f46e5', '#3730a3'] as [string, string] },
                { emoji: '⚙️', label: 'Settings', sub: 'App preferences & security', onPress: () => router.push('/settings' as any), gradient: ['#374151', '#1f2937'] as [string, string] },
              ].map((l, i) => (
                <TouchableOpacity key={i} onPress={l.onPress} style={ss.linkRow} activeOpacity={0.7}>
                  <LinearGradient colors={l.gradient} style={ss.linkIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={{ fontSize: 20 }}>{l.emoji}</Text>
                  </LinearGradient>
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
              <LinearGradient colors={['#0a1f14', '#0d2a1a']} style={{ borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.gold, marginBottom: 4 }}>🎁 Your Referral Code</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Share with friends — they get a discount and you earn ₹50 wallet credits.</Text>

                {/* Code row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.gold, letterSpacing: 2, textAlign: 'center' }}>{(user as any).referral_code}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Share.share({ message: (user as any).referral_code }).then(() => toast.success('Referral code shared!')).catch(() => {}) }
                    style={{ backgroundColor: Colors.forest, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.bold }}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Share.share({ message: `Use my code ${(user as any).referral_code} on Oroganix to get a discount on your first order!` })}
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.bold }}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Stats row */}
                {referralStats && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: referralStats.referrals.length > 0 ? 12 : 0 }}>
                    {[
                      { label: 'Invited', value: String(referralStats.total) },
                      { label: 'Rewarded', value: String(referralStats.rewarded) },
                      { label: 'Earned', value: `₹${referralStats.earned}` },
                    ].map(s => (
                      <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(201,168,76,0.15)' }}>
                        <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.gold }}>{s.value}</Text>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Referral history (last 5) */}
                {referralStats && referralStats.referrals.length > 0 && (
                  <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 10 }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Recent Referrals</Text>
                    {referralStats.referrals.slice(0, 5).map((r, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: i < Math.min(referralStats.referrals.length, 5) - 1 ? 0.5 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 13 }}>{r.status === 'rewarded' ? '✅' : '🕐'}</Text>
                          </View>
                          <View>
                            <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: '#fff' }}>{r.referred_name}</Text>
                            <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                              {r.status === 'rewarded' ? `Rewarded ₹${r.reward_amount}` : 'Pending first order'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            )}

            <TouchableOpacity onPress={handleLogout} disabled={loggingOut} style={ss.logoutBtn}>
              <Text style={ss.logoutText}>{loggingOut ? 'Logging out...' : '🚪  Sign Out'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'Orders' && (
          <Animated.View entering={FadeInDown.duration(350)} style={ss.tabContent}>
            {ordersLoading ? (
              <View style={{ gap: 12 }}>
                {[1, 2, 3].map(k => <OrderCardSkeleton key={k} />)}
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
            ) : (
              <>
                {orders.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)}
                {ordersMeta && ordersMeta.pages > 1 && (
                  <View style={ss.paginationRow}>
                    <TouchableOpacity
                      onPress={() => fetchOrders(ordersPage - 1)}
                      disabled={ordersPage <= 1}
                      style={[ss.pageBtn, ordersPage <= 1 && ss.pageBtnDisabled]}
                    >
                      <Text style={[ss.pageBtnText, ordersPage <= 1 && ss.pageBtnTextDisabled]}>‹ Prev</Text>
                    </TouchableOpacity>
                    <Text style={ss.pageInfo}>{ordersPage} / {ordersMeta.pages}</Text>
                    <TouchableOpacity
                      onPress={() => fetchOrders(ordersPage + 1)}
                      disabled={ordersPage >= ordersMeta.pages}
                      style={[ss.pageBtn, ordersPage >= ordersMeta.pages && ss.pageBtnDisabled]}
                    >
                      <Text style={[ss.pageBtnText, ordersPage >= ordersMeta.pages && ss.pageBtnTextDisabled]}>Next ›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* ── ADDRESSES ── */}
        {activeTab === 'Addresses' && (
          <Animated.View entering={FadeInDown.duration(350)} style={ss.tabContent}>
            <TouchableOpacity onPress={() => { setAddrForm(p => ({ ...p, email: user?.email || '' })); setShowAddAddr(true) }} style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={ms.bg} onPress={() => setShowEditProfile(false)} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
              <View style={ms.handle} />
              <Text style={ms.title}>Edit Profile</Text>
              {/* Avatar picker */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={{ position: 'relative' }}>
                  {avatarUri || (user as any)?.avatar ? (
                    <Image source={{ uri: avatarUri || (user as any).avatar }} style={ms.avatarLarge} />
                  ) : (
                    <LinearGradient colors={[Colors.sage, Colors.gold]} style={ms.avatarLarge}>
                      <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 32 }}>{initials}</Text>
                    </LinearGradient>
                  )}
                  <View style={ms.avatarCameraBtn}>
                    <Text style={{ fontSize: 14 }}>📷</Text>
                  </View>
                </TouchableOpacity>
                <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textDim, marginTop: 6 }}>Tap to change photo</Text>
              </View>
              <ModalField label="Full Name" placeholder="Your full name" value={editForm.name} onChangeText={(t: string) => setEditForm(p => ({ ...p, name: t }))} />
              <ModalField label="Email Address" placeholder="you@example.com" value={editForm.email} keyboardType="email-address" onChangeText={(t: string) => setEditForm(p => ({ ...p, email: t }))} />
              <ModalField label="Phone Number" placeholder="+91 98765 43210" value={editForm.phone} keyboardType="phone-pad" onChangeText={(t: string) => setEditForm(p => ({ ...p, phone: t }))} />
              <TouchableOpacity onPress={saveProfile} disabled={savingProfile} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
                <LinearGradient colors={[Colors.forest, Colors.moss]} style={ms.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={ms.confirmText}>{savingProfile ? 'Saving...' : '✓  Save Changes'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal visible={showChangePwd} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={ms.bg} onPress={() => setShowChangePwd(false)} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ADD ADDRESS MODAL ── */}
      <Modal visible={showAddAddr} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={ms.bg} onPress={() => setShowAddAddr(false)} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
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

              {/* Detect location button */}
              <TouchableOpacity
                onPress={() => detectLocation(setAddrForm)}
                disabled={locating}
                style={ms.locBtn}
              >
                {locating
                  ? <ActivityIndicator size="small" color={Colors.forest} />
                  : <Text style={ms.locBtnIcon}>📍</Text>}
                <Text style={ms.locBtnText}>{locating ? 'Detecting location…' : 'Use my current location'}</Text>
              </TouchableOpacity>

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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── EDIT ADDRESS MODAL ── */}
      <Modal visible={!!editingAddr} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={ms.bg} onPress={() => setEditingAddr(null)} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
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

              {/* Detect location button */}
              <TouchableOpacity
                onPress={() => detectLocation(setEditAddrForm)}
                disabled={locating}
                style={ms.locBtn}
              >
                {locating
                  ? <ActivityIndicator size="small" color={Colors.forest} />
                  : <Text style={ms.locBtnIcon}>📍</Text>}
                <Text style={ms.locBtnText}>{locating ? 'Detecting location…' : 'Use my current location'}</Text>
              </TouchableOpacity>

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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  avatarImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarEditBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
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

  statsRow: { flexDirection: 'row', gap: 8, paddingTop: 12, paddingBottom: 2, marginBottom: 14 },
  statPill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 2, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.18)' },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statNum: { color: '#fff', fontFamily: Fonts.bold, fontSize: 20, lineHeight: 24 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.medium, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 13, padding: 4, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.medium, fontSize: 13 },
  tabTextActive: { color: Colors.forest, fontFamily: Fonts.bold },

  tabContent: { padding: 16 },
  section: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderWidth: 0.5, borderColor: '#d9eedf', ...Shadows.sm },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textDim, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  infoIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  infoLabel: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },

  halfBtn: { paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  halfBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 13 },
  halfBtnOutline: { paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  halfBtnOutlineText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  linkIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  linkLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  linkSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 1 },

  logoutBtn: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5', marginTop: 4 },
  logoutText: { color: Colors.red, fontFamily: Fonts.bold, fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 44 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },

  addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  addAddrText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 4 },
  pageBtn: { backgroundColor: Colors.forest, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  pageBtnDisabled: { backgroundColor: Colors.border },
  pageBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 13 },
  pageBtnTextDisabled: { color: Colors.textDim },
  pageInfo: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },

  addrCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: Colors.border, gap: 12, ...Shadows.sm },
  addrIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  defaultBadge: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage },
  typeBadge: { backgroundColor: '#f0f4f0', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textDim },
  addrStreet: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 19, marginTop: 4 },
  addrLine: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 18 },
  addrActionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f0f4f0', alignItems: 'center', justifyContent: 'center' },

  // Wallet mini-card
  walletCard: { borderRadius: 18, padding: 16, ...Shadows.md },
  walletIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  walletLabel: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  walletBalance: { color: '#fff', fontFamily: Fonts.displayBold, fontSize: 26 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pointsText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 12 },
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
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0faf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 16 },
  locBtnIcon: { fontSize: 15 },
  locBtnText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.forest, flex: 1 },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#d1fae5', overflow: 'hidden' },
  avatarCameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 16, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#d1fae5' },
})
