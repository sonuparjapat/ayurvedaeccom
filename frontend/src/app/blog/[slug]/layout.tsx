import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const res = await fetch(`${API}/blog/public/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return { title: 'Blog | Oroganix' }
    const json = await res.json()
    const post = json?.post || json?.data || json

    const title = post?.meta_title || post?.title
    const description = post?.meta_description || post?.excerpt || (post?.content || '').replace(/<[^>]+>/g, '').slice(0, 155)
    const image = post?.cover_image

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/blog/${slug}` },
      openGraph: {
        title,
        description,
        type: 'article',
        url: `${SITE_URL}/blog/${slug}`,
        publishedTime: post?.published_at,
        modifiedTime: post?.updated_at,
        authors: post?.author_name ? [post.author_name] : undefined,
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
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
