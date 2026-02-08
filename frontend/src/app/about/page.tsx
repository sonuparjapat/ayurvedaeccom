'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Carousel, CarouselItem } from '@/components/ui/carousel/carousel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Leaf, 
  Heart, 
  Award, 
  Users, 
  Globe, 
  Shield,
  CheckCircle,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter,
  Youtube
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AboutPage() {
  const values = [
    {
      icon: Leaf,
      title: "100% Natural",
      description: "All our products are sourced directly from farms without any preservatives or additives."
    },
    {
      icon: Heart,
      title: "Ayurvedic Wisdom",
      description: "Ancient Indian wellness traditions combined with modern quality standards."
    },
    {
      icon: Shield,
      title: "Quality Assured",
      description: "Rigorous testing and certification ensures only the best reaches our customers."
    },
    {
      icon: Globe,
      title: "Sustainable",
      description: "Environmentally friendly practices that support local farmers and communities."
    }
  ]

  const milestones = [
    { year: "2018", title: "Our Journey Begins", description: "Started with a small farm in Kerala" },
    { year: "2019", title: "First Product Launch", description: "Introduced our premium turmeric powder" },
    { year: "2020", title: "Expanded Nationwide", description: "Began shipping across India" },
    { year: "2021", title: "100+ Products", description: "Expanded our product range significantly" },
    { year: "2022", title: "10K+ Customers", description: "Reached a major milestone" },
    { year: "2024", title: "Digital Launch", description: "Launched our premium online store" }
  ]

  const team = [
    {
      name: "Dr. Rajesh Sharma",
      role: "Founder & CEO",
      image: "👨‍⚕️",
      description: "Ayurvedic practitioner with 20+ years of experience in traditional medicine."
    },
    {
      name: "Priya Nair",
      role: "Head of Operations",
      image: "👩‍💼",
      description: "Expert in supply chain management and sustainable sourcing."
    },
    {
      name: "Amit Kumar",
      role: "Head of Quality",
      image: "👨‍🔬",
      description: "Food scientist ensuring highest quality standards for all products."
    },
    {
      name: "Sneha Patel",
      role: "Customer Experience",
      image: "👩‍💻",
      description: "Dedicated to making wellness accessible to everyone."
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="bg-emerald-100 text-emerald-800 mb-6">
                🌿 Our Story
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Bringing Ancient
                <span className="text-emerald-600"> Ayurvedic Wisdom</span>
                <br />
                to Modern Wellness
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Founded in 2018, AyurVeda Desi Foods is on a mission to make authentic 
                Ayurvedic and traditional Indian products accessible to everyone. We bridge 
                the gap between ancient wisdom and modern lifestyle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href="/products">
                    Explore Our Products
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Image Carousel */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <Carousel autoSlide autoSlideInterval={4000} className="h-96 rounded-2xl overflow-hidden">
              <CarouselItem>
                <div className="h-96 bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl mb-4">🌾</div>
                    <h3 className="text-2xl font-bold mb-2">Sourced from Indian Farms</h3>
                    <p className="text-lg">Direct partnerships with local farmers across India</p>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="h-96 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl mb-4">🌿</div>
                    <h3 className="text-2xl font-bold mb-2">Authentic Ayurvedic Herbs</h3>
                    <p className="text-lg">Traditional knowledge meets modern quality standards</p>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="h-96 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl mb-4">🥜</div>
                    <h3 className="text-2xl font-bold mb-2">Premium Dry Fruits</h3>
                    <p className="text-lg">Handpicked and processed with care</p>
                  </div>
                </div>
              </CarouselItem>
            </Carousel>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do, from sourcing to delivery
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-600">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Journey Timeline */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Journey
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From a small farm to a nationwide wellness movement
              </p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-emerald-200"></div>
              
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                      <div className="bg-white p-6 rounded-lg shadow-lg">
                        <Badge className="bg-emerald-100 text-emerald-800 mb-2">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-emerald-600 rounded-full border-4 border-white"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The passionate individuals behind AyurVeda Desi Foods
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-6xl mb-4">{member.image}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {member.name}
                      </h3>
                      <p className="text-emerald-600 font-medium mb-3">
                        {member.role}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {member.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-emerald-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Join Our Wellness Community
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Be part of a movement that's bringing authentic Ayurvedic wellness to modern India. 
              Follow us on social media and stay updated with our latest products and wellness tips.
            </p>
            
            <div className="flex justify-center gap-4 mb-8">
              <Button variant="secondary" size="sm" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Facebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>
              <Button variant="secondary" size="sm" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Instagram className="w-5 h-5 mr-2" />
                Instagram
              </Button>
              <Button variant="secondary" size="sm" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Twitter className="w-5 h-5 mr-2" />
                Twitter
              </Button>
              <Button variant="secondary" size="sm" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Youtube className="w-5 h-5 mr-2" />
                YouTube
              </Button>
            </div>

            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100" asChild>
              <Link href="/products">
                Start Your Wellness Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}