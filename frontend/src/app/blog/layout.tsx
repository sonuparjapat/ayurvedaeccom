import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Ayurveda & Wellness Blog',
  description: 'Explore Ayurvedic health tips, herb guides, and wellness articles from Oroganix experts. Learn about the benefits of organic herbs, traditional Ayurvedic remedies, and healthy living.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Ayurveda & Wellness Blog | Oroganix',
    description: 'Explore Ayurvedic health tips, herb guides, and wellness articles from Oroganix experts.',
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: 'Oroganix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayurveda & Wellness Blog | Oroganix',
    description: 'Health tips, herb guides, and wellness articles from Oroganix experts.',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
  ],
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
