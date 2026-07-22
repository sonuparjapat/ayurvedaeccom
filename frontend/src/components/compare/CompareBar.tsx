'use client'

import Link from 'next/link'
import { useCompare } from '@/hooks/useCompare'
import { X, BarChart2 } from 'lucide-react'

export function CompareBar() {
  const { list, remove, clear, count } = useCompare()

  if (count === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #064e3b, #047857)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <BarChart2 size={16} color="white" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
          Compare ({count}/4)
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
        {list.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
            {item.image && (
              <img src={item.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
            )}
            <span style={{ fontSize: 12, color: 'white', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </span>
            <button
              onClick={() => remove(item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <X size={12} color="rgba(255,255,255,0.7)" />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        <button
          onClick={clear}
          style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            background: 'none', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          }}
        >
          Clear
        </button>
        {count >= 2 && (
          <Link
            href={`/compare?ids=${list.map(i => i.id).join(',')}`}
            style={{
              fontSize: 12, fontWeight: 700, color: '#064e3b',
              background: 'white', borderRadius: 8, padding: '6px 14px',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Compare Now →
          </Link>
        )}
      </div>
    </div>
  )
}
