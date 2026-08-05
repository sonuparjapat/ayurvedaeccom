import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Oroganix Privacy Policy to understand how we collect, use, and protect your personal information when you shop with us.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy | Oroganix',
    description: 'How we collect, use, and protect your personal information at Oroganix.',
    type: 'website',
    url: `${SITE_URL}/privacy`,
    siteName: 'Oroganix',
    images: [{ url: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png', width: 1536, height: 1024, alt: 'Oroganix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Oroganix',
    description: 'How we collect, use, and protect your personal information at Oroganix.',
    images: ['https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'],
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
