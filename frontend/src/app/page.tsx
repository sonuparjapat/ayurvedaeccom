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
