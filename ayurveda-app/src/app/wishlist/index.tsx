// src/app/wishlist/index.tsx
import React, { useCallback, useEffect, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import {
  ActivityIndicator, Dimensions, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native'
import { toast } from '../../components/ui/Toast'
import { Image as ExpoImage } from 'expo-image'
import { impact, notify, Haptics } from '../../utils/haptics'
import Animated, { FadeInDown, FadeOutRight, Layout, useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, Extrapolation, withSpring, runOnJS } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Colors, Fonts } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

function Skel({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  const op = useSharedValue(0.45)
  useEffect(() => {
    op.value = withRepeat(withTiming(1, { duration: 700 }), -1, true)
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: '#d1e8dc' }, style]} />
}

function WishlistCardSkeleton() {
  const cardW = (W - 44) / 2
  return (
    <View style={{ width: cardW, borderRadius: 16, backgroundColor: '#f5f9f6', overflow: 'hidden', marginBottom: 12 }}>
      <Skel w={cardW} h={140} r={0} />
      <View style={{ padding: 10, gap: 6 }}>
        <Skel w={60} h={9} />
        <Skel w={cardW * 0.75} h={13} />
        <Skel w={55} h={11} />
        <Skel w={cardW - 20} h={32} r={9} />
      </View>
    </View>
  )
}

const SWIPE_THRESHOLD = 80

interface WishlistCardProps {
  p: any
  index: number
  removingId: number | null
  addingId: number | null
  inCart: (id: number) => boolean
  onRemove: (id: number) => void
  onAddToCart: (id: number) => void
}

function WishlistCard({ p, index, removingId, addingId, inCart, onRemove, onAddToCart }: WishlistCardProps) {
  const disc = p.compareprice ? Math.round(((p.compareprice - p.price) / p.compareprice) * 100) : null
  const outOfStock = p.inventory === 0
  const isRemoving = removingId === p.id
  const isAdding = addingId === p.id
  const img = getImage(p.images)
  const cartAlready = inCart(p.id)

  const translateX = useSharedValue(0)

  const triggerCart = () => { impact(Haptics.ImpactFeedbackStyle.Medium); onAddToCart(p.id); translateX.value = withSpring(0, { damping: 18 }) }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate(e => {
      if (e.translationX > 0) translateX.value = Math.min(e.translationX, W * 0.4)
    })
    .onEnd(e => {
      if (e.translationX > SWIPE_THRESHOLD && !outOfStock && !cartAlready) runOnJS(triggerCart)()
      else translateX.value = withSpring(0, { damping: 18, stiffness: 200 })
    })

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))
  const cartRevealStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 60], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, 80], [0.7, 1], Extrapolation.CLAMP) }],
  }))

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      exiting={FadeOutRight.duration(300)}
      layout={Layout.springify()}
      style={{ overflow: 'hidden', borderRadius: 18 }}
    >
      {/* Green cart reveal on left */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, backgroundColor: Colors.emerald, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, cartRevealStyle]}>
        <Text style={{ fontSize: 22 }}>🛍️</Text>
        <Text style={{ fontSize: 10, color: '#fff', fontFamily: Fonts.bold, marginTop: 2 }}>Cart</Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[ss.card, isRemoving && { opacity: 0.5 }, { marginBottom: 0 }, cardStyle]}>
          <TouchableOpacity onPress={() => router.push(`/product/${(p as any).slug || p.id}`)} activeOpacity={0.9} style={{ flex: 1 }}>
            <View style={ss.imgWrap}>
              {img ? (
                <ExpoImage source={{ uri: img }} style={ss.img} contentFit="cover" transition={200} />
              ) : (
                <View style={[ss.img, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 40 }}>🌿</Text>
                </View>
              )}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.2)']} style={StyleSheet.absoluteFill} />
              {disc && !outOfStock && (
                <View style={ss.discBadge}><Text style={ss.discText}>{disc}% OFF</Text></View>
              )}
              {outOfStock && (
                <View style={ss.oosOverlay}><Text style={ss.oosText}>Out of Stock</Text></View>
              )}
              <TouchableOpacity onPress={() => onRemove(p.id)} disabled={!!removingId} style={ss.removeBtn} hitSlop={8}>
                <Text style={{ fontSize: 14 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <View style={ss.cardBody}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={ss.catTag}><Text style={ss.catTagText}>{p.category_name}</Text></View>
                {!outOfStock && p.inventory <= 5 && <Text style={ss.lowStock}>Only {p.inventory} left</Text>}
              </View>
              <Text style={ss.cardName} numberOfLines={2}>{p.name}</Text>
              <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', marginBottom: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <Text key={s} style={{ fontSize: 9, color: s <= Math.round(p.averagerating) ? '#f59e0b' : '#d1d5db' }}>★</Text>
                ))}
                <Text style={{ fontSize: 9, color: Colors.textDim, marginLeft: 3 }}>({p.reviewcount})</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <Text style={ss.price}>₹{p.price}</Text>
                {p.compareprice && <Text style={ss.mrp}>₹{p.compareprice}</Text>}
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => outOfStock ? null : cartAlready ? router.push('/cart') : onAddToCart(p.id)}
            disabled={outOfStock || isAdding}
            style={{ marginHorizontal: 12, marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={outOfStock ? ['#9ca3af', '#6b7280'] : cartAlready ? ['#059669', '#0d9488'] : [Colors.forest, Colors.moss]}
              style={ss.addBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={ss.addBtnText}>
                {isAdding ? 'Adding...' : outOfStock ? 'Out of Stock' : cartAlready ? '✓ Go to Cart' : '🛍️ Add to Cart'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

interface WishlistItem {
  wishlist_id: number
  id: number
  name: string
  price: number
  compareprice?: number
  images: string        // JSON string or direct URL
  inventory: number
  averagerating: number
  reviewcount: number
  category_name: string
  shortdescription?: string
}

const getImage = (images: any): string => {
  try {
    if (Array.isArray(images)) return images[0] || ''
    const parsed = JSON.parse(images || '[]')
    return Array.isArray(parsed) ? parsed[0] || '' : ''
  } catch { return '' }
}

function WishlistListRow({ p, index, removingId, addingId, inCart, onRemove, onAddToCart }: WishlistCardProps) {
  const img = getImage(p.images)
  const outOfStock = p.inventory === 0
  const cartAlready = inCart(p.id)
  const isAdding = addingId === p.id
  const disc = p.compareprice ? Math.round(((p.compareprice - p.price) / p.compareprice) * 100) : null

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)} layout={Layout.springify()} style={ss.listRow}>
      <TouchableOpacity onPress={() => router.push(`/product/${(p as any).slug || p.id}`)} activeOpacity={0.9} style={{ flexDirection: 'row', flex: 1, gap: 12, alignItems: 'center' }}>
        <View style={ss.listImgWrap}>
          {img
            ? <ExpoImage source={{ uri: img }} style={ss.listImg} contentFit="cover" transition={200} />
            : <View style={[ss.listImg, { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 26 }}>🌿</Text></View>
          }
          {disc && !outOfStock && (
            <View style={[ss.discBadge, { top: 4, left: 4, paddingHorizontal: 5, paddingVertical: 2 }]}>
              <Text style={[ss.discText, { fontSize: 8 }]}>{disc}%</Text>
            </View>
          )}
          {outOfStock && (
            <View style={[ss.oosOverlay, { borderRadius: 10 }]}><Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 8 }}>OOS</Text></View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ss.cardName} numberOfLines={2}>{p.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={[ss.price, { fontSize: 15 }]}>₹{p.price}</Text>
            {p.compareprice && <Text style={ss.mrp}>₹{p.compareprice}</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 2, marginTop: 3 }}>
            {[1,2,3,4,5].map(s => (
              <Text key={s} style={{ fontSize: 9, color: s <= Math.round(p.averagerating) ? '#f59e0b' : '#d1d5db' }}>★</Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
      <View style={{ gap: 8, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => outOfStock ? null : cartAlready ? router.push('/cart') : onAddToCart(p.id)}
          disabled={outOfStock || isAdding}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={outOfStock ? ['#9ca3af', '#6b7280'] : cartAlready ? ['#059669', '#0d9488'] : [Colors.forest, Colors.moss]}
            style={{ paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 11 }}>
              {isAdding ? '...' : outOfStock ? 'OOS' : cartAlready ? '✓ Cart' : '+ Cart'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRemove(p.id)} disabled={!!removingId} hitSlop={8}>
          <Text style={{ fontSize: 16 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

export default function WishlistScreen() {
  const insets = useSafeAreaInsets()
  const { user, setAuthOpen, cartData, setCartData } = useStore()

  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addingAll, setAddingAll] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const searchTimer = React.useRef<any>(null)

  useEffect(() => {
    if (!user) return
    fetchWishlist(1)
  }, [user?.id, search])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
  }, [searchInput])

  const fetchWishlist = async (pg: number) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      // GET /shop → { data: WishlistItem[], pagination }
      const res = await api.get('/shop', { params: { limit: 8, page: pg, search } })
      const data = res.data?.data || []
      const pagination = res.data?.pagination || {}
      if (pg === 1) setItems(data)
      else setItems(prev => [...prev, ...data])
      setTotalPages(pagination.totalPages || 1)
      setPage(pg)
    } catch { }
    finally { setLoading(false); setLoadingMore(false) }
  }

  const removeItem = async (productId: number) => {
    impact(Haptics.ImpactFeedbackStyle.Medium)
    setRemovingId(productId)
    try {
      await api.delete(`/shop/${productId}`)
      setItems(prev => prev.filter(i => i.id !== productId))
      notify(Haptics.NotificationFeedbackType.Success)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to remove')
      notify(Haptics.NotificationFeedbackType.Error)
    } finally { setRemovingId(null) }
  }

  const addToCart = async (productId: number) => {
    if (!user) { setAuthOpen(true); return }
    impact(Haptics.ImpactFeedbackStyle.Medium)
    setAddingId(productId)
    try {
      await api.post('/cart', { productId, quantity: 1 })
      const res = await api.get('/cart')
      const cartItems = res.data?.items || []
      setCartData({ items: cartItems, subtotal: res.data?.subtotal || 0, totalItems: cartItems.length })
      notify(Haptics.NotificationFeedbackType.Success)
      toast.success('Item added to cart')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed')
      notify(Haptics.NotificationFeedbackType.Error)
    } finally { setAddingId(null) }
  }

  const inCart = (id: number) => cartData.items.some(i => i.product_id === id)

  const addAllToCart = async () => {
    const eligible = items.filter(i => i.inventory > 0 && !inCart(i.id))
    if (eligible.length === 0) { toast.success('All in-stock items already in cart!'); return }
    impact(Haptics.ImpactFeedbackStyle.Heavy)
    setAddingAll(true)
    try {
      await Promise.all(eligible.map(i => api.post('/cart', { productId: i.id, quantity: 1 })))
      const res = await api.get('/cart')
      const cartItems = res.data?.items || []
      setCartData({ items: cartItems, subtotal: res.data?.subtotal || 0, totalItems: cartItems.length })
      notify(Haptics.NotificationFeedbackType.Success)
      toast.success(`${eligible.length} item${eligible.length > 1 ? 's' : ''} added to cart!`)
    } catch {
      toast.error('Some items could not be added')
      notify(Haptics.NotificationFeedbackType.Error)
    } finally { setAddingAll(false) }
  }

  const renderItem = ({ item: p, index }: { item: WishlistItem; index: number }) =>
    viewMode === 'grid' ? (
      <WishlistCard
        p={p} index={index} removingId={removingId} addingId={addingId}
        inCart={inCart} onRemove={removeItem} onAddToCart={addToCart}
      />
    ) : (
      <WishlistListRow
        p={p} index={index} removingId={removingId} addingId={addingId}
        inCart={inCart} onRemove={removeItem} onAddToCart={addToCart}
      />
    )

  if (!user) return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>❤️</Text>
      <Text style={ss.emptyTitle}>Sign in to view wishlist</Text>
      <Text style={ss.emptySub}>Save your favourite organic products</Text>
      <TouchableOpacity onPress={() => setAuthOpen(true)} style={{ marginTop: 20, borderRadius: 13, overflow: 'hidden' }}>
        <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ paddingHorizontal: 32, paddingVertical: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 15 }}>Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.forest, '#0f2018']} style={[ss.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>My Wishlist</Text>
          <Text style={ss.headerSub}>{items.length} item{items.length !== 1 ? 's' : ''} saved</Text>
        </View>
        <TouchableOpacity
          onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
          style={[ss.backBtn, { marginRight: 6 }]}
        >
          <Text style={{ fontSize: 16, color: '#fff' }}>{viewMode === 'grid' ? '☰' : '⊞'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')} style={ss.backBtn}>
          <Text style={{ fontSize: 18 }}>🛍️</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={ss.searchWrap}>
        <View style={ss.searchBox}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={ss.searchInput}
            placeholder="Search your wishlist..."
            placeholderTextColor={Colors.textDim}
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearch('') }}>
              <Text style={{ color: Colors.textDim, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Add all to cart strip */}
      {!loading && items.length > 0 && (
        <View style={ss.addAllWrap}>
          <TouchableOpacity
            onPress={addAllToCart}
            disabled={addingAll}
            style={{ borderRadius: 12, overflow: 'hidden', flex: 1 }}
          >
            <LinearGradient
              colors={[Colors.forest, Colors.moss]}
              style={ss.addAllBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={ss.addAllText}>
                {addingAll ? '⏳ Adding all...' : '🛍️ Add All to Cart'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map(k => <WishlistCardSkeleton key={k} />)}
        </View>
      ) : items.length === 0 ? (
        <View style={ss.emptyWrap}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>❤️</Text>
          <Text style={ss.emptyTitle}>{search ? `No results for "${search}"` : 'Your wishlist is empty'}</Text>
          <Text style={ss.emptySub}>{search ? 'Try a different search' : 'Start saving organic products you love'}</Text>
          <TouchableOpacity onPress={() => router.push('/products')} style={{ marginTop: 20, borderRadius: 13, overflow: 'hidden' }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ paddingHorizontal: 28, paddingVertical: 13 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 14 }}>Explore Products</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={items}
          keyExtractor={i => String(i.wishlist_id)}
          renderItem={renderItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? { gap: 12 } : undefined}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchWishlist(1); setRefreshing(false) }} tintColor={Colors.forest} colors={[Colors.forest]} />}
          onEndReached={() => { if (!loadingMore && page < totalPages) fetchWishlist(page + 1) }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.forest} style={{ marginTop: 12 }} /> : null}
        />
      )}
      <BottomNav active="/wishlist" />
    </View>
  )
}

const CARD_W = (W - 48) / 2

const ss = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 17 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 11 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.cream },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  searchInput: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.forest, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },
  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  imgWrap: { height: CARD_W * 0.95, backgroundColor: Colors.mint, position: 'relative' },
  img: { width: '100%', height: '100%' },
  discBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.red, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  discText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 9 },
  oosOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  oosText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 10 },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 99, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 10 },
  catTag: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 0.5, borderColor: '#bbf7d0' },
  catTagText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.sage, letterSpacing: 0.5, textTransform: 'uppercase' },
  lowStock: { fontFamily: Fonts.bold, fontSize: 8, color: '#f97316' },
  cardName: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, lineHeight: 17, marginBottom: 4 },
  price: { fontFamily: Fonts.displayBold, fontSize: 17, color: Colors.forest },
  mrp: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, textDecorationLine: 'line-through' },
  addBtn: { paddingVertical: 9, alignItems: 'center' },
  addBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 11 },
  addAllWrap: { paddingHorizontal: 16, paddingBottom: 10, backgroundColor: Colors.cream, flexDirection: 'row' },
  addAllBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  addAllText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },

  // List view
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  listImgWrap: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.mint, position: 'relative', overflow: 'hidden' },
  listImg: { width: 80, height: 80 },
})