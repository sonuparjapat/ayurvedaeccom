import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Oroganix. Reach our customer support team for product queries, order help, or any concerns about your Ayurvedic wellness journey.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact Oroganix',
    description: 'Reach our customer support team for product queries, order help, or any concerns.',
    type: 'website',
    url: `${SITE_URL}/contact`,
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
