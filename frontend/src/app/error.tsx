'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'linear-gradient(135deg, #fff7ed 0%, #fafaf7 60%, #f0fdf4 100%)',
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(249,115,22,0.07)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🌱</div>

        <p style={{
          fontSize: 'clamp(80px, 18vw, 140px)', fontWeight: 900, lineHeight: 1,
          margin: '0 0 8px',
          background: 'linear-gradient(135deg, #92400e, #f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}>
          500
        </p>

        <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#0f3d2e', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: '0 0 36px' }}>
          We hit an unexpected root. Our team has been notified and we're
          working to restore balance. Try again in a moment.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 99, fontWeight: 700, fontSize: 14,
              background: 'linear-gradient(135deg, #0f3d2e, #059669)', color: '#fff',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(15,61,46,0.25)',
            }}
          >
            ↺ Try Again
          </button>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 99, fontWeight: 700, fontSize: 14,
            background: '#fff', color: '#0f3d2e',
            border: '1.5px solid rgba(15,61,46,0.15)', textDecoration: 'none',
          }}>
            🏠 Back to Home
          </Link>
        </div>

        {error.digest && (
          <p style={{ marginTop: 32, fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
