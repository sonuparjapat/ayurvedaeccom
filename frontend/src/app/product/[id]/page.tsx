'use client'

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useParams, useRouter } from 'next/navigation'
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
import StarRating from '@/components/StartRatings'
import Pagination from '@/components/Paginationcom'
import { useCompare } from '@/hooks/useCompare'


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
  safety_tags?: string[]
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
  const [cartQty, setCartQty] = useState(1) // qty currently in cart
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

  // Bundles (Frequently Bought Together)
  const [bundles, setBundles] = useState<any[]>([])
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleAdding, setBundleAdding] = useState<string | null>(null)

  // Review sort + filter
  const [reviewSort, setReviewSort] = useState<string>('created_at')
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [filteredReviews, setFilteredReviews] = useState<any[] | null>(null)
  const [filterLoading, setFilterLoading] = useState(false)

  // Write review
  const [wRating, setWRating] = useState(0)
  const [wComment, setWComment] = useState('')
  const [wLoading, setWLoading] = useState(false)
  const [wImages, setWImages] = useState<{ file: File; preview: string }[]>([])
  const [wExistingImages, setWExistingImages] = useState<string[]>([])
  const [wUrlInput, setWUrlInput] = useState('')
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null)
  const [pdTab, setPdTab] = useState<'desc' | 'reviews' | 'qa'>('desc')

  // Flash sale
  const [flashSaleInfo, setFlashSaleInfo] = useState<{ flash_price: number; ends_at: string; title: string; discount_percent: number; saleId: number } | null>(null)

  // Sticky ATC bar
  const atcBtnRef = useRef<HTMLDivElement>(null)
  const [stickyAtc, setStickyAtc] = useState(false)
  useEffect(() => {
    const el = atcBtnRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setStickyAtc(!entry.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [product])
 const { handleCart, opencart, setOpencart, totalCartProducts, fetchCart, cartdata, cartloading, loginuserdata,getwishlist,wishlistdata,reviewsData,loadReviews
  } = useAuth()
  const { toggle: compareToggle, has: compareHas } = useCompare()
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
    setFilteredReviews(null) // reset filter when page changes
  }, [id, page])

  // Re-fetch reviews with sort/rating filter applied
  useEffect(() => {
    if (!id) return
    if (reviewSort === 'created_at' && reviewRating === 0) {
      setFilteredReviews(null) // use context data
      return
    }
    setFilterLoading(true)
    axios.get(`/shop/reviews/product/${id}`, {
      params: { sortBy: reviewSort, rating: reviewRating || undefined, page: 1, limit: 50 }
    })
      .then(r => setFilteredReviews(r.data?.data || []))
      .catch(() => {})
      .finally(() => setFilterLoading(false))
  }, [reviewSort, reviewRating, id])

  useEffect(() => {
    if (!loginuserdata?.id || !id) return
    axios.get(`/shop/reviews/product/${id}`, { params: { me: 1 } })
      .then(({ data }) => {
        const mine = (data.data || [])[0]
        if (mine) {
          setWRating(mine.rating)
          setWComment(mine.comment || '')
          setWExistingImages(mine.images || [])
        }
      })
      .catch(() => {})
  }, [loginuserdata?.id, id])

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
    setBundleLoading(true)
    axios.get(`/bundles/by-product/${id}`).then((r) => setBundles(r.data?.bundles || [])).catch(() => {}).finally(() => setBundleLoading(false))
    // Check flash sale
    axios.get('/flash-sales/active').then((r) => {
      const sales = r.data?.sales || []
      for (const sale of sales) {
        const sp = (sale.products || []).find((p: any) => String(p.product_id) === String(id) || p.slug === id)
        if (sp) {
          setFlashSaleInfo({ flash_price: sp.flash_price, ends_at: sale.ends_at, title: sale.title, discount_percent: sp.discount_percent, saleId: sale.id })
          break
        }
      }
    }).catch(() => {})
    // log recently viewed for logged-in users
    if (loginuserdata?.id) {
      axios.post('/shop/recently-viewed', { productId: id }).catch(() => {})
    }
  }, [id])

  // Real-time flash sale exhaustion listener
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })

    socket.on('flash_sale_exhausted', ({ saleId }: { saleId: number }) => {
      setFlashSaleInfo(prev => (prev?.saleId === saleId ? null : prev))
      toast('⚠️ This flash sale has been fully claimed. Regular prices now apply.', {
        duration: 7000,
        style: { background: '#fff7ed', border: '1px solid #f97316', color: '#7c2d12' },
        icon: '🔥',
      })
    })

    socket.on('flash_product_sold_out', ({ saleId, productId }: { saleId: number; productId: number }) => {
      if (String(productId) === String(id)) {
        setFlashSaleInfo(prev => (prev?.saleId === saleId ? null : prev))
        toast('⚡ Flash sale stock for this product has sold out. Regular price now applies.', {
          duration: 7000,
          style: { background: '#fef2f2', border: '1px solid #ef4444', color: '#7f1d1d' },
          icon: '⚡',
        })
      }
    })

    return () => { socket.disconnect() }
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

  const submitReview = async () => {
    if (!loginuserdata) { toast.error('Please login to submit a review'); return }
    if (!wRating) { toast.error('Please select a rating'); return }
    try {
      setWLoading(true)
      const form = new FormData()
      form.append('productId', String(product?.id))
      form.append('rating', String(wRating))
      form.append('comment', wComment)
      form.append('oldImages', JSON.stringify(wExistingImages))
      wImages.forEach(img => form.append('images', img.file))
      await axios.post('/shop/reviews/product', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Review saved')
      setWImages([])
      loadReviews(id, page)
      fetchProduct()
      axios.get(`/shop/reviews/product/${id}`, { params: { me: 1 } })
        .then(({ data }) => {
          const mine = (data.data || [])[0]
          if (mine) { setWRating(mine.rating); setWComment(mine.comment || ''); setWExistingImages(mine.images || []) }
        })
        .catch(() => {})
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login required to review')
    } finally {
      setWLoading(false)
    }
  }

  const pickReviewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f: any) => f.type.startsWith('image/'))
    const remaining = 5 - wExistingImages.length - wImages.length
    if (!files.length || remaining <= 0) return
    const toAdd = files.slice(0, remaining)
    setWImages(prev => [...prev, ...toAdd.map((f: any) => ({ file: f, preview: URL.createObjectURL(f) }))])
    e.target.value = ''
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

  const cartItem = product
    ? cartdata?.items?.find((item: any) =>
        item?.product_id == product?.id &&
        (!selectedVariant ? !item?.variant_id : item?.variant_id == selectedVariant?.id)
      )
    : undefined
  const isInCart = !!cartItem

  // Sync qty from cart when item detected
  useEffect(() => {
    if (cartItem && cartItem.quantity !== cartQty) {
      setCartQty(cartItem.quantity)
      setQty(cartItem.quantity)
    }
  }, [cartItem?.quantity, cartItem?.product_id])

