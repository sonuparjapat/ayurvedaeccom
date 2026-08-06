import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oroganix — Premium Ayurvedic Products',
    short_name: 'Oroganix',
    description: 'Shop authentic Ayurvedic herbs, organic supplements, and natural wellness products.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f4eb',
    theme_color: '#1a5c38',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['shopping', 'health', 'lifestyle'],
    lang: 'en-IN',
  }
}
