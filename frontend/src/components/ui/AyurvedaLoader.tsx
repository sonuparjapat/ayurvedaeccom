'use client'

import { useEffect, useState } from 'react'

const WELLNESS_TIPS = [
  'Nourishing your wellness journey…',
  'Preparing your Ayurvedic experience…',
  'Balancing your Doshas…',
  'Connecting you to nature\'s wisdom…',
  'Gathering herbs from the Himalayas…',
  'Aligning body, mind & spirit…',
]

const LEAF_POSITIONS = [
  { x: 15, y: 20, delay: 0,    size: 18, rotate: -30 },
  { x: 80, y: 15, delay: 0.4,  size: 14, rotate: 45  },
  { x: 70, y: 75, delay: 0.8,  size: 16, rotate: -60 },
  { x: 20, y: 70, delay: 1.2,  size: 12, rotate: 20  },
  { x: 50, y: 10, delay: 0.6,  size: 10, rotate: 80  },
  { x: 88, y: 50, delay: 1.0,  size: 13, rotate: -45 },
]

interface AyurvedaLoaderProps {
  message?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function AyurvedaLoader({
  message,
  fullScreen = true,
  size = 'md',
}: AyurvedaLoaderProps) {
  const [tipIdx, setTipIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setTipIdx(i => (i + 1) % WELLNESS_TIPS.length)
        setVisible(true)
      }, 300)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  const sizeMap = {
    sm: { lotus: 48, ring1: 56, ring2: 68, ring3: 80 },
    md: { lotus: 64, ring1: 76, ring2: 92, ring3: 108 },
    lg: { lotus: 88, ring1: 104, ring2: 124, ring3: 144 },
  }
  const s = sizeMap[size]

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      position: 'relative',
    }}>
      <style>{`
        @keyframes ayur-spin-slow  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes ayur-spin-rev   { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes ayur-pulse-glow { 0%,100% { opacity:.4; transform:scale(1);   }  50% { opacity:.9; transform:scale(1.08); } }
        @keyframes ayur-float      { 0%,100% { transform:translateY(0px) rotate(var(--r)); } 50% { transform:translateY(-8px) rotate(var(--r)); } }
        @keyframes ayur-fade-in    { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ayur-shimmer    { 0% { background-position:200% center; } 100% { background-position:0% center; } }
        @keyframes ayur-petal      { 0%,100% { transform:scale(1) rotate(0deg);   } 50% { transform:scale(1.06) rotate(3deg); } }
      `}</style>

      {/* Floating leaves background */}
      <div style={{ position: 'absolute', width: s.ring3 * 1.8, height: s.ring3 * 1.8, pointerEvents: 'none' }}>
        {LEAF_POSITIONS.map((leaf, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${leaf.x}%`,
              top: `${leaf.y}%`,
              fontSize: leaf.size,
              '--r': `${leaf.rotate}deg`,
              animation: `ayur-float 3.${i}s ${leaf.delay}s ease-in-out infinite`,
              opacity: 0.55,
            } as any}
          >
            🌿
          </div>
        ))}
      </div>

      {/* Ring layers */}
      <div style={{ position: 'relative', width: s.ring3, height: s.ring3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Outer glow ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 70%)',
          animation: 'ayur-pulse-glow 2.4s ease-in-out infinite',
        }} />

        {/* Ring 3 — slowest */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.5px dashed rgba(16,185,129,0.25)',
          animation: 'ayur-spin-rev 12s linear infinite',
        }} />

        {/* Ring 2 */}
        <div style={{
          position: 'absolute',
          inset: (s.ring3 - s.ring2) / 2,
          borderRadius: '50%',
          border: '2px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #10b981, #d4a017, #10b981) border-box',
          animation: 'ayur-spin-slow 4s linear infinite',
        }} />

        {/* Ring 1 */}
        <div style={{
          position: 'absolute',
          inset: (s.ring3 - s.ring1) / 2,
          borderRadius: '50%',
          border: '2.5px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(225deg, #065f46, #10b981, #d4a017, #065f46) border-box',
          backgroundSize: '300% 300%',
          animation: 'ayur-spin-rev 2.2s linear infinite',
        }} />

        {/* Centre lotus */}
        <div style={{
          width: s.lotus,
          height: s.lotus,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(6,95,70,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          animation: 'ayur-petal 3s ease-in-out infinite',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ fontSize: s.lotus * 0.52, lineHeight: 1 }}>🌸</span>
        </div>

      </div>

      {/* Brand name */}
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: size === 'sm' ? 15 : size === 'lg' ? 22 : 18,
        fontWeight: 700,
        background: 'linear-gradient(135deg, #065f46 0%, #10b981 50%, #d4a017 100%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'ayur-shimmer 3s linear infinite',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        Oroganix
      </div>

      {/* Tip text */}
      {size !== 'sm' && (
        <p style={{
          color: '#6b7280',
          fontSize: 13,
          fontFamily: 'inherit',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          textAlign: 'center',
          maxWidth: 240,
          lineHeight: 1.5,
        }}>
          {message ?? WELLNESS_TIPS[tipIdx]}
        </p>
      )}

      {/* Dots */}
      {size !== 'sm' && (
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#10b981',
                animation: `ayur-pulse-glow 1.2s ${i * 0.2}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (!fullScreen) return content

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 40%, rgba(16,185,129,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(212,160,23,0.05) 0%, transparent 60%), #f9fafb',
    }}>
      {content}
    </div>
  )
}
