'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

interface FieldInfoProps {
  label?: string
  what: string
  why: string
  example: string
  note?: string
}

export function FieldInfo({ label, what, why, example, note }: FieldInfoProps) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [arrowLeft, setArrowLeft] = useState<string>('50%')
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const btn = btnRef.current.getBoundingClientRect()
    const POP_W = 280
    const GAP = 10

    // Horizontal: centre on button, clamp to viewport
    let left = btn.left + btn.width / 2 - POP_W / 2
    const clampedLeft = Math.max(10, Math.min(window.innerWidth - POP_W - 10, left))
    // Arrow offset relative to clamped popover
    const arrowX = btn.left + btn.width / 2 - clampedLeft
    setArrowLeft(`${Math.max(14, Math.min(POP_W - 14, arrowX))}px`)

    // Vertical: prefer above, fall back to below
    const spaceAbove = btn.top
    const spaceBelow = window.innerHeight - btn.bottom

    if (spaceAbove >= 200 || spaceAbove >= spaceBelow) {
      // show above
      setStyle({
        position: 'fixed',
        bottom: window.innerHeight - btn.top + GAP,
        left: clampedLeft,
        width: POP_W,
      })
    } else {
      // show below
      setStyle({
        position: 'fixed',
        top: btn.bottom + GAP,
        left: clampedLeft,
        width: POP_W,
      })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !popRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const showAbove = (style as any).bottom !== undefined

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        title={`About: ${label || what}`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%',
          background: open ? '#059669' : '#e0fdf4',
          border: `1.5px solid ${open ? '#059669' : '#6ee7b7'}`,
          color: open ? '#fff' : '#059669',
          cursor: 'pointer', padding: 0, flexShrink: 0,
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        }}
      >
        <Info size={9} strokeWidth={2.5} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          style={{
            ...style,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            zIndex: 2147483647,
            overflow: 'visible',
          }}
        >
          {/* Arrow pointing to button */}
          <div style={{
            position: 'absolute',
            [showAbove ? 'bottom' : 'top']: -7,
            left: arrowLeft,
            width: 12, height: 12,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderTop: showAbove ? 'none' : undefined,
            borderLeft: showAbove ? 'none' : undefined,
            borderBottom: showAbove ? undefined : 'none',
            borderRight: showAbove ? undefined : 'none',
            transform: `translateX(-50%) rotate(${showAbove ? 45 : 225}deg)`,
          }} />

          <div style={{ borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            {label && (
              <div style={{ padding: '10px 14px 8px', background: 'linear-gradient(90deg,#f0fdf4,#f8fafc)', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
              </div>
            )}

            <div style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {/* What */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>What is this?</p>
                <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.55, margin: 0 }}>{what}</p>
              </div>

              {/* Why */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>Why it matters</p>
                <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.55, margin: 0 }}>{why}</p>
              </div>

              {/* Example */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>Example</p>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: '#059669', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{example}</p>
              </div>

              {/* Note */}
              {note && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>⚠️ {note}</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}

/* ─────────────────────────────────────────────
   LabelWithInfo — label + ℹ️ in one line
───────────────────────────────────────────── */
interface LabelWithInfoProps extends FieldInfoProps {
  required?: boolean
  className?: string
  style?: React.CSSProperties
}

export function LabelWithInfo({ label, required, className, style, ...infoProps }: LabelWithInfoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...style }} className={className}>
      {label}{required && <span style={{ color: '#dc2626', fontSize: 11, fontWeight: 700 }}>*</span>}
      <FieldInfo label={label} {...infoProps} />
    </span>
  )
}

/* ─────────────────────────────────────────────
   PageInfoBanner — collapsible top-of-page info
───────────────────────────────────────────── */
interface PageInfoBannerProps {
  title: string
  description: string
  tips: string[]
  defaultOpen?: boolean
}

export function PageInfoBanner({ title, description, tips, defaultOpen = false }: PageInfoBannerProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      border: '1.5px solid #bbf7d0', borderRadius: 16, overflow: 'hidden',
      marginBottom: 20, background: '#fff',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: open ? 'linear-gradient(90deg,#f0fdf4,#f8fafc)' : '#f8fafc',
          border: 'none', cursor: 'pointer', gap: 12,
          borderBottom: open ? '1px solid #d1fae5' : 'none',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
            <Info size={14} />
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#065f46' }}>{title}</span>
        </span>
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>{open ? 'Hide ▲' : 'Show guide ▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>{description}</p>
          {tips.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tips.map((t, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#4b5563', lineHeight: 1.55 }}>
                  <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
