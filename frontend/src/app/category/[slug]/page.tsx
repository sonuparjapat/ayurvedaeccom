'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Carousel, CarouselItem } from '@/components/ui/carousel/carousel'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  ShoppingCart, 
  Heart, 
  Star,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string
  price: number
  comparePrice?: number
  images: string
  inventory: number
  category: {
    name: string
    slug: string
  }
  averageRating: number
  reviewCount: number
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  _count: {
    products: number
  }
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 })

  const categoryInfo: Record<string, { name: string; description: string; banner: string; features: string[] }> = {
    'dry-fruits': {
      name: 'Dry Fruits',
      description: 'Premium quality dry fruits and nuts from the best Indian farms. Rich in nutrients, perfect for healthy snacking and cooking.',
      banner: '🥜 Premium Dry Fruits & Nuts',
      features: ['100% Natural', 'No Preservatives', 'Rich in Nutrients', 'Sourced from Best Farms']
    },
    'herbs': {
      name: 'Ayurvedic Herbs',
      description: 'Authentic medicinal herbs and powders for holistic health. Traditional Ayurvedic remedies for modern wellness.',
      banner: '🌿 Authentic Ayurvedic Herbs',
      features: ['Traditional Wisdom', 'Lab Tested', 'Organic Options', 'Holistic Health']
    },
    'dehydrated': {
      name: 'Dehydrated Foods',
      description: 'Nutrient-rich dehydrated vegetables and fruits preserving natural goodness. Perfect for busy lifestyles.',
      banner: '🍅 Dehydrated Superfoods',
      features: ['Long Shelf Life', 'Nutrient Preserved', 'Easy to Use', 'No Additives']
    },
    'tofu': {
      name: 'Tofu Products',
      description: 'Fresh and organic tofu (soya paneer) rich in protein and essential nutrients. Perfect for healthy cooking.',
      banner: '🧈 Fresh Organic Tofu',
      features: ['High Protein', 'Plant Based', 'Fresh Daily', 'Versatile Cooking']
    }
  }

  const currentCategory = categoryInfo[categorySlug] || {
    name: 'Products',
    description: 'Explore our premium collection',
    banner: '🛍️ Our Products',
    features: ['Quality Assured', 'Fast Delivery', 'Best Prices']
  }

  useEffect(() => {
    fetchCategoryData()
  }, [categorySlug, searchTerm, sortBy])

  const fetchCategoryData = async () => {
    setLoading(true)
    try {
      // Fetch products for this category
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      params.append('category', categorySlug)
      params.append('sortBy', sortBy)
      params.append('sortOrder', 'desc')

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])

      // Set category info
      setCategory({
        id: categorySlug,
        name: currentCategory.name,
        slug: categorySlug,
        description: currentCategory.description,
        _count: { products: data.products?.length || 0 }
      })
    } catch (error) {
      console.error('Error fetching category data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagesJson: string) => {
    try {
      const images = JSON.parse(imagesJson || '[]')
      return images[0] || '/placeholder-product.jpg'
    } catch {
      return '/placeholder-product.jpg'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'guest-session'
        },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      
      if (response.ok) {
        console.log('Product added to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Category Hero */}
        <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="text-6xl mb-6">{currentCategory.banner.split(' ')[0]}</div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {currentCategory.banner.split(' ').slice(1).join(' ')}
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {currentCategory.description}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {currentCategory.features.map((feature, index) => (
                  <Badge key={index} className="bg-emerald-100 text-emerald-800 px-4 py-2">
                    {feature}
                  </Badge>
                ))}
              </div>

              {category && (
                <div className="text-lg text-gray-600">
                  <span className="font-semibold">{category._count.products}</span> Products Available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Category Carousel */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <Carousel autoSlide autoSlideInterval={4000} className="h-64 rounded-2xl overflow-hidden">
              <CarouselItem>
                <div className="h-64 bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <h3 className="text-2xl font-bold mb-2">Premium Quality</h3>
                    <p className="text-lg">Only the finest products make it to our collection</p>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="h-64 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <h3 className="text-2xl font-bold mb-2">Farm Fresh</h3>
                    <p className="text-lg">Directly sourced from trusted Indian farms</p>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="h-64 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <h3 className="text-2xl font-bold mb-2">Health Certified</h3>
                    <p className="text-lg">All products meet strict quality standards</p>
                  </div>
                </div>
              </CarouselItem>
            </Carousel>
          </div>
        </section>

        {/* Products Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
                
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Latest</SelectItem>
                      <SelectItem value="price">Price: Low to High</SelectItem>
                      <SelectItem value="price">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('')
                    setSortBy('createdAt')
                    setPriceRange({ min: 0, max: 5000 })
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentCategory.name} ({products.length})
                </h2>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                        {viewMode === 'grid' ? (
                          <>
                            <div className="relative h-48 bg-gray-100 overflow-hidden">
                              <img
                                src={getImageUrl(product.images)}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {product.comparePrice && product.comparePrice > product.price && (
                                <Badge className="absolute top-2 left-2 bg-red-500">
                                  Sale
                                </Badge>
                              )}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur">
                                  <Heart className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                {product.name}
                              </h3>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {product.shortDescription}
                              </p>
                              
                              <div className="flex items-center gap-1 mb-3">
                                {renderStars(product.averageRating)}
                                <span className="text-sm text-gray-500">
                                  ({product.reviewCount})
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="text-xl font-bold text-emerald-600">
                                    {formatPrice(product.price)}
                                  </div>
                                  {product.comparePrice && (
                                    <div className="text-sm text-gray-500 line-through">
                                      {formatPrice(product.comparePrice)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-sm text-gray-500">
                                  {product.inventory > 0 ? (
                                    <span className="text-green-600">In Stock</span>
                                  ) : (
                                    <span className="text-red-600">Out of Stock</span>
                                  )}
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={product.inventory === 0}
                                onClick={() => addToCart(product.id)}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                            </CardContent>
                          </>
                        ) : (
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={getImageUrl(product.images)}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {product.shortDescription}
                                    </p>
                                  </div>
                                  
                                  <Button size="sm" variant="ghost">
                                    <Heart className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <div className="text-lg font-bold text-emerald-600">
                                        {formatPrice(product.price)}
                                      </div>
                                      {product.comparePrice && (
                                        <div className="text-sm text-gray-500 line-through">
                                          {formatPrice(product.comparePrice)}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      {renderStars(product.averageRating)}
                                      <span className="text-sm text-gray-500">
                                        ({product.reviewCount})
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled={product.inventory === 0}
                                    onClick={() => addToCart(product.id)}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}