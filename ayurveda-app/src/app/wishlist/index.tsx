// src/app/wishlist/index.tsx
import React, { useCallback, useEffect, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import {
  ActivityIndicator, Dimensions, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Alert,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { impact, notify, Haptics } from '../../utils/haptics'
import Animated, { FadeInDown, FadeOutRight, Layout } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Colors, Fonts } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

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
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimer = React.useRef<any>(null)

  useEffect(() => {
    if (!user) return
    fetchWishlist(1)
  }, [user, search])

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
    } catch (e) { console.log('[Wishlist]', e) }
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
      Alert.alert('Error', e?.response?.data?.message || 'Failed to remove')
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
      Alert.alert('Added!', 'Item added to cart')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed')
      notify(Haptics.NotificationFeedbackType.Error)
    } finally { setAddingId(null) }
  }

  const inCart = (id: number) => cartData.items.some(i => i.product_id === id)

  const renderItem = ({ item: p, index }: { item: WishlistItem; index: number }) => {
    const disc = p.compareprice ? Math.round(((p.compareprice - p.price) / p.compareprice) * 100) : null
    const outOfStock = p.inventory === 0
    const isRemoving = removingId === p.id
    const isAdding = addingId === p.id
    const img = getImage(p.images)
    const cartAlready = inCart(p.id)

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 60).duration(400)}
        exiting={FadeOutRight.duration(300)}
        layout={Layout.springify()}
        style={[ss.card, isRemoving && { opacity: 0.5 }]}
      >
        <TouchableOpacity onPress={() => router.push(`/product/${p.id}`)} activeOpacity={0.9} style={{ flex: 1 }}>
          {/* Image */}
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

            {/* Remove btn */}
            <TouchableOpacity
              onPress={() => removeItem(p.id)}
              disabled={!!removingId}
              style={ss.removeBtn}
              hitSlop={8}
            >
              <Text style={{ fontSize: 14 }}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={ss.cardBody}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={ss.catTag}>
                <Text style={ss.catTagText}>{p.category_name}</Text>
              </View>
              {!outOfStock && p.inventory <= 5 && (
                <Text style={ss.lowStock}>Only {p.inventory} left</Text>
              )}
            </View>

            <Text style={ss.cardName} numberOfLines={2}>{p.name}</Text>

            {/* Stars */}
            <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', marginBottom: 6 }}>
              {[1,2,3,4,5].map(s => (
                <Text key={s} style={{ fontSize: 9, color: s <= Math.round(p.averagerating) ? '#f59e0b' : '#d1d5db' }}>★</Text>
              ))}
              <Text style={{ fontSize: 9, color: Colors.textDim, marginLeft: 3 }}>({p.reviewcount})</Text>
            </View>

            {/* Price */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <Text style={ss.price}>₹{p.price}</Text>
              {p.compareprice && <Text style={ss.mrp}>₹{p.compareprice}</Text>}
            </View>
          </View>
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => outOfStock ? null : cartAlready ? router.push('/cart') : addToCart(p.id)}
          disabled={outOfStock || isAdding}
          style={{ marginHorizontal: 12, marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={
              outOfStock ? ['#9ca3af', '#6b7280'] :
              cartAlready ? ['#059669', '#0d9488'] :
              [Colors.forest, Colors.moss]
            }
            style={ss.addBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={ss.addBtnText}>
              {isAdding ? 'Adding...' : outOfStock ? 'Out of Stock' : cartAlready ? '✓ Go to Cart' : '🛍️ Add to Cart'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.forest} size="large" />
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
          data={items}
          keyExtractor={i => String(i.wishlist_id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
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
})