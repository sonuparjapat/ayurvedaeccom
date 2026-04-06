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
  ShoppingBag,
  Sparkles,
  Package,
  ArrowRight,
  X
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


import toast from 'react-hot-toast'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

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

export function CartSheet(){
  const [cart, setCart] = useState<Cart | null>(null)
const router=useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

const [liked,setLiked] = useState(false)
const [likeLoading,setLikeLoading] = useState(false)
const {handleCart,opencart,setOpencart,totalCartProducts,fetchCart,cartdata,cartloading,loginuserdata}=useAuth()
  /* ================= FETCH CART ================= */




  /* ================= UPDATE QTY ================= */

  const updateQuantity = async (
    productId: number,
    newQty: number,
    stock: number
  ) => {
console.log(newQty,stock)
    if (newQty < 1) return

    const finalQty = Math.min(newQty, stock)
console.log(finalQty,"finalquantity")
    try {

      setLoading(true)

      await axios.put('/cart', {
        productId,
        quantity: finalQty
      })

    await fetchCart(loginuserdata?.id,true)

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

      await fetchCart(loginuserdata?.id,true)

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



  const cartCount = cartdata?.totalItems || 0



  /* ================= UI ================= */

  return (

    <Sheet open={opencart} onOpenChange={setOpencart}>


      {/* ================= TRIGGER ================= */}

      <SheetTrigger asChild>

        <Button
          variant="ghost"
          size="sm"
          className="relative flex items-center gap-2 group"
        >

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
          </motion.div>

          <span className="hidden md:inline font-medium text-gray-700 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
            Cart
          </span>


          {cartCount > 0 && (

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Badge
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs min-w-[22px] h-6 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-gray-900"
              >
                {cartCount}
              </Badge>
            </motion.div>

          )}

        </Button>

      </SheetTrigger>



      {/* ================= SHEET ================= */}
<SheetContent className="w-full sm:max-w-lg flex flex-col z-[9999] p-0 bg-white dark:bg-gray-950">

  {/* HEADER */}
  <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b px-6 py-4 flex items-center justify-between">

    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
        <ShoppingBag className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">Your Cart</p>
        <p className="text-xs text-gray-500">{cartCount} items</p>
      </div>
    </div>

    <button
      onClick={() => setOpencart(false)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      <X size={18} />
    </button>

  </div>


  {/* BODY */}
  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

    {cartdata && cartdata?.items?.length > 0 ? (

      <AnimatePresence>

        {cartdata.items.map((item, index) => (

          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-4 p-4 rounded-2xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition"
          >

            {/* IMAGE */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
              <img
                src={getImage(item.images)}
                className="w-full h-full object-cover"
              />
            </div>

            {/* INFO */}
            <div className="flex-1 flex flex-col justify-between">

              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2">
                  {item.name}
                </h4>

                <p className="text-emerald-600 font-bold text-lg mt-1">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* CONTROLS */}
              <div className="flex items-center justify-between mt-3">

                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <button
                    className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity - 1, item.inventory)
                    }
                  >
                    <Minus size={14} />
                  </button>

                  <span className="px-3 text-sm font-medium">
                    {item.quantity}
                  </span>

                  <button
                    className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity + 1, item.inventory)
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>

              </div>

            </div>

          </motion.div>

        ))}

      </AnimatePresence>

    ) : (

      <div className="text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Cart is empty</h3>
        <p className="text-gray-500 mb-6">Add something amazing ✨</p>

        <Button
          onClick={() => {
            handleCart(false)
            setOpencart(false)
            router.push("/products")
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Shop Now
        </Button>
      </div>

    )}

  </div>


  {/* FOOTER */}
  {cartdata && cartdata?.items?.length > 0 && (

    <div className="border-t p-5 space-y-4 bg-white dark:bg-gray-900">

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Subtotal</span>
        <span className="text-xl font-bold text-emerald-600">
          {formatPrice(cartdata?.subtotal)}
        </span>
      </div>

      <Link href="/checkout">
        <Button
          onClick={() => setOpencart(false)}
          className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
        >
          Checkout
        </Button>
      </Link>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpencart(false)}
      >
        Continue Shopping
      </Button>

    </div>

  )}

</SheetContent>

    </Sheet>

  )
}