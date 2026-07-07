import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const res = await fetch(`${API}/categories/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Category | Oroganix' }
    const json = await res.json()
    const cat = json?.data || json?.category || json

    const name = cat?.name || slug
    const title = `${name} - Buy ${name} Online | Oroganix`
    const description = cat?.description || `Shop premium ${name} products at Oroganix. 100% organic, lab-tested, farm-direct Ayurvedic products. Free delivery above ₹499.`
    const image = cat?.image

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/category/${slug}` },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${SITE_URL}/category/${slug}`,
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: name }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image && { images: [image] }),
      },
    }
  } catch {
    return { title: 'Category | Oroganix' }
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