const buyNow = () => {
  if (!product) return;
  if (effectiveInventory === 0) { toast.error('Product is out of stock'); return; }
  if (variants.length > 0 && !selectedVariant) { toast.error('Please select a variant'); return; }
  const item = {
    productId: product.id,
    quantity: qty,
    variantId: selectedVariant?.id || null,
    name: product.name,
    price: selectedVariant ? Number(selectedVariant.price) : Number(product.price),
    image: product.images?.[0] || '',
    gst_percent: product.gst_percent || 0,
    variantLabel: selectedVariant?.label || null,
  };
  sessionStorage.setItem('buyNowItem', JSON.stringify(item));
  router.push('/checkout?mode=buynow');
};

const addToCart = async () => {
  if (!product) return;

  if (effectiveInventory === 0) {
    toast.error("Product is out of stock");
    return;
  }

  if (variants.length > 0 && !selectedVariant) {
    toast.error("Please select a variant");
    return;
  }

  // In cart, qty unchanged → open cart drawer
  if (isInCart && qty === cartQty) {
    setOpencart(true);
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

    if (isInCart && qty !== cartQty) {
      // Update existing cart quantity
      await axios.put("/cart", payload);
      toast.success("Quantity updated!");
    } else {
      await axios.post("/cart", payload);
      toast.success("Added to cart!");
    }
    setCartQty(finalQty);
    fetchCart(loginuserdata?.id);

  } catch (err: any) {
    toast.error(
      err?.response?.data?.message || "Could not update cart"
    );
  } finally {
    setCartLoading(false);
  }
};



  /* ================= LOADING ================= */

  if (loading) {

    return (

      <div className="h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 50%, #f0fbf7 100%)'}}>
        <div className="relative flex items-center justify-center">
          <div className="animate-spin h-14 w-14 border-2 border-emerald-200 border-t-emerald-600 rounded-full"></div>
          <div className="absolute animate-ping h-14 w-14 border border-emerald-300 rounded-full opacity-20"></div>
        </div>
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


      {/* ================= JSON-LD Structured Data ================= */}
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
            brand: { '@type': 'Brand', name: product.brand_display_name || product.brand || 'Oroganix' },
            ...(product.barcode ? { gtin: product.barcode } : {}),
            ...(product.weight_grams ? { weight: { '@type': 'QuantitativeValue', value: product.weight_grams, unitCode: 'GRM' } } : {}),
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: product.sale_price || product.price,
              availability: product.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: { '@type': 'Organization', name: 'Oroganix' }
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
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            })
          }}
        />
      )}



      <div style={{background: 'linear-gradient(160deg, #f8fffb 0%, #f0fdf4 25%, #fffdf5 55%, #f0fdf4 80%, #f6fff9 100%)'}} className="pb-10">


        <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">


          {/* ================= BREADCRUMB ================= */}

          <nav className="mb-10 flex items-center gap-2" style={{fontSize: 13, color: '#6b7280', width: 'fit-content', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', padding: '9px 22px', borderRadius: 50, border: '1px solid rgba(16,185,129,0.14)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)'}}>

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

              <div
                className="relative aspect-square rounded-3xl overflow-hidden group cursor-zoom-in"
                style={{background: 'white', boxShadow: '0 24px 80px rgba(16,185,129,0.14), 0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(16,185,129,0.08)'}}
                onClick={() => setLightbox({ images: product.images, idx: activeImg })}
              >
                <img
                  src={product.images[activeImg]}
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                />

                {/* Zoom hint overlay */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div style={{
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Zoom</span>
                  </div>
                </div>


                {product.inventory === 0 && (

                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">

                    <Package size={40} />
                    <span>Unavailable</span>

                  </div>

                )}


               <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(String(product.id)) }}
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
                    className={`w-20 h-20 rounded-xl overflow-hidden transition-all duration-200 ${
                      activeImg === i
                        ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-md scale-105'
                        : 'ring-1 ring-black/5 opacity-70 hover:opacity-100 hover:ring-2 hover:ring-emerald-200 hover:ring-offset-1 hover:shadow-sm'
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
                <Badge className="px-4 py-1.5 text-xs font-semibold rounded-full" style={{background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#065f46', border: '1px solid rgba(16,185,129,0.22)', letterSpacing: '0.03em'}}>
                  {product.category_name || 'Ayurveda'}
                </Badge>

                {/* BESTSELLER BADGE */}
                {product.is_bestseller && (
                  <Badge className="px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1" style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', border: '1px solid rgba(245,158,11,0.25)', letterSpacing: '0.03em'}}>
                    <Award size={14} />
                    BESTSELLER
                  </Badge>
                )}
              </div>


              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight" style={{color: '#0f172a', letterSpacing: '-0.02em'}}>
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

                <span className="text-4xl font-black" style={{background: 'linear-gradient(135deg, #047857, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
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



              {/* STOCK URGENCY */}
              {effectiveInventory > 0 && effectiveInventory <= 10 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>Only {effectiveInventory} left in stock — order soon!</span>
                </div>
              )}

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
                      ? (() => {
                          const d = new Date()
                          d.setDate(d.getDate() + (pincodeResult.delivery_days || 0))
                          const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                          return `Delivery by ${dateStr} to ${pincodeResult.city || pincode} (${pincodeResult.delivery_days} day${pincodeResult.delivery_days !== 1 ? 's' : ''})`
                        })()
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

              {/* SAFETY TAGS */}
              {product.safety_tags && product.safety_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.safety_tags.map((tag: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                      ✓ {tag}
                    </span>
                  ))}
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

              <div className="space-y-4" ref={atcBtnRef}>


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
                    disabled={effectiveInventory === 0 || cartLoading || (variants.length > 0 && !selectedVariant)}
                    onClick={addToCart}
                    className={`flex-1 text-lg py-6 font-semibold rounded-2xl transition-all duration-200 ${
                      isInCart && qty !== cartQty ? 'bg-amber-600 hover:bg-amber-700'
                      : isInCart ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                    }`}
                    style={!(effectiveInventory === 0 || cartLoading || (variants.length > 0 && !selectedVariant)) ? {boxShadow: '0 8px 28px rgba(16,185,129,0.4), 0 2px 8px rgba(16,185,129,0.2)'} : {}}
                  >
                    {cartLoading ? (
                      <span className="flex gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : effectiveInventory === 0 ? (
                      <><Package className="mr-2" /> Out Of Stock</>
                    ) : variants.length > 0 && !selectedVariant ? (
                      <><Tag className="mr-2" /> Select a Variant</>
                    ) : isInCart && qty !== cartQty ? (
                      <><ShoppingCart className="mr-2" /> Update Cart</>
                    ) : isInCart ? (
                      <><ShoppingCart className="mr-2" /> In Cart</>
                    ) : (
                      <><ShoppingCart className="mr-2" /> Add To Cart</>
                    )}
                  </Button>

                </div>

                {/* BUY NOW */}
                <Button
                  disabled={effectiveInventory === 0 || (variants.length > 0 && !selectedVariant)}
                  onClick={buyNow}
                  className="w-full text-lg py-6 font-semibold rounded-2xl bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200"
                  style={!(effectiveInventory === 0 || (variants.length > 0 && !selectedVariant)) ? {boxShadow: '0 8px 28px rgba(245,158,11,0.35), 0 2px 8px rgba(245,158,11,0.18)'} : {}}
                >
                  {effectiveInventory === 0 ? (
                    <><Package className="mr-2" /> Out Of Stock</>
                  ) : variants.length > 0 && !selectedVariant ? (
                    <><Tag className="mr-2" /> Select a Variant</>
                  ) : (
                    <>⚡ Buy Now</>
                  )}
                </Button>

              </div>



              {/* TRUST */}

              <div className="flex items-stretch gap-3 pt-6">
                <div className="flex-1 rounded-2xl p-4 flex flex-col items-center gap-2 text-center" style={{background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid rgba(16,185,129,0.18)', boxShadow: '0 2px 14px rgba(16,185,129,0.08)'}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(16,185,129,0.14)'}}>
                    <Truck size={18} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800">Fast Delivery</span>
                </div>
                <div className="flex-1 rounded-2xl p-4 flex flex-col items-center gap-2 text-center" style={{background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid rgba(37,99,235,0.14)', boxShadow: '0 2px 14px rgba(37,99,235,0.07)'}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(37,99,235,0.1)'}}>
                    <Shield size={18} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-blue-800">Secure Payment</span>
                </div>
                <div className="flex-1 rounded-2xl p-4 flex flex-col items-center gap-2 text-center" style={{background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid rgba(217,119,6,0.16)', boxShadow: '0 2px 14px rgba(217,119,6,0.07)'}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(217,119,6,0.1)'}}>
                    <CheckCircle size={18} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-amber-800">100% Genuine</span>
                </div>
              </div>

              {/* COMPARE BUTTON */}
              <div style={{ paddingTop: 4 }}>
                <button
                  onClick={() => compareToggle({ id: product.id, name: product.name, price: product.price, image: product.images?.[0], category_name: product.category_name })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${compareHas(product.id) ? '#047857' : '#d1d5db'}`,
                    background: compareHas(product.id) ? '#ecfdf5' : 'white',
                    color: compareHas(product.id) ? '#047857' : '#374151',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  {compareHas(product.id) ? '✓ Added to Compare' : 'Add to Compare'}
                </button>
              </div>

              {/* SOCIAL SHARING */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Share:</span>
                <button
                  onClick={() => {
                    const url = window.location.href
                    const text = `Check out ${product.name} on Oroganix: ${url}`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#25d366', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.122 1.53 5.853L0 24l6.335-1.51A11.957 11.957 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 012.118 12C2.118 6.978 6.978 2.118 12 2.118S21.882 6.978 21.882 12 17.022 21.882 12 21.882z"/></svg>
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('Link copied!')
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy Link
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={() => navigator.share({ title: product.name, url: window.location.href }).catch(() => {})}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Share
                  </button>
                )}
              </div>

            </div>

          </div>



          {/* ── TAB BAR ── */}
          <div className="mt-14 mb-2">
            <div className="inline-flex gap-1 p-1.5 rounded-2xl" style={{background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)'}}>
            {(['desc', 'reviews', 'qa'] as const).map(t => (
              <button
                key={t}
                onClick={() => setPdTab(t)}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200"
                style={pdTab === t ? {
                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                  color: '#065f46',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.22)',
                } : {color: '#6b7280'}}
              >
                {t === 'desc' ? 'Description' : t === 'reviews' ? `Reviews (${product.reviewcount})` : 'Q&A'}
              </button>
            ))}
            </div>
          </div>

          {/* ================= DESCRIPTION TAB ================= */}
          {pdTab === 'desc' && (
          <Card className="mt-8 rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(16,185,129,0.06)', background: 'white'}}>


            <CardContent className="p-10">

              <h2 className="text-3xl font-bold mb-6" style={{borderLeft: '4px solid #10b981', paddingLeft: 14, color: '#0f172a'}}>

                Product Description

              </h2>

              <p className="text-lg text-gray-700 leading-relaxed">

                {product.longdescription}

              </p>

              {/* SPECIFICATIONS */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #6366f1', paddingLeft: 14, color: '#0f172a'}}>Specifications</h3>
                  <div className="overflow-hidden" style={{borderRadius: 14, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)'}}>
                    <table className="w-full text-sm">
                      <tbody>
                        {product.specifications.map((spec: any, i: number) => (
                          <tr key={i} style={{background: i % 2 === 0 ? '#f8f9ff' : 'white'}}>
                            <td className="px-5 py-3 font-semibold text-gray-700 w-1/3" style={{borderRight: '1px solid rgba(99,102,241,0.1)'}}>
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
          )}

        </div>

        {/* ================= AYURVEDIC DETAILS ================= */}
        {pdTab === 'desc' && (
        <div className="max-w-7xl mx-auto px-4 mt-10 space-y-6">

          {/* HIGHLIGHTS */}
          {product.highlights && (
            <Card className="rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 6px 30px rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #ffffff, #f8fffe)'}}>
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #10b981', paddingLeft: 14, color: '#0f172a'}}>Product Highlights</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.highlights}</p>
              </CardContent>
            </Card>
          )}

          {/* INGREDIENTS */}
          {product.ingredients && (
            <Card className="rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 6px 30px rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #ffffff, #f8fff8)'}}>
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #059669', paddingLeft: 14, color: '#0f172a'}}>Ingredients</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.ingredients}</p>
              </CardContent>
            </Card>
          )}

          {/* BENEFITS */}
          {product.benefits && (
            <Card className="rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 6px 30px rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #ffffff, #f8fff3)'}}>
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #16a34a', paddingLeft: 14, color: '#0f172a'}}>Health Benefits</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.benefits}</p>
              </CardContent>
            </Card>
          )}

          {/* USAGE INSTRUCTIONS */}
          {product.usage_instructions && (
            <Card className="rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 6px 30px rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #ffffff, #fffbf5)'}}>
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #d97706', paddingLeft: 14, color: '#0f172a'}}>Usage / Dosage Instructions</h3>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{product.usage_instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* STORAGE INSTRUCTIONS */}
          {product.storage_instructions && (
            <Card className="rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 6px 30px rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #ffffff, #f5fbff)'}}>
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #0ea5e9', paddingLeft: 14, color: '#0f172a'}}>Storage Instructions</h3>
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
            <Card className="rounded-3xl border-0 overflow-hidden" style={{boxShadow: '0 6px 30px rgba(0,0,0,0.06)', background: 'white'}}>
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold mb-4" style={{borderLeft: '4px solid #7c3aed', paddingLeft: 14, color: '#0f172a'}}>Product Video</h3>
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
        )}

      </div>
      {/* ================= FAQs ================= */}
      {pdTab === 'desc' && product?.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 && (
        <div className="p-8 mb-4" style={{background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', maxWidth: 1200, margin: '0 auto 16px'}}>
          <h3 className="text-2xl font-bold mb-6" style={{borderLeft: '4px solid #f59e0b', paddingLeft: 14, color: '#0f172a'}}>Frequently Asked Questions</h3>
          <div className="space-y-3">
            {product.faqs.map((faq: any, i: number) => (
              <details key={i} className="group overflow-hidden" style={{borderRadius: 14, border: '1px solid rgba(245,158,11,0.15)', background: '#fffdf5'}}>
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-sm text-gray-800 hover:bg-amber-50 transition-colors">
                  {faq.question}
                  <span className="text-amber-400 group-open:rotate-180 transition-transform shrink-0 ml-3">▾</span>
                </summary>
                <div className="px-5 py-4 text-sm text-gray-600 leading-relaxed border-t border-amber-100">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* ================= FREQUENTLY BOUGHT TOGETHER ================= */}
      {(bundleLoading || bundles.length > 0) && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px 0' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>Frequently Bought Together</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Curated bundles with this product at a special price</p>

          {bundleLoading ? (
            <div style={{ display: 'flex', gap: 16 }}>
              {[1,2].map(i => (
                <div key={i} style={{ width: 320, background: '#f8f8f8', borderRadius: 16, height: 180, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {bundles.map((bundle: any) => {
                const prods = bundle.products || []
                const originalTotal = prods.reduce((s: number, p: any) => s + Number(p.price) * (p.quantity || 1), 0)
                let bundlePrice = originalTotal
                if (bundle.discount_type === 'percent') bundlePrice = originalTotal * (1 - Number(bundle.discount_value) / 100)
                else if (bundle.discount_type === 'flat') bundlePrice = Math.max(0, originalTotal - Number(bundle.discount_value))
                const savePct = originalTotal > 0 ? Math.round(((originalTotal - bundlePrice) / originalTotal) * 100) : 0

                return (
                  <div key={bundle.id} style={{ background: 'white', border: '1.5px solid rgba(16,185,129,0.15)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                    {/* Bundle header */}
                    <div style={{ background: 'linear-gradient(135deg,#064e3b,#047857)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{bundle.name}</p>
                        {savePct > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#6ee7b7', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '2px 8px', letterSpacing: '0.06em' }}>SAVE {savePct}%</span>}
                      </div>
                      {bundle.image_url && <img src={bundle.image_url} alt={bundle.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                    </div>

                    {/* Products in bundle */}
                    <div style={{ padding: '14px 16px', flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        {prods.map((p: any, i: number) => (
                          <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {i > 0 && <span style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>+</span>}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <img
                                src={p.images?.[0] || '/placeholder.png'}
                                alt={p.name}
                                style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(16,185,129,0.15)' }}
                              />
                              <p style={{ fontSize: 9, color: '#6b7280', marginTop: 4, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                              {p.quantity > 1 && <p style={{ fontSize: 9, color: '#10b981', fontWeight: 700 }}>×{p.quantity}</p>}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price row */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#047857' }}>₹{bundlePrice.toFixed(0)}</span>
                        {savePct > 0 && <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>₹{originalTotal.toFixed(0)}</span>}
                        {savePct > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>(-{savePct}%)</span>}
                      </div>

                      {bundle.description && (
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>{bundle.description}</p>
                      )}
                    </div>

                    {/* Add bundle to cart */}
                    <div style={{ padding: '0 16px 16px' }}>
                      <button
                        disabled={bundleAdding === bundle.id}
                        onClick={async () => {
                          if (!loginuserdata?.id) { toast.error('Please login to add bundles'); return }
                          setBundleAdding(bundle.id)
                          try {
                            await axios.post('/bundles/add-to-cart', { bundleId: bundle.id })
                            toast.success(`Bundle added to cart! You saved ₹${(originalTotal - bundlePrice).toFixed(0)}`)
                            fetchCart(loginuserdata.id)
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message || 'Failed to add bundle')
                          } finally {
                            setBundleAdding(null)
                          }
                        }}
                        style={{
                          width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: bundleAdding === bundle.id ? '#d1fae5' : 'linear-gradient(135deg,#064e3b,#047857)',
                          color: bundleAdding === bundle.id ? '#065f46' : 'white',
                          fontWeight: 700, fontSize: 13, letterSpacing: '0.02em',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {bundleAdding === bundle.id ? 'Adding…' : '🛍️ Add Bundle to Cart'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= RELATED PRODUCTS ================= */}
      {relatedProducts.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px 0' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.01em' }}>You May Also Like</h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
            {relatedProducts.map((p: any) => (
              <a key={p.id} href={`/product/${p.slug || p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: 188 }}>
                <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', transition: 'all 0.25s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(16,185,129,0.14)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)' }}
                >
                  <div style={{overflow: 'hidden'}}>
                    <img src={p.images?.[0] || '/placeholder.png'} alt={p.name} style={{ width: '100%', height: 168, objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} />
                  </div>
                  <div style={{ padding: '12px 14px 14px' }}>
                    {p.is_bestseller && <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginBottom: 6, letterSpacing: '0.06em' }}>BESTSELLER</div>}
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#047857' }}>₹{p.price}</span>
                      {p.compareprice && <span style={{ fontSize: 11, color: '#cbd5e1', textDecoration: 'line-through' }}>₹{p.compareprice}</span>}
                    </div>
                    {Number(p.averagerating) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: '#f59e0b' }}>★</span>
                        <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>{Number(p.averagerating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ================= REVIEWS TAB ================= */}
      {pdTab === 'reviews' && (
      <>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 0' }}>
        {ratingBreakdown && (
          <div style={{ background: 'linear-gradient(135deg, #ffffff, #f8fffe)', borderRadius: 20, padding: '28px 24px', marginBottom: 28, border: '1px solid rgba(16,185,129,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
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
                      <div style={{ width: `${pct}%`, height: '100%', background: pct > 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'transparent', borderRadius: 4, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#aaa', width: 24 }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

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

        {/* ── Sort + Star Filter Controls ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          {/* Sort */}
          <select
            value={reviewSort}
            onChange={e => setReviewSort(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid rgba(16,185,129,0.2)', background: 'white', fontSize: 13, color: '#1a3a2a', fontWeight: 500, cursor: 'pointer', outline: 'none' }}
          >
            <option value="created_at">Newest First</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="rating_asc">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>

          {/* Star filter */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>Filter:</span>
            {[0,5,4,3,2,1].map(s => (
              <button
                key={s}
                onClick={() => setReviewRating(reviewRating === s ? 0 : s)}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: '1.5px solid',
                  borderColor: reviewRating === s ? '#f59e0b' : 'rgba(16,185,129,0.15)',
                  background: reviewRating === s ? '#fef3c7' : 'white',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  color: reviewRating === s ? '#92400e' : '#6b7280',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                {s === 0 ? 'All' : <><span style={{ color: '#f59e0b' }}>★</span>{s}</>}
              </button>
            ))}
          </div>

          {filterLoading && <span style={{ fontSize: 12, color: '#10b981' }}>Loading…</span>}
          {(reviewSort !== 'created_at' || reviewRating > 0) && (
            <button
              onClick={() => { setReviewSort('created_at'); setReviewRating(0) }}
              style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Write review form — visible to logged-in users only */}
        {loginuserdata ? (
          <div className="bg-white rounded-2xl mb-4 p-5" style={{border: '1px solid rgba(16,185,129,0.1)', boxShadow: '0 4px 24px rgba(16,185,129,0.08)'}}>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {wExistingImages.length > 0 || wRating > 0 ? 'Edit Your Review' : 'Write a Review'}
            </p>
            {/* Star rating */}
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => (
                <Star
                  key={i}
                  onClick={() => setWRating(i)}
                  className={`cursor-pointer w-6 h-6 ${i <= wRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <textarea
              className="w-full border rounded-lg p-3 mb-3 text-sm"
              placeholder="Share your experience..."
              rows={3}
              value={wComment}
              onChange={e => setWComment(e.target.value)}
            />
            {/* Image URL input */}
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={wUrlInput}
                onChange={e => setWUrlInput(e.target.value)}
                placeholder="Paste image URL (optional)..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <button
                onClick={() => {
                  const url = wUrlInput.trim()
                  if (url && wExistingImages.length + wImages.length < 5) {
                    setWExistingImages(prev => [...prev, url])
                    setWUrlInput('')
                  }
                }}
                disabled={!wUrlInput.trim() || wExistingImages.length + wImages.length >= 5}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >Add URL</button>
            </div>
            {/* Existing images */}
            {wExistingImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {wExistingImages.map((url, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={url} alt="existing"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightbox({ images: [...wExistingImages, ...wImages.map(x => x.preview)], idx: i })}
                    />
                    <button
                      onClick={() => setWExistingImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            {/* New images preview */}
            {wImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {wImages.map((img, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={img.preview} alt="new"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightbox({ images: [...wExistingImages, ...wImages.map(x => x.preview)], idx: wExistingImages.length + i })}
                    />
                    <button
                      onClick={() => setWImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="sm" onClick={submitReview} disabled={wLoading}>
                {wLoading ? 'Saving...' : 'Submit Review'}
              </Button>
              {wExistingImages.length + wImages.length < 5 && (
                <label className="cursor-pointer text-xs text-emerald-700 font-semibold border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">
                  + Add Photos
                  <input type="file" multiple accept="image/*" className="hidden" onChange={pickReviewImages} />
                </label>
              )}
              <span className="text-xs text-gray-400">{wExistingImages.length + wImages.length}/5 photos</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4 text-center text-sm text-gray-500">
            <a href="/login" className="text-emerald-700 font-semibold hover:underline">Login</a> to write a review
          </div>
        )}

        <div className="space-y-4">
          {(filteredReviews ?? reviewsData?.data)?.map((r: any) => {
            const initials = (r.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            const colors = ['#2d5a3d', '#1e40af', '#7c3aed', '#b45309', '#0e7490']
            const avatarColor = colors[r.id % colors.length]
            return (
              <div key={r.id} className="bg-white rounded-2xl p-5 transition-all duration-200 hover:shadow-lg" style={{border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 14px rgba(0,0,0,0.04)'}}>
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
                        <span className="font-semibold text-gray-900 text-sm">{r.name || r.user_name || 'Customer'}</span>
                        {r.is_verified_purchase && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#e8f5ee', color: '#2d5a3d' }}
                          >
                            ✓ Verified Purchase
                          </span>
                        )}
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
                    {r.images.map((img: any, imgIdx: number) => (
                      <button key={img} onClick={() => setLightbox({ images: r.images, idx: imgIdx })} className="focus:outline-none">
                        <img src={img} alt="review" className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:opacity-90 transition-opacity cursor-zoom-in" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {(filteredReviews ?? reviewsData?.data)?.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Star size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">
                {reviewRating > 0 ? `No ${reviewRating}-star reviews yet` : 'No reviews yet'}
              </p>
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
      </>
      )}

      {/* ================= Q&A TAB ================= */}
      {pdTab === 'qa' && (
      <QASection productId={id as string} loginuserdata={loginuserdata} />
      )}

      {/* ── Image Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium select-none">
            {lightbox.idx + 1} / {lightbox.images.length}
          </div>
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 text-lg font-bold"
          >✕</button>
          {/* Prev */}
          {lightbox.images.length > 1 && lightbox.idx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, idx: prev.idx - 1 } : null) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 text-xl font-bold"
            >‹</button>
          )}
          {/* Image */}
          <img
            src={lightbox.images[lightbox.idx]}
            alt="review"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl select-none"
            onClick={e => e.stopPropagation()}
          />
          {/* Next */}
          {lightbox.images.length > 1 && lightbox.idx < lightbox.images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, idx: prev.idx + 1 } : null) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 text-xl font-bold"
            >›</button>
          )}
          {/* Dot indicators */}
          {lightbox.images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
              {lightbox.images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, idx: i } : null) }}
                  className={`rounded-full transition-all ${i === lightbox.idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ STICKY ATC BAR ═══ */}
      {product && stickyAtc && effectiveInventory > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            background: 'rgba(250,248,243,0.96)',
            backdropFilter: 'blur(24px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            borderTop: '1px solid rgba(201,168,76,0.18)',
            boxShadow: '0 -8px 40px rgba(26,58,42,0.12), 0 -1px 0 rgba(255,255,255,0.8)',
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            transform: stickyAtc ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Product thumbnail */}
            {product.images?.[0] && (
              <div style={{
                width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
                flexShrink: 0, border: '1px solid rgba(26,58,42,0.1)',
              }}>
                <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Name + price */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a3a2a', lineHeight: 1.3,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product.name}
              </p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#047857', marginTop: 1 }}>
                {flashSaleInfo
                  ? `₹${Number(flashSaleInfo.flash_price).toFixed(0)}`
                  : `₹${Number(effectivePrice).toFixed(0)}`}
                {(selectedVariant?.compareprice || product.compareprice) && (
                  <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginLeft: 6, fontWeight: 400 }}>
                    ₹{Number(selectedVariant?.compareprice || product.compareprice).toFixed(0)}
                  </span>
                )}
              </p>
            </div>

            {/* ATC button */}
            <button
              onClick={addToCart}
              disabled={cartLoading}
              style={{
                flexShrink: 0,
                padding: '11px 24px',
                borderRadius: 14,
                border: 'none',
                background: cartLoading
                  ? 'rgba(26,58,42,0.5)'
                  : isInCart
                  ? 'linear-gradient(135deg,#047857,#065f46)'
                  : 'linear-gradient(135deg,#059669,#1a3a2a)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: cartLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(5,150,105,0.4)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              {cartLoading ? (
                <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
              ) : (
                <ShoppingCart size={16} />
              )}
              {isInCart ? 'In Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}

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
  const axiosClient = axios

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
