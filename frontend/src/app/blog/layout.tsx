import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'
const OG_IMAGE = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

export const metadata: Metadata = {
  title: 'Oroganix Wellness Blog',
  description: 'Explore health tips, herb guides, and wellness articles from Oroganix experts. Learn about the benefits of organic herbs, Ayurvedic remedies, and healthy living.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Oroganix Wellness Blog',
    description: 'Explore Ayurvedic health tips, herb guides, and wellness articles from Oroganix experts.',
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: 'Oroganix',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Oroganix Wellness Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oroganix Wellness Blog',
    description: 'Health tips, herb guides, and wellness articles from Oroganix experts.',
    images: [OG_IMAGE],
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
