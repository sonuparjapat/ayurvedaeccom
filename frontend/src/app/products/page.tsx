'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import StarRating from '@/components/StartRatings'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import {
  Grid,
  List,
  ShoppingCart,
  Heart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  AlertCircle,
  Check,
  Package
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'

import { notify } from '../utils/notify'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'


/* ================= TYPES ================= */

interface Product {
  id: string
  name: string
  slug: string
  shortdescription: string
  price: number
  compareprice?: number
  images: string
  inventory: number
  category_name: string
  averagerating: number
  reviewcount: number
}


/* ================= COMPONENT ================= */

export default function ProductsPage() {


  /* ---------- STATE ---------- */

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')


  const [page, setPage] = useState(1)
  const limit = 9
  const [total, setTotal] = useState(0)

  const [viewMode, setViewMode] =
    useState<'grid' | 'list'>('grid')

  const [showFilters, setShowFilters] = useState(false)


  const { handleCart, opencart, setOpencart, totalCartProducts, fetchCart, cartdata, cartloading, loginuserdata } = useAuth()

  const router = useRouter()


  /* ---------- FETCH ---------- */

  useEffect(() => {

    fetchCategories()
    fetchProducts()

  }, [])





  useEffect(() => {

    const t = setTimeout(() => {
      fetchProducts()
    }, 400)

    return () => clearTimeout(t)

  }, [search, category, page])


  /* ---------- API ---------- */

  const fetchProducts = async () => {

    try {

      setLoading(true)

      const res = await axios.get(
        '/shop/public',
        {
          params: {
            search,
            category,
            page,
            limit,
          },
        }
      )

      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)

    } catch (err) {

      notify.error('Unable to load products')

    } finally {

      setLoading(false)

    }

  }


  const fetchCategories = async () => {

    try {

      const res = await axios.get('/shop/categories')

      setCategories(res.data.categories || [])

    } catch {

      notify.error('Category load failed')

    }

  }
  console.log(cartdata, products, "coming")




  /* ---------- HELPERS ---------- */

  const getImageUrl = (images: string) => {

    try {

      const arr = (images || '[]')

      return arr[0] || '/placeholder-product.jpg'

    } catch {

      return '/placeholder-product.jpg'

    }

  }


  const formatPrice = (price: number) => {

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price)

  }


  /* ---------- ACTIONS ---------- */

  const toggleLike = async (id: string) => {

    try {

      await axios.post('/shop/wishlist', {
        productId: id,
      })

      notify.success('Wishlist updated')

    } catch {

      notify.error('Login required')

    }

  }


  const addToCart = async (id: string) => {

    if (!loginuserdata?.id) {

      notify.error('Login first')
      router.push('/login')
      return
    }

    try {

      await axios.post('/cart', {
        productId: id,
        quantity: 1,
      })

      notify.success('Added to cart')

      fetchCart(loginuserdata?.id)


    } catch {

      notify.error('Add to cart failed')

    }

  }


  const totalPages = Math.ceil(total / limit)


  /* ================= UI ================= */

  return (

    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">


      <Header />


      {/* ================= HERO ================= */}

      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 text-white py-16">

        <div className="max-w-7xl mx-auto px-6 text-center">

          <h1 className="text-5xl md:text-6xl font-bold mb-3">
            Our Products
          </h1>

          <p className="text-stone-300">
            Premium Ayurvedic Collection
          </p>

        </div>

      </div>



      <div className="max-w-7xl mx-auto px-6 py-12">


        {/* ================= CONTROLS ================= */}

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-10 flex flex-col lg:flex-row gap-4 justify-between items-center">


          {/* SEARCH */}

          <div className="relative w-full lg:w-96">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <Input
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search products..."
              className="pl-12 h-12 rounded-xl"
            />

          </div>


          <div className="flex items-center gap-3">


            {/* FILTER */}

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl"
              variant={showFilters ? 'default' : 'outline'}
            >
              <SlidersHorizontal size={16} />
              Filters
            </Button>


            {/* VIEW */}

            <div className="flex border rounded-xl overflow-hidden">

              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </Button>

              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>

            </div>

          </div>

        </div>


        {/* ================= FILTERS ================= */}

        <AnimatePresence>

          {showFilters && (

            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-2xl shadow p-6 mb-10"
            >

              <div className="flex flex-wrap gap-3">

                <Button
                  size="sm"
                  variant={category === 'all' ? 'default' : 'outline'}
                  onClick={() => {
                    setCategory('all')
                    setPage(1)
                  }}
                >
                  All
                </Button>


                {categories.map(c => (

                  <Button
                    key={c}
                    size="sm"
                    variant={category === c ? 'default' : 'outline'}
                    onClick={() => {
                      setCategory(c)
                      setPage(1)
                    }}
                  >
                    {c}
                  </Button>

                ))}

              </div>

            </motion.div>

          )}

        </AnimatePresence>



        {/* ================= PRODUCTS ================= */}

        {loading ? (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {[...Array(6)].map((_, i) => (

              <div
                key={i}
                className="h-80 bg-gray-200 rounded-2xl animate-pulse"
              />

            ))}

          </div>

        ) : (

          <div
            className={`grid ${viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
              } gap-8`}
          >


            {products.map((product, i) => {
              console.log(cartdata, "card data cmon")

              const inCart =
                cartdata?.items?.filter(
                  c => c.product_id == product.id
                ).length >= 1


              return (

                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:-translate-y-2 transition-all"
                >


                  {/* IMAGE */}

                  <div className="relative h-72 overflow-hidden bg-gray-100">

                    <img
                      src={getImageUrl(product.images)}
                      className="w-full h-full object-cover hover:scale-110 transition-all duration-500"
                    />


                    {/* OUT STOCK */}

                    {product.inventory === 0 && (

                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <Package size={36} />
                        <span className="ml-2">Unavailable</span>
                      </div>

                    )}


                    {/* LIKE */}

                    <button
                      onClick={() => toggleLike(product.id)}
                      disabled={product.inventory === 0}
                      className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center"
                    >

                      <Heart size={18} />

                    </button>

                  </div>


                  {/* INFO */}

                  <div className="p-6">

                    <div className='flex justify-between'>
                      <div>
                        <div className="text-xs text-amber-600 font-bold mb-1 uppercase">
                          {product.category_name}
                        </div>


                        <h3 className="text-xl font-bold mb-2">
                          {product.name}
                        </h3>


                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {product.shortdescription}
                        </p>
                      </div>

                      {/* RATING */}

                      <div className="mb-4 mt-2">

                        <StarRating
                          productId={product.id}
                          avgRating={product.averagerating}
                          refresh={fetchProducts}
                        />

                        <span className="text-xs text-gray-500 ml-1">
                          ({product.reviewcount})
                        </span>

                      </div>
                    </div>

                    {/* PRICE */}
                    <div className='flex justify-between'>

                      <div className="flex items-center gap-2 mb-3">

                        <span className="text-2xl font-bold">
                          {formatPrice(product.price)}
                        </span>

                        {product.compareprice && (
                          <span className="line-through text-gray-400">
                            {formatPrice(product.compareprice)}
                          </span>
                        )}

                      </div>


                      {/* STOCK */}

                      <div className="mb-4 text-sm">

                        {product.inventory === 0 ? (

                          <div className="text-red-600 flex gap-1">
                            <AlertCircle size={14} />
                            Out of Stock
                          </div>

                        ) : product.inventory <= 5 ? (

                          <div className="text-orange-600 flex gap-1">
                            <AlertCircle size={14} />
                            Only {product.inventory} left
                          </div>

                        ) : (

                          <div className="text-green-600 flex gap-1">
                            <Check size={14} />
                            In Stock: {product.inventory}
                          </div>

                        )}

                      </div>
                    </div>




                    {/* ACTIONS */}

                    <div className="flex gap-3">


                      <Link
                        href={`/product/${product.id}`}
                        className="flex-1"
                      >

                        <Button
                          variant="outline"
                          className="w-full"
                        >
                          <Eye size={16} />
                          View
                        </Button>

                      </Link>


                      {product.inventory === 0 ? (

                        <Button
                          disabled
                          className="flex-1 bg-gray-300"
                        >
                          Out
                        </Button>

                      ) : inCart ? (

                        <Button
                          onClick={() => handleCart(true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <ShoppingCart size={16} />
                          Cart
                        </Button>

                      ) : (

                        <Button
                          onClick={() => addToCart(product.id)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700"
                        >
                          <ShoppingCart size={16} />
                          Add
                        </Button>

                      )}

                    </div>

                  </div>

                </motion.div>

              )

            })}

          </div>

        )}



        {/* ================= PAGINATION ================= */}

        {totalPages > 1 && (

          <div className="flex justify-center gap-2 mt-12">


            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>


            {Array.from({ length: totalPages }).map((_, i) => (

              <Button
                key={i}
                size="sm"
                variant={page === i + 1 ? 'default' : 'outline'}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>

            ))}


            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>

          </div>

        )}

      </div>


      <Footer />

    </div>

  )
}
