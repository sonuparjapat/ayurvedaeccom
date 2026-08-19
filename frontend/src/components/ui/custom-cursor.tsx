'use client'

import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [onLink, setOnLink] = useState(false)

  useEffect(() => {
    // Only on desktop
    if (window.matchMedia('(pointer: coarse)').matches) return

    let raf = 0
    let mx = -200, my = -200
    let rx = -200, ry = -200

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!visible) setVisible(true)
    }
    const onDown = () => setClicked(true)
    const onUp = () => setClicked(false)
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    const checkLink = (e: MouseEvent) => {
      const el = e.target as Element
      const isInteractive = el.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor-grow]')
      setOnLink(!!isInteractive)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousemove', checkLink)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    const animate = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx - 4}px, ${my - 4}px)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousemove', checkLink)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          *, *::before, *::after { cursor: none !important; }
        }
        .cursor-dot {
          position: fixed;
          top: 0; left: 0;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          pointer-events: none;
          z-index: 999999;
          transition: opacity 0.2s, width 0.2s, height 0.2s, background 0.2s;
          will-change: transform;
          mix-blend-mode: normal;
        }
        .cursor-ring {
          position: fixed;
          top: 0; left: 0;
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1.5px solid rgba(16,185,129,0.55);
          pointer-events: none;
          z-index: 999998;
          transition: opacity 0.2s, width 0.25s cubic-bezier(0.22,1,0.36,1), height 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.2s, background 0.2s;
          will-change: transform;
        }
        .cursor-ring.on-link {
          width: 56px; height: 56px;
          border-color: rgba(16,185,129,0.3);
          background: rgba(16,185,129,0.06);
          margin-top: -8px; margin-left: -8px;
        }
        .cursor-dot.on-link {
          width: 10px; height: 10px;
          background: #059669;
          margin-top: -1px; margin-left: -1px;
        }
        .cursor-dot.clicked {
          transform-origin: center;
          width: 6px; height: 6px;
          background: #d97706;
        }
        .cursor-ring.clicked {
          width: 32px; height: 32px;
          border-color: rgba(217,119,6,0.5);
          margin-top: 4px; margin-left: 4px;
        }
      `}</style>
      <div
        ref={dotRef}
        className={`cursor-dot${onLink ? ' on-link' : ''}${clicked ? ' clicked' : ''}`}
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        ref={ringRef}
        className={`cursor-ring${onLink ? ' on-link' : ''}${clicked ? ' clicked' : ''}`}
        style={{ opacity: visible ? 1 : 0 }}
      />
    </>
  )
}
