'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Eye,
  Truck,
  Edit,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Upload,
  Download,
  Plus,
  Trash2,
  Shield,
  Bell,
  ChevronRight,
  Home,
  Briefcase,
  MoreHorizontal,
  Lock,
  Phone,
  Mail,
  AlertCircle,
  Gift,
  TrendingUp,
  ShoppingBag,
  Wallet,
} from 'lucide-react'

import Link from 'next/link'
import axios from '@/lib/axios'

import { useAuth } from '@/context/auth-context'
import { useOrderSocket } from '@/hooks/useOrderSocket'
import AppModal from '@/components/modal/AppModal'
import { notify } from '../utils/notify'
import { addAddress, deleteAccount, deleteAddress, exportData, getAddresses, getSettings, setDefaultAddress, updateAddress, updateProfile, updateSettings } from '@/lib/accountapi'
import { formatDate } from '../utils/formatDate'


/* ================= TYPES ================= */

interface OrderItem {
  product_id: number
  name: string
  quantity: number
  price: number
  image?: string
}

interface Order {
  id: number
  orderNumber: string
  status:
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  totalAmount: number
  createdAt: string
  estimatedDelivery?: string
  items: OrderItem[]
}

interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  street: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

const intarrdata = {
  "product_id": "",
  "name": "",
  "quantity": 0,
  "price": 0,
  "image": "",
  rating: 0,
  comment: "",
  images: [],
  oldimages: []
}

/* ================= STAT CARD ================= */

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${color} text-white`}>
      <div className="absolute -right-4 -top-4 opacity-20">
        <Icon size={72} />
      </div>
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
    </div>
  )
}

/* ================= ADDRESS FORM ================= */

function AddressForm({ onSave, onCancel, initial }: { onSave: (a: any) => void, onCancel: () => void, initial?: any }) {
const {loginuserdata}=useAuth()
  const [form, setForm] = useState<any>({
  type: 'home',
  street: '',
  city: '',
  state: '',
  pincode: '',
  email:loginuserdata?.email||"",
  is_default: false,
  phone:loginuserdata?.phone||"",
  name:loginuserdata?.name||''

});
useEffect(() => {
  if (initial) {
    setForm({
      type: initial.type || "home",
      street: initial.street || "",
      city: initial.city || "",
      state: initial.state || "",
      pincode: initial.pincode || "",
      is_default: Boolean(initial.is_default),
      email:initial?.email||""
    });
  }
}, [initial]);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
      <div className="flex gap-3 mb-2">
        {['home', 'work', 'other'].map(t => (
          <button
            key={t}
            onClick={() => setForm({ ...form, type: t })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${form.type === t ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'}`}
          >
            {t === 'home' ? <Home size={13} /> : t === 'work' ? <Briefcase size={13} /> : <MoreHorizontal size={13} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white" placeholder="Street Address" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <input className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <input className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white" placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
        <input className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white" placeholder="PIN Code" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white" placeholder="Enter Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() =>
  setForm(prev => ({
    ...prev,
    is_default: true,
  }))
} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.is_default ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
          {form.is_default && <CheckCircle size={12} className="text-white"  />}
        </div>
        <span className="text-sm text-gray-700 font-medium">Set as default address</span>
      </label>
      <div className="flex gap-3 pt-1">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6" onClick={() => onSave(form)}>Save Address</Button>
        <Button variant="outline" className="rounded-xl px-6" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

/* ================= WALLET TAB ================= */

