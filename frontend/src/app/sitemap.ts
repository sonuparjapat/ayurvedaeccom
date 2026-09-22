import type { MetadataRoute } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.oroganix.com/api'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/cart`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE}/wishlist`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE}/account`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Dynamic product pages
  const productData = await fetchJSON<{ products?: { id: number; updated_at?: string }[]; data?: { id: number; updated_at?: string }[] }>('/products?limit=500')
  const products = productData?.products || productData?.data || []
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/product/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Dynamic blog pages
  const blogData = await fetchJSON<{ blogs?: { slug?: string; id: number; updated_at?: string }[] }>('/blogs?limit=200')
  const blogs = blogData?.blogs || []
  const blogRoutes: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${SITE}/blog/${b.slug || b.id}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...blogRoutes]
}
