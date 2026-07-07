import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const res = await fetch(`${API}/blog/public/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Blog | Oroganix' }
    const json = await res.json()
    // page.tsx reads res.data.data — fetch returns the raw JSON so it's json.data
    const post = json?.data || json?.post || json

    const title = post?.meta_title || post?.title || 'Blog'
    const description = (post?.meta_description || post?.excerpt || (post?.content || '').replace(/<[^>]+>/g, '').slice(0, 155)).trim()
    const image = post?.cover_image || null
    const canonical = `${SITE_URL}/blog/${slug}`

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title: `${title} | Oroganix`,
        description,
        type: 'article',
        url: canonical,
        siteName: 'Oroganix',
        publishedTime: post?.published_at,
        modifiedTime: post?.updated_at || post?.published_at,
        authors: post?.author_name ? [`${SITE_URL}/blog`] : undefined,
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Oroganix`,
        description,
        ...(image && { images: [image] }),
      },
    }
  } catch {
    return { title: 'Blog | Oroganix' }
  }
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
