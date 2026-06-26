import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator, Dimensions, ScrollView, Share, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    api.get(`/blog/public/${slug}`)
      .then(r => setPost(r.data?.post || r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  const handleShare = async () => {
    if (!post) return
    try {
      await Share.share({ message: `${post.title}\n\nRead on Oroganix`, url: `https://oroganix.com/blog/${post.slug}` })
    } catch {}
  }

  // Content rendered as stripped text (no WebView dependency needed)

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.emerald} />
      </View>
    )
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest }}>Post Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: Colors.forest, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
            <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={ss.shareBtn}>
            <Text style={{ color: '#fff', fontSize: 14 }}>Share</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {post.cover_image && (
          <ExpoImage source={{ uri: post.cover_image }} style={{ width: '100%', height: 220 }} contentFit="cover" transition={200} />
        )}

        {/* Post Info */}
        <View style={{ padding: 20 }}>
          {post.category && (
            <View style={ss.catBadge}>
              <Text style={ss.catBadgeText}>{post.category}</Text>
            </View>
          )}
          <Text style={ss.title}>{post.title}</Text>
          <View style={ss.metaRow}>
            <Text style={ss.metaText}>By {post.author_name || 'Oroganix'}</Text>
            <Text style={ss.metaDot}>·</Text>
            <Text style={ss.metaText}>{formatDate(post.published_at)}</Text>
            {post.views_count > 0 && (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.metaText}>{post.views_count} views</Text>
              </>
            )}
          </View>

          {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {post.tags.map((tag: string, i: number) => (
                <View key={i} style={{ backgroundColor: Colors.mint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 10, color: Colors.sage }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        {post.content && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: '#374151', lineHeight: 26 }}>
              {post.content.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const ss = StyleSheet.create({
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  catBadge: { backgroundColor: Colors.mint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  catBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.sage, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontFamily: Fonts.displayBold, fontSize: 26, color: Colors.forest, lineHeight: 34, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim },
  metaDot: { color: Colors.textDim, fontSize: 12 },
})
