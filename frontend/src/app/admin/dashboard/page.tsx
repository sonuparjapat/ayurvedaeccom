'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import {
  Shield,
  LogOut,
  Settings,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'


/* ---------------- TYPES ---------------- */

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalProducts: number
  pendingOrders: number
  lowStockItems: number
}

interface Order {
  id: string
  order_number: string
  customer: string
  amount: number
  status: string
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
  stock: number
}


/* ---------------- COMPONENT ---------------- */

export default function AdminDashboard() {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  })

  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
const {statusList,logout}=useAuth()

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    loadDashboard()
  }, [])


  const loadDashboard = async () => {
    try {

      const [statsRes, ordersRes, productsRes, lowStockRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/recent-orders'),
        axios.get('/admin/top-products'),
        axios.get('/admin/low-stock'),
      ])

      setStats(statsRes.data)
      setRecentOrders(ordersRes.data)
      setTopProducts(productsRes.data)
      setLowStockProducts(lowStockRes.data?.products || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  /* ---------------- LOGOUT ---------------- */



  /* ---------------- HELPERS ---------------- */

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price)
  }


  const getStatusColor = (status:number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800'
      case 1: return 'bg-blue-100 text-blue-800'
      case 2: return 'bg-purple-100 text-purple-800'
           case 3: return 'bg-yellow-100 text-yellow-800'
      case 4: return 'bg-green-100 text-green-800'
           case 5: return 'bg-red-100 text-red-800'
             case 6: return 'bg-red-100 text-red-800'
               case 7: return 'bg-red-100 text-red-800'
                 case 8: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


/* ---------------- LOADING ---------------- */

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full mx-auto mb-4" />
        <p>Loading dashboard...</p>
      </div>
    </div>
  )
}


/* ---------------- UI ---------------- */

