import React, { useEffect, useState } from 'react'
import {
  ScrollView, Share, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { LeafLoader } from '../../components/ui/LeafLoader'
import { Image as ExpoImage } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'

// ─── Simple HTML-to-native block renderer ────────────────────────────────────
type Block = { type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'quote'; text: string }

function stripInline(html: string): string {
  return html
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '$1')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '$1')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '$1')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '$1')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim()
}

function parseHtml(html: string): Block[] {
  const blocks: Block[] = []
  const blockRe = /<(h[1-6]|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase()
    const text = stripInline(m[2])
    if (!text) continue
    if (tag === 'h1') blocks.push({ type: 'h1', text })
    else if (tag === 'h2') blocks.push({ type: 'h2', text })
    else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') blocks.push({ type: 'h3', text })
    else if (tag === 'blockquote') blocks.push({ type: 'quote', text })
    else if (tag === 'li') blocks.push({ type: 'li', text })
    else blocks.push({ type: 'p', text })
  }
  if (blocks.length === 0) {
    const plain = stripInline(html)
    if (plain) blocks.push({ type: 'p', text: plain })
  }
  return blocks
}

function HtmlContent({ html }: { html: string }) {
  const blocks = parseHtml(html)
  return (
    <View style={{ gap: 2 }}>
      {blocks.map((b, i) => {
        if (b.type === 'h1') return <Text key={i} style={{ fontFamily: Fonts.displayBold, fontSize: 22, color: Colors.forest, lineHeight: 30, marginTop: 16, marginBottom: 4 }}>{b.text}</Text>
        if (b.type === 'h2') return <Text key={i} style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, lineHeight: 26, marginTop: 14, marginBottom: 4 }}>{b.text}</Text>
        if (b.type === 'h3') return <Text key={i} style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.dark, lineHeight: 22, marginTop: 10, marginBottom: 2 }}>{b.text}</Text>
        if (b.type === 'li')  return <Text key={i} style={{ fontFamily: Fonts.regular, fontSize: 15, color: '#374151', lineHeight: 24, paddingLeft: 12 }}>{'• '}{b.text}</Text>
        if (b.type === 'quote') return (
          <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: Colors.emerald, paddingLeft: 12, marginVertical: 8, backgroundColor: Colors.mint, borderRadius: 4, padding: 10 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.sage, lineHeight: 22, fontStyle: 'italic' }}>{b.text}</Text>
          </View>
        )
        return <Text key={i} style={{ fontFamily: Fonts.regular, fontSize: 15, color: '#374151', lineHeight: 26, marginTop: 8 }}>{b.text}</Text>
      })}
    </View>
  )
}

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

  // Parse HTML into styled blocks (no external HTML renderer needed)


  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <LeafLoader size="lg" text="Loading article…" />
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
            <HtmlContent html={post.content} />
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
