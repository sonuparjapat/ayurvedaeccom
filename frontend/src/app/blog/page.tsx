'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { LeafLoader } from '@/components/ui/leaf-loader'
import {
  Calendar, User, ArrowRight, Search,
  ChevronRight, BookOpen, Feather, Clock, Tag,
} from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  cover_image?: string | null
  author_name: string
  category: string
  tags: string[]
  views_count: number
  published_at: string
  read_time?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Ayurveda: '#059669', Wellness: '#c9a84c', Herbs: '#2d5a3d', Health: '#6d28d9',
  Recipes: '#d97706', Lifestyle: '#0ea5e9',
}
function categoryColor(cat: string) { return CATEGORY_COLORS[cat] || '#1a3a2a' }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function readTime(post: BlogPost) {
  if (post.read_time) return `${post.read_time} min`
  if (!post.excerpt) return '1 min'
  return `${Math.max(1, Math.ceil(post.excerpt.trim().split(/\s+/).length / 200))} min`
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const shimmerKf = `
@keyframes shimmer {
  0%   { background-position: -600px 0 }
  100% { background-position:  600px 0 }
}
`
function Skel({ w = '100%', h = 16, r = 8, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      background: 'linear-gradient(90deg, #e8e8e2 25%, #f2f2ec 50%, #e8e8e2 75%)',
      backgroundSize: '600px 100%',
      animation: 'shimmer 1.4s infinite linear',
    }} />
  )
}

function FeaturedSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 28, overflow: 'hidden', border: '1px solid #eaf4ee', display: 'grid', gridTemplateColumns: '1.1fr 1fr', marginBottom: 40 }}>
      <div style={{ aspectRatio: '3/2', background: '#e8e8e2' }} />
      <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skel w={80} h={20} r={99} />
        <Skel w="90%" h={28} r={6} />
        <Skel w="100%" h={28} r={6} />
        <Skel w="60%" h={14} r={6} />
        <Skel w="100%" h={12} r={4} />
        <Skel w="100%" h={12} r={4} />
        <Skel w="75%" h={12} r={4} />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #f0f0e8' }}>
      <div style={{ aspectRatio: '16/9', background: '#e8e8e2' }} />
      <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skel w="100%" h={14} r={4} />
        <Skel w="80%" h={14} r={4} />
        <Skel w="100%" h={10} r={4} />
        <Skel w="60%" h={10} r={4} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Skel w={60} h={10} r={4} />
          <Skel w={50} h={10} r={4} />
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <>
      <style>{shimmerKf}</style>
      <FeaturedSkeleton />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </>
  )
}

