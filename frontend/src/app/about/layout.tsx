import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'About Us - Our Story & Mission',
  description: 'Learn about Oroganix — our commitment to bringing you authentic, lab-tested Ayurvedic herbs and organic products sourced directly from certified farms across India.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Oroganix - Our Story & Mission',
    description: 'We bring you authentic, lab-tested Ayurvedic herbs and organic wellness products sourced directly from certified Indian farms.',
    type: 'website',
    url: `${SITE_URL}/about`,
    siteName: 'Oroganix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Oroganix - Our Story & Mission',
    description: 'Authentic, lab-tested Ayurvedic herbs and organic products sourced directly from certified Indian farms.',
  },
}

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Oroganix',
  url: SITE_URL,
  logo: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png',
  description: 'Premium Ayurvedic herbs, organic supplements, dry fruits, and natural wellness products. 100% organic, lab-tested, farm-direct.',
  foundingDate: '2023',
  areaServed: 'India',
  knowsAbout: ['Ayurveda', 'Organic Herbs', 'Natural Wellness', 'Herbal Supplements'],
  sameAs: [
    'https://www.instagram.com/oroganix',
    'https://www.facebook.com/oroganix',
  ],
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {children}
    </>
  )
}
