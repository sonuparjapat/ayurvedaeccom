'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Shield,
  ChevronRight,
  AlertCircle,
  Package
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { notify } from '@/app/utils/notify'
import { useAuth } from '@/context/auth-context'
import ReviewSection from '@/components/ReviewSection'
import StarRating from '@/components/StartRatings'
import Pagination from '@/components/Paginationcom'


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
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  const [cartLoading, setCartLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [page,setPage]=useState<any>(1)
 const { handleCart, opencart, setOpencart, totalCartProducts, fetchCart, cartdata, cartloading, loginuserdata,getwishlist,wishlistdata,reviewsData,loadReviews
  } = useAuth()
console.log(cartdata,"carrrrrrrrrrtdata")
const handlepagechage=(page:number)=>{
  setPage(page)
}
  /* ================= FETCH ================= */

  useEffect(() => {
    if (id) {fetchProduct()

  
    }
  }, [id])
  useEffect(()=>{
    loadReviews(id,page)
  },[page])
  console.log(reviewsData,"reviewdata")


  const fetchProduct = async () => {

    try {

      const res = await axios.get(`/shop/public/${id}`)

      setProduct(res.data?.data || null)

    } catch {

      toast.error('Product not found')

    } finally {

      setLoading(false)

    }
  }

console.log(product, "cccccccccccccccccccccccccccccccccc")

  /* ================= HELPERS ================= */

  const formatPrice = (price: string) => {

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(price))

  }
 const toggleLike = async (id: string) => {
    try {
      await axios.post('/shop/wishlist', { productId: id })
      notify.success('Wishlist updated')
      getwishlist()
    } catch {
      notify.error('Login required')
    }
  }

 



  /* ================= CART ================= */

  const addToCart = async () => {

    if (!product) return

    if (product.inventory === 0) {
      notify.error('Out of stock')
      return
    }

    try {

      if (cartLoading) return

      setCartLoading(true)

      const finalQty = Math.min(qty, product.inventory)


    cartdata?.items?.filter((item:any)=>item?.product_id==product?.id)?.length>=1? await axios.put('/cart', {
        productId: product.id,
        quantity: finalQty
      }):await axios.post('/cart', {
        productId: product.id,
        quantity: finalQty
      })


      toast.success('Added to cart')
fetchCart(loginuserdata?.id)
    } catch (err: any) {

      if (err?.response?.status === 401) {

        toast.error('Please login first')
        router.push('/auth')

      } else if (err?.response?.data?.message) {

        toast.error(err.response.data.message)

      } else {

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



      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-emerald-50/30">


        <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">


          {/* ================= BREADCRUMB ================= */}

          <nav className="mb-10 text-sm text-stone-500 flex items-center gap-2">

            <Link href="/" className="hover:text-emerald-600">
              Home
            </Link>

            <ChevronRight size={14} />

            <Link href="/products" className="hover:text-emerald-600">
              Products
            </Link>

            <ChevronRight size={14} />

            <span className="text-stone-900 font-medium">
              {product.name}
            </span>

          </nav>



          {/* ================= MAIN ================= */}

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">


            {/* ================= IMAGES ================= */}

            <div className="space-y-6">

              <div className="relative aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl group">

                <img
                  src={product.images[activeImg]}
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                />


                {product.inventory === 0 && (

                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">

                    <Package size={40} />
                    <span>Unavailable</span>

                  </div>

                )}


               <button
                        onClick={() => toggleLike(product.id)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(4px)',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        }}
                      >
  <Heart
        size={18}
        strokeWidth={2}
        className="transition-all duration-200"
        fill={wishlistdata?.items?.find((item:any)=>item?.id==product?.id)?.id ? "red" : "transparent"}
        color={wishlistdata?.items?.find((item:any)=>item?.id==product?.id)?.id  ? "red" : "var(--terracotta)"}
      />
                      </button>

              </div>



              <div className="flex gap-4 flex-wrap justify-center lg:justify-start">

                {product.images.map((img, i) => (

                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${
                      activeImg === i
                        ? 'border-emerald-600'
                        : 'border-gray-200'
                    }`}
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

            <div className="space-y-7">


              <Badge className="bg-emerald-100 text-emerald-700 px-4 py-1">

                {product.brand || product.category_name || 'Ayurveda'}

              </Badge>


              <h1 className="text-4xl lg:text-5xl font-bold">

                {product.name}

              </h1>


              <p className="text-lg text-gray-600">

                {product.shortdescription}

              </p>



              {/* RATING */}
  <div className="flex items-center gap-2 mb-4">
                        <StarRating
                          productId={product.id}
                          avgRating={product.averagerating}
                          refresh={fetchProduct}
                        />
                        <span className="text-xs font-body" style={{ color: 'var(--light-brown)' }}>
                          ({product.reviewcount})
                        </span>
                      </div>

            



              {/* PRICE */}

              <div className="flex items-end gap-4">

                <span className="text-4xl font-bold text-emerald-600">

                  {formatPrice(product.price)}

                </span>

                {product.compareprice && (

                  <span className="text-lg text-gray-400 line-through">

                    {formatPrice(product.compareprice)}

                  </span>

                )}

              </div>



              {/* STOCK */}

              <div className="flex items-center gap-3">

                {product.inventory === 0 ? (

                  <div className="flex gap-2 text-red-600">

                    <AlertCircle />
                    Out of Stock

                  </div>

                ) : (

                  <div className="flex gap-2 text-green-600">

                    <CheckCircle />
                    {product.inventory} in stock

                  </div>

                )}

              </div>



              {/* QUANTITY + CART */}

              <div className="space-y-4">


                <label className="text-sm font-semibold uppercase text-gray-700">
                  Quantity
                </label>


                <div className="flex flex-wrap gap-4">


                  <div className="flex border rounded-xl overflow-hidden">

                    <Button
                      variant="ghost"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                    >
                      <Minus size={18} />
                    </Button>

                    <Input
                      readOnly
                      value={qty}
                      className="w-16 text-center border-0"
                    />

                    <Button
                      variant="ghost"
                      onClick={() =>
                        setQty(q =>
                          Math.min(product.inventory, q + 1)
                        )
                      }
                    >
                      <Plus size={18} />
                    </Button>

                  </div>


                  <Button
                    disabled={
                      product.inventory === 0 ||
                      cartLoading
                    }
                    onClick={addToCart}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-lg py-6"
                  >

                    {cartLoading ? (
                      <span className="flex gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2" />
                          {product.inventory ==0?"Out Of Stock":"Add To Cart"}
                      </>
                    )}

                    

                  </Button>

                </div>

              </div>



              {/* TRUST */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">


                <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">

                  <Truck className="text-emerald-600" />
                  Fast Delivery

                </div>


                <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">

                  <Shield className="text-blue-600" />
                  Secure Payment

                </div>


                <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">

                  <CheckCircle className="text-amber-600" />
                  Genuine

                </div>

              </div>

            </div>

          </div>



          {/* ================= DESCRIPTION ================= */}

          <Card className="mt-20 shadow-xl rounded-3xl border-0 overflow-hidden">


            <CardContent className="p-10">

              <h2 className="text-3xl font-bold mb-6">

                Product Description

              </h2>

              <p className="text-lg text-gray-700 leading-relaxed">

                {product.longdescription}

              </p>

            </CardContent>

          </Card>


        </div>

      </div>
{/* <ReviewSection productId={product.id} fetchProduct={fetchProduct} product={product} loginuserdata={loginuserdata}/> */}
     <div className="space-y-6 overflow-auto">

        {reviewsData?.data?.map(r=>(
          <div
            key={r.id}
            className="bg-white p-5 rounded-xl shadow"
          >

            <div className="flex justify-between mb-2">

              <p className="font-semibold">
                {r.name}
              </p>

              <div className="flex gap-1">
                {[...Array(r.rating)].map((_,i)=>(
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

            </div>

            <p className="text-gray-700 mb-3">
              {r.comment}
            </p>

            {r.images?.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {r.images.map((img:any)=>(
                  <a href={img} target='_blank'>
                  <img
                    key={img}
                    src={img}
                    alt={img}
                    className="w-24 h-24 rounded"
                  /></a>
                ))}
              </div>
            )}

          </div>
        ))}
        {reviewsData?.data?.length == 0 && (
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-700">
              No reviews yet
            </p>
          </div>
        )}
        {reviewsData?.pagination?.totalPages>0&& (
          <div className='mb-2'>
         <Pagination currentPage={page}
  totalPages={reviewsData?.pagination?.totalPages}
  onPageChange={handlepagechage}/>  </div>
        )}
      

      </div>
      <Footer />

    </>

  )
}
