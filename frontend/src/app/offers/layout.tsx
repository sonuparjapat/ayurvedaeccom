import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Offers & Bundles - Best Deals on Ayurvedic Products',
  description: 'Shop the best deals on premium Ayurvedic products at Oroganix. Explore curated wellness bundles, flash sales, and exclusive offers on organic herbs and supplements.',
  alternates: { canonical: `${SITE_URL}/offers` },
  openGraph: {
    title: 'Offers & Bundles | Oroganix',
    description: 'Best deals on premium Ayurvedic products. Curated wellness bundles, flash sales, and exclusive offers on organic herbs and supplements.',
    type: 'website',
    url: `${SITE_URL}/offers`,
    siteName: 'Oroganix',
    images: [{ url: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png', width: 1536, height: 1024, alt: 'Oroganix Offers & Bundles' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Offers & Bundles | Oroganix',
    description: 'Best deals on premium Ayurvedic products. Wellness bundles, flash sales, and exclusive offers.',
    images: ['https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'],
  },
}

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
