import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const res = await fetch(`${API}/shop/public/${id}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Product | AyurVeda Desi Foods' }
    const json = await res.json()
    const p = json?.data
    if (!p) return { title: 'Product | AyurVeda Desi Foods' }

    const desc = (p.shortdescription || p.longdescription || '').slice(0, 155)
    const image = p.images?.[0] || null

    return {
      title: `${p.name} | AyurVeda Desi Foods`,
      description: desc,
      openGraph: {
        title: p.name,
        description: desc,
        type: 'website',
        ...(image && { images: [{ url: image, width: 800, height: 800, alt: p.name }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: p.name,
        description: desc,
        ...(image && { images: [image] }),
      },
    }
  } catch {
    return { title: 'Product | AyurVeda Desi Foods' }
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
