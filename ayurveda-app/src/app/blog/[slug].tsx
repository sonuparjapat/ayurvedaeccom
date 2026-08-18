import React, { useEffect, useRef, useState } from 'react'
import {
  Dimensions, ScrollView, Share, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native'
import { LeafLoader } from '../../components/ui/LeafLoader'
import { Image as ExpoImage } from 'expo-image'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const BOOKMARKS_KEY = 'blog_bookmarks_v1'

const { height: SCREEN_H, width: W } = Dimensions.get('window')

// ─── HTML → native block renderer ────────────────────────────────────────────
type Block = { type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'quote'; text: string }

function stripInline(html: string): string {
  return html
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '$1')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '$1')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '$1')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '$1')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
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
    <View style={{ gap: 0 }}>
      {blocks.map((b, i) => {
        if (b.type === 'h1') return (
          <Text key={i} style={cs.h1}>{b.text}</Text>
        )
        if (b.type === 'h2') return (
          <Text key={i} style={cs.h2}>{b.text}</Text>
        )
        if (b.type === 'h3') return (
          <Text key={i} style={cs.h3}>{b.text}</Text>
        )
        if (b.type === 'li') return (
          <View key={i} style={cs.liRow}>
            <Text style={cs.liBullet}>•</Text>
            <Text style={cs.liText}>{b.text}</Text>
          </View>
        )
        if (b.type === 'quote') return (
          <View key={i} style={cs.quote}>
            <Text style={cs.quoteText}>{b.text}</Text>
          </View>
        )
        return <Text key={i} style={cs.para}>{b.text}</Text>
      })}
    </View>
  )
}

