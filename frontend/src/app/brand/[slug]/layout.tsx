import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const res = await fetch(`${API}/brands/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Shop by Brand | Oroganix' }
    const json = await res.json()
    const brand = json?.data || json

    const name = brand?.name || slug.replace(/-/g, ' ')
    const title = `${name} - Authentic Organic Products`
    const description = brand?.description || `Shop genuine ${name} products at Oroganix. 100% organic, FSSAI certified, lab-tested Ayurvedic products. Free delivery above ₹499.`
    const image = brand?.logo_url || null

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/brand/${slug}` },
      openGraph: {
        title: `${title} | Oroganix`,
        description,
        type: 'website',
        url: `${SITE_URL}/brand/${slug}`,
        siteName: 'Oroganix',
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: name }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Oroganix`,
        description,
        ...(image && { images: [image] }),
      },
    }
  } catch {
    return { title: 'Shop by Brand | Oroganix' }
  }
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
