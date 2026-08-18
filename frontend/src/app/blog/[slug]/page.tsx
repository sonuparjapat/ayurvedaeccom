'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import {
  Calendar, User, Eye, ArrowLeft, BookOpen, Clock,
  Share2, Link2, Check, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  id: number; title: string; slug: string
  excerpt?: string | null; content: string
  cover_image?: string | null; author_name: string
  category: string; tags: string[]; status: string
  views_count: number; read_time?: number
  meta_title?: string | null; meta_description?: string | null
  published_at: string; updated_at?: string; created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript:[^\s"'>]*/gi, '')
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, level, attrs, content) => {
    if (attrs.includes('id=')) return `<h${level}${attrs}>${content}</h${level}>`
    const text = content.replace(/<[^>]+>/g, '').trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}

function extractToc(html: string) {
  const result: { level: number; text: string; id: string }[] = []
  const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    result.push({ level: parseInt(m[1]), text, id })
  }
  return result
}

function readTime(post: BlogPost) {
  if (post.read_time) return post.read_time
  const words = post.content.replace(/<[^>]+>/g, '').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// ─── Reading progress ─────────────────────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const fn = () => {
      const scrolled = window.scrollY
      const total = document.body.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.06)', zIndex: 1000, pointerEvents: 'none' }}>
      <div style={{ height: '100%', background: 'linear-gradient(90deg, #059669, #0d9488)', width: `${progress}%`, transition: 'width 0.1s linear' }} />
    </div>
  )
}