// ─── Newsletter strip ─────────────────────────────────────────────────────────
function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1f14 0%, #1a3a2a 100%)',
      borderRadius: 24, padding: '36px 32px', marginBottom: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 24, flexWrap: 'wrap',
      border: '1px solid rgba(201,168,76,0.2)',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Feather size={14} color="#c9a84c" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Wellness Digest
          </span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
          Get weekly Ayurvedic wisdom
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '6px 0 0' }}>
          Recipes, remedies, and wellness tips — straight to your inbox.
        </p>
      </div>
      {submitted ? (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '14px 22px' }}>
          <p style={{ color: '#34d399', fontWeight: 700, fontSize: 14, margin: 0 }}>✓ You&apos;re subscribed!</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>We&apos;ll be in touch soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 12, padding: '11px 16px', fontSize: 13, color: '#fff', outline: 'none', width: 220,
            }}
          />
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #c9a84c, #a07830)', border: 'none',
            borderRadius: 12, padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Subscribe
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Featured post card ───────────────────────────────────────────────────────
function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 40 }}>
      <div style={{
        background: '#fff', borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(26,58,42,0.10)', border: '1px solid #eaf4ee',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr',
        transition: 'box-shadow 0.22s, transform 0.22s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 48px rgba(26,58,42,0.16)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 32px rgba(26,58,42,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
      >
        <div style={{ aspectRatio: '3/2', overflow: 'hidden', background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)', position: 'relative' }}>
          {post.cover_image ? (
            <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={64} color="rgba(255,255,255,0.15)" />
            </div>
          )}
          <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 12px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>✦ Cover Story</span>
          </div>
        </div>
        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: `${categoryColor(post.category)}18`, color: categoryColor(post.category), border: `1px solid ${categoryColor(post.category)}30` }}>
              {post.category}
            </span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0d2014', lineHeight: 1.22, marginBottom: 12, letterSpacing: '-0.02em', textWrap: 'balance' as any }}>
            {post.title}
          </h2>
          {post.excerpt && (
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, marginBottom: 22, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#9ca3af' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} />{post.author_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{fmtDate(post.published_at)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{readTime(post)} read</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
              Read <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
      <div style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #f0f0e8',
        boxShadow: '0 2px 14px rgba(26,58,42,0.05)', transition: 'all 0.22s',
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(26,58,42,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(26,58,42,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
      >
        <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)', position: 'relative', flexShrink: 0 }}>
          {post.cover_image ? (
            <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={32} color="rgba(255,255,255,0.18)" />
            </div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: categoryColor(post.category), color: '#fff',
            }}>{post.category}</span>
          </div>
          {post.views_count > 500 ? (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>🔥 Trending</span>
            </div>
          ) : post.views_count > 100 ? (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(217,119,6,0.85)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>⭐ Popular</span>
            </div>
          ) : null}
        </div>
        <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0d2014', lineHeight: 1.38, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em' }}>
            {post.title}
          </h3>
          {post.excerpt && (
            <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.58, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9ca3af' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{post.author_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{readTime(post)}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
              Read <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    axios.get('/blog/public/categories')
      .then(r => setCategories(r.data?.categories || []))
      .catch(() => {})
  }, [])

  const load = useCallback(async (pg: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const params: any = { page: pg, limit: 12 }
      if (search) params.search = search
      if (category) params.category = category
      const res = await axios.get('/blog/public', { params })
      const incoming: BlogPost[] = res.data.data || []
      if (append) setPosts(prev => [...prev, ...incoming])
      else setPosts(incoming)
      const total = res.data.totalPages || 1
      setHasMore(pg < total)
    } catch { if (!append) setPosts([]) }
    finally { setLoadingMore(false); setLoading(false) }
  }, [search, category])

  useEffect(() => { setPage(1); load(1) }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    load(next, true)
  }

  const isFiltered = !!search || !!category
  const featuredPost = !isFiltered && page === 1 && posts.length > 0 ? posts[0] : null
  const gridPosts = !isFiltered && posts.length > 0 ? posts.slice(1) : posts

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f4eb' }}>
      <Header />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(145deg, #071812 0%, #0f2d1e 55%, #152a1e 100%)', padding: '72px 16px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 99, padding: '5px 16px', marginBottom: 22 }}>
            <Feather size={12} color="#c9a84c" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Oroganix Wellness Journal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
            Wisdom of <span style={{ color: '#c9a84c' }}>Ancient Ayurveda</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 auto 40px', maxWidth: 480, lineHeight: 1.65 }}>
            Expert insights, traditional remedies and modern wellness tips to live your healthiest life.
          </p>
          <form onSubmit={handleSearch} style={{ maxWidth: 540, margin: '0 auto', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search articles, herbs, recipes…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 99, padding: '14px 110px 14px 46px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #c9a84c, #a07830)', border: 'none', borderRadius: 99,
              padding: '9px 20px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}>Search</button>
          </form>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1160, width: '100%', margin: '0 auto', padding: '44px 16px 64px' }}>

        {/* Category pills */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36, justifyContent: 'center' }}>
            <button onClick={() => { setCategory(''); setPage(1) }} style={{
              padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
              background: !category ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : '#fff',
              borderColor: !category ? 'transparent' : '#e5e7eb', color: !category ? '#fff' : '#6b7280',
            }}>All</button>
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1) }} style={{
                padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                background: category === c ? categoryColor(c) : '#fff',
                borderColor: category === c ? 'transparent' : '#e5e7eb',
                color: category === c ? '#fff' : '#6b7280',
              }}>
                {c}
              </button>
            ))}
            {search && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} style={{
                padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: '#fff3cd', border: '1.5px solid #f0c040', color: '#92740a',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Tag size={11} /> &ldquo;{search}&rdquo; ✕
              </button>
            )}
          </div>
        )}

        {loading && page === 1 ? (
          <SkeletonGrid />
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <LeafLoader size={40} text="Loading…" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #e8f5ee, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <BookOpen size={36} color="#10b981" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 6 }}>No articles found</p>
            <p style={{ fontSize: 13 }}>Try a different search or check back later.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featuredPost && <FeaturedPost post={featuredPost} />}

            {/* Newsletter strip */}
            {!isFiltered && page === 1 && <NewsletterStrip />}

            {/* Post grid */}
            {gridPosts.length > 0 && (
              <>
                {!isFiltered && page === 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Latest Articles</span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
                  {gridPosts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              </>
            )}

            {/* Load more */}
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '13px 36px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: loadingMore ? 'not-allowed' : 'pointer',
                    background: loadingMore ? '#e5e7eb' : 'linear-gradient(135deg, #1a3a2a, #2d5a3d)',
                    color: loadingMore ? '#9ca3af' : '#fff', border: 'none',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {loadingMore ? 'Loading…' : <>Load More Articles <ChevronRight size={15} /></>}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #071812 0%, #0f2d1e 55%, #152a1e 100%)', padding: '64px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 50%, rgba(201,168,76,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em', position: 'relative' }}>
          Ready to start your <span style={{ color: '#c9a84c' }}>wellness journey?</span>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 30, position: 'relative' }}>
          Explore our premium Ayurvedic products crafted from ancient wisdom.
        </p>
        <Link href="/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #c9a84c, #a07830)',
          color: '#fff', padding: '14px 30px', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', position: 'relative',
        }}>
          Shop Now <ArrowRight size={16} />
        </Link>
      </div>

      <Footer />
    </div>
  )
}
