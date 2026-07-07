import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about Oroganix — shipping, returns, product quality, certifications, subscriptions, and more.',
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: 'FAQ - Oroganix',
    description: 'Answers to common questions about shipping, returns, product quality, and more at Oroganix.',
    type: 'website',
    url: `${SITE_URL}/faq`,
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