// ─── TOC ──────────────────────────────────────────────────────────────────────
function TableOfContents({ items, activeId }: { items: { level: number; text: string; id: string }[]; activeId: string }) {
  if (items.length < 2) return null
  return (
    <div style={{
      position: 'sticky', top: 88, background: '#fff', borderRadius: 16,
      border: '1px solid #eaf4ee', padding: '20px 20px 20px 0',
      boxShadow: '0 2px 12px rgba(26,58,42,0.05)',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px 20px' }}>In this article</p>
      <nav>
        {items.map(item => (
          <a key={item.id} href={`#${item.id}`} style={{
            display: 'block', padding: `5px 20px 5px ${item.level === 3 ? 32 : 20}px`,
            fontSize: 13, lineHeight: 1.4, textDecoration: 'none', borderRadius: '0 99px 99px 0',
            color: activeId === item.id ? '#059669' : '#6b7280',
            fontWeight: activeId === item.id ? 700 : 400,
            background: activeId === item.id ? 'linear-gradient(90deg, #ecfdf5, #f0fdf4)' : 'transparent',
            borderLeft: activeId === item.id ? '2px solid #059669' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  )
}

// ─── Share button ─────────────────────────────────────────────────────────────
function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  useEffect(() => { setCanShare(typeof navigator !== 'undefined' && !!navigator.share) }, [])

  const handleShare = async () => {
    const url = window.location.href
    if (canShare) {
      await navigator.share({ title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }
  return (
    <button onClick={handleShare} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
      background: copied ? '#ecfdf5' : '#f7f4eb', border: `1px solid ${copied ? '#a7f3d0' : '#e5e7eb'}`,
      color: copied ? '#059669' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      transition: 'all 0.2s',
    }}>
      {copied ? <Check size={14} /> : canShare ? <Share2 size={14} /> : <Link2 size={14} />}
      {copied ? 'Copied!' : canShare ? 'Share' : 'Copy link'}
    </button>
  )
}

// ─── Social share row ────────────────────────────────────────────────────────
function SocialShareRow({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : `https://oroganix.com/blog/${slug}`

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', border: 'none', textDecoration: 'none', transition: 'opacity 0.18s',
  }

  return (
    <div style={{ marginTop: 36, padding: '24px 0', borderTop: '1px solid #f0f0e8', borderBottom: '1px solid #f0f0e8' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
        Share this article
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnBase, background: '#0f1419', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Share on X
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnBase, background: '#25d366', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.125.549 4.126 1.51 5.866L.055 23.454a.75.75 0 0 0 .918.92l5.684-1.492A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.12-1.404l-.367-.216-3.817 1.002.979-3.7-.24-.386A9.967 9.967 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          WhatsApp
        </a>
        <button onClick={copyLink} style={{ ...btnBase, background: copied ? '#ecfdf5' : '#f3f4f6', color: copied ? '#059669' : '#374151' }}>
          {copied ? <Check size={13} /> : <Link2 size={13} />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

// ─── Author card ──────────────────────────────────────────────────────────────
function AuthorCard({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : 'O'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'linear-gradient(135deg, #f7f4eb, #ecfdf5)', borderRadius: 20,
      border: '1px solid #eaf4ee', padding: '20px 24px', marginTop: 32,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#c9a84c' }}>{initial}</span>
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 16, color: '#0d2014', margin: '0 0 3px' }}>{name || 'Oroganix Team'}</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Ayurvedic Wellness Expert at Oroganix</p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
          Passionate about blending ancient Ayurvedic wisdom with modern wellness science to help you live your healthiest life.
        </p>
      </div>
    </div>
  )
}

// ─── Newsletter CTA ───────────────────────────────────────────────────────────
function NewsletterCta() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1f14 0%, #1a3a2a 100%)',
      borderRadius: 24, padding: '40px 36px', marginTop: 48, textAlign: 'center',
      border: '1px solid rgba(201,168,76,0.18)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
        Enjoyed this article?
      </h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 auto 28px', maxWidth: 380, lineHeight: 1.6 }}>
        Get weekly Ayurvedic wisdom, recipes and wellness tips delivered to your inbox.
      </p>
      {submitted ? (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '14px 24px', display: 'inline-block' }}>
          <p style={{ color: '#34d399', fontWeight: 700, fontSize: 14, margin: 0 }}>✓ You&apos;re subscribed!</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (email) setSubmitted(true) }} style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto', justifyContent: 'center' }}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fff', outline: 'none',
          }} />
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #c9a84c, #a07830)', border: 'none',
            borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}>Subscribe</button>
        </form>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toc, setToc] = useState<{ level: number; text: string; id: string }[]>([])
  const [activeHeading, setActiveHeading] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    axios.get(`/blog/public/${slug}`)
      .then(res => {
        const p: BlogPost = res.data.data
        setPost(p)
        setError(false)
        setToc(extractToc(p.content || ''))
        if (p?.category) {
          axios.get(`/blog/public?category=${encodeURIComponent(p.category)}&limit=4`)
            .then(r => {
              const all: BlogPost[] = r.data?.data || []
              setRelatedPosts(all.filter(x => x.slug !== p.slug).slice(0, 3))
            }).catch(() => {})
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) return
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveHeading(e.target.id) })
      },
      { rootMargin: '-72px 0px -60% 0px', threshold: 0 }
    )
    toc.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [toc])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  const processedContent = post ? addHeadingIds(sanitizeHtml(post.content)) : ''

  return (
    <div className="min-h-screen flex flex-col">
      <ReadingProgressBar />
      <Header />

      <main className="flex-1">
        {loading ? (
          <div className="text-center py-32 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            Loading…
          </div>
        ) : error || !post ? (
          <div className="text-center py-32 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">Post not found</p>
            <p className="text-sm mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Link href="/blog"><Button variant="outline"><ArrowLeft size={16} className="mr-2" /> Back to Blog</Button></Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div style={{ position: 'relative', background: '#0d2014', overflow: 'hidden' }}>
              {post.cover_image && (
                <img src={post.cover_image} alt={post.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,32,20,0.5) 0%, rgba(13,32,20,0.9) 100%)' }} />
              <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: '56px 24px 52px' }}>
                <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none', marginBottom: 22, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)') }
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)') }
                >
                  <ArrowLeft size={14} /> Back to Blog
                </Link>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 99, padding: '4px 14px', marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{post.category}</span>
                </div>
                <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.02em' }}>
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 24, maxWidth: 580 }}>
                    {post.excerpt}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={14} />{post.author_name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={14} />{formatDate(post.published_at)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} />{readTime(post)} min read</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Eye size={14} />{post.views_count} views</span>
                  <div style={{ marginLeft: 'auto' }}><ShareButton title={post.title} /></div>
                </div>
              </div>
            </div>

            {/* Article layout: content + TOC sidebar */}
            <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 16px 32px', display: 'grid', gridTemplateColumns: toc.length >= 2 ? '1fr 260px' : '1fr', gap: 48, alignItems: 'start' }}>

              {/* Content column */}
              <article>
                {/* Author card */}
                <AuthorCard name={post.author_name} />

                <div style={{ height: 1, background: '#e8f5ee', margin: '32px 0' }} />

                {/* Prose */}
                <div
                  ref={contentRef}
                  className="prose prose-lg max-w-none prose-emerald
                    prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-[15px]
                    prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-2xl prose-img:shadow-md
                    prose-blockquote:border-amber-500 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                    prose-strong:text-gray-900 prose-li:text-gray-700"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Tags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {post.tags.map((tag, i) => (
                        <span key={i} style={{ padding: '5px 14px', borderRadius: 99, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', background: '#fff', fontWeight: 500 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social share */}
                <SocialShareRow title={post.title} slug={post.slug} />

                {/* Newsletter CTA */}
                <NewsletterCta />

                {/* Related posts */}
                {relatedPosts.length > 0 && (
                  <div style={{ marginTop: 48, paddingTop: 36, borderTop: '1px solid #f3f4f6' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0d2014', marginBottom: 20, letterSpacing: '-0.01em' }}>Related Articles</h2>
                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                      {relatedPosts.map(rp => (
                        <Link key={rp.id} href={`/blog/${rp.slug}`} style={{ textDecoration: 'none' }}>
                          <div style={{
                            background: '#fff', borderRadius: 16, overflow: 'hidden',
                            border: '1px solid #eaf4ee', boxShadow: '0 2px 10px rgba(26,58,42,0.05)',
                            transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(26,58,42,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(26,58,42,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                          >
                            {rp.cover_image && (
                              <div style={{ height: 120, overflow: 'hidden', background: '#e8f5ee' }}>
                                <img src={rp.cover_image} alt={rp.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                              </div>
                            )}
                            <div style={{ padding: '12px 14px 14px' }}>
                              <p style={{ fontWeight: 700, fontSize: 13, color: '#0d2014', lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rp.title}</p>
                              <p style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                                <Clock size={10} /> {rp.read_time ? `${rp.read_time} min read` : rp.category}
                                <span style={{ marginLeft: 'auto', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  Read <ChevronRight size={10} />
                                </span>
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Back */}
                <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                  <Link href="/blog">
                    <Button variant="outline" size="lg" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      <ArrowLeft size={16} className="mr-2" /> Back to All Articles
                    </Button>
                  </Link>
                </div>
              </article>

              {/* TOC sidebar */}
              {toc.length >= 2 && (
                <aside><TableOfContents items={toc} activeId={activeHeading} /></aside>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
