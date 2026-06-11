import React, { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Dimensions, FlatList, Image, Modal, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Pressable,
} from 'react-native'
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { getGuestSession } from '../../utils/guestSession'
import { Colors, Fonts, Shadows, Radius } from '../../constants/theme'

const { width: W } = Dimensions.get('window')
const CARD_W = (W - 44) / 2

interface Product {
  id: number; name: string; shortdescription: string
  price: number; compareprice?: number; images: string[]
  inventory: number; category_name: string
  averagerating: number; reviewcount: number
}

const SORTS = [
  { label: 'Newest', value: 'created_at', icon: '🆕' },
  { label: 'Price ↑', value: 'price_asc', icon: '💰' },
  { label: 'Price ↓', value: 'price_desc', icon: '💎' },
  { label: 'Top Rated', value: 'averagerating', icon: '⭐' },
  { label: 'A-Z', value: 'name', icon: '🔤' },
]

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const op = useSharedValue(0.4)
  useEffect(() => {
    op.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1, false
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value }))
  const S = (props: { w: any; h: number; r?: number }) => (
    <Animated.View style={[{ width: props.w, height: props.h, borderRadius: props.r ?? 7, backgroundColor: '#e2e8e2' }, style]} />
  )
  return (
    <View style={[ss.card, { overflow: 'hidden' }]}>
      <S w="100%" h={CARD_W * 0.9} r={0} />
      <View style={{ padding: 10, gap: 7 }}>
        <S w={60} h={9} />
        <S w={CARD_W - 30} h={13} />
        <S w={80} h={10} />
        <S w={55} h={19} />
      </View>
      <View style={{ marginHorizontal: 10, marginBottom: 10 }}>
        <S w="100%" h={32} r={9} />
      </View>
    </View>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ p, index, addingId, addToCart, toggleWish, wishlist, inCart }: {
  p: Product; index: number; addingId: number | null
  addToCart: (id: number) => void; toggleWish: (id: number) => void
  wishlist: number[]; inCart: (id: number) => boolean
}) {
  const d = p.compareprice ? Math.round(((p.compareprice - p.price) / p.compareprice) * 100) : null
  const isWished = wishlist.includes(p.id)

  return (
    <Animated.View entering={FadeInDown.delay((index % 8) * 50).duration(400)} style={ss.card}>
      <TouchableOpacity onPress={() => router.push(`/product/${p.id}`)} activeOpacity={0.9}>
        <View style={ss.cardImgWrap}>
          <Image source={{ uri: p.images?.[0] || '' }} style={ss.cardImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.2)']} style={StyleSheet.absoluteFill} />
          {d != null && (
            <View style={ss.discBadge}>
              <Text style={ss.discText}>{d}%{'\n'}OFF</Text>
            </View>
          )}
          {p.inventory === 0 && (
            <View style={ss.oosBadge}><Text style={ss.oosText}>Out of Stock</Text></View>
          )}
          <TouchableOpacity onPress={() => toggleWish(p.id)} style={ss.wishBtn} hitSlop={6}>
            <Text style={{ fontSize: 16 }}>{isWished ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={ss.cardBody}>
          <Text style={ss.cardCat} numberOfLines={1}>{p.category_name}</Text>
          <Text style={ss.cardName} numberOfLines={2}>{p.name}</Text>
          <View style={{ flexDirection: 'row', gap: 2, marginBottom: 5, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <Text key={s} style={{ fontSize: 9, color: s <= Math.round(p.averagerating) ? '#f59e0b' : '#d1d5db' }}>★</Text>
            ))}
            <Text style={{ fontSize: 9, color: Colors.textDim, marginLeft: 2 }}>({p.reviewcount})</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
            <Text style={ss.price}>₹{p.price}</Text>
            {p.compareprice && <Text style={ss.mrp}>₹{p.compareprice}</Text>}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => addToCart(p.id)}
        disabled={p.inventory === 0 || addingId === p.id}
        style={{ marginHorizontal: 10, marginBottom: 10, borderRadius: 10, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={
            p.inventory === 0 ? ['#9ca3af', '#6b7280']
              : inCart(p.id) ? ['#059669', '#0d9488']
                : [Colors.forest, Colors.moss]
          }
          style={ss.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={ss.addBtnText}>
            {addingId === p.id ? '·  Adding...' : p.inventory === 0 ? 'Out of Stock' : inCart(p.id) ? '✓ In Cart' : '+ Add'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ProductsScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const categoryId = params.id as string | undefined
  const initialSearch = params.q as string || ''

  const { cartData, cartCount, setCartData, user, setAuthOpen, wishlistData } = useStore()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const LIMIT = 12

  const [search, setSearch] = useState(initialSearch)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [selectedSort, setSelectedSort] = useState('created_at')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [wishlist, setWishlist] = useState<number[]>(() =>
    wishlistData.items.map((w: any) => w.id)
  )

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
  }, [searchInput])

  useEffect(() => { fetchProducts(1) }, [search, selectedSort, minPrice, maxPrice, inStockOnly, categoryId])

  const fetchProducts = async (pg: number) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const sortOrder = selectedSort === 'price_asc' ? 'asc' : 'desc'
      const sortBy = selectedSort === 'price_asc' || selectedSort === 'price_desc' ? 'price' : selectedSort
      const res = await api.get('/shop/public', {
        params: {
          search, page: pg, limit: LIMIT, sortBy, sortOrder,
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(inStockOnly && { inStock: true }),
          ...(categoryId && { category_id: categoryId }),
        }
      })
      const newProducts = res.data?.products || []
      if (pg === 1) setProducts(newProducts)
      else setProducts(p => [...p, ...newProducts])
      setTotal(res.data?.total || 0)
      setPage(pg)
    } catch (e: any) {
      console.warn('[Products fetch]', e?.response?.status, e?.message)
    } finally { setLoading(false); setLoadingMore(false) }
  }

  const addToCart = async (productId: number) => {
    setAddingId(productId)
    try {
      const payload: any = { productId, quantity: 1 }
      let sessionId: string | null = null
      if (!user?.id) {
        sessionId = await getGuestSession()
        if (sessionId) payload.sessionId = sessionId
      }
      await api.post('/cart', payload)
      const url = !user?.id && sessionId ? `/cart?sessionId=${sessionId}` : '/cart'
      const res = await api.get(url)
      const items = res.data?.items || []
      setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
    } catch { } finally { setAddingId(null) }
  }

  const { setWishlistData } = useStore()
  const toggleWish = async (id: number) => {
    if (!user) { setAuthOpen(true); return }
    const adding = !wishlist.includes(id)
    const prevLocal = wishlist
    const prevStore = useStore.getState().wishlistData

    setWishlist(adding ? [...prevLocal, id] : prevLocal.filter(i => i !== id))

    // Keep store in sync so product detail screen shows the correct heart state
    if (adding) {
      const p = products.find(x => x.id === id)
      if (p) {
        const item: any = { wishlist_id: Date.now(), id: p.id, name: p.name, price: p.price, compareprice: p.compareprice, images: p.images[0] || '', inventory: p.inventory, averagerating: p.averagerating, reviewcount: p.reviewcount, category_name: p.category_name }
        setWishlistData({ ...prevStore, items: [...prevStore.items, item], totalItems: prevStore.totalItems + 1 })
      }
    } else {
      setWishlistData({ ...prevStore, items: prevStore.items.filter((w: any) => w.id !== id), totalItems: Math.max(0, prevStore.totalItems - 1) })
    }

    try { await api.post('/shop/wishlist', { productId: id }) }
    catch {
      setWishlist(prevLocal)
      setWishlistData(prevStore)
    }
  }

  const inCart = (id: number) => cartData.items.some(i => i.product_id === id)
  const hasFilters = !!(minPrice || maxPrice || inStockOnly || selectedSort !== 'created_at')

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.forest, '#0f2018']} style={[ss.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.headerBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>{categoryId ? 'Category' : 'All Products'}</Text>
          {!loading && <Text style={ss.headerSub}>{total} products</Text>}
        </View>
        <TouchableOpacity onPress={() => router.push('/cart')} style={[ss.headerBtn, { position: 'relative' }]}>
          <Text style={{ fontSize: 20 }}>🛍️</Text>
          {cartCount > 0 && (
            <View style={ss.cartDot}>
              <Text style={{ fontSize: 8, color: Colors.forest, fontFamily: Fonts.bold }}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Search bar */}
      <View style={ss.searchBar}>
        <View style={ss.searchInputWrap}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={ss.searchText}
            placeholder="Search products..."
            placeholderTextColor={Colors.textDim}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(''); setSearch('') }} hitSlop={8}>
              <View style={ss.clearBtn}>
                <Text style={{ fontSize: 10, color: Colors.textDim }}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={[ss.filterBtn, hasFilters && ss.filterBtnActive]}>
          <Text style={{ fontSize: 14 }}>⚙️</Text>
          {hasFilters && <View style={ss.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Sort pills */}
      <View style={ss.sortWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
          {SORTS.map(s => (
            <TouchableOpacity key={s.value} onPress={() => { setSelectedSort(s.value); setPage(1) }}
              style={[ss.sortPill, selectedSort === s.value && ss.sortPillActive]}>
              <Text style={{ fontSize: 11 }}>{s.icon}</Text>
              <Text style={[ss.sortPillText, selectedSort === s.value && ss.sortPillTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={k => String(k)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={() => <SkeletonCard />}
        />
      ) : products.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={ss.emptyWrap}>
          <Text style={{ fontSize: 54, marginBottom: 14 }}>🌿</Text>
          <Text style={ss.emptyTitle}>No products found</Text>
          <Text style={ss.emptySub}>Try a different search or clear your filters</Text>
          {hasFilters && (
            <TouchableOpacity
              onPress={() => { setMinPrice(''); setMaxPrice(''); setInStockOnly(false); setSelectedSort('created_at') }}
              style={ss.clearFiltersBtn}
            >
              <Text style={ss.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => String(p.id)}
          renderItem={({ item: p, index }) => (
            <ProductCard
              p={p} index={index} addingId={addingId}
              addToCart={addToCart} toggleWish={toggleWish}
              wishlist={wishlist} inCart={inCart}
            />
          )}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (!loadingMore && products.length < total) fetchProducts(page + 1) }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}><SkeletonCard /><SkeletonCard /></View>
              : null
          }
        />
      )}

      {/* Filter Sheet */}
      <Modal visible={showFilter} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={ss.modalBackdrop} onPress={() => setShowFilter(false)} />
        <Animated.View entering={FadeInUp.duration(300)} style={[ss.filterSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={ss.filterHandle} />
          <View style={ss.filterSheetHeader}>
            <Text style={ss.filterTitle}>Filters & Sort</Text>
            {hasFilters && (
              <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); setInStockOnly(false); setSelectedSort('created_at') }}>
                <Text style={ss.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
            <Text style={ss.filterLabel}>Price Range</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TextInput
                style={ss.priceInput} placeholder="Min ₹"
                placeholderTextColor={Colors.textDim}
                value={minPrice} onChangeText={setMinPrice} keyboardType="numeric"
              />
              <View style={ss.priceSep}><Text style={{ color: Colors.textDim, fontFamily: Fonts.bold }}>—</Text></View>
              <TextInput
                style={ss.priceInput} placeholder="Max ₹"
                placeholderTextColor={Colors.textDim}
                value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric"
              />
            </View>

            <Text style={ss.filterLabel}>Sort By</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {SORTS.map(s => (
                <TouchableOpacity key={s.value} onPress={() => setSelectedSort(s.value)}
                  style={[ss.filterChip, selectedSort === s.value && ss.filterChipActive]}>
                  <Text style={{ fontSize: 12 }}>{s.icon}</Text>
                  <Text style={[ss.filterChipText, selectedSort === s.value && ss.filterChipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setInStockOnly(s => !s)} style={ss.toggleRow}>
              <View>
                <Text style={ss.toggleLabel}>In Stock Only</Text>
                <Text style={ss.toggleSub}>Show only available products</Text>
              </View>
              <View style={[ss.toggle, inStockOnly && ss.toggleActive]}>
                <View style={[ss.toggleThumb, inStockOnly && ss.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity onPress={() => { setShowFilter(false); setPage(1); fetchProducts(1) }}
            style={{ borderRadius: 14, overflow: 'hidden', marginTop: 10 }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.applyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={ss.applyBtnText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  )
}

const ss = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  headerBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 17 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 10, marginTop: 1 },
  cartDot: { position: 'absolute', top: -3, right: -3, backgroundColor: Colors.gold, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.cream, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm },
  searchText: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest },
  clearBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  filterBtn: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.border, position: 'relative', ...Shadows.sm },
  filterBtnActive: { borderColor: Colors.forest, backgroundColor: Colors.mint },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },

  sortWrap: { backgroundColor: Colors.cream, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  sortPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: '#fff', borderWidth: 0.5, borderColor: Colors.border },
  sortPillActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  sortPillText: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textDim },
  sortPillTextActive: { color: '#fff' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },
  clearFiltersBtn: { marginTop: 16, borderRadius: 11, borderWidth: 1, borderColor: Colors.forest, paddingHorizontal: 20, paddingVertical: 10 },
  clearFiltersText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },

  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 0.5, borderColor: Colors.border, ...Shadows.md },
  cardImgWrap: { height: CARD_W * 0.9, backgroundColor: Colors.mint, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  discBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.red, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  discText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 8, textAlign: 'center', lineHeight: 12 },
  oosBadge: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
  oosText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 10 },
  wishBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 99, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  cardBody: { padding: 10 },
  cardCat: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.sage, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  cardName: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, lineHeight: 17, marginBottom: 4 },
  price: { fontFamily: Fonts.displayBold, fontSize: 18, color: Colors.forest },
  mrp: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, textDecorationLine: 'line-through' },
  addBtn: { paddingVertical: 9, alignItems: 'center' },
  addBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 11 },

  // Filter sheet
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  filterSheet: { backgroundColor: Colors.cream, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: '78%' },
  filterHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.14)', alignSelf: 'center', marginBottom: 16 },
  filterSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  filterTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest },
  clearAllText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.red },
  filterLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  priceInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: Fonts.regular, fontSize: 14, color: Colors.forest, borderWidth: 0.5, borderColor: Colors.border },
  priceSep: { justifyContent: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, backgroundColor: '#fff', borderWidth: 0.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  filterChipText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  filterChipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 0.5, borderTopColor: Colors.border },
  toggleLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  toggleSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginTop: 2 },
  toggle: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#e0e0e0', justifyContent: 'center', paddingHorizontal: 3 },
  toggleActive: { backgroundColor: Colors.forest },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', ...Shadows.sm },
  toggleThumbActive: { alignSelf: 'flex-end' },
  applyBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
})
