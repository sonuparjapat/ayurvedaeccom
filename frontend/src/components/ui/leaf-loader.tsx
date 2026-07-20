'use client'

import { useEffect, useState } from 'react'

interface LeafLoaderProps {
  size?: number
  text?: string
  fullPage?: boolean
}

export function LeafLoader({ size = 48, text, fullPage = false }: LeafLoaderProps) {
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setAngle(a => (a + 8) % 360), 30)
    return () => clearInterval(id)
  }, [])

  const leaf = (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: 'block', transform: `rotate(${angle}deg)`, transition: 'transform 0.03s linear' }}>
        {/* Spinning ring */}
        <circle cx="24" cy="24" r="21" stroke="#e8f5ee" strokeWidth="3" />
        <circle cx="24" cy="24" r="21" stroke="#10b981" strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="35 97"
          strokeDashoffset="0" />
      </svg>
      {/* Static leaf icon in center */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none">
          <path
            d="M17 8C8 10 5.9 16.17 3.82 19.97L5 21l1-1c.5-.5 2-2 3-3 1.5 0 5.5-.5 9-5M3 21c2-2 3-4 3-6"
            stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )

  if (fullPage) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {leaf}
        {text && <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{text}</p>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {leaf}
      {text && <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{text}</p>}
    </div>
  )
}
