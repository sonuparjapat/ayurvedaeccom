import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator,
  StyleSheet, StatusBar, ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import api from '../../api/axios'

const BOOKMARKS_KEY = 'blog_bookmarks_v1'
const Colors = { forest: '#065f46', gold: '#d97706', surface: '#f0fdf4', text: '#1a1a1a', sub: '#6b7280' }

interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  cover_image: string | null
  read_time?: number
  category_name?: string
}

export default function SavedArticlesScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_KEY)
      const slugs: string[] = raw ? JSON.parse(raw) : []
      if (slugs.length === 0) { setEmpty(true); setPosts([]); setLoading(false); return }
      setEmpty(false)
      const results = await Promise.all(
        slugs.map(slug =>
          api.get(`/blog/public/${slug}`)
            .then(r => r.data?.data ?? null)
            .catch(() => null)
        )
      )
      setPosts(results.filter(Boolean) as Post[])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const removeBookmark = async (slug: string) => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_KEY)
      const ids: string[] = raw ? JSON.parse(raw) : []
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids.filter(x => x !== slug)))
      setPosts(p => p.filter(post => post.slug !== slug))
      if (posts.length === 1) setEmpty(true)
    } catch {}
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Colors.forest, '#0f766e']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Articles</Text>
        <Text style={s.headerSub}>Your bookmarked wellness reads</Text>
      </LinearGradient>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.forest} /></View>
      ) : empty || posts.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔖</Text>
          <Text style={s.emptyTitle}>No saved articles yet</Text>
          <Text style={s.emptySub}>Bookmark articles while reading to find them here.</Text>
          <TouchableOpacity onPress={() => router.push('/blog' as any)} style={s.browseBtn}>
            <LinearGradient colors={[Colors.forest, '#0f766e']} style={s.browseBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.browseBtnText}>Browse Blog</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.slug}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/blog/${item.slug}` as any)} activeOpacity={0.85}>
              <View style={s.card}>
                {item.cover_image ? (
                  <Image source={{ uri: item.cover_image }} style={s.thumb} />
                ) : (
                  <View style={[s.thumb, s.thumbFallback]}>
                    <Text style={{ fontSize: 28 }}>🌿</Text>
                  </View>
                )}
                <View style={s.info}>
                  {item.category_name && (
                    <Text style={s.category}>{item.category_name.toUpperCase()}</Text>
                  )}
                  <Text style={s.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.excerpt} numberOfLines={2}>{item.excerpt}</Text>
                  <View style={s.meta}>
                    {item.read_time && <Text style={s.metaText}>{item.read_time} min read</Text>}
                    <TouchableOpacity onPress={() => removeBookmark(item.slug)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={s.remove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '700', letterSpacing: 0.3 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.sub, textAlign: 'center', marginBottom: 24 },
  browseBtn: { borderRadius: 10, overflow: 'hidden' },
  browseBtnInner: { paddingHorizontal: 28, paddingVertical: 12 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  thumb: { width: 90, height: 90 },
  thumbFallback: { backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  category: { fontSize: 10, fontWeight: '700', color: Colors.forest, letterSpacing: 0.8, marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text, lineHeight: 20, marginBottom: 4 },
  excerpt: { fontSize: 12, color: Colors.sub, lineHeight: 17 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  metaText: { fontSize: 11, color: Colors.sub },
  remove: { fontSize: 11, color: '#ef4444', fontWeight: '600' },
})
