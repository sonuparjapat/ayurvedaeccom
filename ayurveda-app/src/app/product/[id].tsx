import React, { useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ReviewImageViewer } from '../../components/ui/ReviewImageViewer'
import { getGuestSession } from '../../utils/guestSession'
import {
  ActivityIndicator, Dimensions, FlatList, Image, Modal,
  ScrollView, Share, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, TextInput,
} from 'react-native'
import { toast } from '../../components/ui/Toast'
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useAnimatedScrollHandler, useAnimatedStyle,
  useSharedValue, withSpring, withTiming, withRepeat, interpolate, Extrapolation,
  withSequence,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Colors, Fonts, Shadows, Radius } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

interface Product {
  id: number; name: string; shortdescription: string; longdescription: string
  price: string; compareprice?: string; inventory: number; images: string[]
  averagerating: string; reviewcount: number; category_name?: string; brand?: string
  brand_id?: number; brand_display_name?: string; tags?: string[]
  is_bestseller?: boolean; weight_grams?: number; total_sold?: number
  specifications?: any[]
  product_type?: string; unit?: string; tax_included?: boolean
  shipping_class?: string; allow_backorder?: boolean
  highlights?: string; ingredients?: string; benefits?: string
  usage_instructions?: string; storage_instructions?: string; warnings?: string
  video_url?: string; fssai_number?: string; coa_url?: string
  focus_keyword?: string; min_order_qty?: number; max_order_qty?: number
  is_returnable?: boolean; sort_order?: number
}
interface Review { id?: number; name: string; user_name?: string; rating: number; comment: string; images?: string[]; order_id?: number }
// console.log("hii")
// ─── IMAGE ZOOM MODAL ─────────────────────────────────────────────────────────
function ImageZoomModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TouchableOpacity
          onPress={onClose}
          style={{ position: 'absolute', top: 52, right: 18, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22 }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          centerContent
          bouncesZoom
        >
          <Image source={{ uri }} style={{ width: W, height: W * 1.1 }} resizeMode="contain" />
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Pinch to zoom</Text>
        </View>
      </View>
    </Modal>
  )
}

// ─── IMAGE GALLERY ────────────────────────────────────────────────────────────
function ImageGallery({ images, disc, outOfStock }: { images: string[]; disc: number | null; outOfStock: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomUri, setZoomUri] = useState('')
  const flatRef = useRef<FlatList>(null)

  const onMomentumEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W)
    setActiveIndex(idx)
  }

  return (
    <View style={{ position: 'relative' }}>
      <FlatList
        ref={flatRef}
        data={images.length > 0 ? images : ['placeholder']}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item: img }) => (
          <TouchableOpacity activeOpacity={0.95} onPress={() => img && img !== 'placeholder' && setZoomUri(img)} style={ig.imgSlide}>
            {img && img !== 'placeholder'
              ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 54 }}>🌿</Text>
              </View>
            }
            <LinearGradient colors={['transparent', 'rgba(26,46,30,0.35)']} style={StyleSheet.absoluteFill} />
            {img && img !== 'placeholder' && (
              <View style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                <Text style={{ color: '#fff', fontSize: 10 }}>🔍 Tap to zoom</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={ig.dotRow}>
          {images.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => {
              flatRef.current?.scrollToIndex({ index: i, animated: true })
              setActiveIndex(i)
            }}>
              <View style={[ig.dot, i === activeIndex && ig.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {disc != null && (
        <View style={ig.discBadge}>
          <Text style={ig.discText}>{disc}%{'\n'}OFF</Text>
        </View>
      )}
      {outOfStock && (
        <View style={ig.oosOverlay}><Text style={ig.oosText}>Out of Stock</Text></View>
      )}

      {/* Image count */}
      {images.length > 1 && (
        <View style={ig.imgCount}>
          <Text style={ig.imgCountText}>{activeIndex + 1}/{images.length}</Text>
        </View>
      )}

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri('')} />
    </View>
  )
}

const ig = StyleSheet.create({
  imgSlide: { width: W, height: W * 0.82, backgroundColor: Colors.mint },
  dotRow: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 20, borderRadius: 3, backgroundColor: '#fff' },
  discBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: Colors.red, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, alignItems: 'center' },
  discText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 10, textAlign: 'center', lineHeight: 14 },
  oosOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center' },
  oosText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15, letterSpacing: 1 },
  imgCount: { position: 'absolute', bottom: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  imgCountText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 10 },
})

