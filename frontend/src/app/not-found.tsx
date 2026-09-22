import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #fafaf7 60%, #fff7ed 100%)',
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', filter: 'blur(70px)' }} />
      </div>

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 520 }}>
        {/* Leaf illustration */}
        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🌿</div>

        {/* 404 number */}
        <p style={{
          fontSize: 'clamp(80px, 18vw, 140px)', fontWeight: 900, lineHeight: 1,
          margin: '0 0 8px',
          background: 'linear-gradient(135deg, #0f3d2e, #059669)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}>
          404
        </p>

        <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#0f3d2e', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          This page has returned to the earth
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: '0 0 36px' }}>
          The page you're looking for doesn't exist or has been moved.
          Let us guide you back to something good.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 99, fontWeight: 700, fontSize: 14,
            background: 'linear-gradient(135deg, #0f3d2e, #059669)', color: '#fff',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(15,61,46,0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            🏠 Back to Home
          </Link>
          <Link href="/products" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 99, fontWeight: 700, fontSize: 14,
            background: '#fff', color: '#0f3d2e',
            border: '1.5px solid rgba(15,61,46,0.15)', textDecoration: 'none',
          }}>
            🛍️ Shop Products
          </Link>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 48, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { href: '/category/herbs', label: 'Herbs' },
            { href: '/category/supplements', label: 'Supplements' },
            { href: '/blog', label: 'Blog' },
            { href: '/account', label: 'My Account' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: '#059669', textDecoration: 'none', fontWeight: 500 }}>
              {label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
