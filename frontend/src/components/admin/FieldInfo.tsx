'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface FieldInfoProps {
  label?: string
  what: string       // what is this field
  why: string        // why it matters / how it affects things
  example: string    // example value
  note?: string      // optional extra warning / tip
}

export function FieldInfo({ label, what, why, example, note }: FieldInfoProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={`Info: ${label || what}`}
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

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          width: 260, background: '#fff',
          border: '1.5px solid #e5e7eb',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 9999, padding: 0, overflow: 'hidden',
          animation: 'fi-pop 0.15s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <style>{`
            @keyframes fi-pop{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
          `}</style>

          {/* Header */}
          {label && (
            <div style={{ padding: '10px 14px 8px', background: 'linear-gradient(90deg,#f0fdf4,#f8fafc)', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
            </div>
          )}

          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* What */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>What</p>
              <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5, margin: 0 }}>{what}</p>
            </div>

            {/* Why */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 3px' }}>Why it matters</p>
              <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5, margin: 0 }}>{why}</p>
            </div>

            {/* Example */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 10px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>Example</p>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#059669', margin: 0, fontFamily: 'monospace' }}>{example}</p>
            </div>

            {/* Optional note */}
            {note && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px' }}>
                <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>⚠️ {note}</p>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -7, left: '50%',
            width: 12, height: 12, background: '#fff',
            border: '1.5px solid #e5e7eb', borderTop: 'none', borderLeft: 'none',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />
        </div>
      )}
    </span>
  )
}

/* ─────────────────────────────────────────────
   LabelWithInfo — label + ℹ️ in one line
   Usage: <LabelWithInfo label="Coupon Code" what="..." why="..." example="SAVE20" />
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
   Shows a summary of what this admin page does
   with a list of tips the admin should know
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
