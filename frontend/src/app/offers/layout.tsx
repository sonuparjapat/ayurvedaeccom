import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Offers & Bundles - Best Deals on Ayurvedic Products',
  description: 'Shop the best deals on premium Ayurvedic products. Explore our curated bundles, flash sales, and exclusive offers on organic herbs, supplements, and wellness products.',
  alternates: { canonical: `${SITE_URL}/offers` },
  openGraph: {
    title: 'Offers & Bundles | Oroganix',
    description: 'Best deals on premium Ayurvedic products. Curated bundles, flash sales, and exclusive offers.',
    type: 'website',
    url: `${SITE_URL}/offers`,
  },
}

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
