'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  CheckCircle,
  MapPin,
  Phone,
  User,
  Shield,
  CreditCard,
  Truck,
  ShoppingBag,
  IndianRupee,
  Lock,
  Sparkles,
  Package,
  ArrowRight,
  ChevronLeft,
  Leaf,
  Wallet
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/auth-context'

declare global {
  interface Window {
    Razorpay: any
  }
}

/* ─────────────────────────────────────────────────────────────
   INLINE STYLES / CSS-IN-JS approach using <style> tag
   ───────────────────────────────────────────────────────────── */

const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --gold: #c9a96e;
      --gold-light: #e8d5b0;
      --gold-dark: #8b6914;
      --ink: #1a1612;
      --bark: #2c2317;
      --parchment: #f7f3ec;
      --sage: #3d5a3e;
      --cream: #fdf9f2;
      --mist: rgba(201,169,110,0.08);
      --border: rgba(201,169,110,0.2);
    }

    .checkout-root {
      font-family: 'DM Sans', sans-serif;
      background: radial-gradient(ellipse at 70% 10%, rgba(201,169,110,0.07) 0%, transparent 50%), radial-gradient(ellipse at 20% 90%, rgba(61,90,62,0.06) 0%, transparent 50%), var(--cream);
      min-height: 100vh;
    }
    .display-font { font-family: 'Cormorant Garamond', serif; }

    /* ── Background canvas ── */
    .bg-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
    .bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.25; }
    .bg-orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #c9a96e 0%, transparent 70%); top: -200px; right: -100px; animation: driftA 18s ease-in-out infinite alternate; }
    .bg-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #3d5a3e 0%, transparent 70%); bottom: -100px; left: -100px; animation: driftB 22s ease-in-out infinite alternate; }
    .bg-orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #c9a96e 0%, transparent 70%); top: 50%; left: 30%; opacity: 0.12; animation: driftC 28s ease-in-out infinite alternate; }
    .bg-orb-4 { width: 500px; height: 500px; background: radial-gradient(circle, #2d5a3d 0%, transparent 70%); top: 30%; right: -200px; opacity: 0.09; animation: driftB 26s ease-in-out infinite alternate; }
    @keyframes driftA { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,80px) scale(1.1); } }
    @keyframes driftB { from { transform: translate(0,0) scale(1); } to { transform: translate(80px,-60px) scale(1.15); } }
    @keyframes driftC { from { transform: translate(0,0) rotate(0deg); } to { transform: translate(40px,40px) rotate(45deg); } }

    /* Grain overlay */
    .grain-overlay { position: fixed; inset: 0; z-index: 1; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); opacity: 0.4; }

    /* ── Progress rail ── */
    .progress-rail { background: var(--border); height: 1px; flex: 1; margin: 0 12px; }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-dark));
      background-size: 200% auto;
      transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
      animation: shimmer-rail 2.2s linear infinite;
    }
    @keyframes shimmer-rail { 0% { background-position: 200% center; } 100% { background-position: 0% center; } }

    /* ── Step node ── */
    .step-node {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border); background: white; color: #999;
      transition: all 0.4s ease; position: relative;
    }
    .step-node.active {
      background: var(--ink); border-color: var(--ink); color: var(--gold);
      animation: step-pulse 2.4s ease-in-out infinite;
    }
    .step-node.done { background: var(--gold); border-color: var(--gold); color: white; }
    @keyframes step-pulse {
      0%, 100% { box-shadow: 0 0 0 4px rgba(201,169,110,0.18), 0 8px 24px rgba(26,22,18,0.2); }
      50%       { box-shadow: 0 0 0 10px rgba(201,169,110,0.05), 0 8px 24px rgba(26,22,18,0.2); }
    }

    /* ── Glass card ── */
    .glass-card {
      background: rgba(255,255,255,0.93);
      backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 8px 60px rgba(26,22,18,0.08), 0 2px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(201,169,110,0.05) inset;
    }

    /* ── Card header — animated gradient ── */
    .card-header-luxury {
      padding: 36px 44px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(-45deg, #1a1612, #2c2317, #0e2318, #1a1612, #2c2317);
      background-size: 400% 400%;
      animation: hdr-shift 12s ease infinite;
      position: relative; overflow: hidden;
    }
    .card-header-luxury::before {
      content: ''; position: absolute; top: -40px; right: -40px;
      width: 140px; height: 140px; border-radius: 50%;
      background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
      opacity: 0.18;
    }
    .card-header-luxury::after {
      content: ''; position: absolute; bottom: -30px; left: -30px;
      width: 100px; height: 100px; border-radius: 50%;
      background: radial-gradient(circle, #2d5a3d 0%, transparent 70%);
      opacity: 0.22;
    }
    @keyframes hdr-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

    /* ── Gold input ── */
    .gold-input {
      width: 100%; padding: 14px 18px;
      background: var(--parchment); border: 1px solid var(--border); border-radius: 12px;
      font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--ink);
      transition: all 0.2s ease; outline: none;
    }
    .gold-input::placeholder { color: #b8a898; }
    .gold-input:focus { border-color: var(--gold); background: white; box-shadow: 0 0 0 3px rgba(201,169,110,0.12); }

    /* ── Label ── */
    .input-label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-dark); margin-bottom: 6px; }

    /* ── Payment option ── */
    .pay-option {
      width: 100%; padding: 24px 28px;
      border: 1.5px solid var(--border); border-radius: 20px;
      cursor: pointer; text-align: left;
      transition: border-color 0.3s, background 0.3s, transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
      background: var(--parchment); position: relative; overflow: hidden;
      display: flex; align-items: center; gap: 22px;
    }
    .pay-option.selected {
      border-color: var(--gold); background: white; transform: translateY(-4px);
      animation: ring-pulse 2.2s ease-in-out infinite;
    }
    .pay-option.selected::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(160deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.02) 60%, transparent 100%);
    }
    .pay-option:hover:not(.selected) {
      border-color: rgba(201,169,110,0.5); background: white;
      transform: translateY(-2px); box-shadow: 0 6px 24px rgba(26,22,18,0.08);
    }
    @keyframes ring-pulse {
      0%, 100% { box-shadow: 0 0 0 2px var(--gold), 0 16px 48px rgba(201,169,110,0.2), 0 4px 16px rgba(26,22,18,0.06); }
      50%       { box-shadow: 0 0 0 3.5px var(--gold), 0 22px 60px rgba(201,169,110,0.32), 0 4px 16px rgba(26,22,18,0.06); }
    }

    /* ── CTA button + shimmer ── */
    .cta-btn {
      width: 100%; padding: 16px 28px;
      background: linear-gradient(135deg, var(--ink) 0%, var(--bark) 100%);
      color: var(--gold-light); border: none; border-radius: 14px;
      font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
      letter-spacing: 0.04em; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      position: relative; overflow: hidden;
    }
    .cta-btn::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(201,169,110,0.15) 0%, transparent 50%);
      opacity: 0; transition: opacity 0.25s ease;
    }
    .cta-btn::after {
      content: ''; position: absolute; top: 0; left: -100%;
      width: 55%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
      transform: skewX(-15deg); transition: left 0.6s ease;
    }
    .cta-btn:not(:disabled):hover::before { opacity: 1; }
    .cta-btn:not(:disabled):hover::after { left: 150%; }
    .cta-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 14px 44px rgba(26,22,18,0.28); }
    .cta-btn:active { transform: translateY(0); }
    .cta-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .back-btn {
      padding: 14px 20px; background: transparent; color: var(--ink);
      border: 1px solid var(--border); border-radius: 14px;
      font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;
    }
    .back-btn:hover { background: var(--parchment); }

    /* ── Summary ── */
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 14px; color: #666; }
    .summary-row.total { color: var(--ink); font-size: 16px; font-weight: 600; padding-top: 18px; letter-spacing: -0.01em; }
    .summary-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 8px 0; }
    .free-badge { background: linear-gradient(135deg, var(--sage), #2d4a2e); color: #a8d5a9; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; }

    /* ── Cart item row — with thumbnail ── */
    .cart-item-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .cart-item-row:last-child { border-bottom: none; }
    .summary-item-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }

    /* ── Trust pill ── */
    .trust-pill {
      display: flex; align-items: center; gap: 7px;
      padding: 7px 10px; border-radius: 10px;
      background: var(--mist); border: 1px solid var(--border);
      transition: background 0.2s;
    }
    .trust-pill:hover { background: rgba(201,169,110,0.12); }

    /* ── Success ── */
    .success-scene { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; }
    .success-card {
      max-width: 480px; width: 100%; background: white; border-radius: 32px;
      padding: 56px 48px; text-align: center;
      box-shadow: 0 32px 80px rgba(26,22,18,0.13), 0 1px 0 rgba(255,255,255,0.9) inset;
      border: 1px solid var(--border); position: relative; overflow: hidden;
    }
    .success-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--gold-dark), var(--gold), #2d5a3d, var(--gold), var(--gold-dark));
      background-size: 300% auto; animation: shimmer-rail 3s linear infinite;
    }
    .success-icon-ring {
      width: 96px; height: 96px; border-radius: 50%;
      background: linear-gradient(135deg, var(--ink), #0e2318);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px; position: relative;
    }
    .success-icon-ring::before {
      content: ''; position: absolute; inset: -4px; border-radius: 50%;
      background: conic-gradient(var(--gold), #2d5a3d, var(--gold-dark), var(--gold));
      z-index: -1; animation: spin 4s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .order-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; background: var(--parchment); border: 1px solid var(--border); border-radius: 40px; font-size: 13px; color: var(--gold-dark); font-weight: 600; letter-spacing: 0.06em; margin: 16px 0; }
    .amount-display { padding: 20px 28px; background: linear-gradient(135deg, var(--ink), #0e2318); border-radius: 16px; margin: 24px 0; position: relative; overflow: hidden; }
    .amount-display::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 40%; background: radial-gradient(circle at right, rgba(201,169,110,0.1) 0%, transparent 70%); }
    .shop-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, var(--gold-dark), var(--gold)); color: var(--ink); border: none; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s ease; position: relative; overflow: hidden; }
    .shop-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 55%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); transform: skewX(-15deg); transition: left 0.5s ease; }
    .shop-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,169,110,0.4); }
    .shop-btn:hover::after { left: 150%; }

    /* ── Floating particles ── */
    @keyframes particle-float {
      0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
      80%  { opacity: 0.7; }
      100% { transform: translateY(-150px) translateX(var(--tx)) rotate(var(--r)) scale(0.2); opacity: 0; }
    }
    .success-particle {
      position: absolute; pointer-events: none; z-index: 0;
      animation: particle-float var(--dur) ease-out forwards;
      animation-delay: var(--delay);
      font-size: var(--fs, 18px);
      bottom: 12%; left: var(--left);
    }

    /* ── Loading ── */
    .loading-scene { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--cream); }
    .loader-ring { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--gold); animation: spin 1s linear infinite; }

    /* ── Nav ── */
    .checkout-nav { position: sticky; top: 0; z-index: 50; background: rgba(253,249,242,0.88); backdrop-filter: blur(24px); border-bottom: 1px solid var(--border); padding: 20px 0; }

    /* ── Responsive ── */
    @media (max-width: 1100px) {
      .card-header-luxury { padding: 28px 32px; }
    }
    @media (max-width: 768px) {
      .card-header-luxury { padding: 22px 24px; }
      .success-card { padding: 40px 28px; }
      .pay-option { padding: 18px 20px; gap: 16px; }
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--parchment); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--gold); }
  `}</style>
)

/* ─── Decorative background ─── */
const BackgroundCanvas = () => (
  <div className="bg-canvas">
    <div className="bg-orb bg-orb-1" />
    <div className="bg-orb bg-orb-2" />
    <div className="bg-orb bg-orb-3" />
    <div className="bg-orb bg-orb-4" />
  </div>
)

/* ─── Floating celebration particles ─── */
const FloatingParticles = () => (
  <>
    {[
      { e: '🌿', l: '12%', tx: '-20px', r: '-120deg', dur: '2.2s', delay: '0s',    fs: '20px' },
      { e: '✨', l: '26%', tx: '28px',  r: '180deg',  dur: '2.7s', delay: '0.15s', fs: '16px' },
      { e: '🍃', l: '40%', tx: '-18px', r: '240deg',  dur: '2.4s', delay: '0.3s',  fs: '22px' },
      { e: '⭐', l: '55%', tx: '22px',  r: '-200deg', dur: '3.0s', delay: '0.08s', fs: '14px' },
      { e: '🌱', l: '68%', tx: '-26px', r: '150deg',  dur: '2.6s', delay: '0.4s',  fs: '18px' },
      { e: '✨', l: '82%', tx: '14px',  r: '-90deg',  dur: '2.0s', delay: '0.22s', fs: '14px' },
      { e: '🌿', l: '48%', tx: '-36px', r: '210deg',  dur: '3.1s', delay: '0.5s',  fs: '16px' },
      { e: '🍃', l: '33%', tx: '18px',  r: '-160deg', dur: '2.5s', delay: '0.35s', fs: '20px' },
      { e: '⭐', l: '74%', tx: '-14px', r: '130deg',  dur: '2.3s', delay: '0.18s', fs: '12px' },
    ].map((p, i) => (
      <div
        key={i}
        className="success-particle"
        style={{ '--left': p.l, '--tx': p.tx, '--r': p.r, '--dur': p.dur, '--delay': p.delay, '--fs': p.fs } as React.CSSProperties}
      >
        {p.e}
      </div>
    ))}
  </>
)

/* ─── Step Node ─── */
const StepNode = ({ id, label, icon: Icon, step }: { id: number; label: string; icon: any; step: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <div className={`step-node ${step > id ? 'done' : step === id ? 'active' : ''}`}>
      {step > id ? <CheckCircle size={18} /> : <Icon size={18} />}
    </div>
    <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: step >= id ? 'var(--gold-dark)' : '#b8a898' }}>
      {label}
    </span>
  </div>
)

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
function CheckoutInner() {

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNo, setOrderNo] = useState('')
  const [shipping, setShipping] = useState({ name: '', phone: '', address: '' })
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [bestCoupon, setBestCoupon] = useState<{ code: string; saving: number; description?: string } | null>(null)
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletApplied, setWalletApplied] = useState(false)
  const [walletDiscount, setWalletDiscount] = useState(0)
  // Loyalty points state (1 point = ₹0.1)
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [loyaltyApplied, setLoyaltyApplied] = useState(false)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  // Gift card state
  const [giftCardInput, setGiftCardInput] = useState('')
  const [giftCardApplying, setGiftCardApplying] = useState(false)
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; discount: number; balance: number } | null>(null)
  const [giftCardError, setGiftCardError] = useState('')
  const {fetchCart, loginuserdata, cartdata,cartloading,settings, loading: authLoading}=useAuth()
  const searchParams = useSearchParams()
  const isBuyNow = searchParams.get('mode') === 'buynow'
  const [buyNowItem, setBuyNowItem] = useState<any>(null)
  const [paidAmount, setPaidAmount] = useState<number>(0)
const [checkingAddress, setCheckingAddress] = useState(true)
const [showAddressForm, setShowAddressForm] = useState(false)
const [newAddr, setNewAddr] = useState({ street: '', city: '', state: '', pincode: '', type: 'home', email: '' })
const [addingAddr, setAddingAddr] = useState(false)
useEffect(() => {

  if (authLoading) return;

  if (!loginuserdata?.id) {
    window.location.href = '/auth?redirect=/checkout';
    return;
  }

  const init = async () => {

    try {

      setCheckingAddress(true);

      // Load buyNow item from sessionStorage if in buyNow mode
      if (isBuyNow) {
        const raw = sessionStorage.getItem('buyNowItem');
        if (raw) {
          try { setBuyNowItem(JSON.parse(raw)); } catch (_) {}
        }
      }

      // Load cart
      await fetchCart(loginuserdata.id);

      // Load addresses
      const res = await axios.get("/users/address");

      const list = res.data?.data || [];

      // No address → show inline form instead of redirecting
      if (!list.length) {
        setShowAddressForm(true)
      }

      setAddresses(list);

      // Auto select default
      const def = list.find((a: any) => a.is_default) || list[0];

      if (def) {

        setSelectedAddressId(def.id);

        setShipping({
          name: loginuserdata?.name || "",
          phone: loginuserdata?.phone || "",
          address: `${def.street}, ${def.city}, ${def.state} - ${def.pincode}`,
        });

      }

    } catch (err) {

      console.error("Checkout init error:", err);

      toast.error("Something went wrong");

    } finally {

      setCheckingAddress(false);

    }

  };

  init();

}, [loginuserdata, authLoading]);

/* ================= SETTINGS → MAP ================= */

const chargesMap = useMemo(() => {
  return (settings || []).reduce((acc: any, item: any) => {

    let value: any = item.value;

    if (item.type === "number") value = Number(value);
    if (item.type === "boolean") value = value === "true";

    acc[item.key] = value;

    return acc;

  }, {});
}, [settings]);

/* ================= CART CALCULATIONS ================= */

const effectiveItems: any[] = useMemo(() => {
  if (isBuyNow && buyNowItem) {
    return [{ ...buyNowItem, images: [buyNowItem.image], variant_label: buyNowItem.variantLabel }];
  }
  return cartdata?.items || [];
}, [isBuyNow, buyNowItem, cartdata]);

const {
  subtotal,
  tax,
  delivery,
  platformFee,
  discount,
  total
} = useMemo(() => {

  let cartSubtotal = 0;
  let cartTax = 0;

  effectiveItems.forEach((item: any) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const gstPercent = Number(item.gst_percent) || 0;
    const itemSubtotal = price * qty;
    const itemTax = (itemSubtotal * gstPercent) / 100;
    cartSubtotal += itemSubtotal;
    cartTax += itemTax;
  });

  const deliveryCharge = Number(chargesMap.delivery_charge || 0);
  const platformCharge = Number(chargesMap.platform_fee || 0);
  const freeLimit = Number(chargesMap.free_delivery_limit || 500);
  const finalDelivery = cartSubtotal >= freeLimit ? 0 : deliveryCharge;
  const couponDiscount = appliedCoupon?.discount || 0;
  const giftCardDiscount = appliedGiftCard?.discount || 0;
  const finalTotal = Math.max(0, cartSubtotal + cartTax + finalDelivery + platformCharge - couponDiscount - walletDiscount - loyaltyDiscount - giftCardDiscount);

  return {
    subtotal: +cartSubtotal.toFixed(2),
    tax: +cartTax.toFixed(2),
    delivery: +finalDelivery.toFixed(2),
    platformFee: +platformCharge.toFixed(2),
    discount: +couponDiscount.toFixed(2),
    total: +finalTotal.toFixed(2)
  };

}, [effectiveItems, chargesMap, appliedCoupon, walletDiscount, loyaltyDiscount, appliedGiftCard]);

// Fetch available coupons and wallet balance
useEffect(() => {
  axios.get('/coupons/public').then(r => setAvailableCoupons(r.data.coupons || [])).catch(() => {})
  if (loginuserdata?.id) {
    axios.get('/wallet').then(r => {
      setWalletBalance(Number(r.data?.wallet_balance || 0))
      setLoyaltyBalance(Number(r.data?.loyalty_points || 0))
    }).catch(() => {})
  }
}, [loginuserdata?.id])

// Fetch best coupon whenever cart total changes
useEffect(() => {
  if (appliedCoupon || subtotal <= 0) { setBestCoupon(null); return }
  axios.get('/coupons/best', { params: { amount: subtotal } })
    .then(r => setBestCoupon(r.data.best || null))
    .catch(() => {})
}, [subtotal, appliedCoupon])

const applyCoupon = async () => {
  if (!couponInput.trim()) return
  try {
    setCouponApplying(true)
    setCouponError('')
    const res = await axios.post('/coupons/apply', { code: couponInput.trim(), cartTotal: subtotal })
    setAppliedCoupon({ code: res.data.coupon?.code || couponInput.trim(), discount: res.data.discount })
    toast.success(`Coupon applied! You save ₹${res.data.discount.toFixed(2)}`)
  } catch (err: any) {
    setCouponError(err?.response?.data?.message || 'Invalid coupon code')
  } finally {
    setCouponApplying(false)
  }
}

const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(''); setCouponError('') }

const handleAddAddress = async () => {
  const { street, city, state, pincode, email } = newAddr
  if (!street.trim() || !city.trim() || !state.trim() || !pincode.trim() || !email.trim()) {
    toast.error('All address fields are required')
    return
  }
  if (!/^\d{6}$/.test(pincode)) { toast.error('Enter valid 6-digit pincode'); return }
  setAddingAddr(true)
  try {
    await axios.post('/users/address', { ...newAddr, is_default: addresses.length === 0 })
    const res = await axios.get('/users/address')
    const list = res.data?.data || []
    setAddresses(list)
    const def = list.find((a: any) => a.is_default) || list[0]
    if (def) {
      setSelectedAddressId(def.id)
      setShipping({
        name: loginuserdata?.name || '',
        phone: loginuserdata?.phone || '',
        address: `${def.street}, ${def.city}, ${def.state} - ${def.pincode}`,
      })
    }
    setShowAddressForm(false)
    setNewAddr({ street: '', city: '', state: '', pincode: '', type: 'home', email: '' })
    toast.success('Address added successfully!')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to add address')
  } finally {
    setAddingAddr(false)
  }
}



  const validateShipping = () => {
    if (!shipping.name.trim()) { toast.error('Full name is required'); return false }
    if (!/^[6-9]\d{9}$/.test(shipping.phone)) { toast.error('Enter valid mobile number'); return false }
    if (shipping.address.trim().length < 10) { toast.error('Enter complete address'); return false }
    return true
  }

const placeOrder = async () => {
if (!addresses.length) {
  setShowAddressForm(true)
  toast.error("Please add a delivery address first")
  setStep(1)
  return
}

if (!validateShipping()) return;

  if (processing) return;

  try {
    setProcessing(true);

    /* ================= CREATE ORDER ================= */

    const baseAfterCoupon = subtotal + tax + delivery + platformFee - (appliedCoupon?.discount || 0)
    const effectiveWalletDiscount = Math.min(walletDiscount, Math.max(0, baseAfterCoupon))
    const effectiveLoyaltyDiscount = Math.min(loyaltyDiscount, Math.max(0, baseAfterCoupon - effectiveWalletDiscount))

    const orderPayload: any = {
      shipping,
      addressId: selectedAddressId,
      paymentMethod,
      couponCode: appliedCoupon?.code || undefined,
      walletDiscount: effectiveWalletDiscount > 0 ? effectiveWalletDiscount : undefined,
      loyaltyDiscount: effectiveLoyaltyDiscount > 0 ? effectiveLoyaltyDiscount : undefined,
      loyaltyPointsUsed: effectiveLoyaltyDiscount > 0 ? Math.ceil(effectiveLoyaltyDiscount / (chargesMap.loyalty_redeem_rate || 0.1)) : undefined,
      giftCardCode: appliedGiftCard?.code || undefined,
      giftCardDiscount: (appliedGiftCard?.discount || 0) > 0 ? (appliedGiftCard?.discount || 0) : undefined,
      pricing: { subtotal, tax, delivery, platformFee, discount, giftCardDiscount: appliedGiftCard?.discount || 0, total }
    };

    if (isBuyNow && buyNowItem) {
      orderPayload.productId = buyNowItem.productId;
      orderPayload.quantity = buyNowItem.quantity;
      if (buyNowItem.variantId) orderPayload.variantId = buyNowItem.variantId;
    }

    const endpoint = isBuyNow && buyNowItem ? '/orders/buy-now' : '/orders/create';
    const res = await axios.post(endpoint, orderPayload);

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Order creation failed");
    }

    const orderId = res.data.orderId;
    const invoiceNo = res.data.invoice_no || '';

    /* ================= COD FLOW ================= */

    if (paymentMethod === "cod") {
      toast.success("Order placed successfully");
      setPaidAmount(total);
      setOrderNo(invoiceNo || "ORD" + orderId);
      setOrderPlaced(true);
      if (isBuyNow) sessionStorage.removeItem('buyNowItem');
      fetchCart(loginuserdata?.id)
      return;
    }

    /* ================= ONLINE PAYMENT ================= */

    if (!window?.Razorpay) {
      toast.error("Payment gateway not loaded");
      return;
    }

    const razorpayData = res.data.razorpay;

    if (!razorpayData?.id || !razorpayData?.amount) {
      throw new Error("Invalid payment data received");
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,

      order_id: razorpayData.id,

      amount: razorpayData.amount,

      currency: "INR",

      name: "Oroganix",

      description: "Secure Checkout",

      image: "/logo.png",

      handler: async (response: any) => {

        try {

          if (
            !response?.razorpay_payment_id ||
            !response?.razorpay_order_id ||
            !response?.razorpay_signature
          ) {
            throw new Error("Invalid payment response");
          }

          /* ================= VERIFY PAYMENT ================= */

          const verify = await axios.post("/orders/verify", {
            ...response,
            orderId
          });

          if (verify?.data?.success) {

            toast.success("Payment successful");

            setOrderNo(invoiceNo || "ORD" + orderId);
            setPaidAmount(total);
            setOrderPlaced(true);
            if (isBuyNow) sessionStorage.removeItem('buyNowItem');
            fetchCart(loginuserdata?.id)

          } else {
            toast.error(verify?.data?.message || "Payment verification failed");
          }

        } catch (err) {

          console.error("Verify Error:", err);

          toast.error("Payment verification error");
        }
      },

      modal: {
        ondismiss: () => {
          toast.error("Payment cancelled");
        }
      },

      prefill: {
        name: shipping.name,
        contact: shipping.phone
      },

      theme: {
        color: "#c9a96e"
      }
    };

    const rz = new window.Razorpay(options);

    rz.open();

  } catch (err: any) {

    console.error("Checkout Error:", err);

    if (err?.response?.status === 400) {
      toast.error(err.response.data?.message || "Invalid request");
    }

    else if (err?.response?.status === 401) {
      toast.error("Unauthorized");
      window.location.href = "/auth";
    }

    else if (err?.response?.status === 409) {
      toast.error("Cart changed. Please refresh.");
    }

    else if (err?.response?.status === 500) {
      toast.error("Server error. Try again.");
    }

    else {
      toast.error(err?.message || "Checkout failed");
    }

  } finally {

    setProcessing(false);
  }
};

  /* ─── LOADING ─── */

if (checkingAddress) {
  return (
    <div className="loading-scene">
      <div className="loader-ring" />
    </div>
  );
}
  /* ─── SUCCESS ─── */
  if (orderPlaced) return (
    <div className="checkout-root">
      <GlobalStyles />
      <BackgroundCanvas />
      <div className="grain-overlay" />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Header />
        <div className="success-scene">
          <motion.div
            className="success-card"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <FloatingParticles />
            <motion.div
              className="success-icon-ring"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <motion.circle
                  cx="26" cy="26" r="24"
                  stroke="var(--gold)" strokeWidth="1.5" fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.7, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M14 27l8 8 16-16"
                  stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.75, duration: 0.45, ease: 'easeInOut' }}
                />
              </svg>
            </motion.div>

            <motion.h1
              className="display-font"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              style={{ fontSize: 40, fontWeight: 300, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.01em' }}
            >
              Order <em>Confirmed</em>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <div className="order-badge">
                <Package size={14} />
                #{orderNo}
              </div>
            </motion.div>

            <motion.div
              className="amount-display"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Total Paid
              </p>
              <p className="display-font" style={{ fontSize: 44, fontWeight: 300, color: 'var(--gold-light)' }}>
                ₹{paidAmount}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              style={{ color: '#999', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}
            >
              Your Ayurvedic essentials are being lovingly prepared and will arrive soon.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <button
                className="shop-btn"
                onClick={() => window.location.href = '/products'}
                style={{ width: '100%' }}
              >
                <Sparkles size={16} />
                Continue Shopping
              </button>
              <button
                onClick={() => window.location.href = '/account?tab=orders'}
                style={{ width: '100%', padding: '14px 24px', borderRadius: 50, background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Package size={16} />
                View My Order
              </button>
            </motion.div>
          </motion.div>
        </div>
        <Footer />
      </div>
    </div>
  )

  /* ─── MAIN CHECKOUT ─── */
  return (
    <div className="checkout-root">
      <GlobalStyles />
      <BackgroundCanvas />
      <div className="grain-overlay" />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />

        {/* ─── PROGRESS NAV ─── */}
        <div className="checkout-nav">
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 48px' }}>

            {/* Brand line */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <Leaf size={14} style={{ color: 'var(--gold)', opacity: 0.7 }} />
              <span className="display-font" style={{ fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-dark)', opacity: 0.8 }}>
                Secure Checkout
              </span>
              <Leaf size={14} style={{ color: 'var(--gold)', opacity: 0.7, transform: 'scaleX(-1)' }} />
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              <StepNode id={1} label="Delivery" icon={Truck} step={step} />
              <div className="progress-rail" style={{ width: 80 }}>
                <div className="progress-fill" style={{ width: step >= 2 ? '100%' : '0%' }} />
              </div>
              <StepNode id={2} label="Payment" icon={CreditCard} step={step} />
              <div className="progress-rail" style={{ width: 80 }}>
                <div className="progress-fill" style={{ width: step >= 3 ? '100%' : '0%' }} />
              </div>
              <StepNode id={3} label="Confirm" icon={CheckCircle} step={step} />
            </div>

          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <main style={{ flex: 1, maxWidth: 1440, margin: '0 auto', width: '100%', padding: '52px 48px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 500px', gap: 44, alignItems: 'start' }}
          className="checkout-main-grid"
        >

          <style jsx>{`
            @media (max-width: 1100px) {
              .checkout-main-grid {
                grid-template-columns: 1fr !important;
                padding: 32px 24px !important;
              }
            }
            @media (max-width: 600px) {
              .checkout-main-grid {
                padding: 20px 16px !important;
              }
            }
          `}</style>

          {/* ─── LEFT PANEL ─── */}
          <div>
            <AnimatePresence mode="wait">

              {/* STEP 1 — SHIPPING */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="glass-card">

                    <div className="card-header-luxury">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={16} style={{ color: 'var(--gold)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', marginBottom: 2 }}>Step 1 of 2</p>
                          <h2 className="display-font" style={{ fontSize: 34, fontWeight: 300, color: 'white', letterSpacing: '-0.01em' }}>
                            Delivery Details
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '40px' }}>
                      {addresses.length > 0 && (
  <div style={{ marginBottom: 24 }}>

    <label className="input-label">Saved Addresses</label>

    <div style={{ display: "grid", gap: 10 }}>

      {addresses.map((addr: any) => {

        const full = `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;

        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => {

              setSelectedAddressId(addr.id);

              setShipping({
                name: loginuserdata?.name || "",
                phone: loginuserdata?.phone || "",
                address: full,
              });

            }}
            className={`gold-input`}
            style={{
              textAlign: "left",
              borderColor:
                selectedAddressId === addr.id
                  ? "var(--gold)"
                  : "var(--border)",
              background:
                selectedAddressId === addr.id
                  ? "white"
                  : "var(--parchment)",
              cursor: "pointer",
            }}
          >
            {addr.is_default && "⭐ "}
            {full}
          </button>
        );
      })}

    </div>

  </div>
)}

                      {/* ─── Add New Address toggle ─── */}
                      <div style={{ marginBottom: 20 }}>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(s => !s)}
                          style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-dark)', background: 'var(--parchment)', border: '1px dashed var(--border)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                        >
                          {showAddressForm ? '✕ Cancel' : addresses.length === 0 ? '+ Add Delivery Address' : '+ Add New Address'}
                        </button>
                      </div>

                      {/* ─── Inline Add Address Form ─── */}
                      {showAddressForm && (
                        <div style={{ padding: '20px', background: 'var(--parchment)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 24 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-dark)', marginBottom: 16 }}>New Delivery Address</p>
                          <div style={{ display: 'grid', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <label className="input-label">Address Type</label>
                                <select
                                  className="gold-input"
                                  value={newAddr.type}
                                  onChange={e => setNewAddr(a => ({ ...a, type: e.target.value }))}
                                >
                                  <option value="home">Home</option>
                                  <option value="work">Work</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="input-label">PIN Code</label>
                                <input
                                  className="gold-input"
                                  placeholder="6-digit PIN"
                                  maxLength={6}
                                  value={newAddr.pincode}
                                  onChange={e => setNewAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="input-label">Street / House No.</label>
                              <input
                                className="gold-input"
                                placeholder="House no., building, street, area"
                                value={newAddr.street}
                                onChange={e => setNewAddr(a => ({ ...a, street: e.target.value }))}
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <label className="input-label">City</label>
                                <input
                                  className="gold-input"
                                  placeholder="City"
                                  value={newAddr.city}
                                  onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="input-label">State</label>
                                <input
                                  className="gold-input"
                                  placeholder="State"
                                  value={newAddr.state}
                                  onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="input-label">Email (for order updates)</label>
                              <input
                                className="gold-input"
                                type="email"
                                placeholder="your@email.com"
                                value={newAddr.email}
                                onChange={e => setNewAddr(a => ({ ...a, email: e.target.value }))}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddAddress}
                              disabled={addingAddr}
                              className="cta-btn"
                              style={{ marginTop: 4 }}
                            >
                              {addingAddr ? 'Saving…' : 'Save Address & Continue'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: 20 }}>

                        <div>
                          <label className="input-label">Full Name</label>
                          <div style={{ position: 'relative' }}>
                            <User size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#b8a898', pointerEvents: 'none' }} />
                            <input
                              className="gold-input"
                              placeholder="Your full name"
                              value={shipping.name}
                              onChange={e => setShipping({ ...shipping, name: e.target.value })}
                              style={{ paddingLeft: 44 }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="input-label">Phone Number</label>
                          <div style={{ position: 'relative' }}>
                            <Phone size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#b8a898', pointerEvents: 'none' }} />
                            <input
                              className="gold-input"
                              placeholder="10-digit mobile number"
                              value={shipping.phone}
                              onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                              style={{ paddingLeft: 44 }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="input-label">Delivery Address</label>
                          <div style={{ position: 'relative' }}>
                            <MapPin size={15} style={{ position: 'absolute', left: 16, top: 16, color: '#b8a898', pointerEvents: 'none' }} />
                            <textarea
                              className="gold-input"
                              placeholder="House no., street, city, state & PIN code"
                              value={shipping.address}
                              onChange={e => setShipping({ ...shipping, address: e.target.value })}
                              rows={3}
                              style={{ paddingLeft: 44, resize: 'none', lineHeight: 1.6 }}
                            />
                          </div>
                        </div>

                      </div>

                      <div style={{ height: 1, background: 'var(--border)', margin: '28px 0' }} />

                      <button
                        className="cta-btn"
                        onClick={() => { if (validateShipping()) setStep(2) }}
                      >
                        Continue to Payment
                        <ArrowRight size={16} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                        <Lock size={12} style={{ color: '#b8a898' }} />
                        <span style={{ fontSize: 12, color: '#b8a898' }}>Your information is 256-bit encrypted</span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STEP 2 — PAYMENT */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="glass-card">

                    <div className="card-header-luxury">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Shield size={16} style={{ color: 'var(--gold)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', marginBottom: 2 }}>Step 2 of 2</p>
                          <h2 className="display-font" style={{ fontSize: 34, fontWeight: 300, color: 'white', letterSpacing: '-0.01em' }}>
                            Payment Method
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '40px' }}>

                      {/* Shipping summary chip */}
                      <div style={{ padding: '14px 18px', background: 'var(--parchment)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <CheckCircle size={16} style={{ color: 'var(--sage)', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{shipping.name}</p>
                          <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{shipping.phone} · {shipping.address}</p>
                        </div>
                        <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gold-dark)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                          Edit
                        </button>
                      </div>

                      <label className="input-label" style={{ marginBottom: 14, display: 'block' }}>Choose Payment</label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>

                        {/* ── COD ── */}
                        <button
                          className={`pay-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('cod')}
                        >
                          <motion.div
                            animate={{ scale: paymentMethod === 'cod' ? 1.06 : 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                            style={{
                              width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: paymentMethod === 'cod'
                                ? 'linear-gradient(135deg, #1a4a28, #2d7a3d)'
                                : 'rgba(0,0,0,0.05)',
                              transition: 'background 0.3s ease',
                              boxShadow: paymentMethod === 'cod' ? '0 10px 28px rgba(45,90,62,0.45)' : 'none',
                            }}
                          >
                            <IndianRupee size={32} style={{ color: paymentMethod === 'cod' ? '#a8d5b0' : '#bbb' }} />
                          </motion.div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Cash on Delivery</p>
                            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 10 }}>Pay conveniently when your order arrives at your doorstep</p>
                            <div style={{
                              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              background: paymentMethod === 'cod' ? 'rgba(45,90,62,0.1)' : 'rgba(0,0,0,0.04)',
                              border: `1px solid ${paymentMethod === 'cod' ? 'rgba(45,90,62,0.22)' : 'transparent'}`,
                              color: paymentMethod === 'cod' ? '#2d5a3d' : '#bbb',
                              transition: 'all 0.3s ease',
                            }}>
                              No extra charges
                            </div>
                            {total > 5000 && (
                              <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>
                                ⚠️ COD not available for orders above ₹5,000. Please use online payment.
                              </p>
                            )}
                          </div>
                          <AnimatePresence>
                            {paymentMethod === 'cod' ? (
                              <motion.div
                                key="check-cod"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(201,169,110,0.55)', flexShrink: 0 }}
                              >
                                <CheckCircle size={17} color="white" />
                              </motion.div>
                            ) : (
                              <motion.div key="uncheck-cod" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                            )}
                          </AnimatePresence>
                        </button>

                        {/* ── Online ── */}
                        <button
                          className={`pay-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('online')}
                        >
                          <motion.div
                            animate={{ scale: paymentMethod === 'online' ? 1.06 : 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                            style={{
                              width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: paymentMethod === 'online'
                                ? 'linear-gradient(135deg, #1a1a60, #3d2a8a)'
                                : 'rgba(0,0,0,0.05)',
                              transition: 'background 0.3s ease',
                              boxShadow: paymentMethod === 'online' ? '0 10px 28px rgba(61,42,138,0.45)' : 'none',
                            }}
                          >
                            <CreditCard size={32} style={{ color: paymentMethod === 'online' ? '#c4b5fd' : '#bbb' }} />
                          </motion.div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Online Payment</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                              {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
                                <span key={m} style={{
                                  fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                  background: paymentMethod === 'online' ? 'rgba(124,58,237,0.1)' : 'rgba(0,0,0,0.05)',
                                  color: paymentMethod === 'online' ? '#7c3aed' : '#bbb',
                                  border: `1px solid ${paymentMethod === 'online' ? 'rgba(124,58,237,0.2)' : 'transparent'}`,
                                  letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.3s ease',
                                }}>{m}</span>
                              ))}
                            </div>
                            <p style={{ fontSize: 12, color: '#999' }}>Powered by Razorpay · Instant confirmation</p>
                          </div>
                          <AnimatePresence>
                            {paymentMethod === 'online' ? (
                              <motion.div
                                key="check-online"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(201,169,110,0.55)', flexShrink: 0 }}
                              >
                                <CheckCircle size={17} color="white" />
                              </motion.div>
                            ) : (
                              <motion.div key="uncheck-online" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                            )}
                          </AnimatePresence>
                        </button>

                      </div>

                      {/* ── BEST COUPON SUGGESTION BANNER ── */}
                      {bestCoupon && !appliedCoupon && (
                        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>🏷️</span>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#065f46', margin: 0 }}>Save ₹{bestCoupon.saving.toFixed(2)} with <span style={{ letterSpacing: '0.06em' }}>{bestCoupon.code}</span></p>
                              {bestCoupon.description && <p style={{ fontSize: 11, color: '#059669', margin: '2px 0 0' }}>{bestCoupon.description}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCouponInput(bestCoupon.code)
                              setTimeout(() => {
                                axios.post('/coupons/apply', { code: bestCoupon.code, cartTotal: subtotal })
                                  .then(r => { const c = r.data.coupon; if (c) { setAppliedCoupon({ code: c.code, discount: r.data.discount }); toast.success(`🎉 Saved ₹${r.data.discount.toFixed(2)} with ${c.code}!`) } })
                                  .catch(err => setCouponError(err?.response?.data?.message || 'Could not apply coupon'))
                              }, 0)
                            }}
                            style={{ padding: '8px 18px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Apply Now
                          </button>
                        </div>
                      )}

                      {/* ── COUPON SECTION ── */}
                      <div style={{ marginBottom: 24, padding: '20px', background: 'var(--parchment)', border: '1px dashed var(--border)', borderRadius: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-dark)', marginBottom: 14 }}>
                          🎁 Apply Coupon / Offer
                        </p>

                        {availableCoupons.length > 0 && !appliedCoupon && (() => {
                          const cartBase = subtotal + tax
                          const usable = availableCoupons.filter((c: any) => cartBase >= Number(c.min_order || 0))
                          const locked = availableCoupons.filter((c: any) => cartBase < Number(c.min_order || 0))
                          return (
                            <div style={{ marginBottom: 12 }}>
                              {usable.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: locked.length ? 8 : 0 }}>
                                  {usable.map((c: any) => (
                                    <button
                                      key={c.id}
                                      onClick={() => { setCouponInput(c.code); setCouponError('') }}
                                      style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', textAlign: 'center' }}
                                    >
                                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sage)', letterSpacing: '0.08em' }}>{c.code}</p>
                                      <p style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}</p>
                                      {c.valid_to && <p style={{ fontSize: 9, color: '#b8a898', marginTop: 1 }}>Expires {new Date(c.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {locked.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {locked.map((c: any) => {
                                    const need = (Number(c.min_order) - cartBase).toFixed(2)
                                    return (
                                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: '#fffbeb', border: '1px dashed #fcd34d', opacity: 0.8 }}>
                                        <div>
                                          <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', letterSpacing: '0.08em' }}>🔒 {c.code}</p>
                                          <p style={{ fontSize: 10, color: '#b45309', marginTop: 2 }}>Add ₹{need} more to unlock ({c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`})</p>
                                        </div>
                                        {c.valid_to && <p style={{ fontSize: 9, color: '#b45309' }}>Till {new Date(c.valid_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {appliedCoupon ? (
                          <div style={{ display: 'flex', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', gap: 10 }}>
                            <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>✓ {appliedCoupon.code} applied</p>
                              <p style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>You save ₹{appliedCoupon.discount.toFixed(2)}</p>
                            </div>
                            <button onClick={removeCoupon} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              className="gold-input"
                              value={couponInput}
                              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                              placeholder="Enter coupon code"
                              style={{ flex: 1, letterSpacing: '0.08em' }}
                              onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                            />
                            <button
                              onClick={applyCoupon}
                              disabled={couponApplying || !couponInput.trim()}
                              style={{ padding: '12px 20px', background: 'var(--ink)', color: 'var(--gold-light)', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: !couponInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
                            >
                              {couponApplying ? '…' : 'Apply'}
                            </button>
                          </div>
                        )}
                        {couponError && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 8 }}>⚠ {couponError}</p>}
                      </div>

                      {/* ── WALLET SECTION ── */}
                      {walletBalance > 0 && (
                        <div style={{ marginBottom: 24, padding: '16px 20px', background: 'linear-gradient(135deg,#f5f0ff,#ede9fe)', border: '1px solid #c4b5fd', borderRadius: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={16} color="white" />
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95' }}>Wallet Balance: ₹{walletBalance.toFixed(2)}</p>
                                {walletApplied
                                  ? <p style={{ fontSize: 11, color: '#6d28d9' }}>₹{walletDiscount.toFixed(2)} applied to this order</p>
                                  : <p style={{ fontSize: 11, color: '#7c3aed' }}>Use wallet credits to reduce your bill</p>}
                              </div>
                            </div>
                            {walletApplied ? (
                              <button onClick={() => { setWalletApplied(false); setWalletDiscount(0) }}
                                style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Remove
                              </button>
                            ) : (
                              <button onClick={() => {
                                const use = Math.min(walletBalance, total)
                                setWalletDiscount(use)
                                setWalletApplied(true)
                              }}
                                style={{ padding: '6px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── LOYALTY POINTS SECTION ── */}
                      {loyaltyBalance > 0 && (
                        <div style={{ marginBottom: 24, padding: '16px 20px', background: 'linear-gradient(135deg,#fffbeb,#fef9c3)', border: '1px solid #fcd34d', borderRadius: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⭐</div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#78350f' }}>{loyaltyBalance} Loyalty Points = ₹{(loyaltyBalance * (chargesMap.loyalty_redeem_rate || 0.1)).toFixed(2)}</p>
                                {loyaltyApplied
                                  ? <p style={{ fontSize: 11, color: '#92400e' }}>₹{loyaltyDiscount.toFixed(2)} discount applied</p>
                                  : <p style={{ fontSize: 11, color: '#b45309' }}>Use points for extra discount (1 pt = ₹{Number(chargesMap.loyalty_redeem_rate || 0.1).toFixed(2)})</p>}
                              </div>
                            </div>
                            {loyaltyApplied ? (
                              <button onClick={() => { setLoyaltyApplied(false); setLoyaltyDiscount(0) }}
                                style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Remove
                              </button>
                            ) : (
                              <button onClick={() => {
                                const maxByPoints = loyaltyBalance * (chargesMap.loyalty_redeem_rate || 0.1)
                                const maxByPct = total * ((chargesMap.loyalty_max_redeem_percent || 20) / 100)
                                const use = Math.min(maxByPoints, maxByPct, total)
                                setLoyaltyDiscount(+use.toFixed(2))
                                setLoyaltyApplied(true)
                              }}
                                style={{ padding: '6px 14px', background: '#d97706', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Redeem
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── GIFT CARD SECTION ── */}
                      <div style={{ marginBottom: 24, padding: '16px 20px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎁</div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#14532d' }}>Gift Card</p>
                        </div>
                        {appliedGiftCard ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#dcfce7', padding: '10px 14px', borderRadius: 10 }}>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', letterSpacing: '0.08em' }}>🎁 {appliedGiftCard.code}</p>
                              <p style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>₹{appliedGiftCard.discount.toFixed(2)} discount applied (balance: ₹{appliedGiftCard.balance.toFixed(2)})</p>
                            </div>
                            <button onClick={() => { setAppliedGiftCard(null); setGiftCardInput(''); setGiftCardError('') }}
                              style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                className="gold-input"
                                value={giftCardInput}
                                onChange={e => { setGiftCardInput(e.target.value.toUpperCase()); setGiftCardError('') }}
                                placeholder="Enter gift card code"
                                style={{ flex: 1, letterSpacing: '0.08em' }}
                                onKeyDown={async e => {
                                  if (e.key === 'Enter') {
                                    if (!giftCardInput.trim()) return
                                    setGiftCardApplying(true)
                                    try {
                                      const r = await axios.get(`/gift-cards/validate/${giftCardInput.trim()}`)
                                      const data = r.data
                                      if (!data.success) { setGiftCardError(data.message || 'Invalid gift card'); return }
                                      const discount = Math.min(Number(data.data.balance), total)
                                      setAppliedGiftCard({ code: data.data.code, balance: Number(data.data.balance), discount })
                                    } catch { setGiftCardError('Failed to validate gift card') }
                                    finally { setGiftCardApplying(false) }
                                  }
                                }}
                              />
                              <button
                                onClick={async () => {
                                  if (!giftCardInput.trim()) return
                                  setGiftCardApplying(true)
                                  try {
                                    const r = await axios.get(`/gift-cards/validate/${giftCardInput.trim()}`)
                                    const data = r.data
                                    if (!data.success) { setGiftCardError(data.message || 'Invalid gift card'); return }
                                    const discount = Math.min(Number(data.data.balance), total)
                                    setAppliedGiftCard({ code: data.data.code, balance: Number(data.data.balance), discount })
                                  } catch { setGiftCardError('Failed to validate gift card') }
                                  finally { setGiftCardApplying(false) }
                                }}
                                disabled={giftCardApplying || !giftCardInput.trim()}
                                style={{ padding: '12px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: !giftCardInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
                              >
                                {giftCardApplying ? '…' : 'Apply'}
                              </button>
                            </div>
                            {giftCardError && <p style={{ fontSize: 11, color: '#dc2626' }}>⚠ {giftCardError}</p>}
                          </div>
                        )}
                      </div>

                      <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="back-btn" onClick={() => setStep(1)}>
                          <ChevronLeft size={16} />
                          Back
                        </button>
                        <button
                          className="cta-btn"
                          style={{ flex: 1 }}
                          onClick={placeOrder}
                          disabled={processing || (paymentMethod === 'cod' && total > 5000)}
                        >
                          {processing ? (
                            <>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.3)', borderTopColor: 'var(--gold)', animation: 'spin 0.8s linear infinite' }} />
                              Processing…
                            </>
                          ) : (
                            <>
                              {paymentMethod === 'cod' ? <Package size={16} /> : <Lock size={16} />}
                              {paymentMethod === 'cod' ? 'Place Order' : 'Pay Securely'}
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ─── RIGHT — ORDER SUMMARY ─── */}
          <div style={{ position: 'sticky', top: 160 }}>
            <div className="glass-card">

              <div className="card-header-luxury">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShoppingBag size={16} style={{ color: 'var(--gold)' }} />
                  <h3 className="display-font" style={{ fontSize: 30, fontWeight: 300, color: 'white' }}>
                    Your Order
                  </h3>
                </div>
              </div>

              <div style={{ padding: '32px' }}>

                {/* Cart items with thumbnails */}
                {effectiveItems.map((item: any, i: number) => (
                  <motion.div
                    key={i}
                    className="cart-item-row"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                  >
                    <img
                      src={item.images?.[0] || '/placeholder-product.jpg'}
                      alt={item.name}
                      className="summary-item-img"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || 'Product'}</p>
                      {item?.variant_label && <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Variant: {item.variant_label}</p>}
                      <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Qty: {item?.quantity || 1}</p>
                      {item.is_returnable === false ? (
                        <p style={{ fontSize: 10, color: '#be123c', marginTop: 2, fontWeight: 600 }}>Non-Returnable</p>
                      ) : (
                        <p style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>{item.return_window_days ?? 7}d return policy</p>
                      )}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>
                      ₹{((Number(item?.price) || 0) * (Number(item?.quantity) || 1)).toFixed(2)}
                    </p>
                  </motion.div>
                ))}

                {/* Price breakdown */}
                <div style={{ marginTop: 16 }}>

                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal?.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
  <span>GST</span>
  <span>₹{tax.toFixed(2)}</span>
</div>

{platformFee > 0 && (
  <div className="summary-row">
    <span>Platform Fee</span>
    <span>₹{platformFee.toFixed(2)}</span>
  </div>
)}

                  <div className="summary-row">
                    <span>Delivery</span>
                    <span>
                      {delivery === 0
                        ? <span className="free-badge">Free</span>
                        : `₹${delivery}`
                      }
                    </span>
                  </div>
{subtotal < (chargesMap.free_delivery_limit || 500) && delivery > 0 && (
  <p
    style={{
      fontSize: 11,
      color: '#b8a898',
      marginTop: -6,
      marginBottom: 8,
      lineHeight: 1.5
    }}
  >
    Add ₹{((chargesMap.free_delivery_limit || 500) - subtotal).toFixed(2)} more for free delivery
  </p>
)}

                  {discount > 0 && (
                    <div className="summary-row" style={{ color: '#16a34a' }}>
                      <span>Coupon ({appliedCoupon?.code})</span>
                      <span style={{ fontWeight: 600 }}>−₹{discount.toFixed(2)}</span>
                    </div>
                  )}

                  {walletDiscount > 0 && (
                    <div className="summary-row" style={{ color: '#7c3aed' }}>
                      <span>Wallet Credits</span>
                      <span style={{ fontWeight: 600 }}>−₹{walletDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {loyaltyDiscount > 0 && (
                    <div className="summary-row" style={{ color: '#d97706' }}>
                      <span>Loyalty Points</span>
                      <span style={{ fontWeight: 600 }}>−₹{loyaltyDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="summary-divider" />

                  <div className="summary-row total" style={{ paddingTop: 22, marginTop: 4 }}>
                    <span className="display-font" style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em' }}>Total Amount</span>
                    <span className="display-font" style={{ background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 800, fontSize: 32 }}>₹{total}</span>
                  </div>

                </div>

                {/* Trust badges */}
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: Lock,     text: '256-bit SSL',      sub: 'Encrypted' },
                    { icon: Shield,   text: 'Buyer Protected',  sub: 'Guaranteed' },
                    { icon: Truck,    text: 'Fast Delivery',    sub: 'Pan India' },
                    { icon: Sparkles, text: '100% Natural',     sub: 'Certified' },
                  ].map(({ icon: Icon, text, sub }, i) => (
                    <motion.div
                      key={text}
                      className="trust-pill"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '12px 14px' }}
                    >
                      <Icon size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, lineHeight: 1 }}>{text}</p>
                        <p style={{ fontSize: 10, color: '#b8a898', marginTop: 2 }}>{sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

              </div>
            </div>
          </div>

        </main>

        <Footer />
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckoutInner />
    </Suspense>
  )
}