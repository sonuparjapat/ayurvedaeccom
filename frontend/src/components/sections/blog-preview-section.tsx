'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import { Calendar, ArrowRight, BookOpen, Clock } from 'lucide-react'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  cover_image?: string | null
  author_name: string
  category: string
  published_at: string
}

function readTime(text?: string | null) {
  if (!text) return '1 min'
  return `${Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200))} min`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function BlogPreviewSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    axios.get('/blog/public', { params: { page: 1, limit: 3 } })
      .then(r => setPosts(r.data?.data || []))
      .catch(() => {})
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="py-16 px-4" style={{ background: '#f7f4eb' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-emerald-600" />
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-600">Wellness Blog</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
              From the <span className="text-emerald-700">Oroganix Journal</span>
            </h2>
            <p className="text-gray-500 text-sm mt-2">Expert tips, Ayurvedic insights and natural living guides</p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            View all articles <ArrowRight size={14} />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block" style={{ textDecoration: 'none' }}>
              <div
                className="bg-white rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200"
                style={{ border: '1px solid #e8f0e4', boxShadow: '0 2px 12px rgba(26,58,42,0.05)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(26,58,42,0.12)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(26,58,42,0.05)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Cover */}
                <div className="aspect-video overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1a3a2a, #2d5a3d)' }}>
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={40} color="rgba(255,255,255,0.2)" />
                    </div>
                  )}
                  {post.category && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-sm text-gray-900 leading-snug mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #f0f0e8' }}>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={10} />{fmtDate(post.published_at)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{readTime(post.excerpt)} read</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile see all */}
        <div className="flex sm:hidden justify-center mt-8">
          <Link
            href="/blog"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #065f46, #0f766e)' }}
          >
            View all articles <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
