import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Blog post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title = 'Oroganix Wellness Blog'
  let excerpt = 'Ancient Ayurvedic wisdom for modern living'
  let category = ''
  let coverImage: string | null = null

  try {
    const res = await fetch(`${API}/blog/public/${slug}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const json = await res.json()
      const post = json?.data || json
      title = post?.title || title
      excerpt = (post?.excerpt || post?.meta_description || '')
        .replace(/<[^>]+>/g, '')
        .slice(0, 120)
        .trim()
      category = post?.category_name || ''
      coverImage = post?.cover_image || null
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: '#052e16',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background cover image */}
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.22,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(140deg, rgba(5,46,22,0.97) 0%, rgba(15,118,110,0.82) 100%)',
            display: 'flex',
          }}
        />

        {/* Decorative right-side accent */}
        <div
          style={{
            position: 'absolute',
            right: -80,
            top: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(217,119,6,0.12)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 60,
            bottom: -120,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: '52px 72px',
            height: '100%',
          }}
        >
          {/* Top bar — brand + category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: '#d97706',
                borderRadius: 8,
                padding: '7px 18px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: 2.5,
                display: 'flex',
              }}
            >
              OROGANIX
            </div>
            {category && (
              <div
                style={{
                  fontSize: 13,
                  color: '#6ee7b7',
                  fontWeight: 600,
                  letterSpacing: 2,
                  display: 'flex',
                }}
              >
                {category.toUpperCase()}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1, display: 'flex' }} />

          {/* Main text */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: title.length > 65 ? 42 : title.length > 45 ? 50 : 58,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                marginBottom: 20,
                maxWidth: 920,
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {title}
            </div>

            {excerpt && (
              <div
                style={{
                  fontSize: 22,
                  color: 'rgba(255,255,255,0.72)',
                  lineHeight: 1.45,
                  maxWidth: 820,
                  display: 'flex',
                }}
              >
                {excerpt}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 36,
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 4,
                  background: '#d97706',
                  borderRadius: 2,
                  display: 'flex',
                }}
              />
              <div
                style={{
                  fontSize: 15,
                  color: '#a7f3d0',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  display: 'flex',
                }}
              >
                oroganix.com/blog
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
