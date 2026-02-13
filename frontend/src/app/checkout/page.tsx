'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  CheckCircle,
  MapPin,
  Phone,
  User,
  Shield,
  CreditCard,
  Truck,
  ShoppingBag,
  IndianRupee,
  Lock,
  Sparkles,
  Package
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'

declare global {
  interface Window {
    Razorpay: any
  }
}

/* ================= COMPONENT ================= */

export default function CheckoutPage() {

  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState(1)
  const [processing, setProcessing] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')

  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNo, setOrderNo] = useState('')

  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: ''
  })


  /* ================= FETCH CART ================= */

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {

    try {

      const res = await axios.get('/cart')

      if (!res.data?.items?.length) {
        toast.error('Your cart is empty')
        window.location.href = '/products'
        return
      }

      setCart(res.data)

    } catch (err: any) {

      if (err?.response?.status === 401) {
        toast.error('Login required')
        window.location.href = '/login'
      } else {
        toast.error('Unable to load cart')
      }

    } finally {

      setLoading(false)

    }
  }


  /* ================= PRICE ================= */

  const subtotal = cart?.subtotal || 0
  const tax = +(subtotal * 0.05).toFixed(2)
  const delivery = subtotal > 500 ? 0 : 50
  const total = +(subtotal + tax + delivery).toFixed(2)


  /* ================= VALIDATION ================= */

  const validateShipping = () => {

    if (!shipping.name.trim()) {
      toast.error('Full name is required')
      return false
    }

    if (!/^[6-9]\d{9}$/.test(shipping.phone)) {
      toast.error('Enter valid mobile number')
      return false
    }

    if (shipping.address.trim().length < 10) {
      toast.error('Enter complete address')
      return false
    }

    return true
  }


  /* ================= PLACE ORDER ================= */

  const placeOrder = async () => {

    if (!validateShipping()) return

    if (processing) return


    try {

      setProcessing(true)


      /* CREATE ORDER */

      const res = await axios.post('/orders/create', {
        shipping,
        paymentMethod
      })


      if (!res.data?.success) {
        throw new Error('Order creation failed')
      }


      /* ================= COD ================= */

      if (paymentMethod === 'cod') {

        toast.success('Order placed successfully')

        setOrderNo('ORD' + res.data.orderId)
        setOrderPlaced(true)

        return
      }


      /* ================= ONLINE ================= */

      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded')
        return
      }


      const options = {

        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,

        order_id: res.data.razorpay.id,

        amount: res.data.razorpay.amount,

        currency: 'INR',

        name: 'Your Store',

        description: 'Secure Checkout',

        image: '/logo.png',


        handler: async (response: any) => {

          try {

            const verify = await axios.post('/orders/verify', {
              ...response,
              orderId: res.data.orderId
            })


            if (verify.data?.success) {

              toast.success('Payment successful')

              setOrderNo('ORD' + res.data.orderId)
              setOrderPlaced(true)

            } else {

              toast.error('Payment verification failed')

            }

          } catch {

            toast.error('Payment verification error')

          }
        },


        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled')
          }
        },


        theme: {
          color: '#10b981'
        }

      }


      const rz = new window.Razorpay(options)

      rz.open()


    } catch (err: any) {

      if (err?.response?.status === 400) {
        toast.error(err.response.data?.message || 'Bad request')
      }

      else if (err?.response?.status === 401) {
        toast.error('Unauthorized')
        window.location.href = '/login'
      }

      else if (err?.response?.status === 500) {
        toast.error('Server error')
      }

      else {
        toast.error('Checkout failed')
      }

    } finally {

      setProcessing(false)

    }
  }


  /* ================= LOADING ================= */

  if (loading) {

    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl opacity-30 animate-pulse" />
          <div className="relative animate-spin h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full" />
        </div>
      </div>
    )
  }


  /* ================= SUCCESS ================= */

  if (orderPlaced) {

    return (

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">

        <Header />

        <main className="flex-1 flex justify-center items-center p-6">

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md w-full"
          >

            <div className="relative inline-block">

              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-40 animate-pulse" />

              <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 p-5 rounded-full">
                <CheckCircle size={56} className="text-white" />
              </div>

            </div>

            <h1 className="text-4xl font-bold mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Order Confirmed!
            </h1>

            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
              <Package size={16} className="text-emerald-600" />
              <p className="text-emerald-700 font-semibold">
                #{orderNo}
              </p>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-emerald-600">
                ₹{total}
              </p>
            </div>

            <Button
              className="mt-8 w-full bg-gradient-to-r from-emerald-500 to-teal-500"
              asChild
            >
              <a href="/" className="flex items-center justify-center gap-2">
                <Sparkles size={18} />
                Continue Shopping
              </a>
            </Button>

          </motion.div>

        </main>

        <Footer />

      </div>
    )
  }


  /* ================= MAIN ================= */

  return (

    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">

      <Header />


      {/* PROGRESS BAR */}

      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 py-6 sticky top-0 z-10">

        <div className="max-w-6xl mx-auto px-6">

          <div className="flex justify-between items-center relative">

            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                animate={{
                  width: step === 1 ? '0%' : step === 2 ? '50%' : '100%'
                }}
              />
            </div>

            {[
              { id: 1, name: 'Shipping', icon: Truck },
              { id: 2, name: 'Payment', icon: CreditCard },
              { id: 3, name: 'Confirm', icon: CheckCircle }
            ].map((s, i) => (

              <div
                key={s.id}
                className="relative flex flex-col items-center gap-2 z-10"
              >

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= s.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-gray-400 border'
                  }`}
                >

                  {step > s.id
                    ? <CheckCircle size={20} />
                    : <s.icon size={20} />
                  }

                </div>

                <span className="text-xs hidden sm:block">
                  {s.name}
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>


      <main className="flex-1 max-w-6xl mx-auto p-6 grid lg:grid-cols-3 gap-8 py-12">


        {/* LEFT */}

        <div className="lg:col-span-2 space-y-6">


          {/* ADDRESS */}

          <AnimatePresence>

            {step === 1 && (

              <motion.div>

                <Card className="rounded-3xl shadow-xl border-0 bg-white">

                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                    <CardTitle className="text-white text-2xl flex gap-2">
                      <MapPin /> Shipping Address
                    </CardTitle>
                  </div>

                  <CardContent className="p-8 space-y-5">

                    <Input
                      placeholder="Full Name"
                      value={shipping.name}
                      onChange={e =>
                        setShipping({ ...shipping, name: e.target.value })
                      }
                    />

                    <Input
                      placeholder="Phone"
                      value={shipping.phone}
                      onChange={e =>
                        setShipping({ ...shipping, phone: e.target.value })
                      }
                    />

                    <Input
                      placeholder="Address"
                      value={shipping.address}
                      onChange={e =>
                        setShipping({ ...shipping, address: e.target.value })
                      }
                    />

                    <Button
                      onClick={() => {
                        if (validateShipping()) setStep(2)
                      }}
                      className="w-full h-14"
                    >
                      Continue to Payment
                      <Truck className="ml-2" />
                    </Button>

                  </CardContent>

                </Card>

              </motion.div>

            )}

          </AnimatePresence>


          {/* PAYMENT */}

          <AnimatePresence>

            {step === 2 && (

              <motion.div>

                <Card className="rounded-3xl shadow-xl border-0 bg-white">

                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                    <CardTitle className="text-white text-2xl flex gap-2">
                      <Shield /> Payment Method
                    </CardTitle>
                  </div>

                  <CardContent className="p-8">

                    <Tabs
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >

                      <TabsList className="grid grid-cols-2 gap-4">

                        <TabsTrigger value="cod">
                          <IndianRupee /> COD
                        </TabsTrigger>

                        <TabsTrigger value="online">
                          <CreditCard /> Online
                        </TabsTrigger>

                      </TabsList>

                    </Tabs>


                    <div className="flex gap-4 mt-8">

                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>

                      <Button
                        onClick={placeOrder}
                        disabled={processing}
                        className="flex-1 bg-emerald-600"
                      >
                        {processing ? 'Processing...' : 'Complete Order'}
                      </Button>

                    </div>

                  </CardContent>

                </Card>

              </motion.div>

            )}

          </AnimatePresence>

        </div>


        {/* SUMMARY */}

        <div className="lg:sticky lg:top-32 h-fit">

          <Card className="rounded-3xl shadow-2xl border-0 bg-white">

            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
              <CardTitle className="text-white flex gap-2">
                <ShoppingBag /> Summary
              </CardTitle>
            </div>

            <CardContent className="p-6 space-y-3">

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
              </div>

              <hr />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

            </CardContent>

          </Card>

        </div>

      </main>

      <Footer />

    </div>
  )
}