// ─── REVIEW CARD ─────────────────────────────────────────────────────────────
function ReviewItem({ r, index }: { r: Review; index: number }) {
  const initials = (r.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#059669', '#f59e0b', '#7c3aed', '#e11d48', '#0284c7']
  const color = colors[(r.name || '?').charCodeAt(0) % colors.length]
  const [viewerIdx, setViewerIdx] = useState<number | null>(null)
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={rv.card}>
      {viewerIdx !== null && r.images?.length
        ? <ReviewImageViewer images={r.images} startIndex={viewerIdx} onClose={() => setViewerIdx(null)} />
        : null
      }
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={[rv.avatar, { backgroundColor: color + '22', borderColor: color + '44' }]}>
            <Text style={[rv.initials, { color }]}>{initials}</Text>
          </View>
          <View>
            <Text style={rv.name}>{r.name}</Text>
            <View style={rv.verifiedBadge}>
              <Text style={rv.verifiedText}>✓ Verified</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <Text key={s} style={{ fontSize: 12, color: s <= r.rating ? '#f59e0b' : '#d1d5db' }}>★</Text>
          ))}
        </View>
      </View>
      <Text style={rv.comment}>{r.comment}</Text>
      {r.images && r.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10 }}>
          {r.images.map((img, j) => (
            <TouchableOpacity key={j} onPress={() => setViewerIdx(j)} activeOpacity={0.85}>
              <Image source={{ uri: img }} style={{ width: 72, height: 72, borderRadius: 10 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  )
}

const rv = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  initials: { fontFamily: Fonts.bold, fontSize: 13 },
  name: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },
  verifiedBadge: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1, alignSelf: 'flex-start', marginTop: 2 },
  verifiedText: { color: Colors.sage, fontFamily: Fonts.medium, fontSize: 9 },
  comment: { fontFamily: Fonts.regular, color: Colors.textDim, fontSize: 13, lineHeight: 20 },
})

