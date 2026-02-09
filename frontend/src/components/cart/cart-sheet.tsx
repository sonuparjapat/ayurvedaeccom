'use client'

import { useState, useEffect } from 'react'

import axios from '@/lib/axios'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShoppingBag
} from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'



/* ================= TYPES ================= */

interface CartItem {
  id: number
  quantity: number

  product_id: number
  name: string
  price: number
  images: string[]
  inventory: number
}

interface Cart {
  items: CartItem[]
  subtotal: number
  totalItems: number
}



/* ================= COMPONENT ================= */

export function CartSheet() {

  const [cart, setCart] = useState<Cart | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)



  /* ================= FETCH CART ================= */

  useEffect(() => {
    if (isOpen) fetchCart()
  }, [isOpen])


  const fetchCart = async () => {
    try {

      const res = await axios.get('/cart')

      const items = res.data.cart || []


      // Calculate totals (frontend safety)
      let subtotal = 0
      let totalItems = 0

      items.forEach((item: CartItem) => {
        subtotal += item.price * item.quantity
        totalItems += item.quantity
      })


      setCart({
        items,
        subtotal,
        totalItems
      })

    } catch (err) {
      console.error('Fetch cart error:', err)
    }
  }



  /* ================= UPDATE QTY ================= */

  const updateQuantity = async (
    productId: number,
    newQty: number,
    stock: number
  ) => {

    if (newQty < 1) return

    const finalQty = Math.min(newQty, stock)

    try {

      setLoading(true)

      await axios.put('/cart', {
        productId,
        quantity: finalQty
      })

      await fetchCart()

    } catch (err) {
      console.error('Update qty error:', err)
      alert('Unable to update cart')

    } finally {
      setLoading(false)
    }
  }



  /* ================= REMOVE ================= */

  const removeFromCart = async (productId: number) => {
    try {

      setLoading(true)

      await axios.delete(`/cart/${productId}`)

      await fetchCart()

    } catch (err) {
      console.error('Remove cart error:', err)
      alert('Unable to remove item')

    } finally {
      setLoading(false)
    }
  }



  /* ================= IMAGE ================= */

  const getImage = (images: string[]) => {
    if (!images || !images.length) {
      return '/placeholder-product.jpg'
    }

    return images[0]
  }



  /* ================= PRICE ================= */

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }



  const cartCount = cart?.totalItems || 0



  /* ================= UI ================= */

  return (

    <Sheet open={isOpen} onOpenChange={setIsOpen}>


      {/* ================= TRIGGER ================= */}

      <SheetTrigger asChild>

        <Button
          variant="ghost"
          size="sm"
          className="relative flex items-center gap-2"
        >

          <ShoppingCart className="w-5 h-5" />

          <span className="hidden md:inline">Cart</span>


          {cartCount > 0 && (

            <Badge
              className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs min-w-[20px] h-5"
            >
              {cartCount}
            </Badge>

          )}

        </Button>

      </SheetTrigger>



      {/* ================= SHEET ================= */}

      <SheetContent className="w-full sm:max-w-lg flex flex-col">


        {/* HEADER */}

        <SheetHeader>

          <SheetTitle className="flex items-center gap-2">

            <ShoppingBag className="w-5 h-5" />

            Shopping Cart ({cartCount})

          </SheetTitle>

        </SheetHeader>



        {/* BODY */}

        <div className="flex-1 overflow-y-auto py-6">


          {cart && cart.items.length > 0 ? (

            <div className="space-y-4 p-2">


              <AnimatePresence>


                {cart.items.map(item => (

                  <motion.div
                    key={item.id}

                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}

                    className="flex gap-4 p-4 rounded-xl border bg-white shadow-sm"
                  >


                    {/* IMAGE */}

                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">

                      <img
                        src={getImage(item.images)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />

                    </div>



                    {/* INFO */}

                    <div className="flex-1 min-w-0">


                      <h4 className="font-medium truncate">

                        {item.name}

                      </h4>


                      <div className="flex items-center justify-between mt-2">


                        {/* PRICE */}

                        <span className="font-semibold text-emerald-600">

                          {formatPrice(item.price)}

                        </span>



                        {/* CONTROLS */}

                        <div className="flex items-center gap-2">


                          <Button
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0"

                            disabled={loading}

                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.quantity - 1,
                                item.inventory
                              )
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>



                          <span className="w-8 text-center text-sm font-medium">

                            {item.quantity}

                          </span>



                          <Button
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0"

                            disabled={loading}

                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.quantity + 1,
                                item.inventory
                              )
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>



                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 h-8 p-0 text-red-500 hover:text-red-700"

                            disabled={loading}

                            onClick={() =>
                              removeFromCart(item.product_id)
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>


                        </div>

                      </div>

                    </div>

                  </motion.div>

                ))}

              </AnimatePresence>

            </div>

          ) : (

            /* EMPTY */

            <div className="text-center py-12">


              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />


              <h3 className="text-lg font-medium mb-2">

                Your cart is empty

              </h3>


              <p className="text-gray-500 mb-6">

                Add products to start shopping

              </p>


              <Button onClick={() => setIsOpen(false)}>

                Continue Shopping

              </Button>

            </div>

          )}

        </div>



        {/* FOOTER */}

        {cart && cart.items.length > 0 && (

          <div className="border-t pt-6 space-y-4 m-4">


            <div className="flex justify-between items-center">


              <span className="text-lg font-semibold">

                Subtotal

              </span>


              <span className="text-xl font-bold text-emerald-600">

                {formatPrice(cart.subtotal)}

              </span>

            </div>



            <p className="text-sm text-gray-500 text-center">

              Shipping & taxes calculated at checkout

            </p>



            <div className="space-y-2">


              <Link href="/checkout">

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Proceed to Checkout
                </Button>

              </Link>



              <Button
                variant="outline"
                className="w-full"

                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>


            </div>

          </div>

        )}

      </SheetContent>

    </Sheet>

  )
}