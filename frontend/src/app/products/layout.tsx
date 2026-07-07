import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Shop Ayurvedic & Organic Products',
  description: 'Browse our full range of premium Ayurvedic herbs, organic supplements, dry fruits, and natural wellness products. 100% organic, lab-tested, farm-direct. Free delivery above ₹499.',
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    title: 'Shop All Ayurvedic & Organic Products | Oroganix',
    description: 'Premium Ayurvedic herbs, organic supplements, and natural wellness products. Lab-tested, farm-direct. Free delivery above ₹499.',
    type: 'website',
    url: `${SITE_URL}/products`,
    siteName: 'Oroganix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop All Products | Oroganix',
    description: 'Premium Ayurvedic herbs, organic supplements, and natural wellness products.',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
  ],
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
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
