'use client'

import { useEffect, useState } from 'react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      <style>{`
        @keyframes btt-in  { from { opacity:0; transform:scale(0.6) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes btt-out { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.6) translateY(12px); } }
        @keyframes btt-ring { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45);} 70%{box-shadow:0 0 0 14px rgba(16,185,129,0);} }
        .btt-btn {
          position: fixed;
          bottom: 28px;
          right: 24px;
          z-index: 9990;
          width: 52px; height: 52px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #065f46, #059669);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(5,150,105,.4), 0 2px 8px rgba(0,0,0,.15);
          cursor: pointer;
          animation: btt-ring 2.8s 1.5s infinite;
          transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s;
        }
        .btt-btn:hover {
          transform: scale(1.12) translateY(-2px);
          box-shadow: 0 14px 36px rgba(5,150,105,.5), 0 4px 12px rgba(0,0,0,.2);
        }
        .btt-btn:active { transform: scale(0.94); }
        .btt-visible { animation: btt-in .4s cubic-bezier(.34,1.56,.64,1) forwards, btt-ring 2.8s 2s infinite; }
        .btt-hidden  { animation: btt-out .3s ease forwards; pointer-events:none; }
      `}</style>
      <button
        onClick={scrollUp}
        className={`btt-btn ${visible ? 'btt-visible' : 'btt-hidden'}`}
        aria-label="Back to top"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  )
}
