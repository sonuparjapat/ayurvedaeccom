'use client'

import { useEffect, useRef } from 'react'

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop
      const scrollHeight = doc.scrollHeight - doc.clientHeight
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      if (barRef.current) barRef.current.style.width = `${pct}%`
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '3px',
        zIndex: 99999,
        background: 'rgba(0,0,0,0.04)',
        pointerEvents: 'none',
      }}
    >
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          background: 'linear-gradient(90deg, #059669, #10b981, #34d399, #d97706)',
          backgroundSize: '200% 100%',
          animation: 'progressShimmer 3s linear infinite',
          transition: 'width 0.05s linear',
          boxShadow: '0 0 8px rgba(16,185,129,0.6)',
        }}
      />
      <style>{`
        @keyframes progressShimmer {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  )
}
