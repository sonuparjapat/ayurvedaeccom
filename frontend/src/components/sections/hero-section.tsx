'use client'
 
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
 
/* ─────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────── */
interface Benefit { text: string; symbol: string }
interface Product { emoji: string; name: string; pos: string }
interface Stat     { value: string; label: string }
 
const benefits: Benefit[] = [
  { text: "100% Natural & Organic",          symbol: "✦" },
  { text: "Traditional Ayurvedic Recipes",   symbol: "❋" },
  { text: "Sourced Directly from Farms",     symbol: "◈" },
  { text: "No Preservatives or Additives",   symbol: "◉" },
]
 
const products: Product[] = [
  { emoji: "🌿", name: "Ayurvedic Herbs",    pos: "top-left"     },
  { emoji: "🥜", name: "Premium Dry Fruits", pos: "top-right"    },
  { emoji: "🌱", name: "Organic Seeds",      pos: "bottom-left"  },
  { emoji: "🍃", name: "Fresh Tofu",         pos: "bottom-right" },
]
 
const stats: Stat[] = [
  { value: "10,000+", label: "Happy Customers" },
  { value: "50+",     label: "Premium Products" },
  { value: "4.8★",    label: "Avg. Rating"       },
]
 
const marqueeItems = [
  "100% Certified Organic", "Lab-Tested Purity", "Farm to Doorstep",
  "No Preservatives", "Ayurvedic Heritage", "10,000+ Happy Customers",
  "Chemical-Free Promise", "Direct from Indian Farms",
]
 
