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
  ShoppingCart, 
  Truck, 
  Shield, 
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  IndianRupee
} from 'lucide-react'
import { motion } from 'framer-motion'

interface CartItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images: string
  }
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  totalItems: number
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form states
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

  const [billingInfo, setBillingInfo] = useState({
    sameAsShipping: true,
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  })

  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      setCart(data.cart)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagesJson: string) => {
    try {
      const images = JSON.parse(imagesJson || '[]')
      return images[0] || '/placeholder-product.jpg'
    } catch {
      return '/placeholder-product.jpg'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }

  const calculateShipping = () => {
    if (!cart) return 0
    return cart.subtotal >= 500 ? 0 : 50
  }

  const calculateTax = () => {
    if (!cart) return 0
    return cart.subtotal * 0.05 // 5% GST
  }

  const calculateTotal = () => {
    if (!cart) return 0
    return cart.subtotal + calculateShipping() + calculateTax()
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep(2)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    if (paymentMethod === 'online') {
      try {
        // Initialize Razorpay
        const options = {
          key: 'rzp_test_1DP5mmOlF5G5ag', // Test key - replace with your live key
          amount: calculateTotal() * 100, // Amount in paise
          currency: 'INR',
          name: 'AyurVeda Desi Foods',
          description: `Order Payment - ${cart.items.length} items`,
          image: '/logo.svg',
          handler: function (response: any) {
            // Payment successful
            handlePaymentSuccess(response.razorpay_payment_id)
          },
          prefill: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            email: shippingInfo.email,
            contact: shippingInfo.phone
          },
          notes: {
            address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.postalCode}`
          },
          theme: {
            color: '#10b981' // emerald-600
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false)
            }
          }
        }

        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
      } catch (error) {
        console.error('Payment error:', error)
        setIsProcessing(false)
      }
    } else {
      // COD order
      await handlePaymentSuccess('cod_' + Date.now())
    }
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Create order in backend
      const orderData = {
        shippingInfo,
        items: cart.items,
        subtotal: cart.subtotal,
        shipping: calculateShipping(),
        tax: calculateTax(),
        total: calculateTotal(),
        paymentMethod,
        paymentId
      }

      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate order number
      const orderNum = 'AVDF' + Date.now().toString().slice(-8)
      setOrderNumber(orderNum)
      setOrderPlaced(true)
      setIsProcessing(false)
      
      // Clear cart
      // In real app, you'd call the cart clear API
      
    } catch (error) {
      console.error('Order creation error:', error)
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to checkout</p>
            <Button asChild>
              <a href="/products">Continue Shopping</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>
            
            <div className="bg-white rounded-lg p-6 mb-6">
              <p className="text-gray-600 mb-2">Order Number:</p>
              <p className="text-2xl font-bold text-emerald-600 mb-4">{orderNumber}</p>
              
              <div className="text-left space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold">
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <span className="font-semibold">3-5 business days</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                You will receive an order confirmation email shortly with tracking details.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                <a href="/">Continue Shopping</a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/contact">Contact Support</a>
              </Button>
            </div>
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
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center max-w-2xl mx-auto">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <span className="ml-2 font-medium">Shipping</span>
              </div>
              
              <div className={`w-16 h-1 mx-4 ${
                currentStep >= 2 ? 'bg-emerald-600' : 'bg-gray-200'
              }`}></div>
              
              <div className={`flex items-center ${currentStep >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200'
                }`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
              
              <div className={`w-16 h-1 mx-4 ${
                currentStep >= 3 ? 'bg-emerald-600' : 'bg-gray-200'
              }`}></div>
              
              <div className={`flex items-center ${currentStep >= 3 ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="ml-2 font-medium">Confirmation</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleShippingSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name *
                            </label>
                            <Input
                              value={shippingInfo.firstName}
                              onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                              required
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name *
                            </label>
                            <Input
                              value={shippingInfo.lastName}
                              onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                              required
                              placeholder="Doe"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email *
                            </label>
                            <Input
                              type="email"
                              value={shippingInfo.email}
                              onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                              required
                              placeholder="john@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone *
                            </label>
                            <Input
                              type="tel"
                              value={shippingInfo.phone}
                              onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                              required
                              placeholder="+91 98765 43210"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                          </label>
                          <Input
                            value={shippingInfo.address}
                            onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                            required
                            placeholder="123 Wellness Street"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <Input
                              value={shippingInfo.city}
                              onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                              required
                              placeholder="Mumbai"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <Input
                              value={shippingInfo.state}
                              onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                              required
                              placeholder="Maharashtra"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PIN Code *
                            </label>
                            <Input
                              value={shippingInfo.postalCode}
                              onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
                              required
                              placeholder="400001"
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                          Continue to Payment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePaymentSubmit} className="space-y-6">
                        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cod">Cash on Delivery</TabsTrigger>
                            <TabsTrigger value="online">Online Payment</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="cod" className="mt-6">
                            <div className="text-center py-8">
                              <IndianRupee className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Pay on Delivery
                              </h3>
                              <p className="text-gray-600 mb-4">
                                Pay cash when your order is delivered
                              </p>
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <p className="text-sm text-emerald-700">
                                  <strong>Note:</strong> Please keep exact change ready for smooth delivery
                                </p>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="online" className="mt-6">
                            <div className="text-center py-8">
                              <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Secure Online Payment
                              </h3>
                              <p className="text-gray-600 mb-4">
                                Pay securely using Razorpay, UPI, or Net Banking
                              </p>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                  All payment transactions are secured with 256-bit encryption
                                </p>
                              </div>
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
                            Back to Shipping
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              "Processing..."
                            ) : (
                              <>
                                Place Order
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="sticky top-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-6">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getImageUrl(item.product.images)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            <p className="font-semibold text-emerald-600">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>
                          {calculateShipping() === 0 ? 'FREE' : formatPrice(calculateShipping())}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (5% GST):</span>
                        <span>{formatPrice(calculateTax())}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-emerald-600">{formatPrice(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>

                    {cart.subtotal < 500 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700">
                          Add <strong>{formatPrice(500 - cart.subtotal)}</strong> more for FREE shipping!
                        </p>
                      </div>
                    )}

                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Secure checkout</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>30-day return policy</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>24/7 customer support</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}