'use client'
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
} from 'lucide-react'


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()


  const logout = () => {
    localStorage.clear()
    router.push('/admin/auth')
  }


  return (
    <div className="min-h-screen w-full border border-red-400 flex bg-gray-100">
<Toaster position="top-right" />

      {/* ========== SIDEBAR ========== */}

      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">

        {/* Logo */}

        <div className="h-16 flex items-center justify-center border-b border-slate-700">

          <h1 className="text-xl font-bold tracking-wide">
            AyurVeda Admin
          </h1>

        </div>


        {/* Menu */}

        <nav className="flex-1 px-4 py-6 space-y-2">

          <MenuItem href="/admin/dashboard" icon={<LayoutDashboard size={18} />}>
            Dashboard
          </MenuItem>

          <MenuItem href="/admin/products" icon={<Package size={18} />}>
            Products
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

          <MenuItem href="/admin/analytics" icon={<BarChart3 size={18} />}>
            Analytics
          </MenuItem>

        </nav>


        {/* Logout */}

        <div className="p-4 border-t border-slate-700">

          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>


      {/* ========== MAIN ========== */}
<div className='w-full'>
      <div className="flex justify-between w-full border border-green-400">


        {/* TOP BAR */}

        <header className="h-16 bg-white border-b flex items-center justify-between px-6  w-full">

          <h2 className="font-semibold text-lg">
            Admin Panel
          </h2>

          <p className="text-sm text-gray-500">
            Welcome, Admin
          </p>

        </header>

  </div>
  
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">

          {children}

        </main>
  </div>
        {/* PAGE CONTENT */}


    

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
