import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'About Oroganix - Our Story & Mission',
  description: 'Learn about Oroganix — our commitment to bringing you authentic, lab-tested Ayurvedic herbs and organic products sourced directly from farms across India.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Oroganix - Our Story & Mission',
    description: 'Learn about our commitment to authentic, lab-tested Ayurvedic herbs and organic products sourced directly from Indian farms.',
    type: 'website',
    url: `${SITE_URL}/about`,
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
