import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useStore } from '../../store'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'

const FIELDS = [
  { key: 'price', label: 'Price', format: (v: any) => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—' },
  { key: 'category_name', label: 'Category' },
  { key: 'brand', label: 'Brand' },
  { key: 'averagerating', label: 'Rating', format: (v: any) => v ? `${parseFloat(v).toFixed(1)} ★` : '—' },
  { key: 'reviewcount', label: 'Reviews' },
  { key: 'fssai_number', label: 'FSSAI' },
  { key: 'weight_grams', label: 'Weight', format: (v: any) => v ? `${v}g` : '—' },
  { key: 'is_returnable', label: 'Returnable', format: (v: any) => v === false ? 'No' : 'Yes' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'benefits', label: 'Benefits' },
]

export default function CompareScreen() {
  const insets = useSafeAreaInsets()
  const { compareIds, clearCompare } = useStore(s => ({
    compareIds: s.compareIds,
    clearCompare: s.clearCompare,
  }))
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!compareIds.length) { setLoading(false); return }
    Promise.all(compareIds.map(id => api.get(`/shop/public/${id}`).then(r => r.data?.data).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [compareIds.join(',')])

  const CARD_W = 160

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={ss.header}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={ss.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={ss.title}>Compare Products</Text>
        <TouchableOpacity onPress={() => { clearCompare(); router.back() }}>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.red }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.emerald} />
        </View>
      ) : products.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 40 }}>⚖️</Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest }}>No products to compare</Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim }}>Add up to 3 products using the Compare button on product pages</Text>
          <TouchableOpacity onPress={() => router.push('/products')} style={{ marginTop: 8, backgroundColor: Colors.forest, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ fontFamily: Fonts.bold, color: '#fff', fontSize: 13 }}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {/* Product header cards */}
            <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 12, paddingTop: 8 }}>
              {/* Row labels column */}
              <View style={{ width: 100, gap: 0 }}>
                <View style={{ height: 160 }} />
                {FIELDS.map(f => (
                  <View key={f.key} style={ss.labelCell}>
                    <Text style={ss.labelText}>{f.label}</Text>
                  </View>
                ))}
              </View>

              {/* Product columns */}
              {products.map((p, pi) => (
                <Animated.View key={p.id} entering={FadeInDown.delay(pi * 100)} style={{ width: CARD_W }}>
                  {/* Product card */}
                  <TouchableOpacity onPress={() => router.push(`/product/${p.id}` as any)} style={ss.productCard}>
                    <Image source={{ uri: p.images?.[0] || '' }} style={ss.productImg} resizeMode="cover" />
                    <Text style={ss.productName} numberOfLines={2}>{p.name}</Text>
                    <Text style={ss.productPrice}>₹{parseFloat(p.price).toLocaleString('en-IN')}</Text>
                    {p.compareprice && Number(p.compareprice) > Number(p.price) && (
                      <Text style={ss.productMrp}>₹{parseFloat(p.compareprice).toLocaleString('en-IN')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Field rows */}
                  {FIELDS.map((f, fi) => {
                    const raw = p[f.key]
                    const val = f.format ? f.format(raw) : (raw ?? '—')
                    // Highlight best price (lowest)
                    const isBest = f.key === 'price' && Number(p.price) === Math.min(...products.map(x => Number(x.price)))
                    return (
                      <View key={f.key} style={[ss.valueCell, fi % 2 === 0 && ss.valueCellAlt]}>
                        <Text style={[ss.valueText, isBest && ss.bestValue]} numberOfLines={3}>
                          {isBest && '✓ '}
                          {String(val).length > 60 ? String(val).slice(0, 60) + '…' : String(val) || '—'}
                        </Text>
                      </View>
                    )
                  })}
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.forest, borderBottomWidth: 0 },
  backBtn: { padding: 4 },
  backText: { fontFamily: Fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  title: { fontFamily: Fonts.bold, fontSize: 16, color: '#fff' },
  labelCell: { height: 56, justifyContent: 'center', paddingRight: 8 },
  labelText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  productCard: { backgroundColor: '#fff', borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 0.5, borderColor: Colors.border },
  productImg: { width: '100%', height: 100, borderRadius: 8, marginBottom: 6, backgroundColor: '#f3f4f6' },
  productName: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, lineHeight: 16, marginBottom: 4 },
  productPrice: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.emerald },
  productMrp: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, textDecorationLine: 'line-through' },
  valueCell: { height: 56, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 6 },
  valueCellAlt: { backgroundColor: 'rgba(26,46,30,0.04)' },
  valueText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.forest, lineHeight: 17 },
  bestValue: { fontFamily: Fonts.bold, color: Colors.emerald },
})
