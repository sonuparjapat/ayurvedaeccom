'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth, type Category } from '@/context/auth-context';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   THEME PALETTE
───────────────────────────────────────────── */
const THEMES = [
  {
    name: 'forest',
    accent: '#0f3d2e',
    bgLight: '#e8f5e9',
    ring: '#bbf7d0',
    bar: 'linear-gradient(90deg, #0f3d2e, #10b981)',
    pillBg: '#dcfce7',
    pillText: '#166534',
    countBg: '#f0fdf4',
    countText: '#166534',
    orb1: '#34d399',
    orb2: '#6ee7b7',
    tag: 'Roots & remedies',
  },
  {
    name: 'amber',
    accent: '#92400e',
    bgLight: '#fffbeb',
    ring: '#fde68a',
    bar: 'linear-gradient(90deg, #92400e, #f59e0b)',
    pillBg: '#fef3c7',
    pillText: '#92400e',
    countBg: '#fffbeb',
    countText: '#92400e',
    orb1: '#fbbf24',
    orb2: '#fcd34d',
    tag: "Nature's energy",
  },
  {
    name: 'teal',
    accent: '#134e4a',
    bgLight: '#f0fdfa',
    ring: '#99f6e4',
    bar: 'linear-gradient(90deg, #134e4a, #14b8a6)',
    pillBg: '#ccfbf1',
    pillText: '#0f766e',
    countBg: '#f0fdfa',
    countText: '#0f766e',
    orb1: '#2dd4bf',
    orb2: '#5eead4',
    tag: "Earth's core",
  },
  {
    name: 'saffron',
    accent: '#7c2d12',
    bgLight: '#fff7ed',
    ring: '#fed7aa',
    bar: 'linear-gradient(90deg, #7c2d12, #f97316)',
    pillBg: '#ffedd5',
    pillText: '#9a3412',
    countBg: '#fff7ed',
    countText: '#9a3412',
    orb1: '#fb923c',
    orb2: '#fdba74',
    tag: 'Plant power',
  },
];

type Theme = typeof THEMES[0];

