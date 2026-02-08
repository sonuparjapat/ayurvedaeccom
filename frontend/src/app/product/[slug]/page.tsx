'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Carousel, CarouselItem } from '@/components/ui/carousel/carousel'
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  RefreshCw,
  Plus,
  Minus,
  CheckCircle,
  ArrowRight,
  Share2
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  sku: string
  price: number
  comparePrice?: number
  costPrice?: number
  trackInventory: boolean
  inventory: number
  weight?: number
  dimensions?: string
  images: string
  tags: string
  status: string
  featured: boolean
  seoTitle?: string
  seoDescription?: string
  metaKeywords?: string
  hasVariants: boolean
  createdAt: string
  updatedAt: string
  category: {
    name: string
    slug: string
  }
  averageRating: number
  reviewCount: number
  variants?: any[]
}

interface Review {
  id: string
  rating: number
  title?: string
  content?: string
  user: {
    name: string
  }
  createdAt: string
  isVerified: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const productSlug = params.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    fetchProductData()
  }, [productSlug])

  const fetchProductData = async () => {
    setLoading(true)
    try {
      // Fetch product details
      const response = await fetch(`/api/products?search=${productSlug}`)
      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        const foundProduct = data.products.find((p: Product) => p.slug === productSlug)
        if (foundProduct) {
          setProduct(foundProduct)
          
          // Fetch related products (same category, excluding current)
          const relatedResponse = await fetch(`/api/products?category=${foundProduct.category.slug}`)
          const relatedData = await relatedResponse.json()
          setRelatedProducts(relatedData.products?.filter((p: Product) => p.id !== foundProduct.id).slice(0, 4) || [])
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagesJson: string, index: number = 0) => {
    try {
      const images = JSON.parse(imagesJson || '[]')
      return images[index] || '/placeholder-product.jpg'
    } catch {
      return '/placeholder-product.jpg'
    }
  }

  const addToWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'guest-session'
        },
        body: JSON.stringify({ productId })
      })
      
      if (response.ok) {
        console.log('Product added to wishlist')
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
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

  const addToCart = async () => {
    if (!product) return
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'guest-session'
        },
        body: JSON.stringify({ 
          productId: product.id, 
          quantity: quantity 
        })
      })
      
      if (response.ok) {
        console.log('Product added to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const increaseQuantity = () => {
    if (product && quantity < product.inventory) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
            <Button asChild>
              <a href="/products">Continue Shopping</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const images = JSON.parse(product.images || '[]')
  const tags = JSON.parse(product.tags || '[]')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-gray-50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <a href="/" className="hover:text-emerald-600">Home</a>
              <span>/</span>
              <a href="/products" className="hover:text-emerald-600">Products</a>
              <span>/</span>
              <a href={`/category/${product.category.slug}`} className="hover:text-emerald-600">
                {product.category.name}
              </a>
              <span>/</span>
              <span className="text-gray-900">{product.name}</span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Images */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(product.images, selectedImage)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnail Images */}
                  {images.length > 1 && (
                    <div className="flex gap-2">
                      {images.map((image: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedImage === index 
                              ? 'border-emerald-600' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <Badge variant="outline" className="mb-4">
                    {product.category.name}
                  </Badge>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    {product.shortDescription}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {renderStars(product.averageRating)}
                    </div>
                    <span className="text-gray-600">
                      {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-3xl font-bold text-emerald-600">
                      {formatPrice(product.price)}
                    </div>
                    {product.comparePrice && (
                      <div className="text-xl text-gray-500 line-through">
                        {formatPrice(product.comparePrice)}
                      </div>
                    )}
                    {product.comparePrice && (
                      <Badge className="bg-red-500">
                        Save {formatPrice(product.comparePrice - product.price)}
                      </Badge>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2 mb-6">
                    {product.inventory > 0 ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">
                          In Stock ({product.inventory} available)
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-red-500"></div>
                        <span className="text-red-600 font-medium">Out of Stock</span>
                      </>
                    )}
                  </div>

                  {/* Quantity and Add to Cart */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className="rounded-r-none"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center border-0 rounded-none"
                        min="1"
                        max={product.inventory}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={increaseQuantity}
                        disabled={quantity >= product.inventory}
                        className="rounded-l-none"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      size="lg"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={product.inventory === 0}
                      onClick={addToCart}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>
                    
                    <Button variant="outline" size="lg">
                      <Heart className="w-5 h-5" />
                    </Button>
                    
                    <Button variant="outline" size="lg">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Free Shipping
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Secure Payment
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      Easy Returns
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Product Tabs */}
            <div className="mt-12">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="details" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Product Information</h3>
                          <dl className="space-y-2">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">SKU:</dt>
                              <dd className="font-medium">{product.sku}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Category:</dt>
                              <dd className="font-medium">{product.category.name}</dd>
                            </div>
                            {product.weight && (
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Weight:</dt>
                                <dd className="font-medium">{product.weight}kg</dd>
                              </div>
                            )}
                            {product.dimensions && (
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Dimensions:</dt>
                                <dd className="font-medium">{product.dimensions}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4">Features & Benefits</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-gray-700">100% Natural & Organic</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-gray-700">No Preservatives Added</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-gray-700">Lab Tested for Quality</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-gray-700">Sourced from Indian Farms</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">⭐</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Customer Reviews
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Be the first to review this product!
                        </p>
                        <Button>
                          Write a Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Related Products
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Card key={relatedProduct.id} className="group hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={getImageUrl(relatedProduct.images)}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-bold text-emerald-600">
                          {formatPrice(relatedProduct.price)}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(relatedProduct.averageRating)}
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                        onClick={() => window.location.href = `/product/${relatedProduct.slug}`}
                      >
                        View Product
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  )
}