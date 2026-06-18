'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

function SearchContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(params.get('q') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  const popularSearches = ['Ashwagandha', 'Triphala', 'Giloy', 'Chyawanprash', 'Tulsi', 'Amla', 'Neem', 'Turmeric']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-24 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Search Products</h1>
        <p className="text-gray-500 text-center mb-8">Find Ayurvedic herbs, supplements & wellness products</p>

        <form onSubmit={handleSearch} className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white shadow-sm"
            placeholder="Search for products, herbs, brands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setQuery('')}>
              <X size={18} />
            </button>
          )}
        </form>

        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map(term => (
              <button
                key={term}
                onClick={() => router.push(`/products?q=${encodeURIComponent(term)}`)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-xs"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm mb-3">Or browse all products</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            View All Products
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>}>
      <SearchContent />
    </Suspense>
  )
}
