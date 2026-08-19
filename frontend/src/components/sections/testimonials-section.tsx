'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Star, ShoppingBag, Leaf, ShieldCheck, Truck, HeartHandshake,
  FlaskConical, Award, BadgeCheck, Quote
} from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/auth-context'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Testimonial {
  user_name: string
  rating: number
  comment: string
  product_name: string
  avatar?: string
}

// ─── Static data (fallbacks) ──────────────────────────────────────────────────
const WHY_US = [
  {
    icon: Leaf,
    title: '100% Organic',
    body: 'Every product is certified organic — no synthetic additives, preservatives, or shortcuts. Nature, bottled.',
    accent: '#4ADE80',
  },
  {
    icon: FlaskConical,
    title: 'Lab Tested',
    body: 'Third-party lab testing on every batch for purity, potency, and heavy-metal safety before it reaches you.',
    accent: '#FBBF24',
  },
  {
    icon: Truck,
    title: 'Farm to Doorstep',
    body: 'Direct partnerships with 200+ farmers. No middlemen. You pay less; farmers earn more. Win-win.',
    accent: '#60A5FA',
  },
  {
    icon: HeartHandshake,
    title: 'Community Rooted',
    body: 'We reinvest 2% of every order into rural farming communities across India. Shopping here does good.',
    accent: '#F472B6',
  },
  {
    icon: ShieldCheck,
    title: 'FSSAI Certified',
    body: 'Fully compliant with Indian food safety standards. Certified, audited, and re-inspected every year.',
    accent: '#A78BFA',
  },
  {
    icon: Award,
    title: 'Award Winning',
    body: 'Recognised by India Organic Awards 2023 & 2024 for excellence in Ayurvedic product authenticity.',
    accent: '#FB923C',
  },
]

const STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '200+', label: 'Farming Partners' },
  { value: '24h', label: 'Average Delivery' },
]

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn('w-4 h-4', i < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-600')}
        />
      ))}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const GRADIENTS = [
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-violet-600 to-purple-700',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-cyan-600',
]
function Avatar({ name }: { name: string }) {
  const initials = (name || '??').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const idx = Math.abs((name || '').charCodeAt(0) + ((name || '').charCodeAt(1) || 0)) % GRADIENTS.length
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0',
        GRADIENTS[idx]
      )}
    >
      {initials}
    </div>
  )
}

