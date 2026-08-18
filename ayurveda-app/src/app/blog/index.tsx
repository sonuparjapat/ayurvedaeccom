import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList, RefreshControl, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { LeafLoader } from '../../components/ui/LeafLoader'
import { Image as ExpoImage } from 'expo-image'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

interface BlogPost {
  id: number; title: string; slug: string; excerpt?: string
  cover_image?: string; category?: string; author_name?: string
  published_at?: string; views_count?: number; read_time?: number
}

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <TouchableOpacity
        onPress={() => router.push(`/blog/${post.slug}` as any)}
        activeOpacity={0.92}
        style={ss.featCard}
      >
        {post.cover_image ? (
          <ExpoImage source={{ uri: post.cover_image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <LinearGradient colors={[Colors.forest, Colors.moss]} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['transparent', 'rgba(5,20,10,0.82)']} style={ss.featOverlay}>
          {post.category && (
            <View style={ss.featBadge}>
              <Text style={ss.featBadgeText}>{post.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={ss.featTitle} numberOfLines={3}>{post.title}</Text>
          {post.excerpt && (
            <Text style={ss.featExcerpt} numberOfLines={2}>{post.excerpt}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Text style={ss.featMeta}>{post.author_name || 'Oroganix'}</Text>
            <Text style={ss.featMetaDot}>·</Text>
            <Text style={ss.featMeta}>{formatDate(post.published_at)}</Text>
            {post.read_time ? (
              <>
                <Text style={ss.featMetaDot}>·</Text>
                <Text style={ss.featMeta}>{post.read_time} min read</Text>
              </>
            ) : null}
          </View>
        </LinearGradient>
        <View style={ss.featLabel}>
          <Text style={ss.featLabelText}>✦  FEATURED</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(380)}>
      <TouchableOpacity
        onPress={() => router.push(`/blog/${post.slug}` as any)}
        activeOpacity={0.88}
        style={ss.card}
      >
        <View style={ss.thumb}>
          {post.cover_image ? (
            <ExpoImage source={{ uri: post.cover_image }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
          ) : (
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>📝</Text>
            </LinearGradient>
          )}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {(post.views_count ?? 0) > 500 && (
              <View style={ss.trendingBadge}>
                <Text style={ss.trendingBadgeText}>🔥 Trending</Text>
              </View>
            )}
            {(post.views_count ?? 0) > 100 && (post.views_count ?? 0) <= 500 && (
              <View style={ss.popularBadge}>
                <Text style={ss.popularBadgeText}>⭐ Popular</Text>
              </View>
            )}
            {post.category && (
              <View style={ss.catBadge}>
                <Text style={ss.catBadgeText}>{post.category}</Text>
              </View>
            )}
          </View>
          <Text style={ss.cardTitle} numberOfLines={2}>{post.title}</Text>
          {post.excerpt && (
            <Text style={ss.cardExcerpt} numberOfLines={2}>{post.excerpt}</Text>
          )}
          <View style={ss.cardMeta}>
            <Text style={ss.metaText}>{post.author_name || 'Oroganix'}</Text>
            <Text style={ss.metaDot}>·</Text>
            {post.read_time ? (
              <Text style={ss.metaText}>{post.read_time} min read</Text>
            ) : (
              <Text style={ss.metaText}>{formatDate(post.published_at)}</Text>
            )}
            {(post.views_count ?? 0) > 0 && (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.metaText}>{post.views_count} views</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function BlogListScreen() {
  const insets = useSafeAreaInsets()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<TextInput>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.get('/blog/public/categories')
      .then(r => setCategories(r.data?.categories || []))
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(async (pg: number, cat: string | null, q: string) => {
    if (pg === 1) setLoading(true)
    else setFetchingMore(true)
    try {
      const params: any = { page: pg, limit: 10 }
      if (cat) params.category = cat
      if (q) params.search = q
      const res = await api.get('/blog/public', { params })
      const data: BlogPost[] = res.data?.data || res.data?.posts || []
      if (pg === 1) setPosts(data)
      else setPosts(prev => [...prev, ...data])
      const serverHasMore = res.data?.has_more ?? res.data?.hasMore
      setHasMore(serverHasMore !== undefined ? Boolean(serverHasMore) : data.length === 10)
    } catch {}
    finally { setLoading(false); setFetchingMore(false) }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPosts(1, selectedCat, search)
  }, [selectedCat, search, fetchPosts])

  const loadMore = () => {
    if (!hasMore || loading || fetchingMore || selectedCat || search) return
    const next = page + 1
    setPage(next)
    fetchPosts(next, null, '')
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPosts(1, selectedCat, search)
    setPage(1)
    setRefreshing(false)
  }, [fetchPosts, selectedCat, search])

  const isFiltered = !!selectedCat || !!search
  const featuredPost = !isFiltered ? posts[0] : null
  const listPosts = !isFiltered && posts.length > 0 ? posts.slice(1) : posts

  const ListHeader = featuredPost ? (
    <View style={{ marginBottom: 22 }}>
      <Text style={ss.sectionLabel}>FEATURED ARTICLE</Text>
      <FeaturedCard post={featuredPost} />
      {listPosts.length > 0 && (
        <Text style={[ss.sectionLabel, { marginTop: 22, marginBottom: 2 }]}>LATEST ARTICLES</Text>
      )}
    </View>
  ) : null

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.forest, '#0f2a1a']} style={[ss.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={ss.headerTitle}>Wellness Blog</Text>
            <Text style={ss.headerSub}>ANCIENT WISDOM · MODERN LIFE</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={[ss.searchBar, searchFocused && ss.searchBarFocused]}>
          <Text style={{ fontSize: 13, opacity: 0.5, marginRight: 8 }}>🔍</Text>
          <TextInput
            ref={searchRef}
            style={ss.searchInput}
            placeholder="Search articles…"
            placeholderTextColor="rgba(255,255,255,0.38)"
            value={searchDraft}
            onChangeText={v => {
              setSearchDraft(v)
              if (debounceRef.current) clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => setSearch(v), 350)
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {searchDraft.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchDraft(''); setSearch('') }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category filter */}
      {categories.length > 0 && (
        <View style={ss.catRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
            <TouchableOpacity
              onPress={() => setSelectedCat(null)}
              style={[ss.catTab, selectedCat === null && ss.catTabActive]}
            >
              <Text style={[ss.catTabText, selectedCat === null && ss.catTabTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCat(selectedCat === cat ? null : cat)}
                style={[ss.catTab, selectedCat === cat && ss.catTabActive]}
              >
                <Text style={[ss.catTabText, selectedCat === cat && ss.catTabTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading && page === 1 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LeafLoader size="lg" text="Loading articles…" />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 6 }}>
            {search ? `No results for "${searchDraft}"` : selectedCat ? 'No posts in this category' : 'No Posts Yet'}
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center' }}>
            {search ? 'Try different keywords' : selectedCat ? 'Try selecting a different category' : 'Check back soon!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listPosts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => <PostCard post={item} index={index} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          onEndReached={!isFiltered ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
              tintColor={Colors.forest}
            />
          }
          ListFooterComponent={
            fetchingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <LeafLoader size="sm" text="Loading more…" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontFamily: Fonts.displayBold, fontSize: 24, letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.42)', fontFamily: Fonts.regular, fontSize: 9, letterSpacing: 1.4, marginTop: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    marginTop: 12,
  },
  searchBarFocused: { borderColor: 'rgba(255,255,255,0.36)', backgroundColor: 'rgba(255,255,255,0.16)' },
  searchInput: { flex: 1, color: '#fff', fontFamily: Fonts.regular, fontSize: 14 },

  catRow: { backgroundColor: Colors.cream, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  catTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: Colors.border,
  },
  catTabActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  catTabText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  catTabTextActive: { color: '#fff', fontFamily: Fonts.bold },

  sectionLabel: {
    fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10,
  },

  featCard: {
    width: '100%', height: 230, borderRadius: 20, overflow: 'hidden',
    backgroundColor: Colors.forest, ...Shadows.md,
  },
  featOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingTop: 48,
  },
  featBadge: {
    backgroundColor: Colors.gold, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  featBadgeText: { fontFamily: Fonts.bold, fontSize: 8, color: '#fff', letterSpacing: 1 },
  featTitle: { fontFamily: Fonts.displayBold, fontSize: 20, color: '#fff', lineHeight: 26 },
  featExcerpt: { fontFamily: Fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18, marginTop: 4 },
  featMeta: { fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  featMetaDot: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  featLabel: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  featLabelText: { fontFamily: Fonts.bold, fontSize: 7, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.6 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', gap: 12,
    ...Shadows.sm,
  },
  thumb: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.mint, flexShrink: 0 },
  catBadge: {
    backgroundColor: Colors.mint, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  catBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage, textTransform: 'uppercase', letterSpacing: 0.5 },
  trendingBadge: { backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  trendingBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: '#ef4444' },
  popularBadge: { backgroundColor: '#fffbeb', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  popularBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: '#d97706' },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest, lineHeight: 20 },
  cardExcerpt: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim },
  metaDot: { color: Colors.textDim, fontSize: 10 },
})
