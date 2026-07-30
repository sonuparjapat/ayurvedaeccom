import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/checkout/', '/account/', '/cart/', '/orders/', '/wishlist/', '/support/', '/adminauth/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/checkout/', '/account/', '/cart/', '/orders/', '/wishlist/', '/support/', '/adminauth/', '/api/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/checkout/', '/account/', '/cart/', '/orders/', '/wishlist/', '/support/', '/adminauth/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