return (

<div className="min-h-screen flex flex-col bg-gray-50">


{/* HEADER */}

<header className="bg-white border-b sticky top-0 z-40">

  <div className="max-w-7xl mx-auto px-4 py-3">

    <div className="flex flex-wrap gap-3 items-center justify-between">


      {/* Logo */}

      <div className="flex items-center gap-3">

        <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center">
          <Shield className="text-white" size={16} />
        </div>

        <div>
          <h1 className="font-bold text-base sm:text-lg">
            Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            AyurVeda Desi Foods
          </p>
        </div>

      </div>


      {/* Buttons */}

      <div className="flex gap-2">

        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/settings">
            <Settings size={15} />
          </Link>
        </Button>

        <Button size="sm" variant="outline" onClick={()=>(logout('auth'))}>
          <LogOut size={15} />
        </Button>

      </div>

    </div>

  </div>

</header>


{/* CONTENT */}

<main className="flex-1">

<div className="max-w-7xl mx-auto px-4 py-6">


{/* STATS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

<StatCard
title="Revenue"
value={formatPrice(stats.totalRevenue)}
icon={<DollarSign className="text-emerald-600" />}
bg="bg-emerald-100"
/>

<StatCard
title="Orders"
value={stats.totalOrders}
icon={<ShoppingCart className="text-blue-600" />}
bg="bg-blue-100"
/>

<StatCard
title="Users"
value={stats.totalUsers}
icon={<Users className="text-purple-600" />}
bg="bg-purple-100"
/>

<StatCard
title="Products"
value={stats.totalProducts}
icon={<Package className="text-orange-600" />}
bg="bg-orange-100"
/>

</div>


{/* TABS */}

<Tabs defaultValue="overview" className="space-y-5">


{/* Scrollable Tabs */}

<div className="overflow-x-auto">

<TabsList className="flex w-max min-w-full">

<TabsTrigger value="overview">Overview</TabsTrigger>
<TabsTrigger value="orders">Orders</TabsTrigger>
<TabsTrigger value="products">Products</TabsTrigger>
<TabsTrigger value="users">Users</TabsTrigger>
<TabsTrigger value="analytics">Analytics</TabsTrigger>

</TabsList>

</div>


{/* OVERVIEW */}

<TabsContent value="overview">

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">


{/* Orders */}

<Card>

<CardHeader>
<CardTitle>Recent Orders</CardTitle>
</CardHeader>

<CardContent className="space-y-3 max-h-[400px] overflow-auto">

{recentOrders.map((o) => (

<div key={o.id} className="flex justify-between items-start gap-3 border-b pb-2">

<div>

<p className="font-medium text-sm">
{o.order_number}
</p>

<Badge className={getStatusColor(o?.status)}>
{statusList?.find((item:any)=>item.code==o.status)?.label}
</Badge>

<p className="text-xs text-gray-500">
{o.customer}
</p>

</div>

<p className="font-semibold text-sm whitespace-nowrap">
{formatPrice(o.amount)}
</p>

</div>

))}

</CardContent>

</Card>


{/* Products */}

<Card>

<CardHeader>
<CardTitle>Top Products</CardTitle>
</CardHeader>

<CardContent className="space-y-3 max-h-[400px] overflow-auto">

{topProducts.map((p, i) => (

<div key={i} className="flex justify-between gap-3 border-b pb-2">

<div>

<p className="font-medium text-sm">{p.name}</p>

<p className="text-xs text-gray-500">
{p.sales} sold
</p>

</div>

<div className="text-right">

<p className="font-semibold text-sm">
{formatPrice(p.revenue)}
</p>

<p className="text-xs text-gray-500">
Stock: {p.stock}
</p>

</div>

</div>

))}

</CardContent>

</Card>

{/* Low Stock Alert */}
{lowStockProducts.length > 0 && (
  <Card className="border-amber-200 bg-amber-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-amber-700">
        <AlertTriangle size={18} className="text-amber-500" />
        Low Stock Alert ({lowStockProducts.length} products)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 max-h-75 overflow-auto">
      {lowStockProducts.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
          <div className="flex items-center gap-2">
            {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover" />}
            <p className="text-sm font-medium text-gray-800 truncate max-w-50">{p.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.inventory === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {p.inventory === 0 ? 'Out of Stock' : `${p.inventory} left`}
            </span>
            <Link href={`/admin/products?edit=${p.id}`} className="text-xs text-blue-600 hover:underline">Update</Link>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)}

</div>

</TabsContent>


{/* ORDERS TAB */}

<TabsContent value="orders">
<AdminLinkCard
title="Order Management"
desc="Manage orders, shipping and status."
href="/admin/orders"
icon={<ShoppingCart />}
/>
</TabsContent>


{/* PRODUCTS TAB */}

<TabsContent value="products">

<AdminLinkCard
title="Product Management"
desc="Manage all products and stock."
href="/admin/products"
icon={<Package />}
/>

</TabsContent>


{/* USERS TAB */}

<TabsContent value="users">

<AdminLinkCard
title="User Management"
desc="Manage registered customers."
href="/admin/users"
icon={<Users />}
/>

</TabsContent>


{/* ANALYTICS TAB */}

<TabsContent value="analytics">

<AdminLinkCard
title="Analytics"
desc="View reports and performance."
href="/admin/analytics"
icon={<BarChart3 />}
/>

</TabsContent>


</Tabs>

</div>

</main>

</div>

)

}


/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value, icon, bg }: any) {

  return (

    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >

      <Card>

        <CardContent className="p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-gray-600">
                {title}
              </p>

              <p className="text-base sm:text-lg font-bold">
                {value}
              </p>

            </div>

            <div
              className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}
            >
              {icon}
            </div>

          </div>

        </CardContent>

      </Card>

    </motion.div>

  )
}


/* LINK CARD */

function AdminLinkCard({
  title,
  desc,
  href,
  icon,
}: any) {

  return (

    <Card>

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>

        <p className="text-gray-600 mb-3 text-sm">
          {desc}
        </p>

        <Button asChild size="sm">

          <Link href={href}>
            Open {title}
          </Link>

        </Button>

      </CardContent>

    </Card>

  )
}