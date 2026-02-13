'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  ShoppingCart,
  Truck,
  CreditCard,
  User,
  CheckCircle,
  ArrowRight,
  IndianRupee,
  Shield
} from 'lucide-react'

import { motion } from 'framer-motion'

/* ================= TYPES ================= */

interface CartItem {
  product_id: number
  name: string
  price: number
  images: string
  quantity: number
}

interface Cart {
  items: CartItem[]
  subtotal: number
  totalItems: number
}

/* ================= PAGE ================= */

export default function CheckoutPage() {

  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  /* ================= FORM ================= */

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  })

  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')


  /* ================= FETCH CART ================= */

  useEffect(() => {
    fetchCart()
  }, [])


  const fetchCart = async () => {

    try {

      setLoading(true)

      const res = await axios.get('/cart')

      if (!res.data.success) {
        throw new Error('Cart failed')
      }

      setCart({
        items: res.data.items,
        subtotal: res.data.subtotal,
        totalItems: res.data.items.length
      })

    } catch (err: any) {

      console.error(err)

      if (err?.response?.status === 401) {
        toast.error('Login first')
        window.location.href = '/login'
      } else {
        toast.error('Failed to load cart')
      }

    } finally {
      setLoading(false)
    }
  }


  /* ================= HELPERS ================= */

  const getImage = (img: string) => {
    try {
      return JSON.parse(img)[0]
    } catch {
      return '/placeholder.jpg'
    }
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(p)

  const shipping = () => cart && cart.subtotal >= 500 ? 0 : 50
  const tax = () => cart ? cart.subtotal * 0.05 : 0
  const total = () => cart ? cart.subtotal + shipping() + tax() : 0


  /* ================= SUBMIT ================= */

  const handleShippingSubmit = (e: any) => {
    e.preventDefault()
    setCurrentStep(2)
  }


  const handlePaymentSubmit = async (e: any) => {
    e.preventDefault()

    try {

      setIsProcessing(true)

      // Fake order for now (we'll connect backend later)
      await new Promise(r => setTimeout(r, 1500))

      const num = 'ORD' + Date.now().toString().slice(-7)

      setOrderNumber(num)
      setOrderPlaced(true)

      toast.success('Order placed')

    } catch {

      toast.error('Order failed')

    } finally {
      setIsProcessing(false)
    }
  }


  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }


  /* ================= EMPTY ================= */

  if (!cart || cart.items.length === 0) {

    return (
      <div className="h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex justify-center items-center">

          <div className="text-center">

            <ShoppingCart size={60} className="mx-auto mb-4 text-gray-300" />

            <h2 className="text-2xl font-bold mb-2">
              Cart is Empty
            </h2>

            <Button asChild>
              <a href="/products">Shop Now</a>
            </Button>

          </div>

        </main>

        <Footer />
      </div>
    )
  }


  /* ================= SUCCESS ================= */

  if (orderPlaced) {

    return (

      <div className="h-screen flex flex-col">

        <Header />

        <main className="flex-1 flex justify-center items-center bg-gray-50">

          <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md">

            <CheckCircle className="mx-auto text-green-600" size={70} />

            <h1 className="text-2xl font-bold mt-4">
              Order Placed
            </h1>

            <p className="mt-2 text-gray-600">
              Order No: {orderNumber}
            </p>

            <p className="mt-4 font-bold">
              {formatPrice(total())}
            </p>

            <Button className="mt-6 w-full" asChild>
              <a href="/">Continue Shopping</a>
            </Button>

          </div>

        </main>

        <Footer />
      </div>
    )
  }


  /* ================= MAIN ================= */

  return (

    <div className="min-h-screen flex flex-col">

      <Header />

      <main className="flex-1 bg-gray-50">

        <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-3 gap-6">


          {/* FORM */}

          <div className="lg:col-span-2">

            {currentStep === 1 && (

              <Card>

                <CardHeader>
                  <CardTitle>Shipping</CardTitle>
                </CardHeader>

                <CardContent>

                  <form
                    onSubmit={handleShippingSubmit}
                    className="space-y-4"
                  >

                    <Input
                      required
                      placeholder="First Name"
                      value={shippingInfo.firstName}
                      onChange={e =>
                        setShippingInfo({
                          ...shippingInfo,
                          firstName: e.target.value
                        })
                      }
                    />

                    <Input
                      required
                      placeholder="Phone"
                      value={shippingInfo.phone}
                      onChange={e =>
                        setShippingInfo({
                          ...shippingInfo,
                          phone: e.target.value
                        })
                      }
                    />

                    <Input
                      required
                      placeholder="Address"
                      value={shippingInfo.address}
                      onChange={e =>
                        setShippingInfo({
                          ...shippingInfo,
                          address: e.target.value
                        })
                      }
                    />

                    <Button className="w-full">
                      Continue
                      <ArrowRight className="ml-2" />
                    </Button>

                  </form>

                </CardContent>

              </Card>

            )}


            {currentStep === 2 && (

              <Card>

                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>

                <CardContent>

                  <form
                    onSubmit={handlePaymentSubmit}
                    className="space-y-6"
                  >

                    <Tabs
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >

                      <TabsList className="grid grid-cols-2">

                        <TabsTrigger value="cod">
                          COD
                        </TabsTrigger>

                        <TabsTrigger value="online">
                          Online
                        </TabsTrigger>

                      </TabsList>


                      <TabsContent value="cod">

                        <div className="text-center py-6">

                          <IndianRupee size={40} className="mx-auto" />

                          Pay on delivery

                        </div>

                      </TabsContent>


                      <TabsContent value="online">

                        <div className="text-center py-6">

                          <Shield size={40} className="mx-auto" />

                          Secure Payment

                        </div>

                      </TabsContent>

                    </Tabs>


                    <div className="flex gap-4">

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>


                      <Button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? 'Processing...' : 'Place Order'}
                      </Button>

                    </div>

                  </form>

                </CardContent>

              </Card>

            )}

          </div>


          {/* SUMMARY */}

          <Card className="h-fit">

            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              {cart.items.map(i => (

                <div
                  key={i.product_id}
                  className="flex gap-3"
                >

                  <img
                    src={getImage(i.images)}
                    className="w-14 h-14 rounded"
                  />

                  <div className="flex-1">

                    <p className="font-medium">
                      {i.name}
                    </p>

                    <p className="text-sm">
                      Qty: {i.quantity}
                    </p>

                  </div>

                  <p>
                    {formatPrice(i.price * i.quantity)}
                  </p>

                </div>

              ))}


              <hr />

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shipping() === 0
                    ? 'FREE'
                    : formatPrice(shipping())}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatPrice(tax())}</span>
              </div>


              <hr />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total())}</span>
              </div>

            </CardContent>

          </Card>

        </div>

      </main>

      <Footer />

    </div>
  )
}
