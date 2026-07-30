'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Command } from 'cmdk'

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  Settings,
  List,
  Menu,
  X,
  Building,
  UploadCloud,
  Tag,
  Image,
  Bell,
  Zap,
  Star,
  Wallet,
  MessageSquare,
  Download,
  BookOpen,
  Code2,
  RotateCcw,
  Eye,
  Mail,
  FlaskConical,
  Receipt,
  HelpCircle,
  Clock,
  AlertCircle,
  Activity,
  Cpu,
  MemoryStick,
} from 'lucide-react'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()
  const { logout, loginuserdata } = useAuth()

  useEffect(() => {
    if (loginuserdata !== undefined && loginuserdata?.role !== 'admin') {
      router.replace('/adminauth')
    }
  }, [loginuserdata])

  /* Mobile Menu State */
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [bellAlerts, setBellAlerts] = useState<{ pendingOrders: number; openTickets: number; lowStock: number }>({ pendingOrders: 0, openTickets: 0, lowStock: 0 })
  const bellCount = bellAlerts.pendingOrders + bellAlerts.openTickets + bellAlerts.lowStock

  // Live server stats via socket
  const [serverStats, setServerStats] = useState<{ connectedUsers: number; cpu: number; memory: number; uptime: number } | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    const fetchAlerts = () => {
      axios.get('/admin/stats').then((r: any) => {
        const d = r.data
        setBellAlerts({ pendingOrders: d.pendingOrders || 0, openTickets: d.openTickets || 0, lowStock: d.lowStockItems || 0 })
      }).catch(() => {})
    }
    fetchAlerts()
    const t = setInterval(fetchAlerts, 30000)
    return () => clearInterval(t)
  }, [])

  // Socket for live server stats
  useEffect(() => {
    if (!loginuserdata?.role || loginuserdata.role !== 'admin') return
    let socket: any = null
    const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
    import('socket.io-client').then(({ io }) => {
      socket = io(API_ROOT, { transports: ['websocket', 'polling'] })
      socketRef.current = socket
      socket.on('connect', () => socket.emit('join_admin'))
      socket.on('server_stats', (data: any) => setServerStats(data))
    }).catch(() => {})
    // Also fetch via REST as fallback
    axios.get('/admin/server-stats').then((r: any) => setServerStats(r.data?.data)).catch(() => {})
    return () => { socket?.disconnect() }
  }, [loginuserdata?.role])

  const logoutfun = () => {
   logout("auth")
  }

  // ⌘K / Ctrl+K shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCmdOpen(o => !o)
    }
    if (e.key === 'Escape') setCmdOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const CMD_ITEMS = [
    { label: 'Dashboard', href: '/admin/dashboard', emoji: '📊' },
    { label: 'Products', href: '/admin/products', emoji: '📦' },
    { label: 'Orders', href: '/admin/orders', emoji: '🛍️' },
    { label: 'Users', href: '/admin/users', emoji: '👤' },
    { label: 'Analytics', href: '/admin/analytics', emoji: '📈' },
    { label: 'Coupons', href: '/admin/coupons', emoji: '🎟️' },
    { label: 'Support Tickets', href: '/admin/support', emoji: '💬' },
    { label: 'Banners', href: '/admin/banners', emoji: '🖼️' },
    { label: 'Flash Sales', href: '/admin/flash-sales', emoji: '⚡' },
    { label: 'Newsletter', href: '/admin/newsletter', emoji: '📧' },
    { label: 'Reviews', href: '/admin/reviews', emoji: '⭐' },
    { label: 'Settings', href: '/admin/settings', emoji: '⚙️' },
    { label: 'Wallet & Credits', href: '/admin/wallet', emoji: '💰' },
    { label: 'Push Notifications', href: '/admin/push-notifications', emoji: '🔔' },
    { label: 'Export Data', href: '/admin/export', emoji: '📤' },
  ]


  return (

    <div className="h-screen w-full flex bg-gray-100 overflow-hidden">

      <Toaster position="top-right" />

      {/* ================= COMMAND PALETTE ================= */}
      {cmdOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
          onClick={() => setCmdOpen(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', overflow: 'hidden', border: '1px solid #e5e7eb' }}
            onClick={e => e.stopPropagation()}
          >
            <Command>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #f3f4f6', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <Command.Input
                  placeholder="Search pages, actions…"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#1a2e1e', background: 'transparent', fontFamily: 'inherit' }}
                  autoFocus
                />
                <kbd style={{ fontSize: 10, background: '#f3f4f6', borderRadius: 5, padding: '2px 6px', color: '#6b7280', fontFamily: 'inherit' }}>ESC</kbd>
              </div>
              <Command.List style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
                <Command.Empty style={{ padding: '20px 18px', color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>No results found.</Command.Empty>
                {CMD_ITEMS.map(item => (
                  <Command.Item
                    key={item.href}
                    onSelect={() => { router.push(item.href); setCmdOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', borderRadius: 10, margin: '1px 8px', fontSize: 14, color: '#1a2e1e', userSelect: 'none' }}
                    className="hover:bg-emerald-50 data-selected:bg-emerald-50"
                  >
                    <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.emoji}</span>
                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}


      {/* ================= MOBILE OVERLAY ================= */}

      {mobileOpen && (

        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />

      )}


      {/* ================= SIDEBAR ================= */}

      <aside

        className={`

          w-64 bg-slate-900 text-white flex flex-col shrink-0
          fixed md:sticky md:top-0 inset-y-0 left-0 z-50 h-screen

          transform transition-transform duration-300

          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0

        `}
      >

        {/* Logo */}

        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">

          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div style={{ position: 'relative', overflow: 'hidden', width: 170, height: 48, borderRadius: 8, background: '#fff', flexShrink: 0 }}>
              <img
                src="https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/mainayurvedalogo.png"
                alt="Oroganix"
                style={{ position: 'absolute', width: 190, height: 'auto', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />
            </div>
          </Link>

          {/* Close (Mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden"
          >
            <X size={22} />
          </button>

        </div>


        {/* Menu */}

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">

          <MenuItem href="/admin/dashboard" icon={<LayoutDashboard size={18} />}>
            Dashboard
          </MenuItem>

          <MenuItem href="/admin/products" icon={<Package size={18} />}>
            Products
          </MenuItem>
            <MenuItem href="/admin/products/bulk-upload" icon={<UploadCloud size={18} />}>
    Bulk Upload
          </MenuItem>
<MenuItem
  href="/admin/products/bulk-stock"
  icon={<Package size={18} />}
>
  Bulk Stock
</MenuItem>
<MenuItem
  href="/admin/products/bulk-price"
  icon={<Package size={18} />}
>
  Bulk Price
</MenuItem>
<MenuItem
  href="/admin/logs"
  icon={<List size={18} />}
>
  Logs
</MenuItem>
<MenuItem
  href="/admin/price-logs"
  icon={<Receipt size={18} />}
>
  Price Logs
</MenuItem>
<MenuItem
  href="/admin/products/bulk-status"
  icon={<Package size={18} />}
>
  Bulk Status
</MenuItem>
<MenuItem
  href="/admin/products/bulk-category"
  icon={<Package size={18} />}
>
  Bulk Category
</MenuItem>
<MenuItem
  href="/admin/products/bulk-images"
  icon={<Package size={18} />}
>
  Bulk Images
</MenuItem>
<MenuItem
  href="/admin/import-history"
  icon={<List size={18} />}
>
  Import History
</MenuItem>
<MenuItem
  href="/admin/jobs"
  icon={<List size={18} />}
>
  Jobs
</MenuItem>
          <MenuItem href="/admin/orders" icon={<ShoppingCart size={18} />}>
            Orders
          </MenuItem>

          <MenuItem href="/admin/returns" icon={<RotateCcw size={18} />}>
            Returns
          </MenuItem>

          <MenuItem href="/admin/categories" icon={<ShoppingCart size={18} />}>
            Categories
          </MenuItem>

          <MenuItem href="/admin/brands" icon={<Tag size={18} />}>
            Brands
          </MenuItem>

          <MenuItem href="/admin/invoices" icon={<List size={18} />}>
            Invoices
          </MenuItem>

          <MenuItem href="/admin/users" icon={<Users size={18} />}>
            Users
          </MenuItem>

          <MenuItem href="/admin/settings" icon={<Settings size={18} />}>
            Settings
          </MenuItem>
<MenuItem href="/admin/company" icon={<Building size={18} />}>
            Company
          </MenuItem>
          <MenuItem href="/admin/analytics" icon={<BarChart3 size={18} />}>
            Analytics
          </MenuItem>

          <MenuItem href="/admin/visitors" icon={<Eye size={18} />}>
            Visitors
          </MenuItem>

          <div className="pt-2 pb-1 px-3">
            <p className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Marketing</p>
          </div>

          <MenuItem href="/admin/banners" icon={<Image size={18} />}>
            Banners
          </MenuItem>

          <MenuItem href="/admin/coupons" icon={<Tag size={18} />}>
            Coupons
          </MenuItem>

          <MenuItem href="/admin/variants" icon={<Package size={18} />}>
            Variants
          </MenuItem>

          <MenuItem href="/admin/pincodes" icon={<List size={18} />}>
            Pincodes
          </MenuItem>

          <MenuItem href="/admin/stock-notifications" icon={<Bell size={18} />}>
            Stock Alerts
          </MenuItem>

          <MenuItem href="/admin/blog" icon={<BookOpen size={18} />}>
            Blog
          </MenuItem>

          <div className="pt-2 pb-1 px-3">
            <p className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Engagement</p>
          </div>

          <MenuItem href="/admin/flash-sales" icon={<Zap size={18} />}>
            Flash Sales
          </MenuItem>

          <MenuItem href="/admin/bundles" icon={<Package size={18} />}>
            Bundles
          </MenuItem>

          <MenuItem href="/admin/reviews" icon={<Star size={18} />}>
            Reviews
          </MenuItem>

          <MenuItem href="/admin/push-notifications" icon={<Bell size={18} />}>
            Push Notifications
          </MenuItem>

          <MenuItem href="/admin/newsletter" icon={<Mail size={18} />}>
            Newsletter
          </MenuItem>

          <MenuItem href="/admin/abandoned-carts" icon={<ShoppingCart size={18} />}>
            Abandoned Carts
          </MenuItem>

          <MenuItem href="/admin/subscriptions" icon={<RotateCcw size={18} />}>
            Subscriptions
          </MenuItem>

          <MenuItem href="/admin/faq" icon={<HelpCircle size={18} />}>
            FAQ
          </MenuItem>

          <MenuItem href="/admin/wallet" icon={<Wallet size={18} />}>
            Wallet & Credits
          </MenuItem>

          <MenuItem href="/admin/qa" icon={<MessageSquare size={18} />}>
            Q&amp;A Moderation
          </MenuItem>

          <div className="pt-2 pb-1 px-3">
            <p className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Reports</p>
          </div>

          <MenuItem href="/admin/export" icon={<Download size={18} />}>
            Export Data
          </MenuItem>

          <div className="pt-2 pb-1 px-3">
            <p className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Support</p>
          </div>

          <MenuItem href="/admin/support" icon={<MessageSquare size={18} />}>
            Tickets
          </MenuItem>

          <div className="pt-2 pb-1 px-3">
            <p className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Content</p>
          </div>

          <MenuItem href="/admin/about" icon={<BookOpen size={18} />}>
            About Page
          </MenuItem>

          <div className="pt-2 pb-1 px-3">
            <p className="text-xs uppercase text-slate-500 font-semibold tracking-widest">Documentation</p>
          </div>

          <MenuItem href="/admin/docs/user-manual" icon={<BookOpen size={18} />}>
            User Manual
          </MenuItem>

          <MenuItem href="/admin/docs/developer" icon={<Code2 size={18} />}>
            Developer Docs
          </MenuItem>

          <MenuItem href="/admin/docs/testing" icon={<FlaskConical size={18} />}>
            Testing Guide
          </MenuItem>

        </nav>


        {/* Logout */}

        <div className="p-4 border-t border-slate-700">

          <button
            onClick={logoutfun}
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>



      {/* ================= MAIN ================= */}

      <div className="flex-1 flex flex-col min-w-0 h-screen">


        {/* ================= TOP BAR ================= */}

        <header className="h-16 bg-white border-b flex items-center justify-between px-3 md:px-6 w-full shrink-0">

          <div className="flex items-center gap-3">

            {/* Hamburger (Mobile) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden"
            >
              <Menu size={24} />
            </button>

            <h2 className="font-semibold text-lg">
              Admin Panel
            </h2>

          </div>


          <div className="flex items-center gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}
            >
              <span>🔍 Search…</span>
              <kbd style={{ fontSize: 11, background: '#e5e7eb', borderRadius: 5, padding: '1px 6px', fontFamily: 'inherit', color: '#374151' }}>⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setBellOpen(o => !o)}
                style={{ position: 'relative', padding: 8, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Bell size={18} color="#374151" />
                {bellCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                    {bellCount > 9 ? '9+' : bellCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setBellOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: 44, width: 280, background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 999, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 13, color: '#1a2e1e' }}>Alerts</div>
                    {bellAlerts.pendingOrders > 0 && (
                      <a href="/admin/orders?status=0" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textDecoration: 'none', color: '#1f2937', borderBottom: '1px solid #f9fafb' }}>
                        <Clock size={16} color="#f59e0b" />
                        <div><p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{bellAlerts.pendingOrders} Pending Orders</p><p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Awaiting confirmation</p></div>
                      </a>
                    )}
                    {bellAlerts.openTickets > 0 && (
                      <a href="/admin/support" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textDecoration: 'none', color: '#1f2937', borderBottom: '1px solid #f9fafb' }}>
                        <MessageSquare size={16} color="#7c3aed" />
                        <div><p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{bellAlerts.openTickets} Open Tickets</p><p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Support tickets need attention</p></div>
                      </a>
                    )}
                    {bellAlerts.lowStock > 0 && (
                      <a href="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textDecoration: 'none', color: '#1f2937' }}>
                        <AlertCircle size={16} color="#ef4444" />
                        <div><p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{bellAlerts.lowStock} Low Stock Items</p><p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Products need restocking</p></div>
                      </a>
                    )}
                    {bellCount === 0 && (
                      <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>✅ All clear — no alerts</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <p className="hidden sm:block text-sm text-gray-500">
              Welcome, Admin
            </p>
          </div>

        </header>



        {/* ================= CONTENT ================= */}

        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-h-0">

          {children}

        </main>


      </div>


    </div>

  )
}



/* ---------- MENU ITEM ---------- */

function MenuItem({ href, icon, children, badge }: any) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition text-sm ${
        isActive
          ? 'bg-emerald-700 text-white font-semibold'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {badge != null && badge > 0 && (
        <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-4.5 text-center leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}