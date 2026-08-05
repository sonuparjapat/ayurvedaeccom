import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API}/shop/public/${id}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = await fetchProduct(id)
  if (!p) return {
    title: 'Product | Oroganix',
    description: 'Shop premium Ayurvedic products at Oroganix.',
    robots: { index: false },
  }

  const desc = p.meta_description || (p.shortdescription || p.longdescription || '').slice(0, 155)
  const image = p.images?.[0] || null
  const title = p.meta_title || p.name
  const keywords = [p.focus_keyword, ...(p.tags || [])].filter(Boolean).join(', ') || undefined

  return {
    title,
    description: desc,
    ...(keywords && { keywords }),
    alternates: { canonical: `${SITE_URL}/product/${p.slug || id}` },
    openGraph: {
      title: p.meta_title || p.name,
      description: desc,
      type: 'website',
      ...(image && { images: [{ url: image, width: 800, height: 800, alt: p.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: p.meta_title || p.name,
      description: desc,
      ...(image && { images: [image] }),
    },
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = await fetchProduct(id)

  const productSchema = p ? {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.name,
    image: p.images || [],
    description: p.meta_description || p.shortdescription || '',
    sku: p.sku,
    brand: { '@type': 'Brand', name: p.brand_display_name || p.brand || 'Oroganix' },
    ...(p.barcode ? { gtin: p.barcode } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: p.sale_price || p.price,
      availability: (p.inventory ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Oroganix' },
      url: `${SITE_URL}/product/${p.slug || id}`,
    },
    ...(Number(p.averagerating) > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(p.averagerating).toFixed(1),
        reviewCount: p.reviewcount || 1,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
  } : null

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      ...(p ? [{ '@type': 'ListItem', position: 3, name: p.name, item: `${SITE_URL}/product/${p.slug || id}` }] : []),
    ],
  }

  const faqSchema = p?.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faqs.map((faq: { question: string; answer: string }) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null

  return (
    <>
      {productSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {children}
    </>
  )
}
