import React, { useEffect, useState } from 'react'
import {
  Dimensions, FlatList, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native'
import { LeafLoader } from '../../components/ui/LeafLoader'
import { Image as ExpoImage } from 'expo-image'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

interface BlogPost {
  id: number; title: string; slug: string; excerpt?: string
  cover_image?: string; category?: string; author_name?: string
  published_at?: string; views_count?: number
}

export default function BlogListScreen() {
  const insets = useSafeAreaInsets()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = async (pg: number) => {
    try {
      const res = await api.get('/blog/public', { params: { page: pg, limit: 10 } })
      const data = res.data?.posts || res.data?.data || []
      if (pg === 1) setPosts(data)
      else setPosts(p => [...p, ...data])
      setHasMore(data.length >= 10)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts(1) }, [])

  const loadMore = () => {
    if (!hasMore || loading) return
    const next = page + 1
    setPage(next)
    fetchPosts(next)
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  const renderPost = ({ item, index }: { item: BlogPost; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <TouchableOpacity
        onPress={() => router.push(`/blog/${item.slug}` as any)}
        activeOpacity={0.9}
        style={ss.card}
      >
        {item.cover_image ? (
          <ExpoImage source={{ uri: item.cover_image }} style={ss.cardImg} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.cardImg}>
            <Text style={{ fontSize: 40 }}>📝</Text>
          </LinearGradient>
        )}
        <View style={ss.cardBody}>
          {item.category && (
            <View style={ss.catBadge}>
              <Text style={ss.catBadgeText}>{item.category}</Text>
            </View>
          )}
          <Text style={ss.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.excerpt && <Text style={ss.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text>}
          <View style={ss.cardMeta}>
            <Text style={ss.metaText}>{item.author_name || 'Oroganix'}</Text>
            <Text style={ss.metaDot}>·</Text>
            <Text style={ss.metaText}>{formatDate(item.published_at)}</Text>
            {item.views_count != null && item.views_count > 0 && (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.metaText}>{item.views_count} views</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Colors.forest, Colors.moss]} style={[ss.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Blog</Text>
        <Text style={ss.headerSub}>Ayurvedic tips, recipes & wellness insights</Text>
      </LinearGradient>

      {loading && page === 1 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LeafLoader size="lg" text="Loading articles…" />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 6 }}>No Posts Yet</Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center' }}>Blog posts will appear here. Check back soon!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          renderItem={renderPost}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        />
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { color: '#fff', fontFamily: Fonts.displayBold, fontSize: 28, marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.regular, fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', ...Shadows.md },
  cardImg: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 16 },
  catBadge: { backgroundColor: Colors.mint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  catBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 17, color: Colors.forest, marginBottom: 6, lineHeight: 24 },
  cardExcerpt: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, lineHeight: 20, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim },
  metaDot: { color: Colors.textDim, fontSize: 11 },
})
