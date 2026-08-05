import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Returns & Refund Policy',
  description: 'Oroganix offers a hassle-free 30-day return policy on unopened products. Learn how to initiate a return and get a full refund within 5-7 business days.',
  alternates: { canonical: `${SITE_URL}/returns` },
  openGraph: {
    title: 'Returns & Refund Policy | Oroganix',
    description: 'Hassle-free 30-day returns on unopened products. Full refund processed within 5-7 business days.',
    type: 'website',
    url: `${SITE_URL}/returns`,
    siteName: 'Oroganix',
    images: [{ url: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png', width: 1536, height: 1024, alt: 'Oroganix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Returns & Refund Policy | Oroganix',
    description: 'Hassle-free 30-day returns on unopened products. Full refund in 5-7 business days.',
    images: ['https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'],
  },
}

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
