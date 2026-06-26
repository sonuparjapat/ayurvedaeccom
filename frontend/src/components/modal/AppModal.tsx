'use client'

import { ReactNode, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  footer?: ReactNode
  width?: string
  children: ReactNode
}

export default function AppModal({
  open,
  onClose,
  title,
  description,
  footer,
  width = 'max-w-2xl',
  children,
}: Props) {

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const overlayStyle: React.CSSProperties = {
    background: 'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0.65) 100%)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    animation: 'fadeIn 0.22s cubic-bezier(0.4,0,0.2,1)',
  }

  const modalStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, #ffffff 0%, #f6f7ff 60%, #f0f1fe 100%)',
    border: '1px solid rgba(99,102,241,0.18)',
    boxShadow: `
      0 0 0 1px rgba(255,255,255,0.9) inset,
      0 8px 32px rgba(99,102,241,0.18),
      0 32px 80px rgba(99,102,241,0.14),
      0 2px 4px rgba(0,0,0,0.06)
    `,
    animation: 'slideUp 0.26s cubic-bezier(0.34,1.56,0.64,1)',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  }

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(99,102,241,0.1)',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
    padding: '20px 22px 18px',
    position: 'relative',
    overflow: 'hidden',
  }

  const headerShineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0))',
    pointerEvents: 'none',
  }

  const titleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#1e1b4b',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
    background: 'linear-gradient(135deg, #3730a3 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }

  const descStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginTop: '3px',
    letterSpacing: '0.01em',
    lineHeight: 1.5,
  }

  const closeBtnStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6366f1',
    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  }

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 22px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(99,102,241,0.2) transparent',
  }

  const footerStyle: React.CSSProperties = {
    padding: '14px 22px',
    borderTop: '1px solid rgba(99,102,241,0.1)',
    background: 'linear-gradient(135deg, rgba(248,249,255,0.95), rgba(243,244,255,0.95))',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
  }

  return (

    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        flex justify-center items-center
        p-3
      "
      style={overlayStyle}
      onClick={(e) => e.stopPropagation()}
    >

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        .app-modal-close:hover {
          background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.16)) !important;
          box-shadow: 0 2px 8px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.9) !important;
          transform: scale(1.08) !important;
        }
        .app-modal-close:active {
          transform: scale(0.96) !important;
        }
        .app-modal-body::-webkit-scrollbar {
          width: 5px;
        }
        .app-modal-body::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.22);
          border-radius: 99px;
        }
        .app-modal-body::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      <div
        className={`
          bg-white rounded-2xl
          w-full ${width}
          max-h-[85vh]
          flex flex-col
          mx-4
        `}
        style={modalStyle}
      >


        {/* HEADER */}

        <div className="p-4 border-b flex justify-between" style={headerStyle}>

          <span style={headerShineStyle} />

          <div style={{ position: 'relative', zIndex: 1 }}>

            <h3 className="font-semibold text-lg" style={titleStyle}>
              {title}
            </h3>

            {description && (
              <p className="text-sm text-gray-500" style={descStyle}>
                {description}
              </p>
            )}

          </div>


          <button
            onClick={onClose}
            className="hover:text-black text-gray-500 app-modal-close"
            style={closeBtnStyle}
          >
            <X size={15} />
          </button>

        </div>


        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-4 app-modal-body" style={bodyStyle}>

          {children}

        </div>


        {/* FOOTER */}

        {footer && (

          <div className="p-4 border-t bg-gray-50" style={footerStyle}>

            {footer}

          </div>

        )}

      </div>

    </div>
  )
}