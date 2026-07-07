import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Ayurveda & Wellness Blog',
  description: 'Explore Ayurvedic health tips, herb guides, and wellness articles written by our experts. Learn about the benefits of organic herbs and natural remedies.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Ayurveda & Wellness Blog | Oroganix',
    description: 'Explore Ayurvedic health tips, herb guides, and wellness articles from Oroganix experts.',
    type: 'website',
    url: `${SITE_URL}/blog`,
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
