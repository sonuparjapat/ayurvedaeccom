'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import StarRating from '@/components/StartRatings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import {
  Grid,
  List,
  ShoppingCart,
  Heart,
  Star,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'


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

const toggleLike = async (id: string) => {

  try {

    await axios.post('/shop/wishlist', {
      productId: id,
    })

  } catch (err) {
    console.error(err)
  }

}
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

      console.error('Fetch Error:', err)

    } finally {

      setLoading(false)

    }

  }


  const fetchCategories = async () => {

    try {

      const res = await axios.get(
        '/shop/categories'
      )

      setCategories(res.data.categories || [])

    } catch (err) {

      console.error(err)

    }

  }


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


const renderStars = (
  productId: string,
  avgRating: number
) => {

  const [rating, setRating] =
    useState(Math.round(avgRating))

  const [hover, setHover] = useState(0)

  const submitRating = async (value: number) => {

    try {

      await axios.post('/api/shop/review', {
        productId,
        rating: value,
        comment: '',
      })

      setRating(value)

      toast.success('Thanks for rating ⭐')

    } catch {

      toast.error('Login required')

    }

  }


  return (

    <div className="flex gap-1">

      {[1,2,3,4,5].map(i => (

        <button
          key={i}
          onClick={() => submitRating(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >

          <Star
            size={16}
            className={`transition ${
              i <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />

        </button>

      ))}

    </div>

  )

}


  /* ---------- ACTIONS ---------- */

  const addToCart = async (id: string) => {

  try {

    await axios.post('/shop/cart', {
      productId: id,
      quantity: 1,
    })

    toast.success('Added to cart')

  } catch {
    toast.error('Failed')
  }

}



 

  const totalPages = Math.ceil(total / limit)


  /* ================= UI ================= */

  return (

    <div className="min-h-screen flex flex-col bg-gray-50">


      <Header />


      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white">


        {/* HEADER */}

        <div className="bg-white border-b">

          <div className="container mx-auto px-4 py-8">

            <h1 className="text-3xl font-bold tracking-tight">
              Our Products
            </h1>

            <p className="text-gray-600 mt-1">
              Discover premium Ayurvedic products
            </p>

          </div>

        </div>


        <div className="container mx-auto px-4 py-8">


          {/* TOP BAR */}

          <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center">


            {/* SEARCH + FILTER */}

            <div className="flex gap-3 flex-wrap">

              <Input
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search products..."
                className="w-72"
              />


              <Button
                variant="outline"
                onClick={() =>
                  setShowFilters(!showFilters)
                }
              >
                <SlidersHorizontal size={16} />
                Filters
              </Button>

            </div>


            {/* VIEW */}

            <div className="flex gap-2">

              <Button
                variant={viewMode === 'grid'
                  ? 'default'
                  : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </Button>


              <Button
                variant={viewMode === 'list'
                  ? 'default'
                  : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>

            </div>

          </div>


          {/* FILTERS */}

          <AnimatePresence>

            {showFilters && (

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white border rounded-xl p-4 mb-8"
              >

                <div className="flex flex-wrap gap-2">

                  <Button
                    size="sm"
                    variant={
                      category === 'all'
                        ? 'default'
                        : 'outline'
                    }
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
                      variant={
                        category === c
                          ? 'default'
                          : 'outline'
                      }
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


          {/* PRODUCTS */}

          {loading ? (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {[...Array(6)].map((_, i) => (

                <Card key={i} className="animate-pulse">

                  <div className="h-48 bg-gray-200" />

                </Card>

              ))}

            </div>

          ) : (

            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >


              <AnimatePresence>

                {products.map((product) => (

                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >

                    <Card className="group hover:shadow-xl transition-all duration-300">


                      <CardContent className="p-4 relative">


                        {/* IMAGE */}

                        <div className="h-52 mb-3 overflow-hidden rounded-lg">

                          <img
                            src={getImageUrl(product.images)}
                            className="
                              w-full h-full object-cover
                              group-hover:scale-110
                              transition-transform duration-500
                            "
                          />

                        </div>


                        {/* INFO */}

                        <Badge className="mb-1">
                          {product.category_name}
                        </Badge>


                        <h3 className="font-semibold text-lg leading-tight">
                          {product.name}
                        </h3>


                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.shortdescription}
                        </p>


                        {/* PRICE */}

                        <div className="mt-2 flex items-center gap-2">

                          <span className="font-bold text-emerald-600 text-lg">

                            {formatPrice(product.price)}

                          </span>


                          {product.compareprice && (

                            <span className="text-sm text-gray-400 line-through">

                              {formatPrice(product.compareprice)}

                            </span>

                          )}

                        </div>


                        {/* RATING */}

                        <div className="flex gap-2 mt-1 items-center">

  <StarRating
    productId={product.id}
    avgRating={product.averagerating}
    refresh={fetchProducts}
  />

  <span className="text-xs text-gray-500">

    ({product.reviewcount})

  </span>

</div>


                        {/* ACTIONS */}

                        <div className="flex justify-between mt-4">


                       <Button
  size="sm"
  variant="ghost"
  onClick={() => toggleLike(product.id)}
>
  <Heart size={16} />
</Button>


                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={product.inventory === 0}
                            onClick={() =>
                              addToCart(product.id)
                            }
                          >

                            <ShoppingCart size={16} className="mr-1" />
                            Add to Cart

                          </Button>

                        </div>


                      </CardContent>

                    </Card>

                  </motion.div>

                ))}

              </AnimatePresence>

            </div>

          )}


          {/* PAGINATION */}

          {totalPages > 1 && (

            <div className="flex justify-center items-center gap-2 mt-12">


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
                  variant={
                    page === i + 1
                      ? 'default'
                      : 'outline'
                  }
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

      </main>


      <Footer />

    </div>
  )
}
