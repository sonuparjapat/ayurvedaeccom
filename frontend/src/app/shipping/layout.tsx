import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Shipping Policy - Delivery Information',
  description: 'Learn about Oroganix shipping and delivery: free delivery above ₹499, standard 3-5 day delivery, express options for major cities, and real-time order tracking.',
  alternates: { canonical: `${SITE_URL}/shipping` },
  openGraph: {
    title: 'Shipping Policy | Oroganix',
    description: 'Free delivery above ₹499. Standard 3-5 days, express 1-2 days in major cities, real-time tracking.',
    type: 'website',
    url: `${SITE_URL}/shipping`,
    siteName: 'Oroganix',
  },
}

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
