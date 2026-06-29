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
  Package,
  MapPin,
  Bell,
  Tag,
  Award,
  Weight,
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
  brand_id?: number
  brand_display_name?: string
  brand_slug?: string
  tags?: string[]
  is_featured?: boolean
  is_bestseller?: boolean
  weight_grams?: number
  total_sold?: number
  specifications?: any[]
  product_type?: string
  unit?: string
  tax_included?: boolean
  shipping_class?: string
  allow_backorder?: boolean
  highlights?: string
  ingredients?: string
  benefits?: string
  usage_instructions?: string
  storage_instructions?: string
  warnings?: string
  video_url?: string
  fssai_number?: string
  coa_url?: string
  focus_keyword?: string
  min_order_qty?: number
  max_order_qty?: number
  is_returnable?: boolean
  sort_order?: number
  faqs?: { question: string; answer: string }[]
  barcode?: string
  sku?: string
  sale_price?: string
}


function FlashCountdown({ endsAt }: { endsAt: string }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)))
  useEffect(() => {
    if (secs <= 0) return
    const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    <div style={{ display: 'flex', gap: 4, color: 'white', fontFamily: 'monospace', fontWeight: 800, fontSize: 16 }}>
      <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 6px' }}>{p(h)}</span>
      <span>:</span>
      <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 6px' }}>{p(m)}</span>
      <span>:</span>
      <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 6px' }}>{p(s)}</span>
    </div>
  )
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
  const [page, setPage] = useState<any>(1)

  // Variants
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariant, setSelectedVariant] = useState<any>(null)

  // Pincode check
  const [pincode, setPincode] = useState('')
  const [pincodeResult, setPincodeResult] = useState<any>(null)
  const [pincodeLoading, setPincodeLoading] = useState(false)

  // Notify me (OOS)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)

  // Rating breakdown
  const [ratingBreakdown, setRatingBreakdown] = useState<any>(null)

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])

  // Flash sale
  const [flashSaleInfo, setFlashSaleInfo] = useState<{ flash_price: number; ends_at: string; title: string; discount_percent: number } | null>(null)
 const { handleCart, opencart, setOpencart, totalCartProducts, fetchCart, cartdata, cartloading, loginuserdata,getwishlist,wishlistdata,reviewsData,loadReviews
  } = useAuth()
const handlepagechage=(page:number)=>{
  setPage(page)
}
  /* ================= FETCH ================= */

  useEffect(() => {
    if (id) {fetchProduct()

  
    }
  }, [id])
  useEffect(() => {
    loadReviews(id, page)
  }, [page])

  useEffect(() => {
    if (wishlistdata?.items) {
      setLiked(!!(wishlistdata.items.find((item: any) => item?.id == id)?.id))
    }
  }, [wishlistdata, id])

  // no console.logs in production

  useEffect(() => {
    if (!id) return
    axios.get(`/shop/variants/${id}`).then((r) => setVariants(r.data?.variants || [])).catch(() => {})
    axios.get(`/shop/rating/${id}`).then((r) => setRatingBreakdown(r.data || null)).catch(() => {})
    axios.get(`/shop/related/${id}`).then((r) => setRelatedProducts(r.data?.products || [])).catch(() => {})
    // Check flash sale
    axios.get('/flash-sales/active').then((r) => {
      const sales = r.data?.sales || []
      for (const sale of sales) {
        const sp = (sale.products || []).find((p: any) => String(p.product_id) === String(id) || p.slug === id)
        if (sp) {
          setFlashSaleInfo({ flash_price: sp.flash_price, ends_at: sale.ends_at, title: sale.title, discount_percent: sp.discount_percent })
          break
        }
      }
    }).catch(() => {})
    // log recently viewed for logged-in users
    if (loginuserdata?.id) {
      axios.post('/shop/recently-viewed', { productId: id }).catch(() => {})
    }
  }, [id])

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

 



  /* ================= PINCODE / NOTIFY / VARIANT HELPERS ================= */

  const checkPincode = async () => {
    if (!/^\d{6}$/.test(pincode)) { toast.error('Enter a valid 6-digit pincode'); return }
    setPincodeLoading(true)
    try {
      const r = await axios.get(`/shop/pincode-check?pincode=${pincode}`)
      setPincodeResult(r.data)
    } catch {
      setPincodeResult({ serviceable: false, message: 'Unable to check. Please try again.' })
    } finally {
      setPincodeLoading(false)
    }
  }

  const submitNotifyMe = async () => {
    if (!notifyEmail.includes('@')) { toast.error('Enter a valid email'); return }
    setNotifyLoading(true)
    try {
      await axios.post('/shop/notify-me', { productId: product?.id, email: notifyEmail, variantId: selectedVariant?.id })
      setNotifyDone(true)
      toast.success('We\'ll notify you when this is back in stock!')
    } catch {
      toast.error('Could not register. Try again.')
    } finally {
      setNotifyLoading(false)
    }
  }

  const effectiveInventory = selectedVariant ? selectedVariant.inventory : product?.inventory ?? 0
  const effectivePrice = selectedVariant ? Number(selectedVariant.price) : Number(product?.price ?? 0)

  /* ================= CART ================= */

  const isInCart = product
    ? cartdata?.items?.some((item: any) =>
        item?.product_id == product?.id &&
        (!selectedVariant ? !item?.variant_id : item?.variant_id == selectedVariant?.id)
      )
    : false

