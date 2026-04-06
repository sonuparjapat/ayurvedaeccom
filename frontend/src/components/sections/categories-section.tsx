'use client';
 
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth, type Category } from '@/context/auth-context';
import { cn } from '@/lib/utils';
 
/* ─────────────────────────────────────────────
   THEME PALETTE  — earthy, premium, on-brand
───────────────────────────────────────────── */
const THEMES = [
  {
    name: 'forest',
    accent: '#0f3d2e',
    light: '#e8f5e9',
    pill: 'bg-emerald-50 text-emerald-800',
    tag: 'Herbs & Botanicals',
    tagBg: 'bg-emerald-100',
    iconRing: 'from-emerald-400 to-[#0f3d2e]',
    border: '#bbf7d0',
    shine: 'rgba(16,185,129,0.12)',
  },
  {
    name: 'amber',
    accent: '#92400e',
    light: '#fffbeb',
    pill: 'bg-amber-50 text-amber-800',
    tag: 'Dry Fruits & Nuts',
    tagBg: 'bg-amber-100',
    iconRing: 'from-amber-400 to-orange-600',
    border: '#fde68a',
    shine: 'rgba(245,158,11,0.12)',
  },
  {
    name: 'teal',
    accent: '#134e4a',
    light: '#f0fdfa',
    pill: 'bg-teal-50 text-teal-800',
    tag: 'Seeds & Grains',
    tagBg: 'bg-teal-100',
    iconRing: 'from-teal-400 to-cyan-600',
    border: '#99f6e4',
    shine: 'rgba(20,184,166,0.12)',
  },
  {
    name: 'saffron',
    accent: '#7c2d12',
    light: '#fff7ed',
    pill: 'bg-orange-50 text-orange-800',
    tag: 'Dehydrated & Tofu',
    tagBg: 'bg-orange-100',
    iconRing: 'from-orange-400 to-red-500',
    border: '#fed7aa',
    shine: 'rgba(249,115,22,0.12)',
  },
];
 