function WalletTab({ data, loading, onMount }: { data: any; loading: boolean; onMount: () => void }) {
  useEffect(() => { onMount() }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  const balance = Number(data?.balance || 0)
  const loyaltyBalance = Number(data?.loyalty_balance || 0)
  const transactions: any[] = data?.transactions || []
  const loyalty: any[] = data?.loyalty || []

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-gray-900 text-lg">Wallet & Loyalty Points</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-violet-600 to-purple-500 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-2">Store Wallet</p>
          <p className="text-4xl font-black">₹{balance.toFixed(2)}</p>
          <p className="text-xs text-purple-200 mt-1">Available balance</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest text-amber-100 mb-2">Loyalty Points</p>
          <p className="text-4xl font-black">{loyaltyBalance}</p>
          <p className="text-xs text-amber-100 mt-1">Redeemable points</p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Wallet Transactions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{t.source || t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loyalty.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Points History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loyalty.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{l.source || l.description}</p>
                  <p className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-sm font-bold ${l.type === 'earn' ? 'text-amber-600' : 'text-red-500'}`}>
                  {l.type === 'earn' ? '+' : '-'}{l.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!transactions.length && !loyalty.length && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <Wallet size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No transactions yet</p>
          <p className="text-xs text-gray-400 mt-1">Wallet credits and loyalty points will appear here</p>
        </div>
      )}
    </div>
  )
}

/* ================= COMPONENT ================= */

export default function AccountContent() {

  const params = useSearchParams()
  const activeTab = params.get('tab') || 'profile'

  const {
    loginuserdata,
    logout,
    orders,
    loadOrders,
    fetchUser
  } = useAuth()

  useOrderSocket(loginuserdata?.id)

  /* ================= STATES ================= */

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    email:loginuserdata?.email|| '',
    phone: '',
  })

  /* notifications settings */
  const [notifSettings, setNotifSettings] = useState({
    orderUpdates: true,
    promotions: false,
    priceDrops: true,
    newArrivals: false,
  })

  /* delete account modal */
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ===== MODAL ===== */

  const [openModal, setOpenModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [realreviewdata, setRealReviewData] = useState<any>([intarrdata])

  /* ===== REVIEW ===== */

  const [reviewLoading, setReviewLoading] = useState(false)
  const [oldImages, setOldImages] = useState([]);
  const [images, setImages] = useState<any[]>([])
  const { loadReviews, reviewsData } = useAuth()

  /* ===== WALLET ===== */
  const [walletData, setWalletData] = useState<{ balance: number; loyalty_balance: number; transactions: any[]; loyalty: any[] } | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)

  /* ================= LOAD ================= */

useEffect(() => {

  if (!loginuserdata?.id) return;

  const init = async () => {
    try {

      setLoading(true);

      await loadOrders(loginuserdata.id);

      /* Profile */
      setEditForm({
        name: loginuserdata?.name || "",
        email: loginuserdata?.email || "",
        phone: loginuserdata?.phone || "",
      });

      /* Addresses */
      const addrRes = await getAddresses();
      setAddresses(addrRes.data.data);

      /* Settings */
      const setRes = await getSettings();
      setNotifSettings({
        orderUpdates: setRes.data.data.order_updates,
        promotions: setRes.data.data.promotions,
        priceDrops: setRes.data.data.price_drops,
        newArrivals: setRes.data.data.new_arrivals,
      });

    } finally {
      setLoading(false);
    }
  };

  init();

}, [loginuserdata,loadOrders]);


  /* ================= PROFILE ================= */

 const handleProfileUpdate = async (e: any) => {
  e.preventDefault();

  try {

    setProfileSaving(true);

    const res = await updateProfile(editForm);

    notify.success("Profile updated");

    setIsEditing(false);
    setProfileSuccess(true);
fetchUser()
    setTimeout(() => setProfileSuccess(false), 3000);

  } catch (err: any) {

    notify.error(
      err?.response?.data?.message || "Update failed"
    );

  } finally {
    setProfileSaving(false);
  }
};

  /* ================= ADDRESS ================= */

const handleSaveAddress = async (data: any) => {
  try {

    if (editingAddressId) {
      await updateAddress(editingAddressId, data);
      notify.success("Updated");
    } else {
      await addAddress(data);
      notify.success("Added");
    }

    const res = await getAddresses();
    setAddresses(res.data.data);

    setEditingAddressId(null);
    setShowAddressForm(false);

  } catch {
    notify.error("Address failed");
  }
};

 const handleDeleteAddress = async (id: string) => {
  try {

    await deleteAddress(id);

    setAddresses(p => p.filter(a => a.id !== id));

    notify.success("Deleted");

  } catch {
    notify.error("Delete failed");
  }
};

 const handleSetDefault = async (id: string) => {
  try {

    await setDefaultAddress(id);

    const res = await getAddresses();

    setAddresses(res.data.data);

    notify.success("Updated");

  } catch {
    notify.error("Failed");
  }
};

  /* ================= HELPERS ================= */

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      case 'shipped': return 'bg-blue-100 text-blue-700 border border-blue-200'
      case 'processing': return 'bg-amber-100 text-amber-700 border border-amber-200'
      case 'confirmed': return 'bg-purple-100 text-purple-700 border border-purple-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border border-red-200'
      default: return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={14} />
      case 'shipped': return <Truck size={14} />
      case 'processing': return <Clock size={14} />
      case 'confirmed': return <CheckCircle size={14} />
      case 'cancelled': return <AlertCircle size={14} />
      default: return <Package size={14} />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(price))
  }

  const totalSpent = orders?.reduce((sum: number, o: Order) => sum + Number(o.totalAmount), 0) || 0
  const deliveredOrders = orders?.filter((o: Order) => o.status === 'delivered').length || 0

  /* ================= MODAL ================= */

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order)
    setOpenModal(true)
  }

  const handlechange = (index: number, name: string, e: any, index2?: number) => {
    const data = [...realreviewdata]
    if (!Array.isArray(data[index].images)) data[index].images = []
    if (!Array.isArray(data[index].oldImages)) data[index].oldImages = []

    if (name === "images") {
      const files = Array.from(e?.target?.files || [])
      if (!files.length) return
      const valid = files.filter((f: any) => f.type.startsWith("image/"))
      const total = data[index].images.length + data[index].oldImages.length + valid.length
      if (total > 5) { alert("Max 5 images allowed"); return }
      const previewImages = valid.map((file: any) => ({ file, preview: URL.createObjectURL(file) }))
      data[index].images = [...data[index].images, ...previewImages]
      e.target.value = null
    } else if (name === "remove") {
      if (!data[index].oldImages.length) return
      data[index].oldImages = data[index].oldImages.filter((_: any, i: number) => i !== index2)
    } else if (name === "new") {
      if (!data[index].images.length) return
      const img = data[index].images[index2!]
      if (img?.preview) URL.revokeObjectURL(img.preview)
      data[index].images = data[index].images.filter((_: any, i: number) => i !== index2)
    } else if (name === "rating") {
      data[index].rating = e
    } else if (name === "comment") {
      data[index].comment = e
    }

    setRealReviewData(data)
  }

  const removeNewImage = (index: number) => {
    setImages((prev) => { URL.revokeObjectURL(prev[index].preview); return prev.filter((_, i) => i !== index) })
  }

  const removeOldImage = (index: number) => {
    setOldImages((prev) => prev.filter((_, i) => i !== index))
  }

  /* ================= REVIEW ================= */

  const submitReview = async (order?: any, productId?: any, item?: any) => {
    const { rating, comment, images } = item
    if (!rating) return alert("Select rating")
    try {
      setReviewLoading(true)
      const form = new FormData()
      form.append("rating", String(rating))
      form.append("comment", comment)
      form.append("oldImages", JSON.stringify(item?.oldImages))
      images.forEach((img: any) => form.append("images", img.file))
      await axios.post(`/shop/reviews/order/${order.id}/product/${productId}`, form)
      notify.success("Review submitted")
    } catch (err) {
      alert("Review failed")
    } finally {
      setReviewLoading(false)
    }
  }

  /* ================= LOADER ================= */

  const loadWallet = async () => {
    if (walletData || walletLoading) return
    setWalletLoading(true)
    try {
      const r = await axios.get('/wallet/')
      // Normalize response keys
      setWalletData({
        balance: r.data.wallet_balance || 0,
        loyalty_balance: r.data.loyalty_points || 0,
        transactions: r.data.transactions || [],
        loyalty: r.data.loyalty_history || [],
      })
    } catch { } finally { setWalletLoading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading your account…</p>
        </div>
      </div>
    )
  }

  /* ================= SIDEBAR NAV ================= */

  const navItems = [
    { href: '/account', tab: 'profile', icon: User, label: 'My Profile' },
    { href: '/account?tab=orders', tab: 'orders', icon: Package, label: 'My Orders' },
    { href: '/account?tab=addresses', tab: 'addresses', icon: MapPin, label: 'Addresses' },
    { href: '/wishlist', tab: 'wishlist', icon: Heart, label: 'Wishlist' },
    { href: '/account?tab=wallet', tab: 'wallet', icon: Wallet, label: 'Wallet & Points' },
    { href: '/account?tab=payment', tab: 'payment', icon: CreditCard, label: 'Payment Methods' },
    { href: '/account?tab=settings', tab: 'settings', icon: Settings, label: 'Settings' },
  ]

  /* ================= UI ================= */

  return (
      <Suspense fallback={null}>
    <div className="min-h-screen flex flex-col bg-[#f5f6fb]">
      <Header />

      <main className="flex-1">
        {/* ===== HERO BANNER ===== */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-white translate-y-1/2" />
          </div>
          <div className="container mx-auto px-4 py-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center shadow-xl">
                  <span className="text-3xl font-black text-white">
                    {loginuserdata?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Welcome back</p>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{loginuserdata?.name}</h1>
                  <p className="text-emerald-100 text-sm mt-0.5">{loginuserdata?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => logout('users')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl gap-2 backdrop-blur"
              >
                <LogOut size={15} /> Logout
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center border border-white/20">
                <p className="text-2xl font-black text-white">{orders?.length || 0}</p>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">Total Orders</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center border border-white/20">
                <p className="text-2xl font-black text-white">{deliveredOrders}</p>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">Delivered</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center border border-white/20">
                <p className="text-lg font-black text-white">{formatPrice(totalSpent)}</p>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* ===== SIDEBAR ===== */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">My Account</p>
                </div>
                <nav>
                  {navItems.map(({ href, tab, icon: Icon, label }) => {
                    const isActive = activeTab === tab
                    return (
                      <Link
                        key={tab}
                        href={href}
                        className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-all group relative ${isActive
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />}
                        <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                          <Icon size={14} />
                        </span>
                        {label}
                        <ChevronRight size={13} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-emerald-500' : ''}`} />
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t border-gray-100">
                  <button onClick={() => logout('users')} className="w-full flex items-center gap-2.5 text-sm font-semibold text-red-500 hover:text-red-600 py-2 px-3 rounded-xl hover:bg-red-50 transition-all">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} className="space-y-0">
                <TabsList className="hidden">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="wallet">Wallet</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* ===================== PROFILE TAB ===================== */}
                <TabsContent value="profile">
                  <div className="space-y-5">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div>
                          <h2 className="font-bold text-gray-900">Personal Information</h2>
                          <p className="text-xs text-gray-400 mt-0.5">Update your personal details</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isEditing ? "outline" : "default"}
                          className={`rounded-xl gap-1.5 text-xs ${!isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit size={13} />
                          {isEditing ? 'Cancel' : 'Edit Profile'}
                        </Button>
                      </div>

                      <div className="p-6">
                        {profileSuccess && (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
                            <CheckCircle size={16} /> Profile updated successfully!
                          </div>
                        )}

                        {isEditing ? (
                          <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                                <div className="relative">
                                  <User size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                                  <input className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="Full Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
                                <div className="relative">
                                  <Mail size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                                  <input className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="Email Address" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                                <div className="relative">
                                  <Phone size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                                  <input className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="Phone Number" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button type="submit" disabled={profileSaving} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 gap-2">
                                {profileSaving ? (
                                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</span>
                                ) : 'Save Changes'}
                              </Button>
                              <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(false)}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                              { icon: User, label: 'Full Name', value: loginuserdata?.name },
                              { icon: Mail, label: 'Email Address', value: loginuserdata?.email },
                              { icon: Phone, label: 'Phone Number', value: loginuserdata?.phone || '—' },
                              { icon: Gift, label: 'Member Since', value:formatDate(loginuserdata?.created_at) },
                              { icon: TrendingUp, label: 'Referral Code', value: loginuserdata?.referral_code || '—' },
                            ].map(({ icon: Icon, label, value }) => (
                              <div key={label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                  <Icon size={15} className="text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                                  <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Security</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Manage your account security</p>
                      </div>
                      <div className="p-6 space-y-3">
                        {[
                          { icon: Lock, label: 'Change Password', sub: 'Last changed 3 months ago' },
                          { icon: Shield, label: 'Two-Factor Authentication', sub: 'Add an extra layer of security' },
                        ].map(({ icon: Icon, label, sub }) => (
                          <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 group-hover:bg-emerald-100 rounded-lg transition-all">
                                <Icon size={15} className="text-gray-500 group-hover:text-emerald-600 transition-all" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{label}</p>
                                <p className="text-xs text-gray-400">{sub}</p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ===================== ORDERS TAB ===================== */}
                <TabsContent value="orders">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-gray-900 text-lg">My Orders</h2>
                      <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full">{orders?.length || 0} orders</span>
                    </div>

                    {!orders?.length ? (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                          <ShoppingBag size={40} className="text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">No orders yet</h3>
                        <p className="text-gray-400 text-sm mb-6">Looks like you haven't placed any orders. Start shopping!</p>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
                          <Link href="/products">
                            Explore Products <ArrowRight size={14} />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      orders.map((order: Order, orderIndex?: any) => (
                        <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-100 transition-all">
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex flex-wrap items-center gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                <p className="font-bold text-gray-800 text-sm">#{order.orderNumber}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Placed On</p>
                                <p className="font-semibold text-gray-700 text-sm">{new Date(order.createdAt).toDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                <p className="font-bold text-gray-800 text-sm">{formatPrice(order.totalAmount)}</p>
                              </div>
                            </div>
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>

                          {/* Items */}
                          <div className="divide-y divide-gray-50">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex gap-4 items-center px-5 py-4">
                                <div className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                                  <img src={item.image || '/placeholder.png'} className="w-full h-full object-cover" alt={item.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                  {item.variant_label && <p className="text-xs text-emerald-600 font-medium mt-0.5">{item.variant_label}</p>}
                                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-gray-800 text-sm">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                            {order.status === 'shipped' && (
                              <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold bg-blue-50 px-3 py-1.5 rounded-full">
                                <Truck size={13} /> Estimated delivery in 2–3 days
                              </div>
                            )}
                            {order.status === 'delivered' && (
                              <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-full">
                                <CheckCircle size={13} /> Delivered successfully
                              </div>
                            )}
                            {!['shipped', 'delivered'].includes(order.status) && <div />}

                            <div className="flex items-center gap-2 ml-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl gap-1.5 text-xs"
                                asChild
                              >
                                <Link href={`/orders/${order.id}`}>
                                  <Truck size={13} /> Track Order
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 text-xs"
                                onClick={async () => {
                                  const newdata = await loadReviews(order?.items?.map((item: any) => item?.product_id), 1, 10, 1)
                                  const data2 = orders?.flatMap((el: any) =>
                                    el.items.map((item: any) => ({
                                      ...item,
                                      rating: newdata?.find((item2: any) => item2?.order_id == orders[orderIndex]?.id && item2?.product_id == item?.product_id)?.rating ?? null,
                                      comment: newdata?.find((item2: any) => item2?.order_id == orders[orderIndex]?.id && item2?.product_id == item?.product_id)?.comment ?? "",
                                      images: [],
                                      oldImages: newdata?.find((item2: any) => item2?.order_id == el?.id && item2?.product_id == item?.product_id)?.images ?? [],
                                    }))
                                  )
                                  setRealReviewData(data2)
                                  openOrderModal(order)
                                }}
                              >
                                <Eye size={13} /> Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* ===================== ADDRESSES TAB ===================== */}
                <TabsContent value="addresses">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-gray-900 text-lg">Saved Addresses</h2>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-1.5 text-xs"
                        onClick={() => { setShowAddressForm(true); setEditingAddressId(null); setEditForm((pre:any)=>({...pre,email:loginuserdata?.email})) }}
                      >
                        <Plus size={13} /> Add New
                      </Button>
                    </div>

                    {showAddressForm && !editingAddressId && (
                      <AddressForm  onSave={handleSaveAddress} onCancel={() => setShowAddressForm(false)} />
                    )}

                    {!addresses.length && !showAddressForm && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin size={36} className="text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-700 mb-2">No saved addresses</h3>
                        <p className="text-sm text-gray-400 mb-5">Add an address for faster checkout</p>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2"
                          onClick={() => setShowAddressForm(true)}
                        >
                          <Plus size={14} /> Add Address
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`bg-white rounded-2xl border-2 ${addr.is_default ? 'border-emerald-400 shadow-emerald-100 shadow-md' : 'border-gray-100'} p-5 relative transition-all`}>
                          {addr.is_default && (
                            <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">Default</span>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              {addr.type === 'home' ? <Home size={14} className="text-emerald-600" /> : addr.type === 'work' ? <Briefcase size={14} className="text-emerald-600" /> : <MoreHorizontal size={14} className="text-emerald-600" />}
                            </div>
                            <span className="font-bold text-sm text-gray-700 capitalize">{addr.type}</span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium">{addr.street}</p>
                          <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>

                          {editingAddressId === addr.id ? (
                            <div className="mt-4">
                              <AddressForm initial={addr} onSave={handleSaveAddress} onCancel={() => setEditingAddressId(null)} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                              {!addr.is_default && (
                                <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-emerald-600 font-semibold hover:underline">Set Default</button>
                              )}
                              <button onClick={() => { setEditingAddressId(addr.id); setShowAddressForm(false)
                                 setEditForm(addr)}} className="text-xs text-gray-500 font-semibold hover:text-gray-700 ml-auto flex items-center gap-1">
                                <Edit size={12} /> Edit
                              </button>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-red-400 font-semibold hover:text-red-600 flex items-center gap-1">
                                <Trash2 size={12} /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* ===================== WALLET TAB ===================== */}
                <TabsContent value="wallet">
                  <WalletTab data={walletData} loading={walletLoading} onMount={loadWallet} />
                </TabsContent>

                {/* ===================== PAYMENT TAB ===================== */}
                <TabsContent value="payment">
                  <div className="space-y-4">
                    <h2 className="font-bold text-gray-900 text-lg">Payment Methods</h2>

                    {/* Wallet / Credits Placeholder */}
                    <div className="bg-gradient-to-r from-violet-600 to-purple-500 rounded-2xl p-5 text-white relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full" />
                      <div className="absolute -right-2 -bottom-10 w-28 h-28 bg-white/10 rounded-full" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet size={18} />
                          <span className="text-sm font-bold">Store Wallet</span>
                        </div>
                        <p className="text-3xl font-black">₹0.00</p>
                        <p className="text-xs text-purple-200 mt-1">Available balance</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                      <h3 className="font-bold text-sm text-gray-700">Saved Cards & UPI</h3>
                      <div className="text-center py-8">
                        <CreditCard size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-500">No saved payment methods</p>
                        <p className="text-xs text-gray-400 mt-1">Add cards or UPI IDs for faster checkout</p>
                        <Button className="mt-5 bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2 text-sm">
                          <Plus size={14} /> Add Payment Method
                        </Button>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
                      <Shield size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Safe & Secure Payments</p>
                        <p className="text-xs text-amber-600 mt-0.5">Your payment information is encrypted with industry-standard SSL security.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ===================== SETTINGS TAB ===================== */}
                <TabsContent value="settings">
                  <div className="space-y-5">
                    <h2 className="font-bold text-gray-900 text-lg">Settings</h2>

                    {/* Notifications */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-emerald-600" />
                          <h3 className="font-bold text-gray-800">Notification Preferences</h3>
                        </div>
                      </div>
                      <div className="p-5 space-y-1">
                        {Object.entries(notifSettings).map(([key, val]) => {
                          const labels: any = {
                            orderUpdates: { label: 'Order Updates', sub: 'Get notified about your order status' },
                            promotions: { label: 'Promotions & Offers', sub: 'Exclusive deals and discounts' },
                            priceDrops: { label: 'Price Drops', sub: 'When wishlist items go on sale' },
                            newArrivals: { label: 'New Arrivals', sub: 'Fresh products in your preferred categories' },
                          }
                          return (
                            <div key={key} className="flex items-center justify-between py-3 px-1">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{labels[key]?.label}</p>
                                <p className="text-xs text-gray-400">{labels[key]?.sub}</p>
                              </div>
                              <button
                               onClick={async () => {

  const updated = {
    ...notifSettings,
    [key]: !val,
  };

  setNotifSettings(updated);

  try {

    await updateSettings({
      order_updates: updated.orderUpdates,
      promotions: updated.promotions,
      price_drops: updated.priceDrops,
      new_arrivals: updated.newArrivals,
    });

    notify.success("Saved");

  } catch {

    notify.error("Save failed");
  }
}}
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${val ? 'bg-emerald-500' : 'bg-gray-200'}`}
                              >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${val ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Account Actions</h3>
                      </div>
                      <div className="p-5 space-y-3">
                        <button  onClick={async () => {

    try {

      const res = await exportData();

      const blob = new Blob([res.data]);

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "my-data.json";

      a.click();

      notify.success("Downloaded");

    } catch {
      notify.error("Export failed");
    }

  }} className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all text-left group">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Download My Data</p>
                            <p className="text-xs text-gray-400">Get a copy of your account data</p>
                          </div>
                          <Download size={15} className="text-gray-300 group-hover:text-gray-500" />
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}
                          className="w-full flex items-center justify-between p-4 rounded-xl border border-red-100 hover:bg-red-50 transition-all text-left group"
                        >
                          <div>
                            <p className="text-sm font-semibold text-red-600">Delete Account</p>
                            <p className="text-xs text-red-400">Deactivate your account and all associated data</p>
                          </div>
                          <Trash2 size={15} className="text-red-300 group-hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

              </Tabs>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {/* ================= DELETE ACCOUNT MODAL ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Delete Account</h2>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-red-800">What happens when you delete your account:</p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Your account will be permanently deactivated</li>
                  <li>You will lose access to your order history</li>
                  <li>Your saved addresses and wishlist will be removed</li>
                  <li>Any remaining wallet balance will be forfeited</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">DELETE</span> to confirm
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition font-mono"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button
                onClick={async () => {
                  if (deleteConfirmText !== 'DELETE') return
                  setDeleteLoading(true)
                  try {
                    await deleteAccount()
                    notify.success('Account deleted')
                    window.location.href = '/'
                  } catch {
                    notify.error('Delete failed — please try again')
                    setDeleteLoading(false)
                  }
                }}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAIL MODAL ================= */}
      <AppModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Order Details"
        width="max-w-4xl"
      >
        {selectedOrder && (
          <div className="space-y-5">

            {/* Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{new Date(selectedOrder?.createdAt).toDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                  </span>
                </div>
                {(selectedOrder as any)?.invoice_date && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-bold text-gray-800 text-sm">{new Date((selectedOrder as any)?.invoice_date).toDateString()}</p>
                      <a href={(selectedOrder as any)?.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download size={16} className="text-emerald-500 hover:text-emerald-700 transition-colors" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakup */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2 text-sm">
                {[
                  { label: 'Subtotal', val: (selectedOrder as any)?.shipping_address?.price_breakup?.subtotal || 0 },
                  { label: 'GST', val: (selectedOrder as any)?.shipping_address?.price_breakup?.gst || 0 },
                  { label: 'Delivery', val: (selectedOrder as any)?.shipping_address?.price_breakup?.delivery || 0 },
                  { label: 'Platform Fee', val: (selectedOrder as any)?.shipping_address?.price_breakup?.platform_fee || 0 },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-gray-600">
                    <span>{label}</span>
                    <span className="font-medium text-gray-800">{formatPrice(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span className="text-emerald-700">{formatPrice((selectedOrder as any)?.shipping_address?.price_breakup?.grand_total || selectedOrder?.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Products + Reviews */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Items in this Order</h3>
              {realreviewdata?.map((item: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm">

                  {/* Product row */}
                  <div className="flex gap-4 items-center p-4">
                    <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                      <img src={item.image || '/placeholder.png'} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                  </div>

                  {/* Review section */}
                  {selectedOrder?.status === 'delivered' && (
                    <div className="border-t border-gray-100 p-4 bg-amber-50/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <h4 className="font-bold text-sm text-gray-700">Rate this Product</h4>
                      </div>

                      {/* Rating stars */}
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => handlechange(i, "rating", n)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              size={28}
                              className={n <= (item?.rating || 0)
                                ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                : "text-gray-300 hover:text-amber-300"}
                            />
                          </button>
                        ))}
                        {item?.rating > 0 && (
                          <span className="ml-1 text-sm font-bold text-amber-600 self-center">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][item.rating]}
                          </span>
                        )}
                      </div>

                      {item?.rating === 0 && (
                        <p className="text-xs text-red-400 font-medium">⚡ Please select a star rating</p>
                      )}

                      {/* Comment */}
                      <div className="relative">
                        <textarea
                          className="w-full border border-gray-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none resize-none transition-all"
                          rows={3}
                          placeholder="Share your experience with this product..."
                          value={item?.comment || ''}
                          onChange={(e) => handlechange(i, "comment", e.target.value)}
                          maxLength={300}
                        />
                        <span className="absolute bottom-2 right-3 text-xs text-gray-300">{item?.comment?.length || 0}/300</span>
                      </div>

                      {/* Upload */}
                      <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-all">
                        <Upload size={14} />
                        Add Photos (Max 5)
                        <input type="file" hidden multiple accept="image/*" onChange={(e) => handlechange(i, "images", e)} />
                      </label>

                      {/* Old images */}
                      {item?.oldImages?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {item.oldImages.map((url: string, i2: number) => (
                            <div key={i2} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 group">
                              <img src={url} className="w-full h-full object-cover" alt="uploaded" />
                              <button onClick={() => handlechange(i, "remove", null, i2)} className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New images */}
                      {Array.isArray(item?.images) && item.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {item.images.map((img: any, i2: number) => (
                            <div key={i2} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-200 group">
                              <img src={img.preview} className="w-full h-full object-cover" alt="preview" />
                              <button onClick={() => handlechange(i, "new", null, i2)} className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Submit */}
                      <Button
                        disabled={reviewLoading || !item?.rating || item?.comment?.trim().length < 5}
                        onClick={() => submitReview(selectedOrder, item.product_id, item)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2 disabled:opacity-50"
                      >
                        {reviewLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2"><Star size={14} className="fill-white" /> Submit Review</span>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </AppModal>
    </div></Suspense>
  )
}