/* ─────────────────────────────────────────────
   ORBIT DOTS
───────────────────────────────────────────── */
const ORBIT_POSITIONS = [
  [
    { top: '18%', left: '12%' },
    { top: '72%', left: '8%' },
    { top: '20%', right: '10%' },
    { top: '70%', right: '12%' },
  ],
  [
    { top: '15%', left: '18%' },
    { top: '75%', left: '15%' },
    { top: '18%', right: '14%' },
    { top: '68%', right: '18%' },
  ],
  [
    { top: '20%', left: '10%' },
    { top: '70%', left: '14%' },
    { top: '22%', right: '12%' },
    { top: '72%', right: '10%' },
  ],
  [
    { top: '16%', left: '16%' },
    { top: '74%', left: '10%' },
    { top: '20%', right: '16%' },
    { top: '66%', right: '14%' },
  ],
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
  theme: Theme;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const orbColors = [theme.orb1, theme.orb2, theme.orb1, theme.orb2];
  const orbSizes = [8, 5, 8, 5];
  const orbs = ORBIT_POSITIONS[index % ORBIT_POSITIONS.length];

  return (
    <div
      className="opacity-0 translate-y-8"
      style={{
        animation: `fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) ${index * 110 + 80}ms forwards`,
      }}
    >
      <a href={`/category/${category?.id}`} className="block h-full">
        {/* outer glow wrapper */}
        <div
          className="relative h-full rounded-[20px] transition-all duration-350"
          style={{
            boxShadow: hovered
              ? `0 0 0 1.5px ${theme.ring}, 0 20px 48px ${theme.accent}18, 0 8px 20px rgba(0,0,0,0.06)`
              : `0 0 0 0.5px ${theme.ring}60`,
          }}
        >
          <div
            className="relative h-full rounded-[20px] overflow-hidden bg-white flex flex-col min-h-[340px] cursor-pointer transition-transform duration-350"
            style={{
              transform: hovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
              transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* top gradient bar */}
            <div className="h-[3px] w-full flex-shrink-0" style={{ background: theme.bar }} />

            {/* ── visual area ── */}
            <div
              className="relative flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ height: 160, background: theme.bgLight, color: theme.accent }}
            >
              {/* tinted bg */}
              <div className="absolute inset-0" style={{ background: theme.bgLight }} />

              {/* dot pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle, ${theme.accent} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                  opacity: 0.06,
                }}
              />

              {/* orbit dots */}
              {orbs.map((pos, oi) => (
                <div
                  key={oi}
                  className="absolute rounded-full transition-opacity duration-400 pointer-events-none"
                  style={{
                    ...pos,
                    width: orbSizes[oi],
                    height: orbSizes[oi],
                    background: orbColors[oi],
                    opacity: hovered ? 1 : 0,
                  }}
                />
              ))}

              {/* icon ring */}
              <div
                className="relative z-10 flex items-center justify-center rounded-full bg-white transition-transform duration-350"
                style={{
                  width: 80,
                  height: 80,
                  border: `2px solid ${theme.ring}`,
                  boxShadow: `0 0 0 6px ${theme.ring}50, 0 8px 24px ${theme.accent}20`,
                  transform: hovered ? 'scale(1.12) rotate(-4deg)' : 'scale(1) rotate(0deg)',
                  transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
                }}
              >
       <img src={category.image_url} alt={category.name} className="w-12 h-12 object-cover rounded-full" />
              </div>
            </div>

            {/* ── card body ── */}
            <div className="flex flex-col flex-1 p-5">
              {/* tag pill */}
              <span
                className="self-start text-[10px] font-medium tracking-[0.12em] uppercase px-3 py-1 rounded-full mb-3"
                style={{
                  background: theme.pillBg,
                  color: theme.pillText,
                  border: `0.5px solid ${theme.ring}80`,
                }}
              >
             {category.tag || theme.tag}
              </span>

              {/* name */}
              <h3
                className="text-xl leading-tight mb-2"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                  color: theme.accent,
                }}
              >
                {category.name}
              </h3>

              {/* description */}
              <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">
                {category.description}
              </p>

              {/* footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: theme.countBg, color: theme.countText }}
                >
                  {category.product_count} Products
                </span>

                <Link href={`/category/${category.id}`} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200"
                    style={{
                      background: hovered ? theme.accent : 'transparent',
                      color: hovered ? '#fff' : theme.accent,
                      border: `0.5px solid ${hovered ? theme.accent : theme.accent + '40'}`,
                    }}
                  >
                    Explore
                    <ArrowUpRight
                      className="w-3.5 h-3.5 transition-transform duration-200"
                      style={{ transform: hovered ? 'translate(2px,-2px)' : 'translate(0,0)' }}
                    />
                  </button>
                </Link>
              </div>
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
    <div
      className="text-center mb-16 opacity-0"
      style={{ animation: 'fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) 0ms forwards' }}
    >
      {/* eyebrow */}
      <div
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
        style={{
          background: 'rgba(15,61,46,0.04)',
          border: '0.5px solid rgba(15,61,46,0.12)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#0f3d2e]">
          Discover premium categories
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* headline */}
      <h2
        className="text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.1] text-[#0f3d2e] mb-4"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900,
          letterSpacing: '-0.02em',
        }}
      >
        Shop by{' '}
        <span className="relative inline-block">
          <span className="relative z-10">Category</span>
          <svg
            className="absolute left-0 w-full"
            style={{ bottom: -6 }}
            viewBox="0 0 200 10"
            height="10"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M2,7 Q50,2 100,7 Q150,12 198,5"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray: 220,
                strokeDashoffset: 0,
                animation: 'drawLine 1s ease-out 0.5s both',
              }}
            />
          </svg>
        </span>
      </h2>

      <p className="text-gray-500 text-[15px] max-w-[500px] mx-auto leading-relaxed mt-4">
        Each collection curated for your holistic health journey —{' '}
        straight from Indian farms to your doorstep.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BACKGROUND
───────────────────────────────────────────── */
function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[#fafaf7]" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[80px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-teal-50/60 blur-[80px]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(15,61,46,0.4) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(15,61,46,0.4) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categoriesdata.rows.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              theme={THEMES[index % THEMES.length]}
              index={index}
            />
          ))}
        </div>

        {/* CTA strip */}
        <div
          className="mt-8 opacity-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-7 py-5 rounded-2xl bg-white border border-gray-100"
          style={{ animation: 'fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) 550ms forwards' }}
        >
          <div>
            <p className="text-sm font-medium text-[#0f3d2e]">Can't decide?</p>
            <p className="text-gray-500 text-sm">Browse all products across every category in one place.</p>
          </div>
          <Link href="/products">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3d2e] text-white text-sm font-medium hover:bg-[#1a5c45] transition-colors shadow-sm">
              View all products
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* global keyframes */}
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 220; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
}

export default CategoriesSection;