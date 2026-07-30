import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'
const OG_IMAGE = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

export const metadata: Metadata = {
  title: 'Dosha Quiz - Discover Your Ayurvedic Body Type',
  description: 'Take our free 2-minute Dosha quiz to discover your Prakriti (Vata, Pitta, or Kapha). Get personalized Ayurvedic product recommendations tailored to your body type.',
  alternates: { canonical: `${SITE_URL}/dosha-quiz` },
  openGraph: {
    title: 'Dosha Quiz - Find Your Ayurvedic Body Type | Oroganix',
    description: 'Discover your Prakriti — Vata, Pitta, or Kapha — with our free 2-minute quiz. Get personalized Ayurvedic recommendations.',
    type: 'website',
    url: `${SITE_URL}/dosha-quiz`,
    siteName: 'Oroganix',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Dosha Quiz - Oroganix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Your Dosha | Oroganix',
    description: 'Free Ayurvedic body-type quiz. Find your Prakriti and get personalised wellness recommendations.',
    images: [OG_IMAGE],
  },
}

export default function DoshaQuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
