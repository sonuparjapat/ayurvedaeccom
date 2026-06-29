import React, { useCallback, useEffect, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import {
  Dimensions, Platform, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View, FlatList,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { impact, notify, Haptics } from '../utils/haptics'
import Animated, {
  Extrapolation, FadeIn, FadeInDown, FadeInRight,
  interpolate, useAnimatedScrollHandler, useAnimatedStyle,
  useSharedValue, withRepeat, withSequence, withSpring, withTiming, ZoomIn,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useStore } from '../store'
import api from '../api/axios'
import { getGuestSession } from '../utils/guestSession'
import { Colors, Fonts, CATEGORY_THEMES, Shadows, Radius } from '../constants/theme'

const LOGO_URL = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

const { width: W, height: H } = Dimensions.get('window')
const AnimPressable = Animated.createAnimatedComponent(Pressable)

interface Product {
  id: number; name: string; price: number; compareprice?: number
  images: string[]; inventory: number; category_name?: string
  averagerating?: number; reviewcount?: number; shortdescription?: string
  brand?: string; brand_id?: number; tags?: string[]
  is_featured?: boolean; is_bestseller?: boolean
  weight_grams?: number; total_sold?: number
  unit?: string
}
interface Review {
  id?: number; user_name: string; rating: number; comment: string; product_name: string
}

async function addToCartApi(productId: number) {
  const user = useStore.getState().user
  const payload: any = { productId, quantity: 1 }
  let sessionId: string | null = null
  if (!user?.id) {
    // getGuestSession creates a new session if one doesn't exist yet
    sessionId = await getGuestSession()
    if (sessionId) payload.sessionId = sessionId
  }
  await api.post('/cart', payload)
  const cartUrl = !user?.id && sessionId ? `/cart?sessionId=${sessionId}` : '/cart'
  const res = await api.get(cartUrl)
  const items = res.data?.items || []
  useStore.getState().setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
}
async function toggleWishlistApi(productId: number) {
  await api.post('/shop/wishlist', { productId })
}

// ─── HERO SLIDES — fallback used when no banners from API ─────────────────────
const FALLBACK_SLIDES = [
  { tag: 'WELCOME', title: 'Ancient Wisdom, Modern Health', subtitle: '100% organic · lab tested · farm direct', bg_color1: '#0a1f14', bg_color2: '#1a3a2a', cta_text: 'Shop Now', cta_link: '/products', image_url: '' },
  { tag: 'BESTSELLERS', title: "Nature's Purest Remedies", subtitle: 'Handpicked from 200+ Indian farms', bg_color1: '#0c1f1a', bg_color2: '#163028', cta_text: 'Explore', cta_link: '/products', image_url: '' },
]
interface BannerSlide { id?: number; tag?: string; title: string; subtitle?: string; image_url?: string; bg_color1: string; bg_color2: string; cta_text: string; cta_link: string }

// ─── TICKER ───────────────────────────────────────────────────────────────────
const DEFAULT_TICKER_ITEMS = [
  '100% Certified Organic', 'Lab-Tested Purity', 'Farm to Doorstep',
  'No Preservatives', 'Ayurvedic Heritage', '10,000+ Happy Customers',
  'Chemical-Free Promise', 'Direct from Indian Farms',
]
function Ticker() {
  const companyData = useStore(s => s.companyData)
  const tickerItems: string[] = (companyData as any)?.[0]?.extra_data?.ticker?.length
    ? (companyData as any)[0].extra_data.ticker
    : DEFAULT_TICKER_ITEMS
  const x = useSharedValue(0)
  const ITEM_W = 190
  const TOTAL = tickerItems.length * ITEM_W
  useEffect(() => {
    x.value = withRepeat(withTiming(-TOTAL, { duration: 22000 }), -1, false)
  }, [TOTAL])
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const items = [...tickerItems, ...tickerItems, ...tickerItems]
  return (
    <View style={ss.ticker}>
      <LinearGradient colors={[Colors.forest, '#0a1a10', Colors.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
        {items.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', width: ITEM_W, paddingHorizontal: 10 }}>
            <Text style={ss.tickerDot}>✦ </Text>
            <Text style={ss.tickerText}>{t}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  )
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ cartCount, user, defaultAddr }: { cartCount: number; user: any; defaultAddr: string | null }) {
  const { setAuthOpen } = useStore()
  const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : null
  const scale = useSharedValue(1)
  const cartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  useEffect(() => {
    if (cartCount > 0) {
      scale.value = withSequence(withSpring(1.25, { damping: 8 }), withSpring(1, { damping: 12 }))
    }
  }, [cartCount])

  return (
    <LinearGradient colors={[Colors.forest, '#0f2018']} style={ss.topbar}>
      {/* Logo + Deliver to */}
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={user ? 0.7 : 1}
        onPress={() => user && router.push('/account')}
      >
        <ExpoImage source={{ uri: LOGO_URL }} style={{ width: 110, height: 32 }} contentFit="contain" transition={200} />
        {user ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Text style={ss.deliverPin}>📍</Text>
            <Text style={ss.deliverVal} numberOfLines={1}>{defaultAddr || 'Select address ›'}</Text>
            <Text style={ss.deliverChev}>›</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setAuthOpen(true)} activeOpacity={0.8}>
            <Text style={[ss.deliverVal, { fontSize: 11, color: 'rgba(255,255,255,0.5)' }]}>Sign in for faster checkout ›</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      <Animated.View style={cartStyle}>
        <TouchableOpacity onPress={() => router.push('/cart')} style={ss.topbarIcon} activeOpacity={0.8}>
          <Text style={{ fontSize: 20 }}>🛍️</Text>
          {cartCount > 0 && (
            <View style={ss.cartBadge}>
              <Text style={ss.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity onPress={() => user ? router.push('/account') : setAuthOpen(true)} style={ss.avatarBtn} activeOpacity={0.8}>
        {initials ? (
          <LinearGradient colors={[Colors.sage, Colors.gold]} style={ss.avatar}>
            <Text style={ss.avatarText}>{initials}</Text>
          </LinearGradient>
        ) : (
          <View style={ss.avatar}>
            <Text style={{ fontSize: 16 }}>👤</Text>
          </View>
        )}
      </TouchableOpacity>
    </LinearGradient>
  )
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar() {
  return (
    <LinearGradient colors={['#0f2018', '#0a1a10']} style={ss.searchWrap}>
      <TouchableOpacity onPress={() => router.push('/search')} style={ss.searchBox} activeOpacity={0.9}>
        <Text style={ss.searchIcon}>🔍</Text>
        <Text style={ss.searchPlaceholder}>Search herbs, spices, supplements...</Text>
        <View style={ss.searchFilter}>
          <Text style={{ fontSize: 13 }}>⚙️</Text>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  )
}

// ─── HERO CAROUSEL ────────────────────────────────────────────────────────────
function HeroCarousel({ slides }: { slides: BannerSlide[] }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const flatRef = useRef<FlatList>(null)
  const timerRef = useRef<any>(null)
  const data = slides.length > 0 ? slides : FALLBACK_SLIDES

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % data.length
        flatRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, 4200)
  }, [data.length])

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [startTimer])

  const onMomentumScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (W - 32))
    setActiveSlide(Math.max(0, Math.min(idx, data.length - 1)))
  }

  return (
    <View style={{ marginBottom: 4 }}>
      <FlatList
        ref={flatRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled={false}
        snapToInterval={W - 32}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{ gap: 0 }}
        getItemLayout={(_, index) => ({
          length: W - 32,
          offset: (W - 32) * index,
          index,
        })}
        onScrollToIndexFailed={({ index }) => {
          flatRef.current?.scrollToOffset({ offset: (W - 32) * index, animated: true })
        }}
        renderItem={({ item: slide, index }) => (
          <Animated.View entering={FadeIn.delay(index * 80)} style={[ss.heroCard, { width: W - 32 }]}>
            <LinearGradient colors={[slide.bg_color1, slide.bg_color2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            {slide.image_url ? (
              <ExpoImage source={{ uri: slide.image_url }} style={[StyleSheet.absoluteFill, { opacity: 0.25, borderRadius: 20 }]} contentFit="cover" transition={300} />
            ) : null}
            <View style={[ss.heroBlob, { top: -30, right: -30, backgroundColor: 'rgba(16,185,129,0.12)' }]} />
            <View style={[ss.heroBlob, { bottom: -20, left: -20, width: 120, height: 120, backgroundColor: 'rgba(201,168,76,0.08)' }]} />

            {slide.tag ? (
              <View style={ss.heroTag}>
                <View style={ss.heroTagDot} />
                <Text style={ss.heroTagText}>{slide.tag}</Text>
              </View>
            ) : null}

            <Text style={ss.heroTitle}>{slide.title}</Text>
            {slide.subtitle ? <Text style={ss.heroSub}>{slide.subtitle}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity onPress={() => router.push('/products')} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.gold, '#a07830']} style={ss.heroCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={ss.heroCtaText}>{slide.cta_text} →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />
      <View style={ss.dotRow}>
        {data.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => {
            flatRef.current?.scrollToIndex({ index: i, animated: true })
            setActiveSlide(i)
          }}>
            <Animated.View style={[ss.dot, i === activeSlide && ss.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ─── FILTER PILLS — driven by real categories from store ──────────────────────
function FilterPills({ activeCatId, setActiveCatId }: { activeCatId: number | null; setActiveCatId: (id: number | null) => void }) {
  const categories = useStore(s => s.categories)
  const topLevel = categories.filter(c => !c.parent_id && (!c.level || c.level === 0))
  const pills = topLevel.length > 0 ? topLevel : categories
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        {[{ id: null, name: 'All' }, ...pills].map((c: any) => {
          const isActive = activeCatId === c.id
          return (
            <TouchableOpacity key={String(c.id)} onPress={() => setActiveCatId(c.id)} style={[ss.pill, isActive ? ss.pillActive : ss.pillInactive]} activeOpacity={0.8}>
              {isActive && <View style={ss.pillActiveDot} />}
              <Text style={[ss.pillText, isActive ? ss.pillTextActive : ss.pillTextInactive]}>{c.name}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </Animated.View>
  )
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll, light = false }: { title: string; onSeeAll?: () => void; light?: boolean }) {
  return (
    <View style={ss.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[ss.sectionAccent, { backgroundColor: light ? Colors.gold : Colors.forest }]} />
        <Text style={[ss.sectionTitle, light && { color: '#f1f5f9' }]}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7} style={[ss.seeAllBtn, light && { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <Text style={[ss.sectionSeeAll, light && { color: Colors.gold }]}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── CATEGORY CARD ────────────────────────────────────────────────────────────
function CategoryCard({ item, index }: { item: any; index: number }) {
  const scale = useSharedValue(1)
  const theme = CATEGORY_THEMES[index % CATEGORY_THEMES.length]
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(500)} style={style}>
      <AnimPressable
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
        onPress={() => router.push(`/category/${item.slug || item.id}`)}
        style={[ss.catCard, { borderColor: theme.ring + '60' }]}
      >
        <LinearGradient colors={theme.grad} style={ss.catBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={[ss.catImgWrap, { backgroundColor: theme.light }]}>
          {item.image_url
            ? <ExpoImage source={{ uri: item.image_url }} style={ss.catImg} contentFit="cover" transition={200} />
            : <Text style={{ fontSize: 34 }}>🌿</Text>
          }
        </View>
        <View style={ss.catBody}>
          <View style={[ss.catTag, { backgroundColor: theme.light, borderColor: theme.ring }]}>
            <Text style={[ss.catTagText, { color: theme.accent }]}>{item.tag || 'Natural'}</Text>
          </View>
          <Text style={[ss.catName, { color: theme.accent }]} numberOfLines={1}>{item.name}</Text>
          <Text style={ss.catCount}>{item.product_count || 0} Products</Text>
          <LinearGradient colors={theme.grad} style={ss.catExploreBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={ss.catExploreText}>Explore →</Text>
          </LinearGradient>
        </View>
      </AnimPressable>
    </Animated.View>
  )
}

// ─── CATEGORIES SECTION ───────────────────────────────────────────────────────
function CategoriesSection() {
  const categories = useStore(s => s.categories)
  const topLevel = categories.filter(c => !c.parent_id && (!c.level || c.level === 0))
  const displayCats = topLevel.length > 0 ? topLevel : categories
  if (!displayCats.length) return null
  return (
    <View style={{ marginBottom: 8 }}>
      <SectionHeader title="Shop by Category" onSeeAll={() => router.push('/products')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
        {displayCats.map((cat, i) => <CategoryCard key={cat.id} item={cat} index={i} />)}
      </ScrollView>
    </View>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ item, index }: { item: Product; index: number }) {
  const scale = useSharedValue(1)
  const wishScale = useSharedValue(1)
  const { user, setAuthOpen, wishlistData, cartData, setWishlistData } = useStore()

  // Initialize from store so state is correct on first render
  const [wished, setWished] = useState(() => wishlistData.items.some((w: any) => w.id === item.id))
  const [adding, setAdding] = useState(false)
  const inCart = cartData.items.some(i => i.product_id === item.id)
  const outOfStock = item.inventory === 0

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const wishStyle = useAnimatedStyle(() => ({ transform: [{ scale: wishScale.value }] }))
  const disc = item.compareprice ? Math.round(((item.compareprice - item.price) / item.compareprice) * 100) : null
  const img = item.images?.[0] || ''

  // Keep wished in sync if store updates externally
  useEffect(() => {
    setWished(wishlistData.items.some((w: any) => w.id === item.id))
  }, [wishlistData.items])

  const handleWish = async () => {
    if (!user) { setAuthOpen(true); return }
    impact(Haptics.ImpactFeedbackStyle.Light)
    const adding = !wished
    const prev = useStore.getState().wishlistData
    setWished(adding)
    wishScale.value = withSequence(withSpring(1.45, { damping: 8 }), withSpring(1, { damping: 12 }))
    if (adding) {
      const newItem: any = { wishlist_id: Date.now(), id: item.id, name: item.name, price: item.price, compareprice: item.compareprice, images: img, inventory: item.inventory, averagerating: item.averagerating || 0, reviewcount: item.reviewcount || 0, category_name: item.category_name || '' }
      setWishlistData({ ...prev, items: [...prev.items, newItem], totalItems: prev.totalItems + 1 })
    } else {
      setWishlistData({ ...prev, items: prev.items.filter((w: any) => w.id !== item.id), totalItems: Math.max(0, prev.totalItems - 1) })
    }
    try { await toggleWishlistApi(item.id) }
    catch { setWished(!adding); setWishlistData(prev) }
  }

  const handleCart = async () => {
    if (inCart) { router.push('/cart'); return }
    impact(Haptics.ImpactFeedbackStyle.Medium)
    setAdding(true)
    try {
      await addToCartApi(item.id)
      notify(Haptics.NotificationFeedbackType.Success)
    } catch { } finally { setAdding(false) }
  }

  const cartLabel = outOfStock ? 'Out of Stock' : inCart ? '✓ In Cart — View' : adding ? 'Adding...' : '+ Add to Cart'
  const cartColors: [string, string] = outOfStock ? ['#9ca3af', '#6b7280'] : inCart ? [Colors.emerald, '#047857'] : adding ? [Colors.sage, Colors.moss] : [Colors.forest, Colors.moss]

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(500)} style={cardStyle}>
      <AnimPressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
        onPress={() => router.push(`/product/${(item as any).slug || item.id}`)}
        style={ss.prodCard}
      >
        <View style={ss.prodImgWrap}>
          {img
            ? <ExpoImage source={{ uri: img }} style={ss.prodImg} contentFit="cover" transition={200} />
            : <View style={[ss.prodImg, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 36 }}>🌿</Text></View>
          }
          <LinearGradient colors={['transparent', 'rgba(10,24,16,0.25)']} style={StyleSheet.absoluteFill} />

          {disc != null && disc > 0 && (
            <View style={ss.discBadge}>
              <Text style={ss.discText}>{disc}%{'\n'}OFF</Text>
            </View>
          )}
          {item.is_bestseller && (
            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: Colors.gold, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 8, color: '#fff' }}>BESTSELLER</Text>
            </View>
          )}
          {outOfStock && (
            <View style={ss.oosOverlay}><Text style={ss.oosText}>Out of Stock</Text></View>
          )}
          <Animated.View style={[ss.wishBtn, wishStyle]}>
            <TouchableOpacity onPress={handleWish} hitSlop={8} activeOpacity={0.8}>
              <Text style={{ fontSize: 18 }}>{wished ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={ss.prodInfo}>
          <Text style={ss.prodCat} numberOfLines={1}>{item.category_name || 'Organic'}</Text>
          <Text style={ss.prodName} numberOfLines={2}>{item.name}</Text>
          {item.averagerating != null && item.averagerating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Text key={s} style={{ fontSize: 9, color: s <= Math.round(item.averagerating!) ? '#f59e0b' : '#d1d5db' }}>★</Text>
              ))}
              <Text style={{ fontSize: 9, color: Colors.textDim }}>({item.reviewcount || 0})</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
            <Text style={ss.prodPrice}>₹{item.price}</Text>
            {item.unit && <Text style={{ fontSize: 10, color: Colors.textDim, fontFamily: Fonts.regular }}>({item.unit})</Text>}
            {item.compareprice && <Text style={ss.prodMrp}>₹{item.compareprice}</Text>}
          </View>
        </View>

        <TouchableOpacity onPress={handleCart} disabled={outOfStock || adding} activeOpacity={0.85} style={{ margin: 10, marginTop: 4 }}>
          <LinearGradient colors={cartColors} style={ss.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={ss.addBtnText}>{cartLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </AnimPressable>
    </Animated.View>
  )
}

// ─── TRUST STRIP ──────────────────────────────────────────────────────────────
const DEFAULT_STATS = [
  { val: '10K+', lbl: 'Customers', emoji: '👥' },
  { val: '4.8★', lbl: 'Rating', emoji: '⭐' },
  { val: '200+', lbl: 'Farmers', emoji: '🌾' },
  { val: '50+', lbl: 'Products', emoji: '🛒' },
]
const STAT_EMOJIS = ['👥', '⭐', '🌾', '🛒']
function TrustStrip() {
  const companyData = useStore(s => s.companyData)
  const rawStats = (companyData as any)?.[0]?.extra_data?.stats
  const stats = rawStats?.length
    ? rawStats.map((s: any, i: number) => ({ val: s.value, lbl: s.label, emoji: s.emoji || STAT_EMOJIS[i % STAT_EMOJIS.length] }))
    : DEFAULT_STATS
  return (
    <Animated.View entering={FadeIn.delay(300)} style={{ marginHorizontal: 16, marginBottom: 8 }}>
      <LinearGradient colors={['#0d1a10', '#111711']} style={ss.trustStrip}>
        {stats.map((s: any, i: number) => (
          <React.Fragment key={i}>
            <View style={ss.trustItem}>
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{s.emoji}</Text>
              <Text style={ss.trustVal}>{s.val}</Text>
              <Text style={ss.trustLbl}>{s.lbl}</Text>
            </View>
            {i < stats.length - 1 && <View style={ss.trustDivider} />}
          </React.Fragment>
        ))}
      </LinearGradient>
    </Animated.View>
  )
}

// ─── REVIEW CARD ──────────────────────────────────────────────────────────────
const GRAD_PAIRS: [string, string][] = [
  ['#059669', '#0d9488'], ['#f59e0b', '#f97316'],
  ['#7c3aed', '#9333ea'], ['#e11d48', '#f43f5e'], ['#0284c7', '#0ea5e9'],
]
function ReviewCard({ item, index }: { item: Review; index: number }) {
  const initials = (item.user_name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = GRAD_PAIRS[Math.abs((item.user_name || '').charCodeAt(0) || 0) % GRAD_PAIRS.length]
  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(500)} style={ss.reviewCard}>
      <LinearGradient colors={['#10b981', '#0d9488', 'transparent']} style={ss.reviewAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <Text style={ss.reviewQuote}>"</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <LinearGradient colors={colors} style={ss.reviewAvatar}>
          <Text style={ss.reviewInitials}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={ss.reviewName}>{item.user_name}</Text>
          <View style={ss.verifiedPill}>
            <Text style={ss.verifiedText}>✓ Verified Buyer</Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 2, marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <Text key={s} style={{ fontSize: 12, color: s <= item.rating ? '#f59e0b' : '#374151' }}>★</Text>
        ))}
      </View>
      <Text style={ss.reviewComment} numberOfLines={3}>"{item.comment}"</Text>
      <View style={ss.reviewProdRow}>
        <Text style={{ fontSize: 11 }}>🛍️</Text>
        <Text style={ss.reviewProd} numberOfLines={1}>{item.product_name}</Text>
      </View>
    </Animated.View>
  )
}

// ─── WHY US ───────────────────────────────────────────────────────────────────
const DEFAULT_WHY = [
  { emoji: '🌿', title: '100% Organic', body: 'Certified organic, no synthetics.', color: '#4ADE80' },
  { emoji: '🧪', title: 'Lab Tested', body: 'Third-party purity testing.', color: '#FBBF24' },
  { emoji: '🚚', title: 'Farm to Door', body: '200+ farming partners.', color: '#60A5FA' },
  { emoji: '🏆', title: 'Award Winning', body: 'India Organic Awards 2023 & 2024.', color: '#F472B6' },
  { emoji: '🛡️', title: 'FSSAI Certified', body: 'Audited Indian food safety.', color: '#A78BFA' },
  { emoji: '💚', title: 'Community', body: '2% of orders to rural farmers.', color: '#34D399' },
]
const WHY_COLORS = ['#4ADE80', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA', '#34D399']
const WHY_EMOJIS = ['🌿', '🧪', '🚚', '🏆', '🛡️', '💚']
function WhyUsSection() {
  const companyData = useStore(s => s.companyData)
  const rawWhy = (companyData as any)?.[0]?.extra_data?.why_us
  const why = rawWhy?.length
    ? rawWhy.map((w: any, i: number) => ({
        emoji: w.emoji || WHY_EMOJIS[i % WHY_EMOJIS.length],
        title: w.title || DEFAULT_WHY[i % DEFAULT_WHY.length].title,
        body: w.body || DEFAULT_WHY[i % DEFAULT_WHY.length].body,
        color: w.accent || WHY_COLORS[i % WHY_COLORS.length],
      }))
    : DEFAULT_WHY
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {why.map((w: any, i: number) => (
          <Animated.View key={w.title} entering={FadeInDown.delay(i * 70).duration(400)} style={ss.whyCard}>
            <View style={[ss.whyIcon, { backgroundColor: w.color + '22' }]}>
              <Text style={{ fontSize: 20 }}>{w.emoji}</Text>
            </View>
            <Text style={ss.whyTitle}>{w.title}</Text>
            <Text style={ss.whyBody}>{w.body}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  )
}

// ─── OFFER BANNER — shows first active coupon from API ────────────────────────
interface ActiveCoupon { code: string; type: string; value: number; min_order: number; description?: string }
function OfferBanner({ coupon }: { coupon: ActiveCoupon | null }) {
  if (!coupon) return null
  const label = coupon.type === 'percent'
    ? `${coupon.value}% OFF`
    : `₹${coupon.value} OFF`
  const sub = coupon.description || (coupon.min_order > 0 ? `On orders above ₹${coupon.min_order}` : 'No minimum order')
  return (
    <Animated.View entering={FadeInDown.delay(100)} style={{ marginHorizontal: 16, marginBottom: 8 }}>
      <LinearGradient colors={[Colors.gold, '#a07830']} style={ss.offerBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={ss.offerBannerLeft}>
          <Text style={ss.offerTitle}>🎁 {label} — Use code: {coupon.code}</Text>
          <Text style={ss.offerSub}>{sub}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/checkout')} style={ss.offerBtn}>
          <Text style={ss.offerBtnText}>Apply</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ w, h, radius = 8 }: { w: number | string; h: number; radius?: number }) {
  const op = useSharedValue(0.45)
  useEffect(() => {
    op.value = withRepeat(withSequence(withTiming(1, { duration: 750 }), withTiming(0.45, { duration: 750 })), -1, false)
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: radius, backgroundColor: Colors.shimmer1 }, style]} />
}

function ProductCardSkeleton() {
  return (
    <View style={[ss.prodCard, { overflow: 'hidden' }]}>
      <Skeleton w={W * 0.48} h={150} radius={0} />
      <View style={{ padding: 10, gap: 7 }}>
        <Skeleton w={70} h={9} />
        <Skeleton w={120} h={13} />
        <Skeleton w={80} h={11} />
        <Skeleton w={60} h={18} />
      </View>
      <View style={{ margin: 10, marginTop: 4 }}>
        <Skeleton w={'100%'} h={32} radius={9} />
      </View>
    </View>
  )
}

// ─── FLASH SALE ──────────────────────────────────────────────────────────────
function FlashSaleSection({ sale }: { sale: any }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(sale.ends_at).getTime() - Date.now()) / 1000)))

  useEffect(() => {
    if (secs <= 0) return
    const t = setInterval(() => setSecs(s => s <= 1 ? 0 : s - 1), 1000)
    return () => clearInterval(t)
  }, [sale.ends_at])

  if (secs <= 0) return null

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(500)} style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <LinearGradient colors={['#dc2626', '#ea580c', '#d97706']} style={{ borderRadius: 18, overflow: 'hidden' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{sale.title}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Ends in </Text>
            {[pad(h), pad(m), pad(s)].map((v, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 13 }}>:</Text>}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#fff' }}>{v}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 14, paddingBottom: 14 }}>
          {(sale.products || []).map((p: any) => {
            const pctSold = p.stock_limit ? Math.min(100, Math.round(((p.sold_count || 0) / p.stock_limit) * 100)) : 0
            return (
              <TouchableOpacity key={p.product_id} onPress={() => router.push(`/product/${p.slug || p.product_id}`)} activeOpacity={0.9}
                style={{ width: 130, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' }}>
                {p.image ? (
                  <ExpoImage source={{ uri: p.image }} style={{ width: 130, height: 110 }} contentFit="cover" transition={200} />
                ) : (
                  <View style={{ width: 130, height: 110, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 30 }}>⚡</Text>
                  </View>
                )}
                <View style={{ padding: 8 }}>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.forest }} numberOfLines={1}>{p.product_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: '#dc2626' }}>₹{p.flash_price}</Text>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, textDecorationLine: 'line-through' }}>₹{p.original_price}</Text>
                  </View>
                  <View style={{ backgroundColor: '#fee2e2', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start', marginTop: 3 }}>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 9, color: '#dc2626' }}>{p.discount_percent}% OFF</Text>
                  </View>
                  {p.stock_limit > 0 && (
                    <View style={{ marginTop: 5 }}>
                      <View style={{ height: 4, backgroundColor: '#fee2e2', borderRadius: 2 }}>
                        <View style={{ height: 4, backgroundColor: '#dc2626', borderRadius: 2, width: `${pctSold}%` as any }} />
                      </View>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 8, color: Colors.textDim, marginTop: 2 }}>{pctSold}% sold</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  )
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const user = useStore(s => s.user)
  const cartCount = useStore(s => s.cartCount)

  const [products, setProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [banners, setBanners] = useState<BannerSlide[]>([])
  const [activeCoupon, setActiveCoupon] = useState<ActiveCoupon | null>(null)
  const [defaultAddr, setDefaultAddr] = useState<string | null>(null)
  const [prodLoading, setProdLoading] = useState(true)
  const [prodError, setProdError] = useState(false)
  const [prodRetryAttempt, setProdRetryAttempt] = useState(0)
  const [revLoading, setRevLoading] = useState(true)
  const [activeCatId, setActiveCatId] = useState<number | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [flashSale, setFlashSale] = useState<any>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [60, 140], [0, 1], Extrapolation.CLAMP),
  }))

  // Fetch banners + coupons once on mount
  useEffect(() => {
    api.get('/banners/public').then(r => setBanners(r.data?.banners || [])).catch(() => {})
    api.get('/coupons/public').then(r => {
      const list = r.data?.coupons || []
      if (list.length) setActiveCoupon(list[0])
    }).catch(() => {})
    api.get('/shop/reviews', { params: { rating: 5, limit: 6, page: 1 } })
      .then(r => setReviews(r.data?.data || []))
      .catch(() => {})
      .finally(() => setRevLoading(false))
    api.get('/flash-sales/active').then(r => {
      const sales = r.data?.sales || []
      if (sales.length) setFlashSale(sales[0])
    }).catch(() => {})
  }, [])

  // Featured products with auto-retry for cold-start servers
  const MAX_RETRIES = 3
  const fetchFeatured = (catId: number | null, attempt = 0) => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    setProdLoading(true)
    setProdError(false)
    setProdRetryAttempt(attempt)
    const params: any = { limit: 8 }
    if (catId) params.category_id = catId
    api.get('/shop/public', { params })
      .then(r => {
        const prods = r.data?.products || []
        if (prods.length > 0) {
          setProducts(prods)
          setProdLoading(false)
        } else if (attempt < MAX_RETRIES) {
          // Empty response during server cold-start — auto retry
          retryTimerRef.current = setTimeout(() => fetchFeatured(catId, attempt + 1), 3000)
        } else {
          setProducts([])
          setProdLoading(false)
          setProdError(true)
        }
      })
      .catch(() => {
        if (attempt < MAX_RETRIES) {
          // Network/timeout error — retry with increasing delay
          retryTimerRef.current = setTimeout(() => fetchFeatured(catId, attempt + 1), (attempt + 1) * 3000)
        } else {
          setProdLoading(false)
          setProdError(true)
        }
      })
  }

  useEffect(() => {
    fetchFeatured(activeCatId)
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current) }
  }, [activeCatId])

  // On focus: refresh cart, default address, recently viewed
  useFocusEffect(useCallback(() => {
    const u = useStore.getState().user
    // recently viewed — server for logged-in, AsyncStorage for guests
    if (u?.id) {
      api.get('/shop/recently-viewed')
        .then(r => setRecentlyViewed(r.data?.products || []))
        .catch(() => {})
    } else {
      AsyncStorage.getItem('recently_viewed').then(raw => {
        if (raw) {
          try { setRecentlyViewed(JSON.parse(raw)) } catch { }
        }
      }).catch(() => {})
    }
    const refreshCart = async () => {
      try {
        const sessionId = await AsyncStorage.getItem('guest_session_id')
        const url = !u?.id && sessionId ? `/cart?sessionId=${sessionId}` : '/cart'
        const res = await api.get(url)
        const items = res.data?.items || []
        useStore.getState().setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
      } catch { }
    }
    refreshCart()
    if (u?.id) {
      api.get('/users/addresses').then(res => {
        const addrs = res.data?.addresses || []
        const def = addrs.find((a: any) => a.is_default) || addrs[0]
        if (def) setDefaultAddr(`${def.city} ${def.pincode}`)
        else setDefaultAddr(null)
      }).catch(() => {})
    } else {
      setDefaultAddr(null)
    }
  }, []))

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.forest} />

      {/* Floating header */}
      <Animated.View style={[ss.floatHeader, { paddingTop: insets.top }, headerStyle]} pointerEvents="none">
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <ExpoImage source={{ uri: LOGO_URL }} style={{ width: 100, height: 28 }} contentFit="contain" transition={200} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ paddingTop: insets.top }}>
          <Ticker />
          <TopBar cartCount={cartCount} user={user} defaultAddr={defaultAddr} />
          <SearchBar />
        </View>

        {/* Hero carousel */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <HeroCarousel slides={banners} />
        </View>

        {/* Filter pills — real categories */}
        <FilterPills activeCatId={activeCatId} setActiveCatId={setActiveCatId} />

        {/* Flash Sale */}
        {flashSale && <FlashSaleSection sale={flashSale} />}

        {/* Offer Banner — real coupon */}
        <OfferBanner coupon={activeCoupon} />

        {/* Categories */}
        <CategoriesSection />

        {/* Featured Products */}
        <View style={{ backgroundColor: Colors.mint, paddingVertical: 20, marginBottom: 8 }}>
          <SectionHeader title="Featured Products" onSeeAll={() => router.push('/products')} />
          {prodLoading ? (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                {[1, 2, 3].map(k => <ProductCardSkeleton key={k} />)}
              </ScrollView>
              {prodRetryAttempt > 0 && (
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ fontSize: 11, color: Colors.textDim, fontFamily: Fonts.regular }}>
                    🌿 Server warming up... ({prodRetryAttempt}/{MAX_RETRIES})
                  </Text>
                </View>
              )}
            </View>
          ) : prodError || products.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>🌿</Text>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest, marginBottom: 6 }}>
                Server is starting up
              </Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, textAlign: 'center', marginBottom: 18, lineHeight: 18 }}>
                Our server wakes up on first request.{'\n'}Tap below to try again.
              </Text>
              <TouchableOpacity
                onPress={() => fetchFeatured(activeCatId)}
                style={{ backgroundColor: Colors.forest, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 13 }}>↻  Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {products.map((p, i) => <ProductCard key={p.id} item={p} index={i} />)}
            </ScrollView>
          )}
        </View>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <View style={{ paddingVertical: 20 }}>
            <SectionHeader title="Recently Viewed" onSeeAll={undefined} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {recentlyViewed.map((p, i) => <ProductCard key={p.id} item={p} index={i} />)}
            </ScrollView>
          </View>
        )}

        {/* Trust strip */}
        <View style={{ paddingTop: 8, paddingBottom: 4 }}>
          <TrustStrip />
        </View>

        {/* Why Us */}
        <View style={{ backgroundColor: Colors.dark, paddingVertical: 24 }}>
          <SectionHeader title="Why Oroganix" light />
          <WhyUsSection />
        </View>

        {/* Reviews */}
        <View style={{ backgroundColor: Colors.dark, paddingBottom: 24 }}>
          <SectionHeader title="Customer Reviews" light />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {revLoading
              ? [1, 2].map(k => (
                <View key={k} style={[ss.reviewCard, { gap: 8 }]}>
                  <Skeleton w={W * 0.72} h={14} />
                  <Skeleton w={100} h={10} />
                  <Skeleton w={W * 0.68} h={40} radius={6} />
                </View>
              ))
              : reviews.map((r, i) => <ReviewCard key={i} item={r} index={i} />)
            }
          </ScrollView>

          <View style={ss.finalCta}>
            <Text style={ss.finalCtaText}>
              Join <Text style={{ color: Colors.emerald, fontFamily: Fonts.bold }}>10,000+</Text> customers living healthier.
            </Text>
            <TouchableOpacity onPress={() => router.push('/products')} activeOpacity={0.85}>
              <LinearGradient colors={['#059669', '#0d9488']} style={ss.finalCtaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={ss.finalCtaBtnText}>🛍️  Shop the Collection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

      <BottomNav active="/" />
    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  ticker: { height: 32, overflow: 'hidden', justifyContent: 'center' },
  tickerDot: { color: Colors.gold, fontSize: 8 },
  tickerText: { color: 'rgba(167,243,208,0.85)', fontSize: 9.5, fontFamily: Fonts.bold, letterSpacing: 1.2, textTransform: 'uppercase' },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  deliverLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontFamily: Fonts.medium, letterSpacing: 0.8, textTransform: 'uppercase' },
  deliverPin: { fontSize: 12 },
  deliverVal: { color: '#fff', fontSize: 13, fontFamily: Fonts.bold },
  deliverChev: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginLeft: 2 },
  topbarIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.gold, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.forest },
  cartBadgeText: { color: Colors.forest, fontSize: 9, fontFamily: Fonts.bold },
  avatarBtn: {},
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  avatarText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 13 },

  searchWrap: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  searchBox: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchIcon: { fontSize: 14 },
  searchPlaceholder: { flex: 1, color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.regular, fontSize: 13 },
  searchFilter: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  // Hero Carousel
  heroCard: { borderRadius: 22, overflow: 'hidden', padding: 22, minHeight: 210, marginBottom: 0 },
  heroBlob: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 0.5, borderColor: 'rgba(201,168,76,0.35)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(201,168,76,0.15)', marginBottom: 12 },
  heroTagDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.gold },
  heroTagText: { color: Colors.gold, fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 36, fontFamily: Fonts.displayBold, lineHeight: 40, letterSpacing: -0.5 },
  heroTitle2: { color: '#fff', fontSize: 36, fontFamily: Fonts.displayBold, lineHeight: 40, letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: Fonts.regular, letterSpacing: 0.5 },
  heroCta: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 13 },
  heroCtaText: { color: Colors.forest, fontFamily: Fonts.bold, fontSize: 14 },
  heroBadge: { position: 'absolute', top: 18, right: 18, backgroundColor: 'rgba(16,185,129,0.18)', borderWidth: 0.5, borderColor: 'rgba(16,185,129,0.35)', borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 64 },
  heroBadgeVal: { color: '#6ee7b7', fontSize: 17, fontFamily: Fonts.bold },
  heroBadgeLabel: { color: 'rgba(110,231,183,0.65)', fontSize: 8, fontFamily: Fonts.medium, letterSpacing: 0.5, textAlign: 'center' },

  // Carousel dots
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, paddingBottom: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(26,46,30,0.2)' },
  dotActive: { width: 20, borderRadius: 3, backgroundColor: Colors.forest },

  // Pills
  pill: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  pillInactive: { backgroundColor: 'transparent', borderColor: 'rgba(26,46,30,0.2)' },
  pillActiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.gold },
  pillText: { fontSize: 12, fontFamily: Fonts.medium },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: Colors.forest },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { color: Colors.forest, fontFamily: Fonts.bold, fontSize: 17 },
  seeAllBtn: { borderWidth: 0.5, borderColor: 'rgba(26,46,30,0.15)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  sectionSeeAll: { color: Colors.sage, fontFamily: Fonts.medium, fontSize: 11 },

  // Category
  catCard: { width: W * 0.52, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden', borderWidth: 0.5, ...Shadows.md },
  catBar: { height: 3 },
  catImgWrap: { height: 115, alignItems: 'center', justifyContent: 'center' },
  catImg: { width: 70, height: 70, borderRadius: 35 },
  catBody: { padding: 12, gap: 4 },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 0.5 },
  catTagText: { fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 0.8, textTransform: 'uppercase' },
  catName: { fontFamily: Fonts.bold, fontSize: 15, letterSpacing: -0.2 },
  catCount: { color: Colors.textDim, fontFamily: Fonts.regular, fontSize: 11 },
  catExploreBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start', marginTop: 4 },
  catExploreText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 11 },

  // Product
  prodCard: { width: W * 0.48, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden', ...Shadows.md },
  prodImgWrap: { height: 155, backgroundColor: Colors.mint, position: 'relative' },
  prodImg: { width: '100%', height: '100%' },
  discBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.red, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignItems: 'center' },
  discText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 9, textAlign: 'center', lineHeight: 13 },
  oosOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  oosText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.5 },
  wishBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 99, width: 33, height: 33, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  prodInfo: { padding: 10, gap: 2 },
  prodCat: { color: Colors.sage, fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  prodName: { color: Colors.forest, fontFamily: Fonts.bold, fontSize: 13, lineHeight: 17 },
  prodPrice: { color: Colors.forest, fontFamily: Fonts.displayBold, fontSize: 19 },
  prodMrp: { color: 'rgba(26,46,30,0.35)', fontFamily: Fonts.regular, fontSize: 11, textDecorationLine: 'line-through' },
  addBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 12 },

  // Offer Banner
  offerBanner: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offerBannerLeft: { flex: 1 },
  offerTitle: { color: Colors.dark, fontFamily: Fonts.bold, fontSize: 14 },
  offerSub: { color: 'rgba(13,18,13,0.65)', fontFamily: Fonts.regular, fontSize: 12, marginTop: 2 },
  offerBtn: { backgroundColor: Colors.dark, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  offerBtnText: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 13 },

  // Trust
  trustStrip: { borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  trustItem: { alignItems: 'center', gap: 1 },
  trustVal: { color: '#6ee7b7', fontFamily: Fonts.displayBold, fontSize: 24 },
  trustLbl: { color: 'rgba(148,163,184,0.8)', fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  trustDivider: { width: 0.5, height: 40, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Why
  whyCard: { width: (W - 32 - 10) / 2, backgroundColor: '#111711', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 14, gap: 6 },
  whyIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  whyTitle: { color: '#f1f5f9', fontFamily: Fonts.bold, fontSize: 13 },
  whyBody: { color: '#94a3b8', fontFamily: Fonts.regular, fontSize: 11, lineHeight: 16 },

  // Review
  reviewCard: { width: W * 0.76, backgroundColor: '#141a14', borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', padding: 16 },
  reviewAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  reviewQuote: { position: 'absolute', top: 8, right: 12, color: 'rgba(16,185,129,0.2)', fontSize: 56, fontFamily: Fonts.displayBold, lineHeight: 56 },
  reviewAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  reviewInitials: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  reviewName: { color: '#f1f5f9', fontFamily: Fonts.bold, fontSize: 14 },
  verifiedPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  verifiedText: { color: '#34d399', fontFamily: Fonts.medium, fontSize: 10 },
  reviewComment: { color: '#cbd5e1', fontFamily: Fonts.regular, fontSize: 12.5, lineHeight: 19, fontStyle: 'italic', marginTop: 6 },
  reviewProdRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)' },
  reviewProd: { color: '#34d399', fontFamily: Fonts.medium, fontSize: 11, flex: 1 },

  // Final CTA
  finalCta: { marginHorizontal: 16, paddingTop: 20, alignItems: 'center', gap: 14 },
  finalCtaText: { color: '#94a3b8', fontFamily: Fonts.regular, fontSize: 14, textAlign: 'center' },
  finalCtaBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 99 },
  finalCtaBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },

  // Floating header
  floatHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, overflow: 'hidden' },
  floatLogo: { color: '#fff', fontFamily: Fonts.displayBold, fontSize: 18 },

  // Bottom nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 10, borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...Shadows.xl,
  },
  navIndicator: {
    position: 'absolute', top: 0, width: 32, height: 3,
    backgroundColor: Colors.forest, borderRadius: 0,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
  },
  navItem: { alignItems: 'center', gap: 3, flex: 1, paddingBottom: 4 },
  navLabel: { fontSize: 9, fontFamily: Fonts.medium },
  navLabelActive: { color: Colors.forest, fontFamily: Fonts.bold },
  navLabelInactive: { color: '#9ca3af' },

})