/* ─────────────────────────────────────────────
   CSS (injected once via <style>)
   All animations use transform/opacity only → GPU composited, zero layout thrash
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
 
  /* ── Keyframes ── */
  @keyframes hero-float   { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-14px)} }
  @keyframes hero-spin    { to{transform:rotate(360deg)} }
  @keyframes hero-spin-r  { to{transform:rotate(-360deg)} }
  @keyframes hero-pulse   { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
  @keyframes hero-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes hero-fadein  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hero-slidein { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes hero-scaler  { from{opacity:0;transform:scale(.82)} to{opacity:1;transform:scale(1)} }
  @keyframes hero-ripple  { to{transform:scale(2.4);opacity:0} }
  @keyframes hero-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes hero-wave    { 0%,100%{d:path("M0,32 C240,56 480,8 720,32 C840,44 936,18 1200,32 L1200,64 L0,64Z")} 50%{d:path("M0,32 C240,8 480,56 720,32 C840,18 936,44 1200,32 L1200,64 L0,64Z")} }
  @keyframes hero-dot-b   { 0%,100%{opacity:.5} 50%{opacity:1} }
 
  /* ── Root vars ── */
  .hero-root {
    --forest:  #0d3424;
    --forest2: #165c3c;
    --leaf:    #1db96b;
    --leaf2:   #10b981;
    --amber:   #f59e0b;
    --sand:    #fef3e2;
    --cream:   #fafaf5;
    --text1:   #111810;
    --text2:   #4a5a4e;
    --text3:   #7a8f80;
    --white:   #ffffff;
    font-family: 'DM Sans', sans-serif;
  }
 
  /* ── Layout ── */
  .hero-root          { position:relative; min-height:100svh; overflow:hidden; background:var(--cream); }
  .hero-ticker        { position:absolute; top:0; left:0; right:0; height:36px; background:var(--forest); z-index:20; display:flex; align-items:center; overflow:hidden; }
  .hero-ticker-track  { display:flex; gap:0; white-space:nowrap; animation:hero-marquee 32s linear infinite; }
  .hero-ticker-track:hover{ animation-play-state:paused }
  .hero-ticker-item   { display:inline-flex; align-items:center; gap:10px; padding:0 28px; font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:rgba(209,250,229,.75); }
  .hero-ticker-dot    { width:5px; height:5px; border-radius:50%; background:var(--amber); flex-shrink:0; }
 
  .hero-grid-bg       { position:absolute; inset:0; pointer-events:none; background-image:linear-gradient(rgba(16,185,129,.04) 1px, transparent 1px),linear-gradient(90deg,rgba(16,185,129,.04) 1px,transparent 1px); background-size:52px 52px; }
 
  /* Static gradient blobs – no animation, no blur jank */
  .hero-blob1         { position:absolute; top:-80px; left:-80px; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle, rgba(16,185,129,.13) 0%, transparent 70%); pointer-events:none; }
  .hero-blob2         { position:absolute; bottom:-80px; right:-60px; width:440px; height:440px; border-radius:50%; background:radial-gradient(circle, rgba(245,158,11,.10) 0%, transparent 70%); pointer-events:none; }
 
  .hero-container     { position:relative; max-width:1280px; margin:0 auto; padding:100px 24px 80px; min-height:100svh; display:flex; align-items:center; }
  .hero-cols          { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; width:100%; }
 
  /* ── Left column ── */
  .hero-badge         { display:inline-flex; align-items:center; gap:8px; padding:6px 16px; border-radius:999px; border:1px solid rgba(13,52,36,.15); background:rgba(13,52,36,.05); font-size:11px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--forest); margin-bottom:28px; animation:hero-fadein .5s ease both; animation-delay:.1s; }
  .hero-badge-dot     { width:7px; height:7px; border-radius:50%; background:var(--leaf); animation:hero-dot-b 2s ease infinite; }
 
  .hero-headline      { font-family:'Cormorant Garamond',Georgia,serif; line-height:1.01; font-weight:700; color:var(--forest); margin:0 0 24px; animation:hero-fadein .7s ease both; animation-delay:.25s; }
  .hero-headline span.accent {
    background: linear-gradient(135deg, var(--leaf2) 0%, var(--forest2) 60%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    position:relative; display:inline-block;
  }
  .hero-underline     { position:absolute; bottom:-4px; left:0; width:100%; height:3px; background:var(--amber); border-radius:2px; transform-origin:left; animation:hero-scaler .8s ease both; animation-delay:1s; }
 
  .hero-desc          { font-size:15px; line-height:1.75; color:var(--text2); max-width:460px; margin:0 0 32px; animation:hero-fadein .6s ease both; animation-delay:.4s; }
  .hero-desc strong   { color:var(--forest); font-weight:600; }
 
  /* Benefits grid */
  .hero-benefits      { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:36px; animation:hero-fadein .6s ease both; animation-delay:.55s; }
  .hero-benefit       { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:12px; background:rgba(255,255,255,.75); border:1px solid rgba(13,52,36,.08); transition:transform .2s ease, box-shadow .2s ease; cursor:default; }
  .hero-benefit:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(13,52,36,.08); }
  .hero-benefit-icon  { width:34px; height:34px; border-radius:9px; background:var(--forest); display:flex; align-items:center; justify-content:center; font-size:14px; color:rgba(209,250,229,.9); flex-shrink:0; }
  .hero-benefit-text  { font-size:12.5px; font-weight:600; color:var(--text1); }
 
  /* CTAs */
  .hero-ctas          { display:flex; gap:12px; margin-bottom:44px; animation:hero-fadein .6s ease both; animation-delay:.7s; }
  .hero-btn-primary   { position:relative; display:inline-flex; align-items:center; gap:8px; padding:14px 28px; border-radius:12px; background:var(--forest); color:var(--white); font-size:14px; font-weight:600; text-decoration:none; border:none; cursor:pointer; overflow:hidden; transition:transform .15s ease, box-shadow .2s ease; box-shadow:0 4px 18px rgba(13,52,36,.25); }
  .hero-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(13,52,36,.35); }
  .hero-btn-primary:active{ transform:translateY(0); }
  .hero-btn-shine     { position:absolute; inset:0; background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.15) 50%,transparent 70%); background-size:200% 100%; background-position:200% center; transition:background-position .5s ease; pointer-events:none; }
  .hero-btn-primary:hover .hero-btn-shine { background-position:-200% center; }
  .hero-btn-arrow     { display:inline-block; transition:transform .2s ease; }
  .hero-btn-primary:hover .hero-btn-arrow { transform:translateX(4px); }
 
  .hero-btn-secondary { display:inline-flex; align-items:center; gap:10px; padding:14px 24px; border-radius:12px; background:rgba(255,255,255,.8); color:var(--forest); font-size:14px; font-weight:600; text-decoration:none; border:1.5px solid rgba(13,52,36,.15); transition:transform .15s ease, background .2s ease, box-shadow .2s ease; }
  .hero-btn-secondary:hover { background:rgba(255,255,255,1); transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.06); }
  .hero-btn-play      { width:34px; height:34px; border-radius:50%; background:rgba(13,52,36,.08); display:flex; align-items:center; justify-content:center; font-size:11px; }
 
  /* Stats */
  .hero-stats         { display:flex; gap:36px; animation:hero-fadein .6s ease both; animation-delay:.85s; }
  .hero-stat-val      { font-family:'Cormorant Garamond',Georgia,serif; font-size:36px; font-weight:700; color:var(--forest); line-height:1; }
  .hero-stat-label    { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); margin-top:3px; }
  .hero-stat-divider  { width:1px; height:40px; background:rgba(13,52,36,.12); align-self:center; }
 
  /* ── Right column ── */
  .hero-visual        { position:relative; display:flex; align-items:center; justify-content:center; height:560px; animation:hero-scaler .8s ease both; animation-delay:.2s; }
 
  /* Orbit rings – CSS only, no JS */
  .hero-orbit         { position:absolute; top:50%; left:50%; border-radius:50%; border:1px dashed; transform-origin:center; }
  .hero-orbit-1       { width:260px; height:260px; margin:-130px 0 0 -130px; border-color:rgba(16,185,129,.15); animation:hero-spin 48s linear infinite; }
  .hero-orbit-2       { width:340px; height:340px; margin:-170px 0 0 -170px; border-color:rgba(245,158,11,.12); animation:hero-spin-r 60s linear infinite; }
  .hero-orbit-3       { width:420px; height:420px; margin:-210px 0 0 -210px; border-color:rgba(16,185,129,.09); animation:hero-spin 80s linear infinite; }
 
  /* Orb */
  .hero-orb-wrap      { position:relative; z-index:5; animation:hero-float 5s ease-in-out infinite; will-change:transform; }
  .hero-orb           { width:220px; height:220px; border-radius:50%; background:linear-gradient(145deg, #e8f5e9 0%, #f1f8e9 50%, #fffde7 100%); border:1.5px solid rgba(255,255,255,.9); box-shadow:0 24px 64px rgba(16,185,129,.18), inset 0 1px 2px rgba(255,255,255,.95); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
  .hero-orb-highlight { position:absolute; top:0; left:8%; right:8%; height:50%; border-radius:50%; background:linear-gradient(180deg,rgba(255,255,255,.65) 0%,transparent 100%); pointer-events:none; }
  .hero-orb-inner     { width:110px; height:110px; border-radius:50%; background:linear-gradient(145deg,var(--forest) 0%,var(--forest2) 100%); display:flex; align-items:center; justify-content:center; position:relative; box-shadow:0 8px 28px rgba(13,52,36,.35); }
  .hero-orb-inner-hl  { position:absolute; inset:0; border-radius:50%; background:radial-gradient(ellipse at 35% 28%, rgba(255,255,255,.18) 0%, transparent 60%); }
  .hero-orb-emoji     { font-size:44px; position:relative; z-index:1; }
  .hero-orb-text      { position:absolute; bottom:20px; text-align:center; }
  .hero-orb-label     { font-size:12px; font-weight:700; color:var(--text1); }
  .hero-orb-sub       { font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--forest2); }
 
  /* Orbit dots */
  .hero-orbit-dot     { position:absolute; top:50%; left:50%; width:10px; height:10px; border-radius:50%; margin:-5px 0 0 -5px; }
 
  /* Product pills */
  .hero-pill          { position:absolute; z-index:10; display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:16px; background:rgba(255,255,255,.92); border:1px solid rgba(255,255,255,.9); box-shadow:0 6px 24px rgba(0,0,0,.07); transition:transform .2s ease; animation:hero-float linear infinite; will-change:transform; }
  .hero-pill:hover    { transform:scale(1.05) translateY(-4px) !important; }
  .hero-pill-top-l    { top:8%;  left:-2%; animation-duration:4.2s; animation-delay:0s; }
  .hero-pill-top-r    { top:10%; right:-2%; animation-duration:3.8s; animation-delay:.4s; }
  .hero-pill-bot-l    { bottom:20%; left:-4%; animation-duration:4.5s; animation-delay:.8s; }
  .hero-pill-bot-r    { bottom:8%;  right:-2%; animation-duration:3.6s; animation-delay:.2s; }
  .hero-pill-icon     { width:38px; height:38px; border-radius:10px; background:var(--forest); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .hero-pill-name     { font-size:12px; font-weight:700; color:var(--text1); white-space:nowrap; }
  .hero-pill-stars    { font-size:9px; color:var(--amber); letter-spacing:1px; margin-top:1px; }
 
  /* Floating badges */
  .hero-badge-fire    { position:absolute; top:14%; right:4%; z-index:10; display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:999px; background:linear-gradient(135deg,#ef4444,#f97316); color:#fff; font-size:11px; font-weight:700; box-shadow:0 4px 16px rgba(239,68,68,.3); animation:hero-float 3s ease-in-out infinite; animation-delay:.5s; }
  .hero-badge-verify  { position:absolute; bottom:28%; right:0%; z-index:10; display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:999px; background:rgba(255,255,255,.92); color:var(--text1); font-size:11px; font-weight:700; border:1px solid rgba(255,255,255,.9); box-shadow:0 4px 16px rgba(0,0,0,.07); animation:hero-float 3.5s ease-in-out infinite; animation-delay:1s; }
  .hero-badge-lab     { position:absolute; top:36%; left:0%; z-index:10; display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:999px; background:var(--forest); color:rgba(209,250,229,.9); font-size:11px; font-weight:700; box-shadow:0 4px 16px rgba(13,52,36,.3); animation:hero-float 4s ease-in-out infinite; animation-delay:.2s; }
 
  /* ── Trust bar ── */
  .hero-trust         { position:relative; z-index:10; background:rgba(255,255,255,.7); border-top:1px solid rgba(13,52,36,.07); padding:16px 0; }
  .hero-trust-inner   { max-width:1280px; margin:0 auto; padding:0 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; overflow-x:auto; scrollbar-width:none; }
  .hero-trust-inner::-webkit-scrollbar { display:none; }
  .hero-trust-item    { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .hero-trust-text    { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text2); white-space:nowrap; }
  .hero-trust-divider { width:1px; height:20px; background:rgba(13,52,36,.1); flex-shrink:0; }
 
  /* ── Wave ── */
  .hero-wave          { position:absolute; bottom:0; left:0; right:0; height:60px; pointer-events:none; }
  .hero-wave path     { animation:hero-wave 9s ease-in-out infinite; }
 
  /* ── Responsive ── */
  @media (max-width:1024px) {
    .hero-cols        { grid-template-columns:1fr; gap:32px; padding-top:60px; text-align:center; }
    .hero-visual      { height:380px; }
    .hero-benefits    { max-width:440px; margin-left:auto; margin-right:auto; }
    .hero-ctas        { justify-content:center; }
    .hero-stats       { justify-content:center; }
    .hero-orb         { width:170px; height:170px; }
    .hero-orb-inner   { width:85px; height:85px; }
    .hero-orb-emoji   { font-size:34px; }
    .hero-orbit-1     { width:200px; height:200px; margin:-100px 0 0 -100px; }
    .hero-orbit-2     { width:260px; height:260px; margin:-130px 0 0 -130px; }
    .hero-orbit-3     { width:320px; height:320px; margin:-160px 0 0 -160px; }
    .hero-pill-top-l, .hero-pill-bot-l { left:-6%; }
    .hero-pill-top-r, .hero-pill-bot-r { right:-6%; }
    .hero-badge-fire  { top:4%; right:2%; }
    .hero-badge-verify{ right:-2%; }
    .hero-badge-lab   { left:-2%; }
    .hero-desc        { margin-left:auto; margin-right:auto; }
  }
 
  @media (max-width:640px) {
    .hero-container   { padding:80px 16px 60px; }
    .hero-benefits    { grid-template-columns:1fr; }
    .hero-ctas        { flex-direction:column; align-items:center; }
    .hero-btn-primary, .hero-btn-secondary { width:100%; justify-content:center; max-width:300px; }
    .hero-stats       { gap:20px; }
    .hero-stat-val    { font-size:28px; }
    .hero-visual      { height:320px; }
    .hero-pill        { display:none; }
    .hero-badge-fire  { font-size:10px; padding:6px 10px; }
    .hero-badge-lab   { font-size:10px; padding:6px 10px; }
    .hero-badge-verify{ font-size:10px; padding:6px 10px; }
    .hero-orb         { width:150px; height:150px; }
    .hero-orb-inner   { width:75px; height:75px; }
    .hero-orb-emoji   { font-size:28px; }
    .hero-orbit-1     { width:170px; height:170px; margin:-85px 0 0 -85px; }
    .hero-orbit-2     { width:220px; height:220px; margin:-110px 0 0 -110px; }
    .hero-orbit-3     { width:270px; height:270px; margin:-135px 0 0 -135px; }
  }
 
  /* font-size fluid */
  .fs-hero { font-size: clamp(2.8rem, 5.5vw, 5.2rem); }
 
  /* Pill only on desktop */
  @media (max-width:1024px) {
    .hero-pill-top-l, .hero-pill-top-r, .hero-pill-bot-l, .hero-pill-bot-r { display:none; }
  }
`
 
/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(true) }, [])
 
  // Orbit dot positions (evenly spaced, static)
  const orbitDots = [
    { angle: 0,   r: 128, color: '#10b981' },
    { angle: 90,  r: 168, color: '#f59e0b' },
    { angle: 180, r: 128, color: '#10b981' },
    { angle: 270, r: 168, color: '#f59e0b' },
  ]
 
  const marqueeDouble = [...marqueeItems, ...marqueeItems]
 
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
 
      <section className="hero-root">
 
        {/* ── Ticker ── */}
        <div className="hero-ticker">
          <div className="hero-ticker-track">
            {marqueeDouble.map((item, i) => (
              <span key={i} className="hero-ticker-item">
                <span className="hero-ticker-dot" />
                {item}
              </span>
            ))}
          </div>
        </div>
 
        {/* ── Backgrounds (static, no blur) ── */}
        <div className="hero-blob1" />
        <div className="hero-blob2" />
        <div className="hero-grid-bg" />
 
        {/* ── Main layout ── */}
        <div className="hero-container">
          <div className="hero-cols">
 
            {/* ════ LEFT ════ */}
            <div>
              {/* Badge */}
              <div>
                <span className="hero-badge">
                  <span className="hero-badge-dot" />
                  Authentic Ayurvedic Products
                </span>
              </div>
 
              {/* Headline */}
              <h1 className="hero-headline fs-hero">
                Discover the<br />
                <span className="accent">
                  Ancient Wisdom
                  <span className="hero-underline" />
                </span>
                <br />of Ayurveda
              </h1>
 
              {/* Description */}
              <p className="hero-desc">
                Experience the healing power of nature with our premium collection of Ayurvedic
                herbs, dry fruits, dehydrated foods, and fresh tofu.{' '}
                <strong>Sourced directly from Indian farms</strong> and delivered to your doorstep.
              </p>
 
              {/* Benefits */}
              <div className="hero-benefits">
                {benefits.map((b) => (
                  <div key={b.text} className="hero-benefit">
                    <div className="hero-benefit-icon">{b.symbol}</div>
                    <span className="hero-benefit-text">{b.text}</span>
                  </div>
                ))}
              </div>
 
              {/* CTAs */}
              <div className="hero-ctas">
                <Link href="/products" className="hero-btn-primary">
                  <span className="hero-btn-shine" />
                  Shop Now
                  <span className="hero-btn-arrow">→</span>
                </Link>
                <Link href="/about" className="hero-btn-secondary">
                  <span className="hero-btn-play">▶</span>
                  Watch Our Story
                </Link>
              </div>
 
              {/* Stats */}
              <div className="hero-stats">
                {stats.map((s, i) => (
                  <>
                    {i > 0 && <div key={`div-${i}`} className="hero-stat-divider" />}
                    <div key={s.label}>
                      <div className="hero-stat-val">{s.value}</div>
                      <div className="hero-stat-label">{s.label}</div>
                    </div>
                  </>
                ))}
              </div>
            </div>
 
            {/* ════ RIGHT ════ */}
            <div className="hero-visual">
 
              {/* Orbit rings */}
              <div className="hero-orbit hero-orbit-1" />
              <div className="hero-orbit hero-orbit-2" />
              <div className="hero-orbit hero-orbit-3" />
 
              {/* Central orb */}
              <div className="hero-orb-wrap">
                <div className="hero-orb">
                  <div className="hero-orb-highlight" />
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <div className="hero-orb-inner">
                      <div className="hero-orb-inner-hl" />
                      <span className="hero-orb-emoji">🌿</span>
                    </div>
                    <div className="hero-orb-text">
                      <div className="hero-orb-label">Premium Quality</div>
                      <div className="hero-orb-sub">100% Organic</div>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Product pills */}
              {products.map((p) => (
                <div
                  key={p.name}
                  className={`hero-pill hero-pill-${p.pos === 'top-left' ? 'top-l' : p.pos === 'top-right' ? 'top-r' : p.pos === 'bottom-left' ? 'bot-l' : 'bot-r'}`}
                >
                  <div className="hero-pill-icon">{p.emoji}</div>
                  <div>
                    <div className="hero-pill-name">{p.name}</div>
                    <div className="hero-pill-stars">★★★★★</div>
                  </div>
                </div>
              ))}
 
              {/* Floating badges */}
              <div className="hero-badge-fire mt-8">🔥 Bestsellers</div>
              <div className="hero-badge-lab">🧪 Lab Tested</div>
              <div className="hero-badge-verify">✅ 100% Verified</div>
            </div>
 
          </div>
        </div>
 
        {/* ── Trust bar ── */}
        <div className="hero-trust">
          <div className="hero-trust-inner">
            {[
              { icon: "🌿", label: "USDA Organic Certified" },
              { icon: "🧪", label: "Lab Tested & Verified" },
              { icon: "🚚", label: "Free Delivery Over ₹999" },
              { icon: "↩️", label: "Easy 7-Day Returns" },
              { icon: "🔒", label: "Secure Payments" },
            ].map((t, i, arr) => (
              <>
                <div key={t.label} className="hero-trust-item">
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span className="hero-trust-text">{t.label}</span>
                </div>
                {i < arr.length - 1 && <div key={`d-${i}`} className="hero-trust-divider" />}
              </>
            ))}
          </div>
        </div>
 
        {/* ── Wave ── */}
        <div className="hero-wave">
          <svg viewBox="0 0 1200 64" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
            <path
              d="M0,32 C240,56 480,8 720,32 C840,44 936,18 1200,32 L1200,64 L0,64Z"
              fill="rgba(255,255,255,0.8)"
            />
          </svg>
        </div>
 
      </section>
    </>
  )
}