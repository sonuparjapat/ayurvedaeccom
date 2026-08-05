import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Oroganix customer support. Email us, call us, or use our contact form for product queries, order help, returns, or any concerns.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact Oroganix',
    description: 'Reach our customer support for product queries, order help, or any concerns. Available Monday to Saturday, 9 AM to 6 PM.',
    type: 'website',
    url: `${SITE_URL}/contact`,
    siteName: 'Oroganix',
    images: [{ url: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png', width: 1536, height: 1024, alt: 'Oroganix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Oroganix',
    description: 'Reach our customer support for product queries, order help, or any concerns.',
    images: ['https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'],
  },
}

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  url: `${SITE_URL}/contact`,
  name: 'Contact Oroganix',
  description: 'Contact page for Oroganix customer support',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      {children}
    </>
  )
}
