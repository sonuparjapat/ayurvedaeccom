'use client'

import { ArrowRight, Play, Leaf, Heart, Shield, Sparkles, Star, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'

const DEFAULT_BENEFITS = [
  { text: "100% Natural & Organic",        icon: Leaf      },
  { text: "Traditional Ayurvedic Recipes", icon: Heart     },
  { text: "Sourced Directly from Farms",   icon: Shield    },
  { text: "No Preservatives or Additives", icon: Sparkles  },
]

const DEFAULT_STATS = [
  { value: "10,000+", label: "Happy Customers", icon: Heart      },
  { value: "50+",     label: "Premium Products", icon: Star      },
  { value: "4.8★",    label: "Customer Rating",  icon: TrendingUp },
]

const DEFAULT_TRUST = [
  { icon: "🌿", label: "USDA Organic Certified"  },
  { icon: "🧪", label: "Lab Tested & Verified"   },
  { icon: "🚚", label: "Free Delivery Over ₹999" },
  { icon: "↩️", label: "Easy 7-Day Returns"      },
  { icon: "🔒", label: "Secure Payments"         },
]

const DEFAULT_TICKER = [
  "100% Certified Organic","Lab-Tested Purity","Farm to Doorstep",
  "No Preservatives","Ayurvedic Heritage","10,000+ Happy Customers",
  "Chemical-Free Promise","Direct from Indian Farms",
]

const pills = [
  { emoji: "🌿", name: "Ayurvedic Herbs",    cls: "pill-tl" },
  { emoji: "🥜", name: "Premium Dry Fruits", cls: "pill-tr" },
  { emoji: "🌱", name: "Organic Seeds",      cls: "pill-bl" },
  { emoji: "🍃", name: "Fresh Tofu",         cls: "pill-br" },
]

export function HeroSection() {
  const { companydata } = useAuth()
  const extra = companydata?.extra_data || {}

  const benefits = DEFAULT_BENEFITS
  const stats: { value: string; label: string; icon: any }[] =
    extra.stats?.length ? extra.stats.map((s: any) => ({
      value: s.value,
      label: s.label,
      icon: [Heart, Star, TrendingUp][extra.stats.indexOf(s) % 3],
    })) : DEFAULT_STATS
  const trustItems: { icon: string; label: string }[] =
    extra.trust_items?.length ? extra.trust_items : DEFAULT_TRUST
  const tickerItems: string[] =
    extra.ticker?.length ? extra.ticker : DEFAULT_TICKER
  const tickerDoubled = [...tickerItems, ...tickerItems]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --forest:      #0f3d2e;
          --forest-mid:  #134d38;
          --emerald:     #10b981;
          --amber:       #f59e0b;
          --cream:       #fafaf5;
          --muted:       #6b7280;
          --card-bg:     rgba(255,255,255,0.72);
          --card-border: rgba(255,255,255,0.85);
        }

        .hero-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .hero-root { font-family: 'DM Sans', sans-serif; }

        /* ── Video background ── */
        .hero-video-wrap {
          position: absolute; inset: 0; z-index: 0;
          overflow: hidden; pointer-events: none;
        }
        .hero-video {
          position: absolute; top: 50%; left: 50%;
          min-width: 100%; min-height: 100%;
          width: auto; height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover; will-change: transform;
        }
        .hero-video-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(to bottom,
              rgba(10,28,20,0.72) 0%, rgba(10,28,20,0.30) 25%,
              rgba(10,28,20,0.18) 50%, rgba(10,28,20,0.35) 75%,
              rgba(10,28,20,0.65) 100%),
            linear-gradient(to right,
              rgba(8,24,16,0.60) 0%, rgba(8,24,16,0.25) 55%,
              rgba(8,24,16,0.05) 100%);
          z-index: 1;
        }

        /* ── Ticker ── */
        .ticker-wrap {
          position: absolute; top: 0; left: 0; right: 0; height: 36px;
          background: linear-gradient(90deg, rgba(5,18,12,0.85), rgba(10,30,20,0.85), rgba(5,18,12,0.85));
          overflow: hidden; display: flex; align-items: center;
          z-index: 20; backdrop-filter: blur(6px);
        }
        .ticker-wrap::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,.4), transparent);
        }
        .ticker-track {
          display: flex; gap: 40px; white-space: nowrap;
          animation: ticker 32s linear infinite; will-change: transform;
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-item {
          font-size: 10px; font-weight: 700; letter-spacing: .15em;
          text-transform: uppercase; color: rgba(167,243,208,.8);
          display: flex; align-items: center; gap: 10px;
        }
        .ticker-dot { color: #f59e0b; font-size: 8px; }

        /* ── Background blobs ── */
        .hero-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; }
        .blob { position: absolute; border-radius: 50%; filter: blur(90px); }
        .blob-1 { width:520px; height:520px; top:-120px; left:-120px; background: radial-gradient(circle, rgba(16,185,129,.10) 0%, transparent 70%); }
        .blob-2 { width:460px; height:460px; bottom:-100px; right:-80px; background: radial-gradient(circle, rgba(245,158,11,.08) 0%, transparent 70%); }
        .blob-3 { width:360px; height:360px; top:38%; right:28%; background: radial-gradient(circle, rgba(239,68,68,.04) 0%, transparent 70%); }
        .grid-lines {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(16,185,129,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.03) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* ── Layout ── */
        .hero-root { position: relative; min-height: 100svh; background: var(--cream); overflow: hidden; }
        .hero-inner {
          position: relative; z-index: 3;
          max-width: min(1600px, 100%); margin: 0 auto; padding: 80px 24px 24px;
          min-height: 100svh; display: flex; flex-direction: column; justify-content: center;
        }
        .hero-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        @media(min-width: 1024px) {
          .hero-inner { padding: 100px 48px 24px; }
          .hero-grid { grid-template-columns: 1fr 1fr; gap: 64px; }
        }

        /* ── Left column ── */
        .left-col { display: flex; flex-direction: column; align-items: center; text-align: center; }
        @media(min-width: 1024px) { .left-col { align-items: flex-start; text-align: left; } }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 18px; border-radius: 100px;
          background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.20);
          color: #d1fae5; font-size: 10px; font-weight: 700; letter-spacing: .18em;
          text-transform: uppercase; margin-bottom: 24px; backdrop-filter: blur(12px);
          position: relative; overflow: hidden; opacity: 0;
          animation: fadeUp .6s .15s ease forwards;
        }
        .eyebrow::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,.12) 0%, transparent 100%); pointer-events: none;
        }
        .dot-pulse { width: 7px; height: 7px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        .dot-green { background: var(--emerald); box-shadow: 0 0 6px rgba(16,185,129,.6); }
        .dot-amber { background: var(--amber);   box-shadow: 0 0 6px rgba(245,158,11,.6); }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.6; transform:scale(1.3); } }

        .headline-wrap { margin-bottom: 20px; opacity: 0; animation: fadeUp .75s .3s ease forwards; }
        .headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.6rem, 5.5vw, 5rem); line-height: 1.03; font-weight: 700;
          color: #f0fdf4; letter-spacing: -.01em; text-shadow: 0 2px 24px rgba(0,0,0,0.35);
        }
        .headline .grad {
          background: linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #2dd4bf 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; position: relative; display: inline-block;
        }
        .headline .grad::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 20%;
          height: 3px; border-radius: 2px; background: var(--amber);
          transform: scaleX(0); transform-origin: left; animation: scaleIn 1s .9s ease forwards;
        }
        @keyframes scaleIn { to { transform: scaleX(1); } }

        .description {
          color: rgba(209,250,229,0.85); font-size: clamp(.9rem,1.5vw,1.05rem);
          line-height: 1.7; max-width: 500px; margin-bottom: 28px;
          opacity: 0; animation: fadeUp .65s .5s ease forwards;
          text-shadow: 0 1px 8px rgba(0,0,0,0.3);
        }
        .description strong { color: #ffffff; font-weight: 600; }

        .benefits-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          width: 100%; max-width: 500px; margin-bottom: 32px;
          opacity: 0; animation: fadeUp .65s .65s ease forwards;
        }
        @media(max-width: 480px) { .benefits-grid { grid-template-columns: 1fr; } }
        .benefit-card {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px;
          background: rgba(255,255,255,0.10); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 2px 16px rgba(0,0,0,.15), inset 0 1px 1px rgba(255,255,255,.12);
          transition: transform .2s ease, box-shadow .2s ease; will-change: transform; cursor: default;
        }
        .benefit-card:hover { transform: translateY(-2px) translateX(3px); box-shadow: 0 8px 28px rgba(0,0,0,.20), inset 0 1px 1px rgba(255,255,255,.12); }
        .benefit-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 4px 12px rgba(5,150,105,.35);
        }
        .benefit-text { font-size: 12.5px; font-weight: 600; color: #ecfdf5; line-height: 1.3; }

        .cta-row {
          display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 36px;
          width: 100%; max-width: 500px; opacity: 0;
          animation: fadeUp .65s .8s ease forwards; justify-content: center;
        }
        @media(min-width: 1024px) { .cta-row { justify-content: flex-start; } }

        .btn-primary {
          position: relative; display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 28px; border-radius: 14px;
          background: linear-gradient(135deg, #059669 0%, #0f3d2e 100%);
          color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700;
          border: none; cursor: pointer; overflow: hidden; text-decoration: none;
          box-shadow: 0 4px 20px rgba(5,150,105,.40), inset 0 1px 1px rgba(255,255,255,.12);
          transition: transform .2s ease, box-shadow .2s ease; will-change: transform;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(5,150,105,.50), inset 0 1px 1px rgba(255,255,255,.12); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.18) 50%, transparent 70%);
          transform: translateX(-100%) skewX(-15deg); transition: transform .5s ease;
        }
        .btn-primary:hover::after { transform: translateX(120%) skewX(-15deg); }
        .arrow-icon { transition: transform .25s ease; }
        .btn-primary:hover .arrow-icon { transform: translateX(4px); }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 12px; padding: 13px 22px; border-radius: 14px;
          background: rgba(255,255,255,0.12); backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.25); color: #f0fdf4;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 2px 16px rgba(0,0,0,.12), inset 0 1px 1px rgba(255,255,255,.12);
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease; will-change: transform;
        }
        .btn-secondary:hover { transform: translateY(-2px); background: rgba(255,255,255,0.20); box-shadow: 0 8px 28px rgba(0,0,0,.18), inset 0 1px 1px rgba(255,255,255,.15); }
        .play-bubble { width:34px; height:34px; border-radius:50%; background:rgba(16,185,129,.25); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:inset 0 1px 1px rgba(255,255,255,.2); }
        .chevron-icon { transition: transform .25s ease; }
        .btn-secondary:hover .chevron-icon { transform: translateX(3px); }

        .stats-row { display:flex; flex-wrap:wrap; gap:20px 36px; justify-content:center; opacity:0; animation: fadeUp .65s 1s ease forwards; }
        @media(min-width:1024px) { .stats-row { justify-content:flex-start; } }
        .stat-item { display:flex; flex-direction:column; align-items:center; gap:2px; transition:transform .2s ease; cursor:default; }
        @media(min-width:1024px) { .stat-item { align-items:flex-start; } }
        .stat-item:hover { transform: scale(1.06); }
        .stat-val { font-family:'Cormorant Garamond',Georgia,serif; font-size:clamp(1.7rem,3vw,2.4rem); font-weight:700; color:#f0fdf4; line-height:1; display:flex; align-items:center; gap:6px; text-shadow:0 2px 12px rgba(0,0,0,0.3); }
        .stat-lbl { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(167,243,208,0.7); }

        /* ── Right column ── */
        .right-col { position:relative; height:420px; display:flex; align-items:center; justify-content:center; opacity:0; animation:fadeIn .9s .25s ease forwards; }
        @media(min-width:1024px) { .right-col { height:580px; } }

        .ring { position:absolute; border-radius:50%; border:1px dashed; top:50%; left:50%; transform:translate(-50%,-50%); will-change:transform; display:none; }
        @media(min-width:768px) { .ring { display:block; } }
        .ring-1 { width:380px; height:380px; border-color:rgba(16,185,129,.20); animation:spinCW 50s linear infinite; }
        .ring-2 { width:480px; height:480px; border-color:rgba(245,158,11,.15); animation:spinCCW 65s linear infinite; }
        @keyframes spinCW  { to { transform:translate(-50%,-50%) rotate(360deg);  } }
        @keyframes spinCCW { to { transform:translate(-50%,-50%) rotate(-360deg); } }

        .orb-wrap { position:relative; z-index:2; animation:float 6s ease-in-out infinite; will-change:transform; }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        .orb {
          width:220px; height:220px; border-radius:50%;
          background:linear-gradient(145deg,rgba(232,245,233,0.18) 0%,rgba(241,248,233,0.14) 50%,rgba(255,253,231,0.18) 100%);
          box-shadow:0 30px 80px rgba(16,185,129,.25),0 8px 32px rgba(0,0,0,.20),inset 0 1px 2px rgba(255,255,255,.30),inset 0 -1px 3px rgba(0,0,0,.10);
          display:flex; align-items:center; justify-content:center;
          position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.25); backdrop-filter:blur(20px);
        }
        @media(min-width:1024px) { .orb { width:300px; height:300px; } }
        .orb::before { content:''; position:absolute; top:0; left:10%; right:10%; height:45%; border-radius:50%; background:linear-gradient(180deg,rgba(255,255,255,.25) 0%,transparent 100%); pointer-events:none; }
        .orb-shine { position:absolute; inset:0; border-radius:50%; background:conic-gradient(from 0deg,transparent 55%,rgba(255,255,255,.30) 65%,rgba(255,255,255,.10) 75%,transparent 85%); animation:spinCW 8s linear infinite; will-change:transform; transform-origin:center center; }
        .orb-inner { position:relative; z-index:1; text-align:center; }
        .orb-disk { width:100px; height:100px; border-radius:50%; background:linear-gradient(145deg,#059669 0%,#0f3d2e 60%,#0d9488 100%); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; box-shadow:0 8px 32px rgba(5,150,105,.50),inset 0 1px 2px rgba(255,255,255,.15); position:relative; overflow:hidden; }
        @media(min-width:1024px) { .orb-disk { width:130px; height:130px; } }
        .orb-disk::before { content:''; position:absolute; inset:0; border-radius:50%; background:radial-gradient(ellipse at 35% 25%,rgba(255,255,255,.22) 0%,transparent 60%); }
        .orb-emoji { font-size:3rem; position:relative; z-index:1; }
        @media(min-width:1024px) { .orb-emoji { font-size:4rem; } }
        .orb-title { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; color:#f0fdf4; }
        @media(min-width:1024px) { .orb-title { font-size:15px; } }
        .orb-sub { font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#6ee7b7; margin-top:2px; }

        .pill { position:absolute; display:none; align-items:center; gap:10px; padding:10px 14px; border-radius:18px; background:rgba(255,255,255,0.12); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.22); box-shadow:0 8px 32px rgba(0,0,0,.18); min-width:160px; will-change:transform; transition:transform .25s ease,box-shadow .25s ease; cursor:default; overflow:hidden; z-index:3; }
        @media(min-width:1100px) { .pill { display:flex; } }
        .pill::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,.04) 30%,transparent 50%); pointer-events:none; border-radius:inherit; }
        .pill:hover { transform:translateY(-4px) scale(1.04); box-shadow:0 16px 48px rgba(0,0,0,.25); }
        .pill-tl { top:6%;  left:-2%;   animation:float 7s  1s   ease-in-out infinite; }
        .pill-tr { top:12%; right:-4%;  animation:float 6s  .5s  ease-in-out infinite; }
        .pill-bl { bottom:22%; left:-4%; animation:float 8s  .8s  ease-in-out infinite; }
        .pill-br { bottom:8%;  right:-2%; animation:float 6.5s 1.2s ease-in-out infinite; }
        .pill-dot { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; box-shadow:0 4px 16px rgba(16,185,129,.25); position:relative; z-index:1; }
        .pill-tl .pill-dot { background:linear-gradient(135deg,#6ee7b7,#10b981); }
        .pill-tr .pill-dot { background:linear-gradient(135deg,#fcd34d,#f59e0b); }
        .pill-bl .pill-dot { background:linear-gradient(135deg,#a7f3d0,#34d399); }
        .pill-br .pill-dot { background:linear-gradient(135deg,#99f6e4,#14b8a6); }
        .pill-info { position:relative; z-index:1; }
        .pill-name { font-size:12px; font-weight:700; color:#f0fdf4; line-height:1.3; }
        .pill-stars { display:flex; gap:1px; margin-top:3px; }

        .badge { position:absolute; z-index:4; display:none; align-items:center; gap:8px; padding:8px 14px; border-radius:100px; font-size:11px; font-weight:700; overflow:hidden; will-change:transform; transition:transform .2s ease; }
        @media(min-width:640px) { .badge { display:flex; } }
        .badge:hover { transform: scale(1.06); }
        .badge-hot { top:8%; right:3%; background:linear-gradient(135deg,#ef4444,#f97316); color:#fff; box-shadow:0 4px 20px rgba(239,68,68,.3); border:1px solid rgba(255,255,255,.2); animation:float 4s ease-in-out infinite; }
        .badge-hot::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,transparent 50%); }
        .badge-verified { bottom:32%; right:0; background:rgba(255,255,255,0.14); backdrop-filter:blur(20px); color:#f0fdf4; box-shadow:0 4px 24px rgba(0,0,0,.15),inset 0 1px 1px rgba(255,255,255,.2); border:1px solid rgba(255,255,255,0.22); animation:float 5s .5s ease-in-out infinite; }
        .badge-lab { top:38%; left:-2%; background:linear-gradient(135deg,rgba(5,150,105,0.85),rgba(15,61,46,0.85)); backdrop-filter:blur(16px); color:#d1fae5; box-shadow:0 4px 24px rgba(5,150,105,.30),inset 0 1px 1px rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.12); animation:float 5.5s .3s ease-in-out infinite; display:none; }
        @media(min-width:1024px) { .badge-lab { display:flex; } }
        .badge-icon { width:26px; height:26px; border-radius:50%; background:rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .mobile-badges { position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:5; }
        @media(min-width:640px) { .mobile-badges { display:none; } }
        .m-badge { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; font-size:10px; font-weight:700; border:1px solid rgba(255,255,255,.25); }

        /* ── Trust bar ── */
        .trust-bar { position:relative; z-index:10; background:linear-gradient(180deg,rgba(5,18,12,0.70) 0%,rgba(5,18,12,0.85) 100%); backdrop-filter:blur(20px); border-top:1px solid rgba(16,185,129,.15); padding:16px 0; margin-top:16px; }
        .trust-bar::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(16,185,129,.4),transparent); }
        .trust-inner { max-width:min(1600px,100%); margin:0 auto; padding:0 24px; }
        @media(min-width:1024px) { .trust-inner { padding:0 48px; } }
        .trust-desktop { display:none; align-items:center; justify-content:space-between; }
        @media(min-width:1024px) { .trust-desktop { display:flex; } }
        .trust-mobile { display:flex; align-items:center; gap:24px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
        .trust-mobile::-webkit-scrollbar { display:none; }
        @media(min-width:1024px) { .trust-mobile { display:none; } }
        .trust-item { display:flex; align-items:center; gap:8px; color:rgba(167,243,208,0.80); cursor:default; transition:transform .2s ease; white-space:nowrap; flex-shrink:0; }
        .trust-item:hover { transform: translateY(-1px); }
        .trust-emoji { font-size:1.1rem; }
        .trust-label { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
        .trust-sep { width:1px; height:20px; background:rgba(255,255,255,.12); }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @media(prefers-reduced-motion: reduce) { * { animation-duration:.01ms !important; transition-duration:.01ms !important; } }
      `}</style>

      <section className="hero-root">

        <div className="hero-video-wrap">
          <video className="hero-video" src="/videos/hero-bg.mp4" autoPlay muted loop playsInline preload="auto" poster="/videos/hero-bg-poster.jpg" />
          <div className="hero-video-overlay" />
        </div>

        <div className="ticker-wrap">
          <div className="ticker-track">
            {tickerDoubled.map((item, i) => (
              <span key={i} className="ticker-item">
                <span className="ticker-dot">✦</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-bg">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="grid-lines" />
        </div>

        <div className="hero-inner">
          <div className="hero-grid">

            <div className="left-col">
              <span className="eyebrow">
                <span className="dot-pulse dot-green" />
                Authentic Ayurvedic Products
                <span className="dot-pulse dot-amber" style={{ animationDelay: '.4s' }} />
              </span>

              <div className="headline-wrap">
                <h1 className="headline">
                  <span style={{ display: 'block' }}>Discover the</span>
                  <span style={{ display: 'block' }}>
                    <span className="grad">Ancient Wisdom</span>
                  </span>
                  <span style={{ display: 'block' }}>of Ayurveda</span>
                </h1>
              </div>

              <p className="description">
                Experience the healing power of nature with our premium collection of Ayurvedic herbs,
                dry fruits, dehydrated foods, and fresh tofu.{' '}
                <strong>Sourced directly from Indian farms</strong> and delivered to your doorstep.
              </p>

              <div className="benefits-grid">
                {benefits.map((b) => (
                  <div key={b.text} className="benefit-card">
                    <div className="benefit-icon">
                      <b.icon style={{ width: 16, height: 16, color: '#fff' }} />
                    </div>
                    <span className="benefit-text">{b.text}</span>
                  </div>
                ))}
              </div>

              <div className="cta-row">
                <Link href="/products" className="btn-primary">
                  Shop Now
                  <ArrowRight className="arrow-icon" style={{ width: 18, height: 18 }} />
                </Link>
                <Link href="/about" className="btn-secondary">
                  <span className="play-bubble">
                    <Play style={{ width: 13, height: 13, color: '#6ee7b7', fill: '#6ee7b7' }} />
                  </span>
                  Watch Our Story
                  <ChevronRight className="chevron-icon" style={{ width: 16, height: 16 }} />
                </Link>
              </div>

              <div className="stats-row">
                {stats.map((s) => (
                  <div key={s.label} className="stat-item">
                    <div className="stat-val">
                      <s.icon style={{ width: 16, height: 16, color: 'var(--emerald)' }} />
                      {s.value}
                    </div>
                    <div className="stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="right-col">
              <div className="ring ring-1" />
              <div className="ring ring-2" />

              <div className="orb-wrap">
                <div className="orb">
                  <div className="orb-shine" />
                  <div className="orb-inner">
                    <div className="orb-disk">
                      <span className="orb-emoji">🌿</span>
                    </div>
                    <div className="orb-title">Premium Quality</div>
                    <div className="orb-sub">100% Organic</div>
                  </div>
                </div>
              </div>

              {pills.map((p) => (
                <div key={p.name} className={`pill ${p.cls}`}>
                  <div className="pill-dot">{p.emoji}</div>
                  <div className="pill-info">
                    <div className="pill-name">{p.name}</div>
                    <div className="pill-stars">
                      {[...Array(5)].map((_, k) => (
                        <Star key={k} style={{ width: 9, height: 9, fill: '#f59e0b', color: '#f59e0b' }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="badge badge-hot">
                <span style={{ position: 'relative', zIndex: 1 }}>🔥</span>
                <span style={{ position: 'relative', zIndex: 1 }}>Bestsellers</span>
              </div>
              <div className="badge badge-verified">
                <div className="badge-icon" style={{ background: 'rgba(16,185,129,.20)' }}>
                  <Shield style={{ width: 13, height: 13, color: '#6ee7b7' }} />
                </div>
                100% Verified
              </div>
              <div className="badge badge-lab">
                <span>🧪</span>
                Lab Tested
              </div>

              <div className="mobile-badges">
                {[
                  { emoji: '🔥', label: 'Bestsellers', bg: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff' },
                  { emoji: '🧪', label: 'Lab Tested',  bg: 'linear-gradient(135deg,#059669,#0f3d2e)', color: '#d1fae5' },
                  { emoji: '✅', label: 'Verified',    bg: 'rgba(255,255,255,.15)',                   color: '#f0fdf4' },
                ].map((b, i) => (
                  <div key={i} className="m-badge" style={{ background: b.bg, color: b.color }}>
                    <span>{b.emoji}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="trust-bar">
          <div className="trust-inner">
            <div className="trust-desktop">
              {trustItems.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="trust-item">
                    <span className="trust-emoji">{t.icon}</span>
                    <span className="trust-label">{t.label}</span>
                  </div>
                  {i < trustItems.length - 1 && <div className="trust-sep" />}
                </div>
              ))}
            </div>
            <div className="trust-mobile">
              {trustItems.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <div className="trust-item">
                    <span className="trust-emoji">{t.icon}</span>
                    <span className="trust-label">{t.label}</span>
                  </div>
                  {i < trustItems.length - 1 && <div className="trust-sep" />}
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </>
  )
}
