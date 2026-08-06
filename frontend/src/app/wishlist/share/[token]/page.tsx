'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Heart, ShoppingCart, ArrowLeft, Share2, Package } from 'lucide-react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/auth-context'

const getImage = (images: any): string => {
  try {
    if (Array.isArray(images)) return images[0] || '/placeholder-product.jpg'
    return JSON.parse(images || '[]')[0] || '/placeholder-product.jpg'
  } catch {
    return '/placeholder-product.jpg'
  }
}

const formatPrice = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

export default function SharedWishlistPage() {
  const { token } = useParams<{ token: string }>()
  const { fetchCart, loginuserdata } = useAuth()
  const [data, setData] = useState<{ owner_name: string; products: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)

  useEffect(() => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(token)) { setError('Invalid share link'); setLoading(false); return }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shop/wishlist/share/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d)
        else setError(d.message || 'Wishlist not found')
      })
      .catch(() => setError('Failed to load wishlist'))
      .finally(() => setLoading(false))
  }, [token])

  const addToCart = async (productId: number) => {
    if (!loginuserdata) { toast.error('Please login to add to cart'); return }
    setAddingId(productId)
    try {
      await axios.post('/cart', { productId, quantity: 1 })
      toast.success('Added to cart!')
      fetchCart(loginuserdata.id)
    } catch {
      toast.error('Add to cart failed')
    } finally {
      setAddingId(null)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #fdfaf6)' }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>Loading wishlist…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Heart size={48} style={{ color: '#e5e7eb', marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>{error}</p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>This wishlist is no longer available</p>
            <Link href="/" style={{ color: 'var(--sage, #3d7a5a)', fontWeight: 600, fontSize: 14 }}>Browse Products →</Link>
          </div>
        ) : data ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', marginBottom: 12, textDecoration: 'none' }}>
                  <ArrowLeft size={14} /> Back to Shop
                </Link>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>
                  <Heart size={22} style={{ color: '#ef4444', display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  {data.owner_name}&apos;s Wishlist
                </h1>
                <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
                  {data.products.length} {data.products.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
              <button
                onClick={copyLink}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
              >
                <Share2 size={14} /> Copy Link
              </button>
            </div>

            {/* Products */}
            {data.products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <Package size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p>This wishlist is empty.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                {data.products.map((p: any) => {
                  const img = getImage(p.images)
                  const inStock = Number(p.inventory) > 0
                  return (
                    <div key={p.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                      <Link href={`/product/${p.slug || p.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#f9fafb' }}>
                          <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg' }} />
                          {!inStock && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ background: 'white', color: '#374151', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>Out of Stock</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Link href={`/product/${p.slug || p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{formatPrice(Number(p.price))}</span>
                          {p.mrp && Number(p.mrp) > Number(p.price) && (
                            <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(Number(p.mrp))}</span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(p.id)}
                          disabled={!inStock || addingId === p.id}
                          style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', background: inStock ? 'var(--sage, #3d7a5a)' : '#e5e7eb', color: inStock ? 'white' : '#9ca3af', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: inStock ? 'pointer' : 'not-allowed' }}
                        >
                          <ShoppingCart size={14} />
                          {addingId === p.id ? 'Adding…' : inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
