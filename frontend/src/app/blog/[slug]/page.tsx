'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  content: string
  cover_image?: string | null
  author_name: string
  category: string
  tags: string[]
  status: string
  views_count: number
  meta_title?: string | null
  meta_description?: string | null
  published_at: string
  created_at: string
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    axios.get(`/blog/public/${slug}`)
      .then(res => {
        setPost(res.data.data)
        setError(false)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [slug])

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {loading ? (
          <div className="text-center py-32 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            Loading...
          </div>
        ) : error || !post ? (
          <div className="text-center py-32 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">Post not found</p>
            <p className="text-sm mb-6">The article you are looking for does not exist or has been removed.</p>
            <Link href="/blog">
              <Button variant="outline">
                <ArrowLeft size={16} className="mr-2" /> Back to Blog
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Cover Image */}
            {post.cover_image && (
              <div className="w-full max-h-[480px] overflow-hidden bg-gray-100">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: '480px' }}
                />
              </div>
            )}

            {/* Content */}
            <article className="max-w-4xl mx-auto px-4 py-12">

              {/* Back Link */}
              <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-6 transition">
                <ArrowLeft size={16} /> Back to Blog
              </Link>

              {/* Category */}
              <Badge className="bg-emerald-100 text-emerald-800 mb-4 block w-fit">
                {post.category}
              </Badge>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
                <span className="flex items-center gap-1.5">
                  <User size={15} />
                  {post.author_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {formatDate(post.published_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={15} />
                  {post.views_count} views
                </span>
              </div>

              {/* Post Content */}
              <div
                className="prose prose-lg max-w-none prose-emerald
                  prose-headings:text-gray-900
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:shadow-md
                  prose-blockquote:border-emerald-500
                  prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-500 uppercase mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to Blog CTA */}
              <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                <Link href="/blog">
                  <Button variant="outline" size="lg" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <ArrowLeft size={16} className="mr-2" /> Back to All Articles
                  </Button>
                </Link>
              </div>
            </article>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
