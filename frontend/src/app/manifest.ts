import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oroganix - Premium Ayurvedic Products',
    short_name: 'Oroganix',
    description: 'Shop authentic Ayurvedic herbs, organic supplements & natural wellness products. 100% organic, lab-tested, farm-direct.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafaf7',
    theme_color: '#1a5c38',
    categories: ['shopping', 'health', 'lifestyle'],
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/mainayurvedalogo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/mainayurvedalogo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Shop Now',
        short_name: 'Shop',
        description: 'Browse all products',
        url: '/products',
      },
      {
        name: 'My Cart',
        short_name: 'Cart',
        description: 'View your cart',
        url: '/cart',
      },
    ],
  }
}
