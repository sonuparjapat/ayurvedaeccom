'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'

export function WhatsAppButton() {
  const { companydata } = useAuth()
  const company = (companydata as any)?.[0] || {}
  const phone = company.phone?.replace(/\D/g, '') || '919999999999'
  const [show, setShow] = useState(false)
  const [tooltip, setTooltip] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1800)
    const t2 = setTimeout(() => setTooltip(false), 6000)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])

  const message = encodeURIComponent('Hi! I have a question about your Ayurvedic products.')
  const href = `https://wa.me/${phone}?text=${message}`

  if (!show) return null

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,211,102,0.5); }
          70%  { box-shadow: 0 0 0 18px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        @keyframes wa-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes wa-in {
          from { opacity: 0; transform: scale(0.5) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tip-in {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .wa-btn {
          position: fixed;
          bottom: 28px;
          right: 24px;
          z-index: 9990;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25D366, #128C7E);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: wa-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, wa-pulse 2.5s 2s infinite, wa-float 4s 2s ease-in-out infinite;
          box-shadow: 0 8px 32px rgba(37,211,102,0.4), 0 2px 8px rgba(0,0,0,0.15);
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .wa-btn:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 12px 40px rgba(37,211,102,0.55), 0 4px 12px rgba(0,0,0,0.2) !important;
          animation: wa-pulse 1.2s infinite !important;
        }
        .wa-tooltip {
          position: fixed;
          bottom: 38px;
          right: 94px;
          z-index: 9989;
          background: #fff;
          color: #1f2937;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 16px 16px 4px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
          animation: tip-in 0.4s 2.5s both;
          white-space: nowrap;
          pointer-events: none;
          line-height: 1.4;
        }
        .wa-tooltip::after {
          content: '';
          position: absolute;
          right: -8px;
          bottom: 10px;
          width: 0; height: 0;
          border: 8px solid transparent;
          border-left-color: #fff;
          border-right: 0;
          border-bottom: 0;
        }
        .wa-badge {
          position: absolute;
          top: -3px; right: -3px;
          width: 16px; height: 16px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #fff;
          font-weight: 700;
        }
      `}</style>

      {tooltip && (
        <div className="wa-tooltip">
          💬 Chat with us on WhatsApp!
        </div>
      )}

      <a href={href} target="_blank" rel="noopener noreferrer" className="wa-btn" aria-label="Chat on WhatsApp">
        <div className="wa-badge">1</div>
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M15 2.5C8.1 2.5 2.5 8.1 2.5 15c0 2.3.6 4.5 1.8 6.4L2.5 27.5l5.3-1.8c1.8 1 3.9 1.5 6.2 1.5 6.9 0 12.5-5.6 12.5-12.5S21.9 2.5 15 2.5zm6.5 17.2c-.3.8-1.5 1.5-2.1 1.6-.6.1-1.3.1-4.2-1.4-3.5-1.8-5.7-5.3-5.9-5.5-.2-.3-1.5-2-.9-3.9.3-1 1-1.7 1.8-1.7h.5c.4 0 .8.2 1 .6l1.2 2.7c.2.4.1.8-.1 1.1l-.4.5c-.2.2-.3.5-.1.8.6 1 1.5 2 2.6 2.7.9.6 1.9 1 2.4 1.1.3.1.6 0 .8-.2l.7-.8c.3-.3.6-.4 1-.3l2.6 1.2c.4.2.7.5.8 1v.5c.1.5-.3 1.2-.7 1.5z" fill="white"/>
        </svg>
      </a>
    </>
  )
}
