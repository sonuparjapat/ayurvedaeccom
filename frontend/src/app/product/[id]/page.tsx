'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Head from 'next/head'
import Link from 'next/link'
import toast from 'react-hot-toast'
import axios from '@/lib/axios'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import {
  ShoppingCart,
  Heart,
  Star,
  Minus,
  Plus,
  CheckCircle,
  Truck,
  Shield
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'


/* ================= TYPES ================= */

interface Product {
  id: number
  name: string
  slug: string
  shortdescription: string
  longdescription: string
  price: string
  compareprice?: string
  inventory: number
  images: string[]
  averagerating: string
  reviewcount: number
  meta_title?: string
  meta_description?: string
  category_name?: string
  brand?: string
}


/* ================= PAGE ================= */

export default function ProductDetailPage() {

  const { id } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  // Button loading
  const [cartLoading, setCartLoading] = useState(false)



  /* ================= FETCH ================= */

  useEffect(() => {
    if (id) fetchProduct()
  }, [id])


  const fetchProduct = async () => {
    try {

      const res = await axios.get(`/shop/public/${id}`)
      const product = res.data?.data || []

      setProduct(product)

    } catch (err) {
      console.error('Fetch product error:', err)
    } finally {
      setLoading(false)
    }
  }



  /* ================= HELPERS ================= */

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(price))
  }


  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }



  /* ================= ADD TO CART ================= */

  const addToCart = async () => {

    if (!product) return

    try {

      if (cartLoading) return

      setCartLoading(true)


      // Limit by stock (extra safety)
      const finalQty = Math.min(qty, product.inventory)


      await axios.post('/cart', {
        productId: product.id,
        quantity: finalQty
      })


      toast.success('Added to cart ✅')


    } catch (err: any) {

      console.error('Add to cart error:', err)

      if (err?.response?.status === 401) {
        alert('Please login first')
      }

      else if (err?.response?.data?.message) {
        alert(err.response.data.message)
      }

      else {
        toast.error('Something went wrong')
      }

    } finally {
      setCartLoading(false)
    }
  }



  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">

        <div className="animate-spin h-14 w-14 border-4 border-emerald-500 border-t-transparent rounded-full"></div>

      </div>
    )
  }



  /* ================= NOT FOUND ================= */

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">

        <h2 className="text-3xl font-bold mb-4">
          Product Not Found 😕
        </h2>

        <Link href="/products">
          <Button>Go Back</Button>
        </Link>

      </div>
    )
  }


  const rating = Math.round(Number(product.averagerating))



  /* ================= UI ================= */

  return (
    <>

      <Header />


      {/* ================= SEO ================= */}

      <Head>

        <title>
          {product.meta_title || product.name}
        </title>

        <meta
          name="description"
          content={
            product.meta_description ||
            product.shortdescription
          }
        />

      </Head>



      {/* ================= PAGE ================= */}

      <div className="max-w-7xl mx-auto px-4 py-12">


        {/* BREADCRUMB */}

        <div className="text-sm mb-8 text-gray-500">

          <Link href="/" className="hover:text-emerald-600">
            Home
          </Link> /{' '}

          <Link href="/products" className="hover:text-emerald-600">
            Products
          </Link> /{' '}

          <span className="text-black font-medium">
            {product.name}
          </span>

        </div>



        {/* MAIN GRID */}

        <div className="grid lg:grid-cols-2 gap-14 items-start">


          {/* ================= IMAGES ================= */}

          <div className="space-y-5">

            <div className="relative group aspect-square bg-white rounded-2xl overflow-hidden shadow-xl">

              <img
                src={product.images[activeImg]}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt={product.name}
              />

            </div>


            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">

              {product.images.map((img, i) => (

                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2
                  ${activeImg === i
                      ? 'border-emerald-600'
                      : 'border-gray-200'}
                `}
                >

                  <img
                    src={img}
                    className="w-full h-full object-cover"
                  />

                </button>

              ))}

            </div>

          </div>



          {/* ================= INFO ================= */}

          <div className="space-y-6">


            <Badge className="bg-emerald-100 text-emerald-700">
              {product.brand || product.category_name || 'Ayurveda'}
            </Badge>


            <h1 className="text-3xl lg:text-4xl font-bold">

              {product.name}

            </h1>


            <p className="text-gray-600">

              {product.shortdescription}

            </p>


            {/* RATING */}

            <div className="flex items-center gap-2">

              {renderStars(rating)}

              <span className="text-sm text-gray-500">
                ({product.reviewcount} Reviews)
              </span>

            </div>



            {/* PRICE */}

            <div className="flex items-end gap-4">

              <span className="text-3xl font-bold text-emerald-600">

                {formatPrice(product.price)}

              </span>

              {product.compareprice && (

                <span className="text-lg text-gray-400 line-through">

                  {formatPrice(product.compareprice)}

                </span>

              )}

            </div>



            {/* STOCK */}

            <div className="flex items-center gap-2">

              <CheckCircle className="text-green-600 w-5 h-5" />

              <span className="text-green-600 font-medium">

                {product.inventory > 0
                  ? `In Stock (${product.inventory})`
                  : 'Out of Stock'}

              </span>

            </div>



            {/* QUANTITY */}

            <div className="flex flex-wrap items-center gap-4">


              <div className="flex border rounded-xl overflow-hidden">

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                >
                  <Minus size={16} />
                </Button>

                <Input
                  value={qty}
                  readOnly
                  className="w-14 text-center border-0"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setQty(q => Math.min(product.inventory, q + 1))
                  }
                >
                  <Plus size={16} />
                </Button>

              </div>



              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-green-600 flex-1"
                disabled={
                  product.inventory === 0 ||
                  cartLoading
                }
                onClick={addToCart}
              >

                {cartLoading ? 'Adding...' : (
                  <>
                    <ShoppingCart className="mr-2" />
                    Add To Cart
                  </>
                )}

              </Button>


              <Button variant="outline">
                <Heart />
              </Button>

            </div>



            {/* TRUST */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm">


              <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl">

                <Truck size={18} />
                Fast Delivery

              </div>


              <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl">

                <Shield size={18} />
                Secure Pay

              </div>


              <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl">

                <CheckCircle size={18} />
                Genuine

              </div>

            </div>

          </div>

        </div>



        {/* ================= DESCRIPTION ================= */}

        <Card className="mt-14 shadow-xl rounded-2xl border-0">

          <CardContent className="p-8">

            <h2 className="text-2xl font-bold mb-4">

              Product Description

            </h2>

            <p className="text-gray-700 text-lg leading-relaxed">

              {product.longdescription}

            </p>

          </CardContent>

        </Card>

      </div>



      <Footer />

    </>
  )
}
