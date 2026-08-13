'use client'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript:[^\s"'>]*/gi, '')
}

export default function ShippingPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/company').then(r => {
      const data = r.data?.data?.[0] || r.data?.data || {}
      setContent(data.shipping_policy || '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : content ? (
            <div className="bg-white rounded-2xl border p-8 prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
          ) : (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <p className="text-gray-500">Shipping Policy coming soon.</p>
              <p className="text-sm text-gray-400 mt-2">Contact us at support@oroganix.com for shipping inquiries.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
