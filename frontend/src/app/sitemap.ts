import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

async function fetchJSON(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    return await res.json()
  } catch { return {} }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [prodData, catData, blogData] = await Promise.all([
    fetchJSON(`${API}/shop/public?limit=1000&page=1`),
    fetchJSON(`${API}/categories`),
    fetchJSON(`${API}/blog/public?limit=500`),
  ])

  const products = prodData.products || []
  const categories = catData.data?.rows || catData.categories || []
  const blogs = blogData.posts || blogData.data || []

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/products`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/offers`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/blog`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shipping`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/returns`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
    url: `${BASE_URL}/product/${p.slug || p.id}`,
    lastModified: new Date(p.updated_at || p.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
    url: `${BASE_URL}/category/${c.slug || c.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((b: any) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: new Date(b.published_at || b.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes]
}