// ─── Related post mini-card ───────────────────────────────────────────────────
function RelatedCard({ post }: { post: any }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/blog/${post.slug}` as any)}
      activeOpacity={0.85}
      style={ss.relCard}
    >
      <View style={ss.relThumb}>
        {post.cover_image ? (
          <ExpoImage source={{ uri: post.cover_image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ flex: 1 }} />
        )}
      </View>
      <Text style={ss.relTitle} numberOfLines={3}>{post.title}</Text>
      {post.read_time && <Text style={ss.relMeta}>{post.read_time} min read</Text>}
    </TouchableOpacity>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const [post, setPost] = useState<any>(null)
  const [relatedPosts, setRelatedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [readProgress, setReadProgress] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const contentHeightRef = useRef(0)

  // Load bookmark state
  useEffect(() => {
    if (!slug) return
    AsyncStorage.getItem(BOOKMARKS_KEY).then(raw => {
      const ids: string[] = raw ? JSON.parse(raw) : []
      setBookmarked(ids.includes(String(slug)))
    }).catch(() => {})
  }, [slug])

  const toggleBookmark = async () => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_KEY)
      const ids: string[] = raw ? JSON.parse(raw) : []
      const id = String(slug)
      const next = bookmarked ? ids.filter(x => x !== id) : [...ids, id]
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
      setBookmarked(!bookmarked)
    } catch {}
  }

  useEffect(() => {
    if (!slug) return
    api.get(`/blog/public/${slug}`)
      .then(r => {
        const p = r.data?.data || null
        setPost(p)
        if (p?.category) {
          api.get('/blog/public', { params: { category: p.category, limit: 4 } })
            .then(res => {
              const all: any[] = res.data?.data || []
              setRelatedPosts(all.filter((x: any) => x.slug !== p.slug).slice(0, 3))
            }).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const handleShare = async () => {
    if (!post) return
    try {
      await Share.share({
        message: `${post.title}\n\nRead on Oroganix: https://oroganix.com/blog/${post.slug}`,
        url: `https://oroganix.com/blog/${post.slug}`,
      })
    } catch {}
  }

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y
    const total = contentHeightRef.current - SCREEN_H
    if (total > 0) setReadProgress(Math.min(1, Math.max(0, y / total)))
  }

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  const authorInitial = post?.author_name ? post.author_name.charAt(0).toUpperCase() : 'O'

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, backgroundColor: Colors.forest, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />

      {/* Reading progress bar */}
      <View style={ss.progressTrack} pointerEvents="none">
        <View style={[ss.progressBar, { width: `${Math.round(readProgress * 100)}%` }]} />
      </View>

      {/* Sticky header */}
      <LinearGradient colors={[Colors.forest, '#0f2a1a']} style={[ss.stickyHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {post.category && (
            <Text style={ss.headerCat}>{post.category}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={toggleBookmark} style={[ss.shareBtn, bookmarked && { backgroundColor: 'rgba(201,168,76,0.25)' }]}>
            <Text style={{ fontSize: 16 }}>{bookmarked ? '🔖' : '🏷️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={ss.shareBtn}>
            <Text style={ss.shareBtnText}>↑ Share</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(_, h) => { contentHeightRef.current = h }}
      >
        {/* Hero cover image */}
        <View style={ss.heroWrap}>
          {post.cover_image ? (
            <ExpoImage source={{ uri: post.cover_image }} style={ss.heroImg} contentFit="cover" transition={300} />
          ) : (
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={ss.heroImg} />
          )}
          <LinearGradient colors={['transparent', 'rgba(5,20,10,0.65)']} style={StyleSheet.absoluteFill} />
        </View>

        {/* Post header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={ss.postHeader}>
          {post.category && (
            <View style={ss.catBadge}>
              <Text style={ss.catBadgeText}>{post.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={ss.postTitle}>{post.title}</Text>
          {post.excerpt && (
            <Text style={ss.postExcerpt}>{post.excerpt}</Text>
          )}

          {/* Meta row */}
          <View style={ss.metaRow}>
            <Text style={ss.metaText}>{formatDate(post.published_at)}</Text>
            {post.read_time && (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.metaText}>{post.read_time} min read</Text>
              </>
            )}
            {post.views_count > 0 && (
              <>
                <Text style={ss.metaDot}>·</Text>
                <Text style={ss.metaText}>{post.views_count} views</Text>
              </>
            )}
          </View>

          {/* Author card */}
          <View style={ss.authorCard}>
            <View style={ss.authorAvatar}>
              <Text style={ss.authorInitial}>{authorInitial}</Text>
            </View>
            <View>
              <Text style={ss.authorName}>{post.author_name || 'Oroganix Team'}</Text>
              <Text style={ss.authorRole}>Ayurvedic Wellness Expert</Text>
            </View>
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={ss.divider} />

        {/* Article content */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={ss.contentWrap}>
          {post.content && <HtmlContent html={post.content} />}
        </Animated.View>

        {/* Tags */}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <View style={ss.tagsSection}>
            <Text style={ss.tagsLabel}>TAGS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {post.tags.map((tag: string, i: number) => (
                <View key={i} style={ss.tagChip}>
                  <Text style={ss.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <View style={ss.relSection}>
            <View style={ss.relHeader}>
              <View style={ss.relHeaderLine} />
              <Text style={ss.relHeaderText}>RELATED ARTICLES</Text>
              <View style={ss.relHeaderLine} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {relatedPosts.map((rp, i) => (
                <Animated.View key={rp.id} entering={FadeInDown.delay(i * 80).duration(400)} style={{ flex: 1 }}>
                  <RelatedCard post={rp} />
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom CTA */}
        <View style={ss.ctaSection}>
          <LinearGradient colors={[Colors.forest, '#0f2a1a']} style={ss.ctaCard}>
            <Text style={ss.ctaEmoji}>🌿</Text>
            <Text style={ss.ctaTitle}>Explore Our Products</Text>
            <Text style={ss.ctaSub}>Premium Ayurvedic formulas crafted from ancient wisdom</Text>
            <TouchableOpacity
              onPress={() => router.push('/products' as any)}
              style={ss.ctaBtn}
            >
              <Text style={ss.ctaBtnText}>Shop Now →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  )
}

// ─── Content styles ───────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  h1: { fontFamily: Fonts.displayBold, fontSize: 24, color: Colors.forest, lineHeight: 32, marginTop: 20, marginBottom: 8 },
  h2: { fontFamily: Fonts.bold, fontSize: 19, color: Colors.forest, lineHeight: 27, marginTop: 18, marginBottom: 6 },
  h3: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.dark, lineHeight: 23, marginTop: 14, marginBottom: 4 },
  para: { fontFamily: Fonts.regular, fontSize: 15, color: '#374151', lineHeight: 27, marginTop: 10 },
  liRow: { flexDirection: 'row', marginTop: 6, paddingLeft: 4 },
  liBullet: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.sage, marginRight: 8, marginTop: 1 },
  liText: { fontFamily: Fonts.regular, fontSize: 15, color: '#374151', lineHeight: 24, flex: 1 },
  quote: {
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
    paddingLeft: 14, marginVertical: 14,
    backgroundColor: Colors.goldLight, borderRadius: 8, padding: 14,
  },
  quoteText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.forest, lineHeight: 22, fontStyle: 'italic' },
})

// ─── Screen styles ────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  progressTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.08)', zIndex: 200 },
  progressBar: { height: '100%', backgroundColor: Colors.emerald },

  stickyHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCat: { fontFamily: Fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2, textTransform: 'uppercase' },
  shareBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  shareBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 12 },

  heroWrap: { width: W, height: 240, backgroundColor: Colors.forest },
  heroImg: { width: '100%', height: '100%' },

  postHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 0 },
  catBadge: {
    backgroundColor: Colors.mint, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  catBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage, textTransform: 'uppercase', letterSpacing: 0.8 },
  postTitle: { fontFamily: Fonts.displayBold, fontSize: 28, color: Colors.forest, lineHeight: 36, marginBottom: 10 },
  postExcerpt: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textDim, lineHeight: 23, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  metaText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim },
  metaDot: { color: Colors.textDim, fontSize: 12 },

  authorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.mint, borderRadius: 14, padding: 12,
    marginBottom: 4,
  },
  authorAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  authorInitial: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.gold },
  authorName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  authorRole: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.sage },

  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20, marginVertical: 20 },

  contentWrap: { paddingHorizontal: 20, paddingBottom: 8 },

  tagsSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  tagsLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage, letterSpacing: 1.2, marginBottom: 10 },
  tagChip: {
    backgroundColor: '#fff', borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 0.5, borderColor: Colors.border, ...Shadows.sm,
  },
  tagChipText: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.forest },

  relSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  relHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  relHeaderLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  relHeaderText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.sage, letterSpacing: 1.2 },
  relCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', ...Shadows.sm,
  },
  relThumb: { height: 80, backgroundColor: Colors.mint },
  relTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest, lineHeight: 17, padding: 10, paddingBottom: 4 },
  relMeta: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.sage, paddingHorizontal: 10, paddingBottom: 10 },

  ctaSection: { paddingHorizontal: 20, paddingTop: 24 },
  ctaCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
  ctaEmoji: { fontSize: 32, marginBottom: 10 },
  ctaTitle: { fontFamily: Fonts.displayBold, fontSize: 22, color: '#fff', marginBottom: 6, textAlign: 'center' },
  ctaSub: { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  ctaBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 0.3 },
})
