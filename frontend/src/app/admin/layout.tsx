'use client'

import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()
    const {logout } = useAuth()

  /* Mobile Menu State */
  const [mobileOpen, setMobileOpen] = useState(false)


  const logoutfun = () => {
   logout("auth")
  }


  return (

    <div className="min-h-screen w-full border border-red-400 flex bg-gray-100">

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

          w-64 bg-slate-900 text-white flex flex-col
          fixed md:static inset-y-0 left-0 z-50

          transform transition-transform duration-300

          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0

        `}
      >

        {/* Logo */}

        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">

          <h1 className="text-xl font-bold tracking-wide">
            AyurVeda Admin
          </h1>

          {/* Close (Mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden"
          >
            <X size={22} />
          </button>

        </div>


        {/* Menu */}

        <nav className="flex-1 px-4 py-6 space-y-2">

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
          <MenuItem href="/admin/orders" icon={<ShoppingCart size={18} />}>
            Orders
          </MenuItem>

          <MenuItem href="/admin/categories" icon={<ShoppingCart size={18} />}>
            Categories
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

      <div className="w-full flex flex-col md:ml-0">


        {/* ================= TOP BAR ================= */}

        <header className="h-16 bg-white border-b flex items-center justify-between px-6 w-full">

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


          <p className="text-sm text-gray-500">
            Welcome, Admin
          </p>

        </header>



        {/* ================= CONTENT ================= */}

        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">

          {children}

        </main>


      </div>


    </div>

  )
}



/* ---------- MENU ITEM ---------- */

function MenuItem({
  href,
  icon,
  children,
}: any) {

  return (

    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition"
    >
      {icon}
      <span>{children}</span>
    </Link>

  )
}