const addToCart = async () => {
  if (!product) return;

  // Already in cart — open cart drawer instead of re-adding
  if (isInCart) {
    setOpencart(true);
    return;
  }

  if (effectiveInventory === 0) {
    notify.error("Product is Out of stock");
    return;
  }

  if (variants.length > 0 && !selectedVariant) {
    toast.error("Please select a variant");
    return;
  }

  if (cartLoading) return;
  setCartLoading(true);

  try {
    const finalQty = Math.min(qty, effectiveInventory);
    const payload: any = {
      productId: product.id,
      quantity: finalQty,
      ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
    };

    if (!loginuserdata?.id) {
      const sessionId = localStorage.getItem("guest_session_id");
      if (sessionId) payload.sessionId = sessionId;
    }

    // Always POST — backend upserts (inserts or increments, capped at stock)
    await axios.post("/cart", payload);
    toast.success("Added to cart!");
    fetchCart(loginuserdata?.id);

  } catch (err: any) {
    toast.error(
      err?.response?.data?.message || "Could not add to cart"
    );
  } finally {
    setCartLoading(false);
  }
};



  /* ================= LOADING ================= */

  if (loading) {

    return (

      <div className="h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-white">

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

        {/* Schema.org JSON-LD for Google Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Product',
              name: product.name,
              image: product.images,
              description: product.meta_description || product.shortdescription,
              sku: product.sku,
              brand: { '@type': 'Brand', name: product.brand_display_name || product.brand || process.env.NEXT_PUBLIC_APP_NAME || 'Oroganix' },
              ...(product.barcode ? { gtin: product.barcode } : {}),
              ...(product.weight_grams ? { weight: { '@type': 'QuantitativeValue', value: product.weight_grams, unitCode: 'GRM' } } : {}),
              offers: {
                '@type': 'Offer',
                url: typeof window !== 'undefined' ? window.location.href : '',
                priceCurrency: 'INR',
                price: product.sale_price || product.price,
                availability: product.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                seller: { '@type': 'Organization', name: process.env.NEXT_PUBLIC_APP_NAME || 'Oroganix' }
              },
              aggregateRating: Number(product.averagerating) > 0 ? {
                '@type': 'AggregateRating',
                ratingValue: Number(product.averagerating).toFixed(1),
                reviewCount: product.reviewcount || 1,
                bestRating: '5',
                worstRating: '1'
              } : undefined
            })
          }}
        />

        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: process.env.NEXT_PUBLIC_SITE_URL || '' },
                { '@type': 'ListItem', position: 2, name: 'Products', item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products` },
                { '@type': 'ListItem', position: 3, name: product.name }
              ]
            })
          }}
        />

        {/* FAQ Schema */}
        {product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: product.faqs.map((faq: any) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                  },
                })),
              }),
            }}
          />
        )}

      </Head>



      <div className="min-h-screen bg-linear-to-br from-stone-50 via-amber-50/20 to-emerald-50/30">


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

              {/* BRAND LINK */}
              {(product.brand_display_name || product.brand) && (
                <Link href={product.brand_slug ? `/products?brand=${product.brand_slug}` : '/products'} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                  {product.brand_display_name || product.brand}
                </Link>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-emerald-100 text-emerald-700 px-4 py-1">
                  {product.category_name || 'Ayurveda'}
                </Badge>

                {/* BESTSELLER BADGE */}
                {product.is_bestseller && (
                  <Badge className="bg-amber-100 text-amber-700 px-4 py-1 flex items-center gap-1">
                    <Award size={14} />
                    BESTSELLER
                  </Badge>
                )}
              </div>


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
                        {product.total_sold != null && product.total_sold > 0 && (
                          <span className="text-xs font-semibold text-gray-500 ml-2">
                            {product.total_sold}+ sold
                          </span>
                        )}
                      </div>

            



              {/* FLASH SALE BADGE */}
              {flashSaleInfo && (
                <div style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>⚡ {flashSaleInfo.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Flash price: ₹{Number(flashSaleInfo.flash_price).toFixed(0)} — Save {flashSaleInfo.discount_percent}%</p>
                  </div>
                  <FlashCountdown endsAt={flashSaleInfo.ends_at} />
                </div>
              )}

              {/* PRICE */}

              <div className="flex items-end gap-4">

                <span className="text-4xl font-bold text-emerald-600">
                  {flashSaleInfo ? `₹${Number(flashSaleInfo.flash_price).toFixed(0)}` : formatPrice(String(effectivePrice))}
                </span>
                {product.unit && (
                  <span className="text-base text-gray-500 ml-1">({product.unit})</span>
                )}

                {flashSaleInfo ? (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(String(effectivePrice))}</span>
                ) : (selectedVariant?.compareprice || product.compareprice) && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(String(selectedVariant?.compareprice || product.compareprice))}
                  </span>
                )}

                {selectedVariant && Number(selectedVariant.price) < Number(product.price) && !flashSaleInfo && (
                  <span style={{ fontSize: 13, color: '#2d5a3d', background: '#e8f5ee', padding: '2px 8px', borderRadius: 6 }}>
                    Variant price
                  </span>
                )}

              </div>



              {/* VARIANTS */}
              {variants.length > 0 && (
                <div>
                  <p className="text-sm font-semibold uppercase text-gray-700 mb-3">Select Variant</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 10,
                          border: `2px solid ${selectedVariant?.id === v.id ? '#2d5a3d' : 'rgba(26,58,42,0.18)'}`,
                          background: selectedVariant?.id === v.id ? '#e8f5ee' : 'white',
                          color: selectedVariant?.id === v.id ? '#1a3a2a' : '#555',
                          fontWeight: selectedVariant?.id === v.id ? 600 : 400,
                          fontSize: 13,
                          cursor: v.inventory > 0 ? 'pointer' : 'not-allowed',
                          opacity: v.inventory > 0 ? 1 : 0.45,
                          position: 'relative',
                        }}
                        disabled={v.inventory <= 0}
                      >
                        {v.label}
                        {Number(v.price) !== Number(product.price) && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: '#4a7c5e' }}>₹{v.price}</span>
                        )}
                        {v.inventory <= 5 && v.inventory > 0 && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: '#e07a2a' }}>Only {v.inventory} left</span>
                        )}
                        {v.inventory <= 0 && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: '#e05252' }}>OOS</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WEIGHT */}
              {product.weight_grams != null && product.weight_grams > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Weight size={16} className="text-gray-500" />
                  <span>Net Weight: {product.weight_grams}g</span>
                </div>
              )}

              {/* TAGS */}
              {product.tags && product.tags.length > 0 && (() => {
                let cleanTags = product.tags
                if (typeof cleanTags === 'string') try { cleanTags = JSON.parse(cleanTags) } catch { cleanTags = [] }
                if (Array.isArray(cleanTags) && cleanTags.length === 1 && typeof cleanTags[0] === 'string' && cleanTags[0].startsWith('[')) {
                  try { cleanTags = JSON.parse(cleanTags[0]) } catch {}
                }
                cleanTags = (Array.isArray(cleanTags) ? cleanTags : []).map((t: any) => String(t).replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim()).filter(Boolean)
                return cleanTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cleanTags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null})()}

              {/* STOCK */}

              <div className="flex items-center gap-3">

                {effectiveInventory === 0 ? (

                  <div className="flex gap-2 text-red-600">

                    <AlertCircle />
                    Out of Stock

                  </div>

                ) : (

                  <div className="flex gap-2 text-green-600">

                    <CheckCircle />
                    {effectiveInventory} in stock

                  </div>

                )}

              </div>

              {/* NOTIFY ME — when OOS */}
              {effectiveInventory === 0 && (
                <div style={{ background: '#fff8e6', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Bell size={15} style={{ color: '#c9a84c' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#6b4c00' }}>Notify me when back in stock</span>
                  </div>
                  {notifyDone ? (
                    <div style={{ color: '#2d5a3d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> You'll be notified at {notifyEmail}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="Enter your email"
                        style={{ flex: 1, height: 38, border: '1.5px solid rgba(201,168,76,0.4)', borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <button
                        onClick={submitNotifyMe}
                        disabled={notifyLoading}
                        style={{ padding: '0 16px', height: 38, background: '#c9a84c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {notifyLoading ? '...' : 'Notify Me'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PINCODE DELIVERY CHECK */}
              <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(26,58,42,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <MapPin size={15} style={{ color: '#4a7c5e' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1a3a2a' }}>Check Delivery</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setPincodeResult(null) }}
                    placeholder="Enter 6-digit pincode"
                    style={{ flex: 1, height: 38, border: '1.5px solid rgba(26,58,42,0.2)', borderRadius: 8, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a3a2a' }}
                  />
                  <button
                    onClick={checkPincode}
                    disabled={pincodeLoading || pincode.length < 6}
                    style={{ padding: '0 16px', height: 38, background: '#1a3a2a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: pincode.length < 6 ? 0.5 : 1 }}
                  >
                    {pincodeLoading ? '...' : 'Check'}
                  </button>
                </div>
                {pincodeResult && (
                  <div style={{ marginTop: 8, fontSize: 13, color: pincodeResult.serviceable ? '#2d5a3d' : '#e05252', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {pincodeResult.serviceable ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {pincodeResult.serviceable
                      ? `Delivery available in ${pincodeResult.delivery_days} day${pincodeResult.delivery_days !== 1 ? 's' : ''} to ${pincodeResult.city || pincode}`
                      : pincodeResult.message || 'Not serviceable to this pincode'}
                  </div>
                )}
              </div>



              {/* MIN ORDER QTY NOTICE */}
              {product.min_order_qty && product.min_order_qty > 1 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                  <AlertCircle size={16} />
                  <span>Minimum order quantity: {product.min_order_qty}</span>
                </div>
              )}

              {/* NON-RETURNABLE NOTICE */}
              {product.is_returnable === false && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  <AlertCircle size={16} />
                  <span>This product is non-returnable</span>
                </div>
              )}

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
                      onClick={() => setQty(q => Math.min(effectiveInventory, q + 1))}
                    >
                      <Plus size={18} />
                    </Button>

                  </div>


                  <Button
                    disabled={!isInCart && (effectiveInventory === 0 || cartLoading || (variants.length > 0 && !selectedVariant))}
                    onClick={addToCart}
                    className={`flex-1 text-lg py-6 ${isInCart ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-linear-to-r from-emerald-600 to-green-600'}`}
                  >
                    {cartLoading ? (
                      <span className="flex gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : effectiveInventory === 0 ? (
                      <><Package className="mr-2" /> Out Of Stock</>
                    ) : variants.length > 0 && !selectedVariant ? (
                      <><Tag className="mr-2" /> Select a Variant</>
                    ) : isInCart ? (
                      <><ShoppingCart className="mr-2" /> Go to Cart</>
                    ) : (
                      <><ShoppingCart className="mr-2" /> Add To Cart</>
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

              {/* SPECIFICATIONS */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-2xl font-bold mb-4">Specifications</h3>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {product.specifications.map((spec: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-5 py-3 font-semibold text-gray-700 w-1/3 border-r border-gray-200">
                              {spec.key}
                            </td>
                            <td className="px-5 py-3 text-gray-600">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </CardContent>

          </Card>


        </div>

        {/* ================= AYURVEDIC DETAILS ================= */}

        <div className="max-w-7xl mx-auto px-4 mt-10 space-y-6">

          {/* HIGHLIGHTS */}
          {product.highlights && (
            <Card className="shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4">Product Highlights</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.highlights}</p>
              </CardContent>
            </Card>
          )}

          {/* INGREDIENTS */}
          {product.ingredients && (
            <Card className="shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4">Ingredients</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.ingredients}</p>
              </CardContent>
            </Card>
          )}

          {/* BENEFITS */}
          {product.benefits && (
            <Card className="shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4">Health Benefits</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.benefits}</p>
              </CardContent>
            </Card>
          )}

          {/* USAGE INSTRUCTIONS */}
          {product.usage_instructions && (
            <Card className="shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4">Usage / Dosage Instructions</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.usage_instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* STORAGE INSTRUCTIONS */}
          {product.storage_instructions && (
            <Card className="shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4">Storage Instructions</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.storage_instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* WARNINGS */}
          {product.warnings && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-10">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-500" size={24} />
                <h3 className="text-2xl font-bold text-red-700">Warnings & Precautions</h3>
              </div>
              <p className="text-lg text-red-700 leading-relaxed whitespace-pre-line">{product.warnings}</p>
            </div>
          )}

          {/* VIDEO */}
          {product.video_url && (
            <Card className="shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4">Product Video</h3>
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <iframe
                    src={product.video_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title="Product Video"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* FSSAI & COA */}
          {(product.fssai_number || product.coa_url) && (
            <div className="flex flex-wrap gap-4">
              {product.fssai_number && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
                  <Shield className="text-emerald-600" size={20} />
                  <div>
                    <span className="text-xs text-emerald-600 font-semibold">FSSAI Certified</span>
                    <div className="text-sm text-emerald-800 font-bold">{product.fssai_number}</div>
                  </div>
                </div>
              )}
              {product.coa_url && (
                <a href={product.coa_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 hover:bg-blue-100 transition-colors">
                  <CheckCircle className="text-blue-600" size={20} />
                  <div>
                    <span className="text-xs text-blue-600 font-semibold">Lab Tested</span>
                    <div className="text-sm text-blue-800 font-bold">View COA / Lab Report →</div>
                  </div>
                </a>
              )}
            </div>
          )}

        </div>

      </div>
      {/* ================= FAQs ================= */}
      {product?.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {product.faqs.map((faq: any, i: number) => (
              <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gray-50 hover:bg-gray-100 transition font-medium text-sm text-gray-800">
                  {faq.question}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* ================= RELATED PRODUCTS ================= */}
      {relatedProducts.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px 0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a2a', marginBottom: 20 }}>You May Also Like</h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {relatedProducts.map((p: any) => (
              <a key={p.id} href={`/product/${p.slug || p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: 180 }}>
                <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(26,58,42,0.1)', transition: 'transform 0.2s' }}>
                  <img src={p.images?.[0] || '/placeholder.png'} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a3a2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2d5a3d' }}>₹{p.price}</span>
                      {p.compareprice && <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through' }}>₹{p.compareprice}</span>}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ================= RATING BREAKDOWN + REVIEWS ================= */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 0' }}>
        {ratingBreakdown && (
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 24, border: '1px solid rgba(26,58,42,0.1)', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: '#1a3a2a', lineHeight: 1 }}>{Number(ratingBreakdown.average).toFixed(1)}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, margin: '8px 0 4px' }}>
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14} fill={s <= Math.round(Number(ratingBreakdown.average)) ? '#f59e0b' : 'none'} stroke={s <= Math.round(Number(ratingBreakdown.average)) ? '#f59e0b' : '#ddd'} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>{ratingBreakdown.total} reviews</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {[5,4,3,2,1].map((star) => {
                const count = ratingBreakdown.breakdown?.[star] || 0
                const pct = ratingBreakdown.total > 0 ? (count / ratingBreakdown.total) * 100 : 0
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#888', width: 16, textAlign: 'right' }}>{star}</span>
                    <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
                    <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct > 0 ? '#f59e0b' : 'transparent', borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#aaa', width: 24 }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

<ReviewSection productId={product.id} fetchProduct={fetchProduct} product={product} loginuserdata={loginuserdata}/>
      {/* ================= REVIEWS ================= */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 32px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a3a2a', marginBottom: 16 }}>
          Customer Reviews
          {reviewsData?.pagination?.total > 0 && (
            <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 8 }}>
              ({reviewsData.pagination.total})
            </span>
          )}
        </h2>

        <div className="space-y-4">
          {reviewsData?.data?.map((r: any) => {
            const initials = (r.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            const colors = ['#2d5a3d', '#1e40af', '#7c3aed', '#b45309', '#0e7490']
            const avatarColor = colors[r.id % colors.length]
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{r.name || 'Customer'}</span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#e8f5ee', color: '#2d5a3d' }}
                        >
                          ✓ Verified Purchase
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={13}
                          fill={s <= r.rating ? '#f59e0b' : 'none'}
                          color={s <= r.rating ? '#f59e0b' : '#e5e7eb'}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">{r.comment}</p>

                {r.images?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {r.images.map((img: any) => (
                      <a key={img} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="review" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {reviewsData?.data?.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Star size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to review this product after your purchase.</p>
            </div>
          )}

          {reviewsData?.pagination?.totalPages > 0 && (
            <div className="mt-2">
              <Pagination
                currentPage={page}
                totalPages={reviewsData.pagination.totalPages}
                onPageChange={handlepagechage}
              />
            </div>
          )}
        </div>
      </div>
      {/* Q&A SECTION */}
      <QASection productId={id as string} loginuserdata={loginuserdata} />

      <Footer />

    </>

  )
}

/* ─── Product Q&A Component ─── */
function QASection({ productId, loginuserdata }: { productId: string; loginuserdata: any }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answerMap, setAnswerMap] = useState<Record<number, string>>({})
  const [answeringId, setAnsweringId] = useState<number | null>(null)
  const axiosClient = require('@/lib/axios').default

  const loadQA = async () => {
    try {
      const r = await axiosClient.get(`/qa/product/${productId}`, { params: { page, limit: 5 } })
      setQuestions(r.data.questions || [])
      setTotal(r.data.total || 0)
    } catch {}
  }

  useEffect(() => { loadQA() }, [productId, page])

  const submitQuestion = async () => {
    if (!question.trim()) return
    try {
      setSubmitting(true)
      await axiosClient.post(`/qa/product/${productId}/ask`, { question })
      setQuestion('')
      toast.success('Question submitted for review!')
    } catch { toast.error('Failed to submit question') }
    finally { setSubmitting(false) }
  }

  const submitAnswer = async (qId: number) => {
    const ans = answerMap[qId]
    if (!ans?.trim()) return
    try {
      await axiosClient.post(`/qa/question/${qId}/answer`, { answer: ans })
      setAnswerMap(m => ({ ...m, [qId]: '' }))
      setAnsweringId(null)
      loadQA()
      toast.success('Answer posted!')
    } catch { toast.error('Failed to submit answer') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        💬 Questions & Answers
        <span className="text-sm font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{total} questions</span>
      </h2>

      {/* ASK A QUESTION */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-2">Ask a question about this product</p>
        <div className="flex gap-3">
          <input
            className="flex-1 border border-amber-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="e.g. Is this product safe for children?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitQuestion()}
          />
          <button onClick={submitQuestion} disabled={submitting || !question.trim()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            {submitting ? 'Sending...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* Q&A LIST */}
      <div className="space-y-4">
        {questions.map((q: any) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0">Q</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                <p className="text-xs text-gray-400 mt-1">{q.user_name || 'Customer'} · {new Date(q.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* ANSWERS */}
            {Array.isArray(q.answers) && q.answers.map((a: any) => (
              <div key={a.id} className={`px-4 py-3 flex items-start gap-3 border-t ${a.is_admin ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${a.is_admin ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {a.is_admin ? 'A' : 'A'}
                </div>
                <div className="flex-1">
                  {a.is_admin && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mr-2">Official</span>}
                  <span className="text-sm text-gray-800">{a.answer}</span>
                  <p className="text-xs text-gray-400 mt-1">{a.user_name || 'User'} · {new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}

            {/* ADD ANSWER (logged in users) */}
            {loginuserdata?.id && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                {answeringId === q.id ? (
                  <div className="flex gap-2">
                    <input className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Write your answer..."
                      value={answerMap[q.id] || ''} onChange={e => setAnswerMap(m => ({ ...m, [q.id]: e.target.value }))}
                    />
                    <button onClick={() => submitAnswer(q.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Post</button>
                    <button onClick={() => setAnsweringId(null)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setAnsweringId(q.id)} className="text-xs text-emerald-600 font-semibold hover:underline">
                    + Write an answer
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!questions.length && (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium">No questions yet. Be the first to ask!</p>
          </div>
        )}
      </div>

      {total > 5 && (
        <div className="flex justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-sm">Page {page} of {Math.ceil(total/5)}</span>
          <button disabled={page >= Math.ceil(total/5)} onClick={() => setPage(p => p+1)} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
