'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CheckCircle, X, ChevronRight } from 'lucide-react'
import { useCompare } from '@/hooks/useCompare'

const FIELDS = [
  { key: 'price', label: 'Price' },
  { key: 'category_name', label: 'Category' },
  { key: 'brand', label: 'Brand' },
  { key: 'weight_grams', label: 'Weight', format: (v: any) => v ? `${v}g` : '—' },
  { key: 'fssai_number', label: 'FSSAI' },
  { key: 'is_returnable', label: 'Returnable', format: (v: any) => v === false ? 'No' : 'Yes' },
  { key: 'averagerating', label: 'Rating', format: (v: any) => v ? `${Number(v).toFixed(1)} ★` : '—' },
  { key: 'reviewcount', label: 'Reviews' },
  { key: 'ingredients', label: 'Ingredients', multiline: true },
  { key: 'benefits', label: 'Benefits', multiline: true },
  { key: 'usage_instructions', label: 'Usage', multiline: true },
  { key: 'storage_instructions', label: 'Storage', multiline: true },
  { key: 'warnings', label: 'Warnings', multiline: true },
]

function ComparePageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { clear } = useCompare()
  const ids = (params.get('ids') || '').split(',').filter(Boolean)

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ids.length) { setLoading(false); return }
    Promise.all(ids.map(id => axios.get(`/shop/public/${id}`).then(r => r.data?.data).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [params.get('ids')])

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #d1fae5', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!products.length) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>No products to compare</p>
        <Link href="/products" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Browse Products →</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 80px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Product Comparison</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { clear(); router.push('/products') }}
            style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
          >
            Clear & Go Back
          </button>
          <Link href="/products" style={{ fontSize: 13, fontWeight: 600, color: 'white', background: '#10b981', borderRadius: 8, padding: '8px 14px', textDecoration: 'none' }}>
            Add More Products
          </Link>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          {/* Product header row */}
          <thead>
            <tr>
              <th style={{ width: 160, textAlign: 'left', padding: '12px 16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Feature
              </th>
              {products.map(p => (
                <th key={p.id} style={{ textAlign: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={p.images?.[0] || '/placeholder.png'}
                        alt={p.name}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }}
                      />
                    </div>
                    <Link href={`/product/${p.id}`} style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textDecoration: 'none', textAlign: 'center', lineHeight: 1.3 }}>
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {FIELDS.map((field, fi) => {
              const values = products.map(p => p[field.key])
              const allSame = values.every(v => v === values[0])
              return (
                <tr key={field.key} style={{ background: fi % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>
                    {field.label}
                  </td>
                  {products.map((p, pi) => {
                    const raw = p[field.key]
                    const display = field.format ? field.format(raw) : (raw || '—')
                    const isPrice = field.key === 'price'
                    const isBest = isPrice
                      ? values.every(v => !v || Number(raw) <= Number(v))
                      : false
                    return (
                      <td key={pi} style={{ padding: '12px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', textAlign: 'center', verticalAlign: 'top' }}>
                        <span style={{
                          fontWeight: (isBest || (!allSame && raw)) ? 700 : 400,
                          color: isBest ? '#059669' : allSame ? '#9ca3af' : '#374151',
                          fontSize: field.multiline ? 12 : 13,
                          textAlign: 'left',
                          display: 'block',
                          lineHeight: field.multiline ? 1.5 : 'inherit',
                          whiteSpace: field.multiline ? 'pre-line' : 'normal',
                        }}>
                          {isPrice ? (raw != null ? `₹${Number(raw).toLocaleString('en-IN')}` : '—') : display || '—'}
                          {isBest && <span style={{ marginLeft: 4, fontSize: 10, background: '#d1fae5', color: '#065f46', borderRadius: 4, padding: '1px 5px' }}>BEST</span>}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add to cart row */}
      <div style={{ display: 'grid', gridTemplateColumns: `160px repeat(${products.length}, 1fr)`, gap: 0, marginTop: 16 }}>
        <div />
        {products.map(p => (
          <div key={p.id} style={{ padding: '0 16px', display: 'flex', justifyContent: 'center' }}>
            <Link
              href={`/product/${p.id}`}
              style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #047857, #10b981)', borderRadius: 10, padding: '10px 0', textDecoration: 'none' }}
            >
              View Product
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading…</div>}>
        <ComparePageInner />
      </Suspense>
      <Footer />
    </>
  )
}