/* ─────────────────────────────────────────────
   CATEGORY CARD
───────────────────────────────────────────── */
function CategoryCard({
  category,
  theme,
  index,
}: {
  category: Category;
  theme: typeof THEMES[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
 
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    setTilt({ x: rx, y: ry });
  };
 
  const reset = () => { setTilt({ x: 0, y: 0 }); setHovered(false); };
 
  return (
    <div
      className="animate-fadeUp"
      style={{ animationDelay: `${index * 110}ms`, animationFillMode: 'both' }}
    >
      <a href={`/category/${category?.id}`} className="block h-full">
        {/* outer glow */}
        <div
          className="relative h-full rounded-2xl transition-all duration-500"
          style={{
            boxShadow: hovered
              ? `0 0 0 1.5px ${theme.border}, 0 20px 60px ${theme.shine}, 0 8px 24px rgba(0,0,0,0.07)`
              : `0 0 0 1px ${theme.border}60, 0 4px 20px rgba(0,0,0,0.05)`,
          }}
        >
          <div
            ref={cardRef}
            className="relative h-full rounded-2xl overflow-hidden cursor-pointer bg-white"
            style={{
              transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.025 : 1})`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={reset}
          >
            {/* top color strip */}
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${theme.iconRing}`}
            />
 
            {/* tinted bg on hover */}
            <div
              className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at top left, ${theme.shine} 0%, transparent 65%)`,
                opacity: hovered ? 1 : 0,
              }}
            />
 
            {/* shimmer sweep */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }}
            >
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.55) 50%,transparent 65%)',
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
 
            {/* ── card body ── */}
            <div className="relative p-6 flex flex-col h-full" style={{ transformStyle: 'preserve-3d' }}>
 
              {/* tag pill */}
              <span
                className={cn('self-start text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5', theme.tagBg, 'text-gray-600')}
                style={{ transform: 'translateZ(12px)' }}
              >
                {theme.tag}
              </span>
 
              {/* emoji / icon */}
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md text-4xl',
                  `bg-gradient-to-br ${theme.iconRing}`,
                )}
                style={{
                  transform: `translateZ(30px) scale(${hovered ? 1.08 : 1})`,
                  transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
                  boxShadow: `0 8px 24px ${theme.shine}`,
                }}
              >
                {category.image}
              </div>
 
              {/* name */}
              <h3
                className="text-xl font-black text-gray-900 mb-2 leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  transform: 'translateZ(20px)',
                  color: theme.accent,
                }}
              >
                {category.name}
              </h3>
 
              {/* description */}
              <p
                className="text-gray-500 text-sm leading-relaxed flex-grow mb-6"
                style={{ transform: 'translateZ(10px)' }}
              >
                {category.description}
              </p>
 
              {/* footer row */}
              <div
                className="flex items-center justify-between pt-4 border-t border-gray-100"
                style={{ transform: 'translateZ(16px)' }}
              >
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: theme.light, color: theme.accent }}
                >
                  {category.product_count} Products
                </span>
 
                <Link href={`/category/${category.id}`} onClick={e => e.stopPropagation()}>
                  <button
                    className="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5 transition-all duration-200"
                    style={{
                      background: hovered ? theme.accent : 'transparent',
                      color: hovered ? '#fff' : theme.accent,
                      border: `1.5px solid ${theme.accent}40`,
                    }}
                  >
                    Explore
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
 
              {/* decorative corner dot */}
              <div
                className="absolute bottom-4 right-4 w-16 h-16 rounded-full blur-2xl pointer-events-none transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, ${theme.shine} 0%, transparent 70%)`,
                  opacity: hovered ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
 
/* ─────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */
function SectionHeader() {
  return (
    <div className="relative text-center mb-20 animate-fadeUp" style={{ animationDelay: '0ms' }}>
      {/* eyebrow */}
      <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#0f3d2e]/6 border border-[#0f3d2e]/12 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold tracking-[0.18em] uppercase text-[#0f3d2e]">
          Discover Premium Categories
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      </div>
 
      {/* headline */}
      <h2
        className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f3d2e] mb-5 leading-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Shop by{' '}
        <span className="relative inline-block">
          <span className="relative z-10">Category</span>
          <svg
            className="absolute -bottom-2 left-0 w-full"
            viewBox="0 0 280 12"
            preserveAspectRatio="none"
            height="10"
          >
            <path
              d="M2,8 Q70,2 140,8 Q210,14 278,6"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 300,
                strokeDashoffset: 0,
                animation: 'drawLine 1s ease-out 0.6s both',
              }}
            />
          </svg>
        </span>
      </h2>
 
      <p className="text-gray-500 text-base lg:text-lg max-w-xl mx-auto leading-relaxed">
        Each collection curated for your holistic health journey —
        straight from Indian farms to your doorstep.
      </p>
 
      {/* decorative line */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#0f3d2e]/20" />
        <span className="text-lg">🌿</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#0f3d2e]/20" />
      </div>
    </div>
  );
}
 
/* ─────────────────────────────────────────────
   BACKGROUND
───────────────────────────────────────────── */
function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* base */}
      <div className="absolute inset-0 bg-[#fafaf7]" />
      {/* mesh blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[80px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-teal-50/60 blur-[80px]" />
      {/* fine grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(15,61,46,0.4) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(15,61,46,0.4) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* noise */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}
 
/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export function CategoriesSection() {
  const { categoriesdata } = useAuth();
 
  if (!categoriesdata?.rows?.length) return null;
 
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <Background />
 
      <div className="relative max-w-7xl mx-auto">
        <SectionHeader />
 
        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesdata.rows.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              theme={THEMES[index % THEMES.length]}
              index={index}
            />
          ))}
        </div>
 
        {/* bottom CTA strip */}
        <div
          className="mt-16 animate-fadeUp flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-6 rounded-2xl border border-[#0f3d2e]/10 bg-white/70 backdrop-blur-sm shadow-sm"
          style={{ animationDelay: '500ms' }}
        >
          <div>
            <p className="text-sm font-bold text-[#0f3d2e] tracking-wide">Can't decide?</p>
            <p className="text-gray-500 text-sm">Browse all products across every category in one place.</p>
          </div>
          <Link href="/products">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f3d2e] text-white text-sm font-bold hover:bg-emerald-800 transition-colors shadow-lg hover:shadow-emerald-900/20">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
 
      {/* ── global keyframes ── */}
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fadeUp {
          animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards;
          opacity: 0;
        }
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.8s ease-in-out infinite;
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 300; }
          to   { stroke-dashoffset: 0;   }
        }
      `}</style>
    </section>
  );
}
 
export default CategoriesSection;
 