'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Trash2,
  ArrowRight,
  Package
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
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
    }
    averageRating: number
    reviewCount: number
  }
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    setLoading(true)
    try {
      // Simulate API call - in real app, this would fetch from your wishlist API
      // For now, we'll create some sample wishlist items
      const sampleWishlist: WishlistItem[] = [
        {
          id: '1',
          productId: '1',
          createdAt: new Date().toISOString(),
          product: {
            id: '1',
            name: 'Premium Almonds',
            slug: 'premium-almonds',
            shortDescription: 'High-quality California almonds, rich in vitamin E',
            price: 299,
            comparePrice: 399,
            images: '["/images/almonds.jpg"]',
            inventory: 100,
            category: { name: 'Dry Fruits' },
            averageRating: 4.8,
            reviewCount: 124
          }
        },
        {
          id: '2',
          productId: '5',
          createdAt: new Date().toISOString(),
          product: {
            id: '5',
            name: 'Organic Ashwagandha Powder',
            slug: 'ashwagandha-powder',
            shortDescription: 'Pure ashwagandha root powder for stress relief',
            price: 199,
            comparePrice: 299,
            images: '["/images/ashwagandha.jpg"]',
            inventory: 80,
            category: { name: 'Ayurvedic Herbs' },
            averageRating: 4.9,
            reviewCount: 89
          }
        },
        {
          id: '3',
          productId: '9',
          createdAt: new Date().toISOString(),
          product: {
            id: '9',
            name: 'Organic Tofu - Extra Firm',
            slug: 'organic-tofu-extra-firm',
            shortDescription: 'Premium organic extra-firm tofu for cooking',
            price: 89,
            comparePrice: 129,
            images: '["/images/tofu-firm.jpg"]',
            inventory: 40,
            category: { name: 'Tofu Products' },
            averageRating: 4.7,
            reviewCount: 56
          }
        }
      ]
      
      setWishlistItems(sampleWishlist)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (itemId: string) => {
    try {
      // Simulate API call
      setWishlistItems(prev => prev.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
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

  const moveToCart = async (item: WishlistItem) => {
    await addToCart(item.productId)
    await removeFromWishlist(item.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your wishlist is empty
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start adding products you love to your wishlist. They'll be saved here for you to view later.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href="/products">
                    <Package className="w-5 h-5 mr-2" />
                    Browse Products
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/category/dry-fruits">
                    View Popular Items
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Wishlist Items */}
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {wishlistItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-6">
                            {/* Product Image */}
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getImageUrl(item.product.images)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2">
                                    {item.product.category.name}
                                  </Badge>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    <Link 
                                      href={`/product/${item.product.slug}`}
                                      className="hover:text-emerald-600 transition-colors"
                                    >
                                      {item.product.name}
                                    </Link>
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {item.product.shortDescription}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                      {renderStars(item.product.averageRating)}
                                      <span className="text-sm text-gray-500">
                                        ({item.product.reviewCount})
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Added {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromWishlist(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xl font-bold text-emerald-600">
                                    {formatPrice(item.product.price)}
                                  </div>
                                  {item.product.comparePrice && (
                                    <div className="text-sm text-gray-500 line-through">
                                      {formatPrice(item.product.comparePrice)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item.product.id)}
                                    disabled={item.product.inventory === 0}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Add to Cart
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => moveToCart(item)}
                                    disabled={item.product.inventory === 0}
                                  >
                                    Move to Cart
                                  </Button>
                                </div>
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
              <div className="space-y-6">
                {/* Wishlist Summary */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Wishlist Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">{wishlistItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Value:</span>
                        <span className="font-medium">
                          {formatPrice(wishlistItems.reduce((sum, item) => sum + item.product.price, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Potential Savings:</span>
                        <span className="font-medium text-green-600">
                          {formatPrice(
                            wishlistItems.reduce((sum, item) => 
                              sum + (item.product.comparePrice ? item.product.comparePrice - item.product.price : 0), 0
                            )
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                        <Link href="/checkout">
                          Add All to Cart
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/products">
                          Continue Shopping
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Share Wishlist */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Share Wishlist</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Share your wishlist with friends and family
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" size="sm">
                        Share via WhatsApp
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recently Viewed */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Recently Viewed</h3>
                    <div className="space-y-3">
                      {['Turmeric Powder', 'Cashew Nuts', 'Dehydrated Amla'].map((product, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product}
                            </p>
                            <p className="text-xs text-gray-500">Viewed recently</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}