const rls = StyleSheet.create({
  card: { width: 148, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  imgWrap: { width: 148, height: 148, backgroundColor: Colors.mint, position: 'relative' },
  img: { width: 148, height: 148 },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.gold, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontFamily: Fonts.bold, fontSize: 9, color: '#fff' },
  name: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.forest, margin: 10, marginBottom: 0, lineHeight: 17 },
  price: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest, marginLeft: 10, marginBottom: 10 },
  mrp: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, textDecorationLine: 'line-through' },
})

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const { user, cartData, cartCount, wishlistData, setCartData, setAuthOpen } = useStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [cartQty, setCartQty] = useState(1) // qty currently in cart for this product
  const [cartLoading, setCartLoading] = useState(false)
  const [wished, setWished] = useState(false)
  const wishScale = useSharedValue(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [totalReviewPages, setTotalReviewPages] = useState(1)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [myImages, setMyImages] = useState<{ uri: string; name: string; type: string }[]>([])
  const [myExistingImages, setMyExistingImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [reviewImgViewer, setReviewImgViewer] = useState<{ images: string[]; start: number } | null>(null)
  const [tab, setTab] = useState<'desc' | 'reviews' | 'qa'>('desc')

  // Q&A
  const [questions, setQuestions] = useState<any[]>([])
  const [myQuestion, setMyQuestion] = useState('')
  const [qaSubmitting, setQaSubmitting] = useState(false)

  // Variants
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariant, setSelectedVariant] = useState<any>(null)

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])

  // Flash sale
  const [flashPrice, setFlashPrice] = useState<number | null>(null)
  const [flashDiscount, setFlashDiscount] = useState(0)

  // Pincode check
  const [pincode, setPincode] = useState('')
  const [pincodeResult, setPincodeResult] = useState<any>(null)
  const [pincodeLoading, setPincodeLoading] = useState(false)

  // Notify me (OOS)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)

  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })
  const headerBg = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [W * 0.4, W * 0.7], [0, 1], Extrapolation.CLAMP),
  }))
  const wishStyle = useAnimatedStyle(() => ({ transform: [{ scale: wishScale.value }] }))

  useEffect(() => {
    if (!user?.id || !id) return
    api.get(`/shop/reviews/product/${id}`, { params: { me: 1 } })
      .then(r => {
        const mine = (r.data?.data || [])[0]
        if (mine) {
          setMyRating(mine.rating || 0)
          setMyComment(mine.comment || '')
          setMyExistingImages(mine.images || [])
        }
      })
      .catch(() => {})
  }, [user?.id, id])

  useEffect(() => {
    if (!id) return
    fetchProduct()
    fetchReviews(1)
    // wishlist check moved to after product loads (id may be slug)
    api.get(`/shop/variants/${id}`).then(r => setVariants(r.data?.variants || [])).catch(() => {})
    api.get(`/shop/related/${id}`).then(r => setRelatedProducts(r.data?.products || [])).catch(() => {})
    api.get(`/qa/product/${id}`).then(r => setQuestions(r.data?.questions || [])).catch(() => {})
    api.get('/flash-sales/active').then(r => {
      const sales = r.data?.sales || []
      for (const sale of sales) {
        const sp = (sale.products || []).find((p: any) => String(p.product_id) === String(id) || p.slug === id)
        if (sp) { setFlashPrice(Number(sp.flash_price)); setFlashDiscount(Number(sp.discount_percent || 0)); break }
      }
    }).catch(() => {})
    // recently-viewed logged inside fetchProduct after product loads
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/shop/public/${id}`)
      const p = res.data?.data || null
      setProduct(p)
      // check wishlist status with numeric ID
      if (p) setWished(wishlistData.items.some((w: any) => w.id === p.id))
      // log recently viewed
      if (p && user?.id) {
        api.post('/shop/recently-viewed', { productId: p.id }).catch(() => {})
      }
      // store in AsyncStorage for guest recently viewed
      if (p && !user?.id) {
        try {
          const raw = await AsyncStorage.getItem('recently_viewed')
          const list: any[] = raw ? JSON.parse(raw) : []
          const filtered = list.filter((x: any) => x.id !== p.id)
          const updated = [p, ...filtered].slice(0, 10)
          await AsyncStorage.setItem('recently_viewed', JSON.stringify(updated))
        } catch { }
      }
    } catch (e: any) {
      console.warn('[Product detail]', e?.response?.status, e?.message)
      toast.error('Product not found')
    } finally { setLoading(false) }
  }

  const fetchReviews = async (pg: number) => {
    try {
      const res = await api.get(`/shop/reviews/product/${id}`, { params: { page: pg, limit: 5 } })
      const mapped = (res.data?.data || []).map((r: any) => ({ ...r, name: r.user_name || r.name || '?' }))
      if (pg === 1) {
        setReviews(mapped)
        const mine = (res.data?.data || []).find((r: any) => r.is_mine)
        if (mine) {
          setMyRating(mine.rating || 0)
          setMyComment(mine.comment || '')
          setMyExistingImages(mine.images || [])
        }
      } else {
        setReviews(p => [...p, ...mapped])
      }
      setTotalReviewPages(res.data?.pagination?.totalPages || 1)
      setReviewPage(pg)
    } catch { }
  }

  const effectiveInventory = selectedVariant ? selectedVariant.inventory : product?.inventory ?? 0
  const effectivePrice = flashPrice ?? (selectedVariant ? selectedVariant.price : product?.price ?? '0')

  const handleAddCart = async () => {
    if (!product || effectiveInventory === 0) return
    if (variants.length > 0 && !selectedVariant) {
      toast.warning('Please select a variant before adding to cart')
      return
    }

    // In cart and qty unchanged → just navigate to cart
    if (inCart && qty === cartQty) {
      router.push('/cart')
      return
    }

    setCartLoading(true)
    try {
      let sessionId: string | null = null
      if (!user?.id) sessionId = await getGuestSession()
      const base: any = { productId: product.id, quantity: qty }
      if (selectedVariant) base.variantId = selectedVariant.id
      if (sessionId) base.sessionId = sessionId

      if (inCart && qty !== cartQty) {
        // Update existing cart item quantity
        await api.put('/cart', base)
        toast.success('Quantity updated!')
      } else {
        // Fresh add
        await api.post('/cart', base)
        toast.success('Added to cart!')
      }

      const cartUrl = !user?.id && sessionId ? `/cart?sessionId=${sessionId}` : '/cart'
      const res = await api.get(cartUrl)
      const items = res.data?.items || []
      setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
      setCartQty(qty)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update cart')
    } finally { setCartLoading(false) }
  }

  const checkPincode = async () => {
    if (!/^\d{6}$/.test(pincode)) { toast.warning('Enter a valid 6-digit pincode'); return }
    setPincodeLoading(true)
    try {
      const r = await api.get(`/shop/pincode-check?pincode=${pincode}`)
      setPincodeResult(r.data)
    } catch {
      setPincodeResult({ serviceable: false, message: 'Unable to check' })
    } finally { setPincodeLoading(false) }
  }

  const submitNotifyMe = async () => {
    if (!notifyEmail.includes('@')) { toast.warning('Enter a valid email address'); return }
    setNotifyLoading(true)
    try {
      await api.post('/shop/notify-me', { productId: product?.id, email: notifyEmail, variantId: selectedVariant?.id })
      setNotifyDone(true)
      toast.success("We'll notify you when back in stock")
    } catch {
      toast.error('Could not register. Try again.')
    } finally { setNotifyLoading(false) }
  }

  const handleWishlist = async () => {
    if (!user) { setAuthOpen(true); return }
    const next = !wished
    setWished(next)
    wishScale.value = withSequence(withSpring(1.4, { damping: 8 }), withSpring(1, { damping: 12 }))
    try { await api.post('/shop/wishlist', { productId: product?.id || id }) }
    catch { setWished(!next) }
  }

  const pickReviewImages = async () => {
    const remaining = 5 - myExistingImages.length - myImages.length
    if (remaining <= 0) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { toast.error('Gallery permission needed'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.75, selectionLimit: remaining,
    })
    if (!result.canceled) {
      const picked = result.assets.map(a => ({
        uri: a.uri, name: a.fileName || `photo_${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg',
      }))
      setMyImages(prev => [...prev, ...picked].slice(0, 5 - myExistingImages.length))
    }
  }

  const submitReview = async () => {
    if (!user) { setAuthOpen(true); return }
    if (!myRating) { toast.warning('Please select a star rating'); return }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('productId', String(id))
      form.append('rating', String(myRating))
      form.append('comment', myComment)
      form.append('oldImages', JSON.stringify(myExistingImages))
      myImages.forEach(img => form.append('images', { uri: img.uri, type: img.type, name: img.name } as any))
      await api.post('/shop/reviews/product', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMyImages([])
      fetchReviews(1); fetchProduct()
      api.get(`/shop/reviews/product/${id}`, { params: { me: 1 } })
        .then(r => { const mine = (r.data?.data || [])[0]; if (mine) { setMyRating(mine.rating || 0); setMyComment(mine.comment || ''); setMyExistingImages(mine.images || []) } })
        .catch(() => {})
      toast.success('Review submitted!')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit review')
    } finally { setSubmitting(false) }
  }

  const submitQuestion = async () => {
    if (!myQuestion.trim()) return
    setQaSubmitting(true)
    try {
      await api.post(`/qa/product/${id}/ask`, { question: myQuestion.trim() })
      setMyQuestion('')
      toast.success('Your question is pending review')
      api.get(`/qa/product/${id}`).then(r => setQuestions(r.data?.questions || [])).catch(() => {})
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit question')
    } finally { setQaSubmitting(false) }
  }

  const cartItem = cartData.items.find(i => i.product_id === Number(id) && (!selectedVariant || i.variant_id === selectedVariant?.id))
  const inCart = !!cartItem

  // Sync qty from cart when item is detected in cart for the first time
  useEffect(() => {
    if (cartItem && cartItem.quantity !== cartQty) {
      setCartQty(cartItem.quantity)
      setQty(cartItem.quantity)
    }
  }, [cartItem?.quantity, cartItem?.product_id])
  const disc = product?.compareprice ? Math.round(((+product.compareprice - +effectivePrice) / +product.compareprice) * 100) : null

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicatorPlaceholder />
    </View>
  )
  if (!product) return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.bold, color: Colors.forest, fontSize: 16 }}>Product not found</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: Colors.sage, fontFamily: Fonts.medium }}>← Go back</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />

      {/* Sticky header (appears on scroll) */}
      <Animated.View style={[ss.stickyHeader, { paddingTop: insets.top }, headerBg]} pointerEvents="none">
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={ss.stickyTitle} numberOfLines={1}>{product.name}</Text>
      </Animated.View>

      {/* Back + wishlist overlay */}
      <View style={[ss.topActions, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.topBtn}>
          <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => router.push('/cart')} style={ss.topBtn}>
            <Text style={{ fontSize: 17 }}>🛍️</Text>
            {cartCount > 0 && (
              <View style={ss.cartDot}>
                <Text style={{ fontSize: 7, color: Colors.forest, fontFamily: Fonts.bold }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Share.share({ message: `${product.name} — ₹${effectivePrice}\n\nAyurVeda Desi Foods`, title: product.name })} style={ss.topBtn}>
            <Text style={{ fontSize: 17 }}>↗️</Text>
          </TouchableOpacity>
          <Animated.View style={wishStyle}>
            <TouchableOpacity onPress={handleWishlist} style={ss.topBtn}>
              <Text style={{ fontSize: 18 }}>{wished ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* Image gallery */}
        <ImageGallery images={product.images} disc={disc} outOfStock={product.inventory === 0} />

        {/* Info card */}
        <View style={ss.infoCard}>
          {/* Tags */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <View style={ss.catTag}>
              <Text style={ss.catTagText}>{product.category_name || 'Organic'}</Text>
            </View>
            {product.inventory > 0
              ? <View style={[ss.catTag, { backgroundColor: '#e8f5ee', borderColor: '#bbf7d0' }]}>
                <Text style={[ss.catTagText, { color: '#059669' }]}>✓ In Stock</Text>
              </View>
              : <View style={[ss.catTag, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                <Text style={[ss.catTagText, { color: '#ef4444' }]}>Out of Stock</Text>
              </View>
            }
          </View>

          {(product.brand_display_name || product.brand) && (
            <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.sage, marginBottom: 2 }}>
              {product.brand_display_name || product.brand}
            </Text>
          )}
          <Text style={ss.productName}>{product.name}</Text>
          <Text style={ss.productDesc}>{product.shortdescription}</Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={ss.ratingBox}>
              {[1, 2, 3, 4, 5].map(s => (
                <Text key={s} style={{ fontSize: 13, color: s <= Math.round(+product.averagerating) ? '#f59e0b' : '#d1d5db' }}>★</Text>
              ))}
              <Text style={ss.ratingText}>{product.averagerating}</Text>
            </View>
            <Text style={ss.reviewCount}>({product.reviewcount} reviews)</Text>
            {product.total_sold != null && product.total_sold > 0 && (
              <View style={{ backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: '#bbf7d0' }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage }}>{product.total_sold}+ sold</Text>
              </View>
            )}
          </View>

          {/* Flash Sale Badge */}
          {flashPrice != null && (
            <View style={{ backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: '#fff' }}>Flash Sale — {flashDiscount}% OFF</Text>
            </View>
          )}
          {/* Price card */}
          <LinearGradient
            colors={['rgba(16,185,129,0.08)', 'rgba(5,150,105,0.04)']}
            style={{ borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(16,185,129,0.18)' }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={ss.priceRow}>
              <Text style={[ss.price, { color: Colors.emerald }]}>₹{effectivePrice}</Text>
              {product.unit && <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, alignSelf: 'flex-end', marginBottom: 4 }}>({product.unit})</Text>}
              {(flashPrice != null || product.compareprice) && <Text style={ss.mrp}>₹{flashPrice != null ? product.price : product.compareprice}</Text>}
              {disc != null && disc > 0 && (
                <LinearGradient colors={[Colors.emerald, '#059669']} style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: '#fff' }}>🎉 Save {disc}%</Text>
                </LinearGradient>
              )}
              {product.is_bestseller && (
                <LinearGradient colors={[Colors.gold, '#a07830']} style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: '#fff' }}>⭐ Bestseller</Text>
                </LinearGradient>
              )}
            </View>
            {product.fssai_number && (
              <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, marginTop: 2 }}>FSSAI: {product.fssai_number}</Text>
            )}
          </LinearGradient>

          {/* Weight */}
          {product.weight_grams != null && product.weight_grams > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim }}>Net Wt: {product.weight_grams}g</Text>
            </View>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
              {product.tags.map((tag, idx) => (
                <View key={idx} style={{ backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: '#bbf7d0' }}>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 10, color: Colors.sage }}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* HIGHLIGHTS */}
          {product.highlights && (
            <View style={{ backgroundColor: Colors.mint, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: '#bbf7d0' }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>Product Highlights</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.forest, lineHeight: 20 }}>{product.highlights}</Text>
            </View>
          )}

          {/* INGREDIENTS */}
          {product.ingredients && (
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>Ingredients</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 20 }}>{product.ingredients}</Text>
            </View>
          )}

          {/* BENEFITS */}
          {product.benefits && (
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>Health Benefits</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 20 }}>{product.benefits}</Text>
            </View>
          )}

          {/* USAGE/DOSAGE */}
          {product.usage_instructions && (
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>Usage / Dosage</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 20 }}>{product.usage_instructions}</Text>
            </View>
          )}

          {/* STORAGE */}
          {product.storage_instructions && (
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>Storage Instructions</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 20 }}>{product.storage_instructions}</Text>
            </View>
          )}

          {/* WARNINGS */}
          {product.warnings && (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: '#fecaca', borderLeftWidth: 3, borderLeftColor: Colors.red }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.red, marginBottom: 6 }}>Warnings & Precautions</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: '#991b1b', lineHeight: 20 }}>{product.warnings}</Text>
            </View>
          )}

          {/* VIDEO LINK */}
          {product.video_url && (
            <TouchableOpacity
              onPress={() => {
                const { Linking } = require('react-native')
                Linking.openURL(product.video_url!)
              }}
              style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Text style={{ fontSize: 24 }}>🎬</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest }}>Watch Product Video</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim }}>Tap to view on YouTube</Text>
              </View>
              <Text style={{ fontSize: 14, color: Colors.sage }}>→</Text>
            </TouchableOpacity>
          )}

          {/* FSSAI BADGE */}
          {product.fssai_number && (
            <View style={{ backgroundColor: Colors.mint, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>🛡️</Text>
              <View>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage, letterSpacing: 0.5, textTransform: 'uppercase' }}>FSSAI Certified</Text>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest }}>{product.fssai_number}</Text>
              </View>
            </View>
          )}

          {/* COA LINK */}
          {product.coa_url && (
            <TouchableOpacity
              onPress={() => {
                const { Linking } = require('react-native')
                Linking.openURL(product.coa_url!)
              }}
              style={{ backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: '#bfdbfe', flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Text style={{ fontSize: 20 }}>🧪</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: '#2563eb', letterSpacing: 0.5, textTransform: 'uppercase' }}>Lab Tested</Text>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#1e40af' }}>View COA / Lab Report →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* NON-RETURNABLE NOTICE */}
          {product.is_returnable === false && (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.red }}>This product is non-returnable</Text>
            </View>
          )}

          {/* MIN ORDER QTY NOTICE */}
          {product.min_order_qty != null && product.min_order_qty > 1 && (
            <View style={{ backgroundColor: '#fff8e6', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14 }}>📦</Text>
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: '#92400e' }}>Minimum order quantity: {product.min_order_qty}</Text>
            </View>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Select Variant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {variants.map((v: any) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => v.inventory > 0 && setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selectedVariant?.id === v.id ? Colors.forest : Colors.border,
                      backgroundColor: selectedVariant?.id === v.id ? Colors.mint : '#fff',
                      opacity: v.inventory > 0 ? 1 : 0.4,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: selectedVariant?.id === v.id ? Colors.forest : Colors.textDim }}>
                      {v.label}
                    </Text>
                    {v.inventory <= 0 && (
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 9, color: Colors.red }}>OOS</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Notify Me (OOS) */}
          {effectiveInventory <= 0 && (
            <View style={{ backgroundColor: '#fff8e6', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 0.5, borderColor: '#fde68a' }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: '#92400e', marginBottom: 8 }}>🔔 Notify me when back in stock</Text>
              {notifyDone ? (
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.sage }}>✓ You'll be notified at {notifyEmail}</Text>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={notifyEmail}
                    onChangeText={setNotifyEmail}
                    placeholder="Your email"
                    placeholderTextColor={Colors.textDim}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: Fonts.regular, fontSize: 12, borderWidth: 0.5, borderColor: Colors.border }}
                  />
                  <TouchableOpacity
                    onPress={submitNotifyMe}
                    disabled={notifyLoading}
                    style={{ backgroundColor: '#c9a84c', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' }}
                  >
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: '#fff' }}>{notifyLoading ? '...' : 'Notify'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Quantity */}
          <View style={ss.qtyRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={ss.qtyLabel}>Quantity</Text>
              {inCart && (
                <View style={{ backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage }}>✓ IN CART ({cartQty})</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => setQty(q => Math.max(1, q - 1))} style={ss.qtyBtn}>
                <Text style={ss.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={ss.qtyVal}>{qty}</Text>
              <TouchableOpacity
                onPress={() => setQty(q => Math.min(effectiveInventory, q + 1))}
                style={[ss.qtyBtn, ss.qtyBtnPlus]}
              >
                <Text style={[ss.qtyBtnText, { color: '#fff' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          {inCart && qty !== cartQty && (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.gold, marginTop: -10, marginBottom: 12 }}>
              Cart qty: {cartQty} → Tap "Update Cart" to change to {qty}
            </Text>
          )}

          {/* Pincode delivery check */}
          <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 0.5, borderColor: Colors.border }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>📍 Check Delivery</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={pincode}
                onChangeText={(t) => { setPincode(t.replace(/\D/g, '').slice(0, 6)); setPincodeResult(null) }}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor={Colors.textDim}
                keyboardType="number-pad"
                maxLength={6}
                style={{ flex: 1, backgroundColor: Colors.cream, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: Fonts.regular, fontSize: 12, borderWidth: 0.5, borderColor: Colors.border, color: Colors.forest }}
              />
              <TouchableOpacity
                onPress={checkPincode}
                disabled={pincodeLoading || pincode.length < 6}
                style={{ backgroundColor: pincode.length < 6 ? '#ccc' : Colors.forest, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: '#fff' }}>{pincodeLoading ? '...' : 'Check'}</Text>
              </TouchableOpacity>
            </View>
            {pincodeResult && (
              <Text style={{ fontFamily: Fonts.medium, fontSize: 12, marginTop: 8, color: pincodeResult.serviceable ? Colors.sage : Colors.red }}>
                {pincodeResult.serviceable
                  ? `✓ Delivery in ${pincodeResult.delivery_days} day${pincodeResult.delivery_days !== 1 ? 's' : ''}`
                  : pincodeResult.message || 'Not serviceable'}
              </Text>
            )}
          </View>

          {/* Trust pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
            {[['🚚', 'Fast Delivery', '24-48 hrs'], ['🧪', 'Lab Tested', 'Certified'], ['↩️', '7-Day Return', 'Easy'], ['🌿', '100% Organic', 'Certified']].map(([e, t, s]) => (
              <View key={t} style={ss.trustPill}>
                <Text style={{ fontSize: 18 }}>{e}</Text>
                <View>
                  <Text style={ss.trustTitle}>{t}</Text>
                  <Text style={ss.trustSub}>{s}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View style={ss.tabRow}>
            {(['desc', 'reviews', 'qa'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={[ss.tabBtn, tab === t && ss.tabBtnActive]}>
                <Text style={[ss.tabText, tab === t && ss.tabTextActive]}>
                  {t === 'desc' ? 'Description' : t === 'reviews' ? `Reviews (${product.reviewcount})` : `Q&A (${questions.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'desc' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={ss.longDesc}>{product.longdescription || product.shortdescription}</Text>

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest, marginBottom: 12 }}>Specifications</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: Colors.border }}>
                    {product.specifications.map((spec: any, idx: number) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
                          borderBottomWidth: idx < (product.specifications?.length ?? 0) - 1 ? 0.5 : 0,
                          borderBottomColor: Colors.border,
                          backgroundColor: idx % 2 === 0 ? '#fff' : Colors.cream,
                        }}
                      >
                        <Text style={{ flex: 1, fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim }}>{spec.key || spec.label || spec.name || ''}</Text>
                        <Text style={{ flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.forest }}>{spec.value || ''}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {tab === 'reviews' && (
            <Animated.View entering={FadeIn.duration(300)}>
              {reviewImgViewer ? <ReviewImageViewer images={reviewImgViewer.images} startIndex={reviewImgViewer.start} onClose={() => setReviewImgViewer(null)} /> : null}
              {/* Write review — logged-in users only */}
              {user ? (
                <View style={ss.reviewWriteBox}>
                  <Text style={ss.reviewWriteTitle}>{myExistingImages.length > 0 || myRating > 0 ? 'Edit Your Review' : 'Write a Review'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <TouchableOpacity key={s} onPress={() => setMyRating(s)} hitSlop={6}>
                        <Text style={{ fontSize: 28, color: s <= myRating ? '#f59e0b' : '#d1d5db' }}>★</Text>
                      </TouchableOpacity>
                    ))}
                    {myRating > 0 && (
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.sage, alignSelf: 'center', marginLeft: 6 }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][myRating]}
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={ss.reviewInput}
                    placeholder="Share your experience with this product..."
                    placeholderTextColor={Colors.textDim}
                    value={myComment}
                    onChangeText={setMyComment}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Previously uploaded images */}
                  {myExistingImages.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 10 }}>
                      {myExistingImages.map((url, j) => (
                        <View key={`ex-${j}`} style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden' }}>
                          <TouchableOpacity onPress={() => setReviewImgViewer({ images: [...myExistingImages, ...myImages.map(i => i.uri)], start: j })} activeOpacity={0.85}>
                            <Image source={{ uri: url }} style={{ width: 68, height: 68 }} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setMyExistingImages(prev => prev.filter((_, i2) => i2 !== j))}
                            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ color: '#fff', fontSize: 10, fontFamily: Fonts.bold }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* Newly picked images */}
                  {myImages.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 10 }}>
                      {myImages.map((img, j) => (
                        <View key={j} style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden' }}>
                          <TouchableOpacity onPress={() => setReviewImgViewer({ images: [...myExistingImages, ...myImages.map(i => i.uri)], start: myExistingImages.length + j })} activeOpacity={0.85}>
                            <Image source={{ uri: img.uri }} style={{ width: 68, height: 68 }} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setMyImages(prev => prev.filter((_, i2) => i2 !== j))}
                            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ color: '#fff', fontSize: 10, fontFamily: Fonts.bold }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* Add photo button */}
                  {(myExistingImages.length + myImages.length) < 5 && (
                    <TouchableOpacity onPress={pickReviewImages} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.mint, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, marginBottom: 12, alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 14 }}>📷</Text>
                      <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.sage }}>
                        Add Photos ({myExistingImages.length + myImages.length}/5)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={submitReview} disabled={submitting} style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ padding: 13, borderRadius: 12, alignItems: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 13 }}>
                        {submitting ? 'Submitting...' : '✓ Submit Review'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setAuthOpen(true)} style={[ss.reviewWriteBox, { alignItems: 'center' }]}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest }}>Login to write a review</Text>
                </TouchableOpacity>
              )}

              {reviews.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>💬</Text>
                  <Text style={{ fontFamily: Fonts.bold, color: Colors.forest, fontSize: 14 }}>No reviews yet</Text>
                  <Text style={{ fontFamily: Fonts.regular, color: Colors.textDim, fontSize: 12, marginTop: 4 }}>Be the first to review!</Text>
                </View>
              ) : (
                reviews.map((r, i) => <ReviewItem key={i} r={r} index={i} />)
              )}

              {reviewPage < totalReviewPages && (
                <TouchableOpacity onPress={() => fetchReviews(reviewPage + 1)} style={ss.loadMoreBtn}>
                  <Text style={{ color: Colors.sage, fontFamily: Fonts.bold, fontSize: 13 }}>Load More Reviews ↓</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {tab === 'qa' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={ss.reviewWriteBox}>
                <Text style={ss.reviewWriteTitle}>Ask a Question</Text>
                <TextInput
                  style={ss.reviewInput}
                  placeholder="What would you like to know about this product?"
                  placeholderTextColor={Colors.textDim}
                  value={myQuestion}
                  onChangeText={setMyQuestion}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity onPress={submitQuestion} disabled={qaSubmitting} style={{ borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ padding: 13, borderRadius: 12, alignItems: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 13 }}>
                      {qaSubmitting ? 'Submitting...' : '❓ Submit Question'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {questions.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>❓</Text>
                  <Text style={{ fontFamily: Fonts.bold, color: Colors.forest, fontSize: 14 }}>No questions yet</Text>
                  <Text style={{ fontFamily: Fonts.regular, color: Colors.textDim, fontSize: 12, marginTop: 4 }}>Be the first to ask!</Text>
                </View>
              ) : (
                questions.map((q: any, i: number) => (
                  <Animated.View key={q.id || i} entering={FadeInDown.delay(i * 50)} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, marginBottom: 6 }}>Q: {q.question}</Text>
                    {q.answers?.length > 0 ? q.answers.map((a: any, j: number) => (
                      <View key={j} style={{ backgroundColor: Colors.mint, borderRadius: 10, padding: 10, marginTop: 6 }}>
                        <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.sage, marginBottom: 3 }}>
                          {a.is_admin ? '🌿 Store Team' : `💬 ${a.user_name || 'User'}`}
                        </Text>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.forest, lineHeight: 18 }}>{a.answer}</Text>
                      </View>
                    )) : (
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, fontStyle: 'italic' }}>No answer yet. Our team will respond soon.</Text>
                    )}
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}
          {/* FAQs */}
          {product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.forest, marginBottom: 10 }}>Frequently Asked Questions</Text>
              {product.faqs.map((faq: any, i: number) => (
                <View key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 8, borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden' }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, padding: 12, paddingBottom: 6 }}>Q: {faq.question}</Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, paddingHorizontal: 12, paddingBottom: 12, lineHeight: 18 }}>A: {faq.answer}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Related Products ─────────────────────────────── */}
          {relatedProducts.length > 0 && (
            <View style={{ marginTop: 24, marginBottom: 8 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest, marginBottom: 12 }}>
                You May Also Like
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {relatedProducts.map((rp: any) => {
                  const rpPrice = rp.price || rp.saleprice || '0'
                  const rpImg = Array.isArray(rp.images) ? rp.images[0] : rp.image
                  return (
                    <TouchableOpacity
                      key={rp.id}
                      onPress={() => router.push(`/product/${rp.slug || rp.id}` as any)}
                      style={rls.card}
                      activeOpacity={0.88}
                    >
                      <View style={rls.imgWrap}>
                        {rpImg
                          ? <Image source={{ uri: rpImg }} style={rls.img} resizeMode="cover" />
                          : <View style={[rls.img, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}>
                              <Text style={{ fontSize: 24 }}>🌿</Text>
                            </View>
                        }
                        {rp.is_bestseller && (
                          <View style={rls.badge}>
                            <Text style={rls.badgeText}>Bestseller</Text>
                          </View>
                        )}
                      </View>
                      <Text style={rls.name} numberOfLines={2}>{rp.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Text style={rls.price}>₹{rpPrice}</Text>
                        {rp.compareprice && Number(rpPrice) < Number(rp.compareprice) && (
                          <Text style={rls.mrp}>₹{rp.compareprice}</Text>
                        )}
                      </View>
                      {rp.averagerating > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                          <Text style={{ fontSize: 10, color: '#f59e0b' }}>★</Text>
                          <Text style={{ fontFamily: Fonts.medium, fontSize: 10, color: Colors.textDim }}>{Number(rp.averagerating).toFixed(1)}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          )}

        </View>
      </Animated.ScrollView>

      {/* Bottom CTA */}
      <Animated.View entering={FadeInUp.delay(300)} style={[ss.bottomCta, { paddingBottom: insets.bottom + 12 }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.96)', 'rgba(240,253,244,0.98)']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={[ss.ctaPrice, { color: Colors.emerald }]}>₹{effectivePrice}</Text>
          {product.compareprice && Number(effectivePrice) < Number(product.compareprice) && (
            <Text style={ss.ctaMrp}>₹{product.compareprice}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleAddCart}
          disabled={effectiveInventory === 0 || cartLoading}
          style={{ flex: 2.2 }}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={
              effectiveInventory === 0 ? ['#9ca3af', '#6b7280']
                : (variants.length > 0 && !selectedVariant) ? ['#9ca3af', '#6b7280']
                : inCart && qty !== cartQty ? ['#d97706', '#b45309']
                : inCart ? ['#059669', '#0d9488']
                  : [Colors.forest, Colors.moss]
            }
            style={ss.ctaBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={ss.ctaBtnText}>
              {cartLoading ? '·  Updating...'
                : effectiveInventory === 0 ? '🚫  Out of Stock'
                : (variants.length > 0 && !selectedVariant) ? 'Select Variant'
                : inCart && qty !== cartQty ? '↻  Update Cart'
                  : inCart ? '✓  In Cart'
                    : '🛍️  Add to Cart'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

function ActivityIndicatorPlaceholder() {
  const op = useSharedValue(0.3)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
      -1, false
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <Animated.View style={[{ alignItems: 'center', gap: 14 }, style]}>
      <Text style={{ fontSize: 48 }}>🌿</Text>
      <Text style={{ fontFamily: Fonts.bold, color: Colors.sage, fontSize: 14 }}>Loading...</Text>
    </Animated.View>
  )
}

const ss = StyleSheet.create({
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, overflow: 'hidden', paddingHorizontal: 20, paddingBottom: 12 },
  stickyTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15, marginTop: 4 },
  topActions: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  topBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.36)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartDot: { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.gold, width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  infoCard: { backgroundColor: Colors.cream, borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -22, padding: 22 },
  catTag: { backgroundColor: Colors.mint, borderWidth: 0.5, borderColor: '#bbf7d0', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  catTagText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage, letterSpacing: 0.5, textTransform: 'uppercase' },
  productName: { fontFamily: Fonts.displayBold, fontSize: 28, color: Colors.forest, lineHeight: 34, marginBottom: 6, letterSpacing: -0.3 },
  productDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, lineHeight: 20, marginBottom: 12 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff7ed', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: '#fde68a' },
  ratingText: { fontFamily: Fonts.bold, fontSize: 12, color: '#92400e', marginLeft: 3 },
  reviewCount: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  price: { fontFamily: Fonts.displayBold, fontSize: 34, color: Colors.forest },
  mrp: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textDim, textDecorationLine: 'line-through' },
  savePill: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 0.5, borderColor: '#bbf7d0' },
  saveText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage },

  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  qtyLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase' },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f4f0', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.border },
  qtyBtnPlus: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  qtyBtnText: { fontSize: 20, color: Colors.forest, fontFamily: Fonts.bold },
  qtyVal: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.forest, minWidth: 28, textAlign: 'center' },

  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  trustTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.forest },
  trustSub: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textDim },

  tabRow: { flexDirection: 'row', backgroundColor: '#f0f4f0', borderRadius: 14, padding: 4, marginBottom: 18 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', ...Shadows.sm },
  tabText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  tabTextActive: { fontFamily: Fonts.bold, color: Colors.forest },
  longDesc: { fontFamily: Fonts.regular, fontSize: 13.5, color: Colors.textDim, lineHeight: 23 },

  reviewWriteBox: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  reviewWriteTitle: { fontFamily: Fonts.bold, color: Colors.forest, fontSize: 14, marginBottom: 12 },
  reviewInput: { backgroundColor: Colors.cream, borderRadius: 12, padding: 12, fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest, marginBottom: 12, minHeight: 80, textAlignVertical: 'top', borderWidth: 0.5, borderColor: Colors.border },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },

  bottomCta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingHorizontal: 18, paddingTop: 14,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    ...Shadows.xl,
  },
  ctaPrice: { fontFamily: Fonts.displayBold, color: Colors.forest, fontSize: 22 },
  ctaMrp: { fontFamily: Fonts.regular, color: Colors.textDim, fontSize: 11, textDecorationLine: 'line-through' },
  ctaBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
})
