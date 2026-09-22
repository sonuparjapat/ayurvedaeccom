'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function NavigationProgress() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')

  useEffect(() => {
    setPhase('running')
    const finish = setTimeout(() => {
      setPhase('done')
      const hide = setTimeout(() => setPhase('idle'), 450)
      return () => clearTimeout(hide)
    }, 80)
    return () => clearTimeout(finish)
  }, [pathname])

  if (phase === 'idle') return null

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2,
        zIndex: 10000, pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
          boxShadow: '0 0 10px rgba(16,185,129,0.7)',
          width: phase === 'done' ? '100%' : '40%',
          opacity: phase === 'done' ? 0 : 1,
          transition:
            phase === 'done'
              ? 'width 0.25s ease, opacity 0.4s ease 0.2s'
              : 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  )
}
