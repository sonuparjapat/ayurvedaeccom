import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the Oroganix Terms and Conditions governing the use of our website and the purchase of our Ayurvedic and organic products.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Terms & Conditions | Oroganix',
    description: 'Terms and conditions governing the use of Oroganix website and purchase of our products.',
    type: 'website',
    url: `${SITE_URL}/terms`,
    siteName: 'Oroganix',
    images: [{ url: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png', width: 1536, height: 1024, alt: 'Oroganix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions | Oroganix',
    description: 'Terms and conditions for use of Oroganix website and products.',
    images: ['https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'],
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