// ─── Single Testimonial Card ──────────────────────────────────────────────────
function TestimonialCard({ t, delay = 0 }: { t: Testimonial; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col h-full group"
    >
      {/* card */}
      <div className="relative flex flex-col flex-1 rounded-3xl border border-white/[0.07] bg-[#141a14] overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5">
        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* giant quote */}
        <Quote className="absolute top-4 right-5 w-10 h-10 text-emerald-900/60 -scale-x-100" />

        <div className="flex flex-col flex-1 p-6 gap-4">
          {/* header */}
          <div className="flex items-center gap-3">
            <Avatar name={t.user_name} />
            <div>
              <p className="font-semibold text-stone-100 text-[15px] leading-tight">{t.user_name}</p>
              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-[2px] rounded-full bg-emerald-900/60 text-emerald-400 text-[11px] font-medium">
                <BadgeCheck className="w-3 h-3" /> Verified Buyer
              </span>
            </div>
          </div>

          {/* stars */}
          <Stars rating={t.rating} />

          {/* comment */}
          <blockquote className="text-stone-300 text-[14.5px] leading-relaxed flex-1 italic">
            "{t.comment}"
          </blockquote>

          {/* product tag */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-400 font-medium truncate">{t.product_name}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Why Choose Us Card ───────────────────────────────────────────────────────
function WhyCard({ item, index }: { item: typeof WHY_US[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const Icon = item.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl border border-white/[0.06] bg-[#111711] p-6 flex gap-4 hover:border-white/[0.14] transition-colors duration-300 overflow-hidden"
    >
      {/* glow dot */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: item.accent }}
      />

      {/* icon */}
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${item.accent}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: item.accent }} />
      </div>

      <div>
        <h4 className="font-semibold text-stone-100 text-[15px] mb-1">{item.title}</h4>
        <p className="text-stone-400 text-[13.5px] leading-relaxed">{item.body}</p>
      </div>
    </motion.div>
  )
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────
function StatPill({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center"
    >
      <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-b from-emerald-300 to-teal-500 bg-clip-text text-transparent tracking-tight leading-none">
        {value}
      </span>
      <span className="mt-2 text-stone-400 text-sm font-medium">{label}</span>
    </motion.div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(false)
  const { companydata } = useAuth()
  const extra = companydata?.extra_data || {}

  const whyUs = extra.why_us?.length
    ? extra.why_us.map((w: any, i: number) => ({
        ...WHY_US[i % WHY_US.length],
        title: w.title || WHY_US[i % WHY_US.length].title,
        body: w.body || WHY_US[i % WHY_US.length].body,
        accent: w.accent || WHY_US[i % WHY_US.length].accent,
      }))
    : WHY_US

  const stats = extra.stats?.length
    ? extra.stats.map((s: any) => ({ value: s.value, label: s.label }))
    : STATS

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/shop/reviews', {
        params: { rating: 5, limit: 12, page: 1 },
      })
      setReviews(res.data.data || [])
    } catch {
      toast.error('Unable to load reviews')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative bg-[#0d120d] text-white overflow-hidden">
      {/* ── Decorative background pattern ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, #4ade80 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Big ambient glow ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-900/30 rounded-full blur-[120px] pointer-events-none" />

      {/* ═══════════════════════════════════════════════
          HERO HEADLINE — WHY CHOOSE US
      ════════════════════════════════════════════════ */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28">

        {/* ── Badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-700/50 bg-emerald-950/60 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <Leaf className="w-3.5 h-3.5" /> Why Oroganix
          </span>
        </motion.div>

        {/* ── Headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-center mb-4"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-stone-100">The cleanest food on</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              the internet. Period.
            </span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center text-stone-400 max-w-2xl mx-auto text-lg leading-relaxed mb-14"
        >
          We obsess over every ingredient so you never have to second-guess what you're putting in your body.
        </motion.p>

        {/* ── Why-us grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {whyUs.map((item, i) => (
            <WhyCard key={item.title} item={item} index={i} />
          ))}
        </div>

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-white/[0.07] bg-[#111811] px-8 py-10 mb-24 overflow-hidden"
        >
          {/* inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-transparent to-teal-950/20 pointer-events-none" />
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <StatPill key={s.label} value={s.value} label={s.label} delay={i * 0.08} />
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════════ */}

        {/* ── Sub-header ── */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-700/40 bg-amber-950/40 text-amber-400 text-sm font-semibold tracking-wide uppercase mb-5"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" /> Verified Reviews
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-100 mb-3"
          >
            What real customers say
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-stone-400 max-w-xl mx-auto text-base"
          >
            Every review is from a verified purchase. No paid placements, no filters.
          </motion.p>
        </div>

        {/* ── Marquee Reviews ── */}
        <style>{`
          @keyframes marquee-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
          .marquee-track { display: flex; width: max-content; gap: 20px; }
          .marquee-track.left  { animation: marquee-left  42s linear infinite; }
          .marquee-track.right { animation: marquee-right 54s linear infinite; }
          .marquee-wrap { overflow: hidden; mask-image: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%); }
          .marquee-wrap:hover .marquee-track { animation-play-state: paused; }
          .marquee-card { width: 320px; flex-shrink: 0; }
        `}</style>

        {loading ? (
          <div className="flex gap-5 overflow-hidden mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-80 h-52 flex-shrink-0 rounded-3xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-stone-500 py-16">No reviews yet — be the first!</p>
        ) : (
          <div className="space-y-5 mb-8">
            {/* Row 1 — scrolls left */}
            <div className="marquee-wrap">
              <div className="marquee-track left">
                {[...reviews, ...reviews].map((t, i) => (
                  <div key={i} className="marquee-card">
                    <div className="relative flex flex-col rounded-3xl border border-white/[0.07] bg-[#141a14] p-5 h-full group hover:-translate-y-1 transition-transform duration-300">
                      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-emerald-900/50 -scale-x-100" />
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={t.user_name} />
                        <div>
                          <p className="font-semibold text-stone-100 text-[14px] leading-tight">{t.user_name}</p>
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-[2px] rounded-full bg-emerald-900/60 text-emerald-400 text-[10px] font-medium">
                            <BadgeCheck className="w-2.5 h-2.5" /> Verified
                          </span>
                        </div>
                      </div>
                      <Stars rating={t.rating} />
                      <blockquote className="text-stone-300 text-[13px] leading-relaxed mt-3 italic line-clamp-3">
                        "{t.comment}"
                      </blockquote>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                        <ShoppingBag className="w-3 h-3 text-emerald-500 shrink-0" />
                        <p className="text-[12px] text-emerald-400 font-medium truncate">{t.product_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 — scrolls right */}
            {reviews.length >= 3 && (
              <div className="marquee-wrap">
                <div className="marquee-track right">
                  {[...reviews.slice().reverse(), ...reviews.slice().reverse()].map((t, i) => (
                    <div key={i} className="marquee-card">
                      <div className="relative flex flex-col rounded-3xl border border-white/[0.07] bg-[#141a14] p-5 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl bg-gradient-to-r from-amber-500 via-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Quote className="absolute top-4 right-4 w-8 h-8 text-amber-900/50 -scale-x-100" />
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar name={t.user_name} />
                          <div>
                            <p className="font-semibold text-stone-100 text-[14px] leading-tight">{t.user_name}</p>
                            <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-[2px] rounded-full bg-amber-900/40 text-amber-400 text-[10px] font-medium">
                              <BadgeCheck className="w-2.5 h-2.5" /> Verified
                            </span>
                          </div>
                        </div>
                        <Stars rating={t.rating} />
                        <blockquote className="text-stone-300 text-[13px] leading-relaxed mt-3 italic line-clamp-3">
                          "{t.comment}"
                        </blockquote>
                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                          <ShoppingBag className="w-3 h-3 text-emerald-500 shrink-0" />
                          <p className="text-[12px] text-emerald-400 font-medium truncate">{t.product_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center pt-10 pb-24"
        >
          <p className="text-stone-400 mb-6 text-base">
            Join <span className="text-emerald-400 font-semibold">10,000+</span> customers already living healthier.
          </p>
          <motion.a
            href="/shop"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-semibold text-[15px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_40px_rgba(52,211,153,0.35)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] transition-shadow duration-300"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            Shop the Collection
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
