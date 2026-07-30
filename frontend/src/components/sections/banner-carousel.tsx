'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: number
  tag: string | null
  title: string
  subtitle: string | null
  image_url: string | null
  bg_color1: string
  bg_color2: string
  cta_text: string
  cta_link: string
}

const FALLBACK: Banner[] = [
  {
    id: 1,
    tag: 'NEW ARRIVALS',
    title: 'Premium Ayurvedic Collection',
    subtitle: 'Sourced directly from Indian farms — pure, organic, potent.',
    image_url: null,
    bg_color1: '#0f3d2e',
    bg_color2: '#0a2e22',
    cta_text: 'Explore Products',
    cta_link: '/products',
  },
  {
    id: 2,
    tag: 'BESTSELLER',
    title: 'Ancient Wisdom, Modern Living',
    subtitle: 'Discover time-tested remedies for everyday wellness.',
    image_url: null,
    bg_color1: '#1a3a22',
    bg_color2: '#0d1f15',
    cta_text: 'Shop Now',
    cta_link: '/products',
  },
]

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    axios.get('/banners/public')
      .then(r => {
        const data = r.data.banners || []
        setBanners(data.length ? data : FALLBACK)
      })
      .catch(() => setBanners(FALLBACK))
      .finally(() => setLoaded(true))
  }, [])

  const slides = banners.length ? banners : FALLBACK

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, slides.length])

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current) }
  const resume = () => {
    if (slides.length <= 1) return
    timerRef.current = setInterval(next, 5000)
  }

  if (!loaded) return null

  const slide = slides[current]

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 'clamp(220px, 35vw, 420px)' }}>

      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: i === current ? 1 : 0,
            pointerEvents: i === current ? 'auto' : 'none',
            background: `linear-gradient(135deg, ${s.bg_color1} 0%, ${s.bg_color2} 100%)`,
          }}
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          {/* Background image overlay */}
          {s.image_url && (
            <img
              src={s.image_url}
              alt={s.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.25, mixBlendMode: 'luminosity' }}
            />
          )}

          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-[40%] h-full pointer-events-none">
            <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[320px] h-[320px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />
          </div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center" style={{ zIndex: 2 }}>
            {s.tag && (
              <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 self-start backdrop-blur-sm">
                {s.tag}
              </span>
            )}
            <h2 className="text-white font-bold leading-tight mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 'clamp(1.4rem, 3.5vw, 2.6rem)', textShadow: '0 2px 20px rgba(0,0,0,0.4)', maxWidth: 560 }}>
              {s.title}
            </h2>
            {s.subtitle && (
              <p className="text-white/70 mb-6 leading-relaxed" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', maxWidth: 440 }}>
                {s.subtitle}
              </p>
            )}
            <Link href={s.cta_link || '/products'}>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-100"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                {s.cta_text}
                <ChevronRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      ))}

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => { pause(); prev(); setTimeout(resume, 5000) }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Previous slide">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => { pause(); next(); setTimeout(resume, 5000) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Next slide">
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { pause(); setCurrent(i); setTimeout(resume, 5000) }}
              className="transition-all"
              style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? '#fff' : 'rgba(255,255,255,0.4)' }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default BannerCarousel
