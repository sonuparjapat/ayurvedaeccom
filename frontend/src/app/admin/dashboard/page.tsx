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
} from 'lucide-react'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


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


  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    loadDashboard()
  }, [])


  const loadDashboard = async () => {
    try {

      const [statsRes, ordersRes, productsRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/recent-orders'),
        axios.get('/admin/top-products'),
      ])

      setStats(statsRes.data)
      setRecentOrders(ordersRes.data)
      setTopProducts(productsRes.data)

    } catch (err: any) {

      if (err?.response?.status === 401) {
        router.push('/admin/auth')
      }

    } finally {
      setLoading(false)
    }
  }


  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    try {
      await axios.post('/admin/logout')
    } finally {
      router.push('/admin/auth')
    }
  }


  /* ---------------- HELPERS ---------------- */

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price)
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
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

        <Button size="sm" variant="outline" onClick={handleLogout}>
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

<Badge className={getStatusColor(o.status)}>
{o.status}
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

</div>

</TabsContent>


{/* OTHER TABS */}

<TabsContent value="orders">
<AdminPlaceholder title="Order Management" />
</TabsContent>

<TabsContent value="products">

<Card>

<CardHeader>
<CardTitle>Product Management</CardTitle>
</CardHeader>

<CardContent>

<p className="text-gray-600 mb-3 text-sm">
Manage all products and stock.
</p>

<Button asChild size="sm">
<Link href="/admin/products">
Open Manager
</Link>
</Button>

</CardContent>

</Card>

</TabsContent>


<TabsContent value="users">
<AdminPlaceholder title="User Management" />
</TabsContent>

<TabsContent value="analytics">
<AdminPlaceholder title="Analytics" />
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


function AdminPlaceholder({ title }: any) {

  return (

    <Card>

      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>

        <p className="text-gray-600 mb-3 text-sm">
          Module coming soon.
        </p>

        <Button size="sm">
          Open {title}
        </Button>

      </CardContent>

    </Card>

  )
}