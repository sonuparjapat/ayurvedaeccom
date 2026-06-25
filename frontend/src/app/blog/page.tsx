'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  User,
  Clock,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
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

      // extract unique categories for filter pills
      if (!category && page === 1) {
        const cats = [...new Set((res.data.data || []).map((p: BlogPost) => p.category).filter(Boolean))] as string[]
        setCategories(prev => {
          const merged = [...new Set([...prev, ...cats])]
          return merged.length > prev.length ? merged : prev
        })
      }
    } catch {
      setPosts([])
    }
    finally { setLoading(false) }
  }, [page, search, category])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="bg-emerald-100 text-emerald-800 mb-6">
                Ayurveda & Wellness Blog
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Discover the
                <span className="text-emerald-600"> Wisdom of Ayurveda</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Expert insights, traditional remedies, and modern wellness tips to help you live your healthiest life.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="max-w-xl mx-auto">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-11 pr-24 py-3 rounded-full border border-gray-200 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-sm"
                    placeholder="Search articles..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-emerald-700 transition">
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                <button
                  onClick={() => { setCategory(''); setPage(1) }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${!category ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'}`}
                >
                  All
                </button>
                {categories.map(c => (
                  <button key={c}
                    onClick={() => { setCategory(c); setPage(1) }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${category === c ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
                Loading articles...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No articles found</p>
                <p className="text-sm mt-1">Try a different search or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    {/* Cover Image */}
                    <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
                          <BookOpen size={40} className="text-emerald-300" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5">
                      {/* Category Badge */}
                      <Badge className="bg-emerald-100 text-emerald-800 mb-3">
                        {post.category}
                      </Badge>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.published_at)}
                          </span>
                        </div>

                        <Link href={`/blog/${post.slug}`}>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 p-0 h-auto">
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-emerald-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Wellness Journey?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Explore our premium Ayurvedic products and experience the healing power of nature.
            </p>
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100" asChild>
              <Link href="/products">
                Shop Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
