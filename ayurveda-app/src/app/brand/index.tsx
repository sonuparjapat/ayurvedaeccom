import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'

interface Brand {
  id: number
  name: string
  slug: string
  logo_url: string | null
}

export default function BrandsScreen() {
  const insets = useSafeAreaInsets()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/brands')
      .then(r => setBrands(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <View style={[ss.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.forest, Colors.moss]}
        style={ss.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={ss.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={ss.title}>Shop by Brand</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.emerald} size="large" />
        </View>
      ) : brands.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 40 }}>🌿</Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest }}>No brands found</Text>
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={b => String(b.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: b, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/products' as any,
                  params: { brand_id: String(b.id), brand_name: b.name },
                })}
                style={ss.card}
                activeOpacity={0.82}
              >
                {b.logo_url ? (
                  <Image
                    source={{ uri: b.logo_url }}
                    style={ss.logo}
                    contentFit="contain"
                  />
                ) : (
                  <View style={[ss.logo, ss.logoPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🌿</Text>
                  </View>
                )}
                <Text style={ss.brandName} numberOfLines={2}>{b.name}</Text>
                <Text style={ss.brandCta}>View Products →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { padding: 4, minWidth: 60 },
  backText: { fontFamily: Fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  title: { fontFamily: Fonts.bold, fontSize: 17, color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  logo: { width: 80, height: 80, borderRadius: 12 },
  logoPlaceholder: { backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, textAlign: 'center', lineHeight: 18 },
  brandCta: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.emerald },
})
