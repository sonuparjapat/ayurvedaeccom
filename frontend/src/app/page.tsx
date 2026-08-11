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
import { RecentlyViewedSection } from '@/components/sections/recently-viewed-section'
import { BlogPreviewSection } from '@/components/sections/blog-preview-section'
import Link from 'next/link'

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
              email: 'support@oroganix.com',
            },
            sameAs: [
              'https://www.instagram.com/oroganix',
              'https://www.facebook.com/oroganix',
            ],
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
      {/* LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'OnlineStore',
            name: 'Oroganix',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com',
            logo: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png',
            image: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png',
            description: 'Premium Ayurvedic herbs, organic supplements, natural wellness products. 100% organic, FSSAI certified, lab-tested, farm-direct. Free delivery above ₹499.',
            priceRange: '₹₹',
            currenciesAccepted: 'INR',
            paymentAccepted: 'Credit Card, Debit Card, UPI, Cash on Delivery',
            email: 'support@oroganix.com',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Ayurvedic & Organic Products',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Ayurvedic Herbs' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Organic Supplements' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Natural Dry Fruits' } },
              ],
            },
            sameAs: [
              'https://www.instagram.com/oroganix',
              'https://www.facebook.com/oroganix',
            ],
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
        <RecentlyViewedSection />
        <BlogPreviewSection />

        {/* DOSHA QUIZ ENTRY */}
        <section className="py-12 px-4 bg-linear-to-r from-emerald-800 to-teal-700">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div>
              <div className="text-3xl mb-2">🌿 Discover Your Dosha</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">What&apos;s Your Ayurvedic Body Type?</h2>
              <p className="text-emerald-200 max-w-md">Take our free 2-minute quiz to find your Prakriti (Vata, Pitta, or Kapha) and get personalized product recommendations.</p>
            </div>
            <Link
              href="/dosha-quiz"
              className="shrink-0 px-8 py-4 bg-white text-emerald-800 font-bold text-lg rounded-2xl shadow-lg hover:bg-emerald-50 transition-all hover:scale-105"
            >
              Take the Quiz →
            </Link>
          </div>
        </section>
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
