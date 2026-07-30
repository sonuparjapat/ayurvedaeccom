'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { LeafLoader } from '@/components/ui/leaf-loader'
import {
  Calendar, User, ArrowRight, Search,
  ChevronLeft, ChevronRight, BookOpen, Feather,
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
}

const CATEGORY_COLORS: Record<string, string> = {
  Ayurveda: '#10b981', Wellness: '#c9a84c', Herbs: '#2d5a3d', Health: '#6d28d9',
  Recipes: '#d97706', Lifestyle: '#0ea5e9',
}

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] || '#1a3a2a'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 12 }
      if (search) params.search = search
      if (category) params.category = category
      const res = await axios.get('/blog/public', { params })
      setPosts(res.data.data || [])
      setTotalPages(res.data.totalPages || 1)
      if (!category && page === 1) {
        const cats = [...new Set((res.data.data || []).map((p: BlogPost) => p.category).filter(Boolean))] as string[]
        setCategories(prev => {
          const merged = [...new Set([...prev, ...cats])]
          return merged.length > prev.length ? merged : prev
        })
      }
    } catch { setPosts([]) }
    finally { setLoading(false) }
  }, [page, search, category])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f4eb' }}>
      <Header />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a1f14 0%, #0f2d1e 55%, #152a1e 100%)', padding: '64px 16px 52px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: -80, right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 99, padding: '5px 15px', marginBottom: 20 }}>
            <Feather size={12} color="#c9a84c" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase' }}>Oroganix Wellness</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 6vw, 46px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Wisdom of <span style={{ color: '#c9a84c' }}>Ancient Ayurveda</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
            Expert insights, traditional remedies and modern wellness tips to help you live your healthiest life.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search articles…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99, padding: '13px 100px 13px 44px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #c9a84c, #a07830)', border: 'none', borderRadius: 99,
              padding: '8px 18px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}>
              Search
            </button>
          </form>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1140, width: '100%', margin: '0 auto', padding: '36px 16px 60px' }}>

        {/* Category pills */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
            <button onClick={() => { setCategory(''); setPage(1) }} style={{
              padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
              background: !category ? 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' : '#fff',
              borderColor: !category ? 'transparent' : '#e5e7eb',
              color: !category ? '#fff' : '#6b7280',
            }}>All</button>
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1) }} style={{
                padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                background: category === c ? categoryColor(c) : '#fff',
                borderColor: category === c ? 'transparent' : '#e5e7eb',
                color: category === c ? '#fff' : '#6b7280',
              }}>{c}</button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <LeafLoader size={52} text="Loading articles…" />
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
            {/* Featured post (first one) */}
            {page === 1 && !search && !category && posts[0] && (
              <Link href={`/blog/${posts[0].slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 28 }}>
                <div style={{
                  background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 28px rgba(26,58,42,0.08)',
                  border: '1px solid #e8f5ee', display: 'grid', gridTemplateColumns: '1fr 1fr',
                  transition: 'box-shadow 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(26,58,42,0.14)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 28px rgba(26,58,42,0.08)'}
                >
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' }}>
                    {posts[0].cover_image ? (
                      <img src={posts[0].cover_image} alt={posts[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={56} color="rgba(255,255,255,0.2)" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                        Featured
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{posts[0].category}</span>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2d1e', lineHeight: 1.25, marginBottom: 12 }}>{posts[0].title}</h2>
                    {posts[0].excerpt && <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{posts[0].excerpt}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} />{posts[0].author_name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{fmtDate(posts[0].published_at)}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Post grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {(page === 1 && !search && !category ? posts.slice(1) : posts).map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #f0f0e8',
                    boxShadow: '0 2px 12px rgba(26,58,42,0.05)', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(26,58,42,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(26,58,42,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                  >
                    {/* Cover */}
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)', position: 'relative' }}>
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={36} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: categoryColor(post.category), color: '#fff' }}>
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0f2d1e', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.55, marginBottom: 14, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#9ca3af' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{post.author_name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} />{fmtDate(post.published_at)}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                          Read <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 36 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12,
                  background: '#fff', border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600,
                  color: page <= 1 ? '#d1d5db' : '#374151', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}>
                  <ChevronLeft size={15} /> Prev
                </button>
                <span style={{ fontSize: 13, color: '#9ca3af', padding: '0 8px' }}>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12,
                  background: '#fff', border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600,
                  color: page >= totalPages ? '#d1d5db' : '#374151', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}>
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #0a1f14 0%, #0f2d1e 60%, #152a1e 100%)', padding: '56px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#fff', marginBottom: 12, position: 'relative' }}>
          Ready to start your <span style={{ color: '#c9a84c' }}>wellness journey?</span>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, position: 'relative' }}>
          Explore our premium Ayurvedic products crafted from ancient wisdom.
        </p>
        <Link href="/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #c9a84c, #a07830)',
          color: '#fff', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', position: 'relative',
        }}>
          Shop Now <ArrowRight size={16} />
        </Link>
      </div>

      <Footer />
    </div>
  )
}
