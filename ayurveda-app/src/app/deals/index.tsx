import React, { useCallback, useEffect, useState } from 'react'
import {
  Dimensions, FlatList, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { getGuestSession } from '../../utils/guestSession'
import { Colors, Fonts, Shadows } from '../../constants/theme'
import { toast } from '../../components/ui/Toast'
import { useStore } from '../../store'

const { width: W } = Dimensions.get('window')
const CARD_W = (W - 48) / 2

interface FlashSale {
  id: number; title: string; description: string; banner_url: string
  discount_pct: number; end_time: string; products: any[]
}
interface Product {
  id: number; name: string; price: string; compareprice: string; images: string
  category_name: string; averagerating: string; inventory: number
}

function countdown(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${h}h ${m}m ${s}s`
}

function FlashBanner({ sale }: { sale: FlashSale }) {
  const [time, setTime] = useState(countdown(sale.end_time))
  useEffect(() => {
    const t = setInterval(() => setTime(countdown(sale.end_time)), 1000)
    return () => clearInterval(t)
  }, [sale.end_time])

  return (
    <LinearGradient
      colors={['#7c1d1d', '#dc2626', '#ef4444']}
      style={fb.wrap}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      {sale.banner_url ? (
        <Image source={{ uri: sale.banner_url }} style={fb.banner} resizeMode="cover" />
      ) : null}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={fb.overlay} />
      <View style={fb.content}>
        <View style={fb.topRow}>
          <View style={fb.pill}>
            <Text style={fb.pillText}>⚡ FLASH SALE</Text>
          </View>
          <View style={fb.timer}>
            <Text style={fb.timerLabel}>Ends in</Text>
            <Text style={fb.timerValue}>{time}</Text>
          </View>
        </View>
        <Text style={fb.title} numberOfLines={1}>{sale.title}</Text>
        {sale.description ? <Text style={fb.desc} numberOfLines={1}>{sale.description}</Text> : null}
      </View>
    </LinearGradient>
  )
}

function ProductCard({ item, delay }: { item: Product; delay: number }) {
  const imgs = (() => { try { return JSON.parse(item.images) } catch { return [item.images] } })()
  const img = imgs?.[0]
  const off = item.compareprice
    ? Math.round(((parseFloat(item.compareprice) - parseFloat(item.price)) / parseFloat(item.compareprice)) * 100)
    : 0
  const { setCartData, cartData } = useStore()

  const handleAdd = async () => {
    try {
      const payload: any = { productId: item.id, quantity: 1 }
      const { user } = useStore.getState()
      if (!user?.id) {
        const sessionId = await getGuestSession()
        if (sessionId) payload.sessionId = sessionId
      }
      const res = await api.post('/cart', payload)
      const items = res.data?.items || cartData.items
      setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
      toast.success('Added to cart')
    } catch { toast.error('Could not add to cart') }
  }

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={pc.wrap}>
      <TouchableOpacity
        style={pc.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}` as any)}
      >
        <View style={pc.imgWrap}>
          {img && <Image source={{ uri: img }} style={pc.img} resizeMode="cover" />}
          {off > 0 && (
            <View style={pc.badge}>
              <Text style={pc.badgeText}>{off}% OFF</Text>
            </View>
          )}
        </View>
        <View style={pc.info}>
          <Text style={pc.name} numberOfLines={2}>{item.name}</Text>
          <View style={pc.priceRow}>
            <Text style={pc.price}>₹{parseFloat(item.price).toFixed(0)}</Text>
            {item.compareprice && (
              <Text style={pc.compare}>₹{parseFloat(item.compareprice).toFixed(0)}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleAdd} style={pc.addBtn}>
            <Text style={pc.addText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function DealsScreen() {
  const insets = useSafeAreaInsets()
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (p = 1) => {
    try {
      const [flashRes, prodRes] = await Promise.allSettled([
        p === 1 ? api.get('/flash-sales/active') : Promise.resolve({ data: { data: [] } }),
        api.get(`/shop/public?discount=true&page=${p}&limit=20`),
      ])
      if (flashRes.status === 'fulfilled' && p === 1) {
        setFlashSales(flashRes.value.data?.data || flashRes.value.data?.sales || [])
      }
      if (prodRes.status === 'fulfilled') {
        const rows = prodRes.value.data?.data?.rows || prodRes.value.data?.rows || prodRes.value.data?.data || []
        const list = Array.isArray(rows) ? rows : []
        setProducts(prev => p === 1 ? list : [...prev, ...list])
        setHasMore(list.length === 20)
        setPage(p)
      }
    } catch { }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load(1) }, [])

  const onRefresh = () => { setRefreshing(true); load(1) }
  const onEndReached = () => { if (hasMore && !loading) load(page + 1) }

  const header = (
    <>
      {/* Top nav */}
      <LinearGradient
        colors={['#7c1d1d', '#dc2626']}
        style={[s.header, { paddingTop: insets.top + 8 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>⚡ Deals & Offers</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Flash sales */}
      {flashSales.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={s.sectionTitle}>⚡ Flash Sales</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {flashSales.map((s) => <FlashBanner key={s.id} sale={s} />)}
          </ScrollView>
        </View>
      )}

      {/* Discount products header */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>🏷️ Discounted Products</Text>
        <Text style={s.sectionSub}>{products.length > 0 ? `${products.length}+ deals` : ''}</Text>
      </View>
    </>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#fff8f8' }}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        renderItem={({ item, index }) => <ProductCard item={item} delay={(index % 10) * 50} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: 'center', paddingTop: 48 }}>
              <Text style={{ fontSize: 48 }}>🏷️</Text>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginTop: 12 }}>No Deals Right Now</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, marginTop: 6 }}>Check back soon for amazing offers!</Text>
            </View>
          )
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bold, color: '#fff' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.forest, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textDim },
})

const fb = StyleSheet.create({
  wrap: { width: W - 32, height: 150, borderRadius: 16, overflow: 'hidden', ...Shadows.md },
  banner: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, padding: 16, justifyContent: 'flex-end' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pill: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { fontFamily: Fonts.bold, fontSize: 11, color: '#fff', letterSpacing: 1 },
  timer: { alignItems: 'flex-end' },
  timerLabel: { fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  timerValue: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: '#fff' },
  desc: { fontFamily: Fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
})

const pc = StyleSheet.create({
  wrap: { width: CARD_W },
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', ...Shadows.sm },
  imgWrap: { width: '100%', height: CARD_W * 0.85, backgroundColor: '#f3f4f6', position: 'relative' },
  img: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#dc2626', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontFamily: Fonts.bold, fontSize: 10, color: '#fff' },
  info: { padding: 10 },
  name: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.forest, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  price: { fontFamily: Fonts.bold, fontSize: 14, color: '#dc2626' },
  compare: { fontFamily: Fonts.regular, fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  addBtn: {
    backgroundColor: Colors.forest, borderRadius: 8,
    paddingVertical: 7, alignItems: 'center',
  },
  addText: { fontFamily: Fonts.bold, fontSize: 11, color: '#fff', letterSpacing: 0.3 },
})
