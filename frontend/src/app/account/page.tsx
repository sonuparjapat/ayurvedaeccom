'use client'

import { useState, useEffect } from 'react'
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
  Calendar,
  Phone,
  Mail,
  Edit,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  createdAt: string
  estimatedDelivery?: string
  items: {
    name: string
    quantity: number
    price: number
    image: string
  }[]
}

interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  street: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/auth')
      return
    }

    // Load user data
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      // Use setTimeout to avoid synchronous setState
      setTimeout(() => {
        setUser(parsedUser)
        setEditForm({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || ''
        })
      }, 0)
    }

    // Load sample data
    const loadSampleData = () => {
      // Sample orders
      const sampleOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'AVDF2024001',
          status: 'delivered',
          totalAmount: 899,
          createdAt: '2024-01-10',
          items: [
            { name: 'Premium Almonds', quantity: 2, price: 299, image: '🥜' },
            { name: 'Ashwagandha Powder', quantity: 1, price: 199, image: '🌿' }
          ]
        },
        {
          id: '2',
          orderNumber: 'AVDF2024002',
          status: 'shipped',
          totalAmount: 549,
          createdAt: '2024-01-15',
          estimatedDelivery: '2024-01-18',
          items: [
            { name: 'Organic Tofu', quantity: 3, price: 89, image: '🧈' },
            { name: 'Turmeric Powder', quantity: 1, price: 149, image: '🟡' }
          ]
        },
        {
          id: '3',
          orderNumber: 'AVDF2024003',
          status: 'processing',
          totalAmount: 399,
          createdAt: '2024-01-18',
          items: [
            { name: 'Cashew Nuts', quantity: 1, price: 249, image: '🥜' },
            { name: 'Dehydrated Amla', quantity: 2, price: 129, image: '🍅' }
          ]
        }
      ]

      // Sample addresses
      const sampleAddresses: Address[] = [
        {
          id: '1',
          type: 'home',
          street: '123 Wellness Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          isDefault: true
        },
        {
          id: '2',
          type: 'work',
          street: '456 Health Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400002',
          isDefault: false
        }
      ]

      setOrders(sampleOrders)
      setAddresses(sampleAddresses)
    }

    loadSampleData()
    setTimeout(() => setLoading(false), 0)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local storage
      const updatedUser = { ...user, ...editForm }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your account...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.name || 'User'}!
                  </h1>
                  <p className="text-gray-600">Manage your account and orders</p>
                </div>
              </div>
              
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-600 bg-emerald-50 border-r-2 border-emerald-600"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/account?tab=orders"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    >
                      <Package className="w-4 h-4" />
                      Orders
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    >
                      <MapPin className="w-4 h-4" />
                      Addresses
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    >
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                    <Link
                      href="/account?tab=payment"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      Payment Methods
                    </Link>
                    <Link
                      href="/account?tab=settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Profile Information</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name
                            </label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <Input
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button type="submit">Save Changes</Button>
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <p className="text-gray-900">{user?.name || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                              </label>
                              <p className="text-gray-900">{user?.email || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                              </label>
                              <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Member Since
                              </label>
                              <p className="text-gray-900">January 2024</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No orders yet
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Start shopping to see your orders here
                          </p>
                          <Button asChild>
                            <Link href="/products">
                              Start Shopping
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      orders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </Badge>
                            </div>
                            
                            <div className="space-y-3 mb-4">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xl">
                                    {item.image}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="font-medium text-gray-900">
                                    {formatPrice(item.price * item.quantity)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {formatPrice(order.totalAmount)}
                                </p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent value="addresses">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Shipping Addresses</h3>
                      <Button>Add New Address</Button>
                    </div>
                    
                    {addresses.map((address) => (
                      <Card key={address.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 capitalize">
                                  {address.type} Address
                                </h4>
                                {address.isDefault && (
                                  <Badge className="bg-emerald-100 text-emerald-800">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600">
                                {address.street}<br />
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Remove</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment">
                  <Card>
                    <CardContent className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No payment methods yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Add a payment method to make checkout faster
                      </p>
                      <Button>Add Payment Method</Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-500">Receive order updates and offers</p>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Privacy Settings</h4>
                          <p className="text-sm text-gray-500">Control your data and privacy</p>
                        </div>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Delete Account</h4>
                          <p className="text-sm text-gray-500">Permanently delete your account</p>
                        </div>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}