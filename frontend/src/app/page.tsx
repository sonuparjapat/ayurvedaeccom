import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero-section'
import { BannerCarousel } from '@/components/sections/banner-carousel'
import { OfferStrip } from '@/components/sections/offer-strip'
import { FeaturesSection } from '@/components/sections/features-section'
import { CategoriesSection } from '@/components/sections/categories-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { FlashSaleBanner } from '@/components/sections/flash-sale-banner'
import { FeaturedProductsSection } from '@/components/sections/featured-products-section'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Oroganix',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com',
            logo: process.env.NEXT_PUBLIC_LOGO_URL || 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png',
            description: 'Premium Ayurvedic herbs, organic supplements, and natural wellness products',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              availableLanguage: 'English',
            },
            sameAs: [],
          }),
        }}
      />
      {/* WebSite JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Oroganix',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <OfferStrip />
        <FlashSaleBanner />
        <BannerCarousel />
        <CategoriesSection />
        <FeaturedProductsSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
