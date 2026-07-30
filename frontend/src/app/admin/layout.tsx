'use client'

import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

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
} from 'lucide-react'
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


  const logoutfun = () => {
   logout("auth")
  }


  return (

    <div className="h-screen w-full flex bg-gray-100 overflow-hidden">

      <Toaster position="top-right" />


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


          <p className="hidden sm:block text-sm text-gray-500">
            Welcome, Admin
          </p>

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