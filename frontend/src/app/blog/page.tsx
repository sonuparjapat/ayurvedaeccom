'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Carousel, CarouselItem } from '@/components/ui/carousel/carousel'
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowRight,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const blogPosts = [
  {
    id: 1,
    title: "The Ancient Wisdom of Ayurveda in Modern Life",
    slug: "ancient-wisdom-ayurveda-modern-life",
    excerpt: "Discover how 5000-year-old Ayurvedic principles can transform your modern lifestyle and bring balance to your daily routine.",
    content: "Ayurveda, the ancient Indian system of medicine, offers timeless wisdom for modern living...",
    author: "Dr. Rajesh Sharma",
    date: "2024-01-15",
    readTime: "5 min read",
    category: "Ayurvedic Wisdom",
    image: "🌿",
    featured: true,
    tags: ["Ayurveda", "Wellness", "Lifestyle"]
  },
  {
    id: 2,
    title: "Top 10 Ayurvedic Herbs for Immunity Boost",
    slug: "top-10-ayurvedic-herbs-immunity",
    excerpt: "Strengthen your immune system naturally with these powerful Ayurvedic herbs that have been used for centuries.",
    content: "In today's fast-paced world, maintaining strong immunity is more important than ever...",
    author: "Priya Nair",
    date: "2024-01-12",
    readTime: "7 min read",
    category: "Herbal Remedies",
    image: "🌱",
    featured: true,
    tags: ["Immunity", "Herbs", "Health"]
  },
  {
    id: 3,
    title: "The Science Behind Turmeric: Golden Spice of Life",
    slug: "science-behind-turmeric-golden-spice",
    excerpt: "Explore the scientific evidence behind turmeric's health benefits and why it's considered a superfood in Ayurveda.",
    content: "Turmeric, often called the 'golden spice of life', has been revered in Ayurvedic medicine...",
    author: "Dr. Amit Kumar",
    date: "2024-01-10",
    readTime: "6 min read",
    category: "Ingredient Spotlight",
    image: "🟡",
    featured: false,
    tags: ["Turmeric", "Science", "Superfood"]
  },
  {
    id: 4,
    title: "Dry Fruits: Nature's Energy Boosters",
    slug: "dry-fruits-nature-energy-boosters",
    excerpt: "Learn how incorporating dry fruits into your diet can provide sustained energy and numerous health benefits.",
    content: "Dry fruits have been a staple in Indian diets for centuries, offering concentrated nutrition...",
    author: "Sneha Patel",
    date: "2024-01-08",
    readTime: "4 min read",
    category: "Nutrition",
    image: "��",
    featured: false,
    tags: ["Dry Fruits", "Energy", "Nutrition"]
  },
  {
    id: 5,
    title: "Understanding Doshas: Your Unique Body Type",
    slug: "understanding-doshas-body-type",
    excerpt: "Discover your Ayurvedic body type (dosha) and how to balance it for optimal health and wellness.",
    content: "According to Ayurveda, each person has a unique constitution called 'dosha'...",
    author: "Dr. Rajesh Sharma",
    date: "2024-01-05",
    readTime: "8 min read",
    category: "Ayurvedic Wisdom",
    image: "⚖️",
    featured: false,
    tags: ["Doshas", "Body Type", "Wellness"]
  },
  {
    id: 6,
    title: "Tofu: The Plant-Based Protein Powerhouse",
    slug: "tofu-plant-based-protein-powerhouse",
    excerpt: "Discover why tofu is becoming increasingly popular in Indian diets and its numerous health benefits.",
    content: "Tofu, also known as soya paneer, is an excellent source of plant-based protein...",
    author: "Priya Nair",
    date: "2024-01-03",
    readTime: "5 min read",
    category: "Plant-Based Nutrition",
    image: "🧈",
    featured: false,
    tags: ["Tofu", "Protein", "Plant-Based"]
  }
]

const categories = [
  { name: "Ayurvedic Wisdom", count: 2 },
  { name: "Herbal Remedies", count: 1 },
  { name: "Ingredient Spotlight", count: 1 },
  { name: "Nutrition", count: 1 },
  { name: "Plant-Based Nutrition", count: 1 }
]

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured)
  const recentPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="bg-emerald-100 text-emerald-800 mb-6">
                📝 Ayurveda & Wellness Blog
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Discover the
                <span className="text-emerald-600"> Wisdom of Ayurveda</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Expert insights, traditional remedies, and modern wellness tips to help you live your healthiest life.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Posts Carousel */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Featured Articles
            </h2>
            
            <Carousel autoSlide autoSlideInterval={5000} className="h-96 rounded-2xl overflow-hidden">
              {featuredPosts.map((post) => (
                <CarouselItem key={post.id}>
                  <div className="h-96 bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                    <div className="text-center text-white p-8 max-w-2xl mx-auto">
                      <div className="text-6xl mb-4">{post.image}</div>
                      <Badge className="bg-white/20 text-white mb-4">
                        {post.category}
                      </Badge>
                      <h3 className="text-2xl font-bold mb-4">{post.title}</h3>
                      <p className="text-lg mb-6 opacity-90">{post.excerpt}</p>
                      <div className="flex items-center justify-center gap-4 text-sm opacity-75">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </Carousel>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>

                <div className="space-y-8">
                  {blogPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-4xl">
                              {post.image}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{post.category}</Badge>
                                {post.featured && (
                                  <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
                                )}
                              </div>
                              
                              <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-emerald-600 transition-colors">
                                <Link href={`/blog/${post.slug}`}>
                                  {post.title}
                                </Link>
                              </h3>
                              
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {post.excerpt}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {post.author}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(post.date).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {post.readTime}
                                  </span>
                                </div>
                                
                                <Link href={`/blog/${post.slug}`}>
                                  <Button variant="ghost" size="sm">
                                    Read More
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Categories */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.name} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-gray-700 hover:text-emerald-600 cursor-pointer transition-colors">
                            {category.name}
                          </span>
                          <Badge variant="secondary">{category.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Ayurveda', 'Wellness', 'Herbs', 'Nutrition', 'Immunity', 'Turmeric', 'Dry Fruits', 'Tofu'].map((tag) => (
                        <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-emerald-100 hover:text-emerald-800 transition-colors">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Newsletter */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Subscribe to Newsletter
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Get the latest Ayurvedic tips and wellness insights delivered to your inbox.
                    </p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Your email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Subscribe
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Follow Us */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
                    <p className="text-gray-600 mb-4">
                      Stay connected for daily wellness tips and updates.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Facebook
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Instagram
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-emerald-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Wellness Journey?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Explore our premium Ayurvedic products and experience the healing power of nature.
            </p>
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100" asChild>
              <Link href="/products">
                Shop Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}