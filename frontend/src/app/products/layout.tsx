import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Shop Ayurvedic & Organic Products',
  description: 'Browse our full range of premium Ayurvedic herbs, organic supplements, dry fruits, and natural wellness products. 100% organic, lab-tested, farm-direct. Free delivery above ₹499.',
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    title: 'Shop Ayurvedic & Organic Products | Oroganix',
    description: 'Browse our full range of premium Ayurvedic herbs, organic supplements, and natural wellness products.',
    type: 'website',
    url: `${SITE_URL}/products`,
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
