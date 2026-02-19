'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

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
  Leaf
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
      background: var(--cream);
      min-height: 100vh;
    }

    .display-font {
      font-family: 'Cormorant Garamond', serif;
    }

    /* Animated background */
    .bg-canvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.25;
    }
    .bg-orb-1 {
      width: 600px; height: 600px;
      background: radial-gradient(circle, #c9a96e 0%, transparent 70%);
      top: -200px; right: -100px;
      animation: driftA 18s ease-in-out infinite alternate;
    }
    .bg-orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #3d5a3e 0%, transparent 70%);
      bottom: -100px; left: -100px;
      animation: driftB 22s ease-in-out infinite alternate;
    }
    .bg-orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, #c9a96e 0%, transparent 70%);
      top: 50%; left: 30%;
      opacity: 0.12;
      animation: driftC 28s ease-in-out infinite alternate;
    }
    @keyframes driftA { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,80px) scale(1.1); } }
    @keyframes driftB { from { transform: translate(0,0) scale(1); } to { transform: translate(80px,-60px) scale(1.15); } }
    @keyframes driftC { from { transform: translate(0,0) rotate(0deg); } to { transform: translate(40px,40px) rotate(45deg); } }

    /* Grain overlay */
    .grain-overlay {
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      opacity: 0.4;
    }

    /* Progress bar */
    .progress-rail {
      background: var(--border);
      height: 1px;
      flex: 1;
      margin: 0 12px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold-dark), var(--gold));
      transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
    }

    /* Step node */
    .step-node {
      width: 44px; height: 44px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border);
      background: white;
      color: #999;
      transition: all 0.4s ease;
      position: relative;
    }
    .step-node.active {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--gold);
      box-shadow: 0 0 0 4px var(--mist), 0 8px 24px rgba(26,22,18,0.2);
    }
    .step-node.done {
      background: var(--gold);
      border-color: var(--gold);
      color: white;
    }

    /* Glass card */
    .glass-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 60px rgba(26,22,18,0.06), 0 1px 0 rgba(255,255,255,0.8) inset;
    }

    /* Card header */
    .card-header-luxury {
      padding: 28px 32px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, var(--bark) 0%, var(--ink) 100%);
      position: relative;
      overflow: hidden;
    }
    .card-header-luxury::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
      opacity: 0.15;
    }

    /* Gold input */
    .gold-input {
      width: 100%;
      padding: 14px 18px;
      background: var(--parchment);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      color: var(--ink);
      transition: all 0.2s ease;
      outline: none;
    }
    .gold-input::placeholder { color: #b8a898; }
    .gold-input:focus {
      border-color: var(--gold);
      background: white;
      box-shadow: 0 0 0 3px rgba(201,169,110,0.12);
    }

    /* Label */
    .input-label {
      display: block;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--gold-dark);
      margin-bottom: 6px;
    }

    /* Payment option */
    .pay-option {
      flex: 1;
      padding: 20px;
      border: 1px solid var(--border);
      border-radius: 16px;
      cursor: pointer;
      text-align: center;
      transition: all 0.25s ease;
      background: var(--parchment);
      position: relative;
      overflow: hidden;
    }
    .pay-option.selected {
      border-color: var(--gold);
      background: white;
      box-shadow: 0 0 0 2px var(--gold), 0 8px 32px rgba(201,169,110,0.15);
    }
    .pay-option.selected::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(201,169,110,0.06) 0%, transparent 100%);
    }
    .pay-option:hover:not(.selected) {
      border-color: rgba(201,169,110,0.5);
      background: white;
    }

    /* CTA button */
    .cta-btn {
      width: 100%;
      padding: 16px 28px;
      background: linear-gradient(135deg, var(--ink) 0%, var(--bark) 100%);
      color: var(--gold-light);
      border: none;
      border-radius: 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.04em;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .cta-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(201,169,110,0.15) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .cta-btn:hover::before { opacity: 1; }
    .cta-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(26,22,18,0.25); }
    .cta-btn:active { transform: translateY(0); }
    .cta-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    .back-btn {
      padding: 14px 20px;
      background: transparent;
      color: var(--ink);
      border: 1px solid var(--border);
      border-radius: 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      cursor: pointer;
      display: flex; align-items: center; gap-6;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .back-btn:hover { background: var(--parchment); }

    /* Summary row */
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0;
      font-size: 14px;
      color: #666;
    }
    .summary-row.total {
      color: var(--ink);
      font-size: 18px;
      font-weight: 600;
      padding-top: 16px;
    }
    .summary-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }
    .free-badge {
      background: linear-gradient(135deg, var(--sage), #2d4a2e);
      color: #a8d5a9;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    /* Cart item */
    .cart-item-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .cart-item-row:last-child { border-bottom: none; }
    .item-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--gold);
      flex-shrink: 0;
    }

    /* Success page */
    .success-scene {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      position: relative;
    }
    .success-card {
      max-width: 480px; width: 100%;
      background: white;
      border-radius: 32px;
      padding: 56px 48px;
      text-align: center;
      box-shadow: 0 32px 80px rgba(26,22,18,0.12), 0 1px 0 rgba(255,255,255,0.9) inset;
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }
    .success-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-dark));
    }
    .success-icon-ring {
      width: 96px; height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ink), var(--bark));
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
      position: relative;
    }
    .success-icon-ring::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: conic-gradient(var(--gold), var(--gold-dark), var(--gold));
      z-index: -1;
      animation: spin 4s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .order-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px;
      background: var(--parchment);
      border: 1px solid var(--border);
      border-radius: 40px;
      font-size: 13px;
      color: var(--gold-dark);
      font-weight: 600;
      letter-spacing: 0.06em;
      margin: 16px 0;
    }
    .amount-display {
      padding: 20px 28px;
      background: linear-gradient(135deg, var(--ink), var(--bark));
      border-radius: 16px;
      margin: 24px 0;
    }
    .shop-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, var(--gold-dark), var(--gold));
      color: var(--ink);
      border: none;
      border-radius: 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: all 0.25s ease;
    }
    .shop-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,169,110,0.4); }

    /* Loading */
    .loading-scene {
      height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--cream);
    }
    .loader-ring {
      width: 64px; height: 64px;
      border-radius: 50%;
      border: 2px solid var(--border);
      border-top-color: var(--gold);
      animation: spin 1s linear infinite;
    }

    /* Sticky top nav */
    .checkout-nav {
      position: sticky; top: 0; z-index: 50;
      background: rgba(253,249,242,0.85);
      backdrop-filter: blur(24px);
      border-bottom: 1px solid var(--border);
      padding: 20px 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .card-header-luxury { padding: 22px 24px; }
      .success-card { padding: 40px 28px; }
    }

    /* Scrollbar */
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
  </div>
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
export default function CheckoutPage() {

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNo, setOrderNo] = useState('')
  const [shipping, setShipping] = useState({ name: '', phone: '', address: '' })
       
  const {fetchCart, loginuserdata, cartdata,cartloading,settings}=useAuth()
  const [paidAmount, setPaidAmount] = useState<number>(0)
console.log(loginuserdata,"loginuserdata")
  useEffect(() => { fetchCart( loginuserdata?.id) }, [])
console.log(cartdata,"cartdata",settings,"settings")

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

const {
  subtotal,
  tax,
  delivery,
  platformFee,
  total
} = useMemo(() => {

  let cartSubtotal = 0;
  let cartTax = 0;

  (cartdata?.items || []).forEach((item: any) => {

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

  // Optional: if later you add this in settings
  const freeLimit = Number(chargesMap.free_delivery_limit || 500);

  const finalDelivery =
    cartSubtotal >= freeLimit ? 0 : deliveryCharge;

  const finalTotal =
    cartSubtotal +
    cartTax +
    finalDelivery +
    platformCharge;

  return {
    subtotal: +cartSubtotal.toFixed(2),
    tax: +cartTax.toFixed(2),
    delivery: +finalDelivery.toFixed(2),
    platformFee: +platformCharge.toFixed(2),
    total: +finalTotal.toFixed(2)
  };

}, [cartdata, chargesMap]);
  

  const validateShipping = () => {
    if (!shipping.name.trim()) { toast.error('Full name is required'); return false }
    if (!/^[6-9]\d{9}$/.test(shipping.phone)) { toast.error('Enter valid mobile number'); return false }
    if (shipping.address.trim().length < 10) { toast.error('Enter complete address'); return false }
    return true
  }

const placeOrder = async () => {

  if (!validateShipping()) return;

  if (processing) return;

  try {
    setProcessing(true);

    /* ================= CREATE ORDER ================= */

    const res = await axios.post("/orders/create", {
      shipping,
      paymentMethod,

      // Optional: frontend snapshot (for debugging only)
      pricing: {
        subtotal,
        tax,
        delivery,
        platformFee,
        total
      }
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Order creation failed");
    }

    const orderId = res.data.orderId;

    /* ================= COD FLOW ================= */

    if (paymentMethod === "cod") {

      toast.success("Order placed successfully");
setPaidAmount(total);
      setOrderNo("ORD" + orderId);

      setOrderPlaced(true);
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

      name: "Ayureveda",

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

            setOrderNo("ORD" + orderId);
setPaidAmount(total);
            setOrderPlaced(true);
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
            <motion.div
              className="success-icon-ring"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <CheckCircle size={40} color="var(--gold)" />
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

            <motion.button
              className="shop-btn"
              onClick={() => window.location.href = '/'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
            >
              <Sparkles size={16} />
              Continue Exploring
            </motion.button>
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
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

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
        <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 28, alignItems: 'start' }}
          className="checkout-main-grid"
        >

          <style jsx>{`
            @media (max-width: 900px) {
              .checkout-main-grid {
                grid-template-columns: 1fr !important;
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="glass-card">

                    <div className="card-header-luxury">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={16} style={{ color: 'var(--gold)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', marginBottom: 2 }}>Step 1 of 2</p>
                          <h2 className="display-font" style={{ fontSize: 26, fontWeight: 300, color: 'white', letterSpacing: '-0.01em' }}>
                            Delivery Details
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '32px' }}>
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
                          <h2 className="display-font" style={{ fontSize: 26, fontWeight: 300, color: 'white', letterSpacing: '-0.01em' }}>
                            Payment Method
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '32px' }}>

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

                      <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>

                        <button
                          className={`pay-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('cod')}
                        >
                          <IndianRupee size={22} style={{ color: paymentMethod === 'cod' ? 'var(--gold)' : '#999', margin: '0 auto 8px' }} />
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Cash on Delivery</p>
                          <p style={{ fontSize: 11, color: '#999' }}>Pay when it arrives</p>
                          {paymentMethod === 'cod' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <CheckCircle size={12} color="white" />
                            </motion.div>
                          )}
                        </button>

                        <button
                          className={`pay-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('online')}
                        >
                          <CreditCard size={22} style={{ color: paymentMethod === 'online' ? 'var(--gold)' : '#999', margin: '0 auto 8px' }} />
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Online Payment</p>
                          <p style={{ fontSize: 11, color: '#999' }}>UPI, Cards, NetBanking</p>
                          {paymentMethod === 'online' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <CheckCircle size={12} color="white" />
                            </motion.div>
                          )}
                        </button>

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
                          disabled={processing}
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
          <div style={{ position: 'sticky', top: 140 }}>
            <div className="glass-card">

              <div className="card-header-luxury">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShoppingBag size={16} style={{ color: 'var(--gold)' }} />
                  <h3 className="display-font" style={{ fontSize: 22, fontWeight: 300, color: 'white' }}>
                    Your Order
                  </h3>
                </div>
              </div>

              <div style={{ padding: '24px' }}>

                {/* Cartdata items */}
                {cartdata?.items?.map((item: any, i: number) => (
                  <div key={i} className="cart-item-row">
                    <div className="item-dot" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>{item.name || 'Product'}</p>
                      {item?.quantity && <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Qty: {item?.quantity}</p>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>₹{(Number(item?.price) || 0)?.toFixed(2)}</p>
                  </div>
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

                  <div className="summary-divider" />

                  <div className="summary-row total">
                    <span>Total</span>
                    <span style={{ color: 'var(--gold-dark)' }}>₹{total}</span>
                  </div>

                </div>

                {/* Trust badges */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: Lock, text: '256-bit SSL' },
                    { icon: Shield, text: 'Buyer Protected' },
                    { icon: Truck, text: 'Fast Delivery' },
                    { icon: Sparkles, text: '100% Natural' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Icon size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#999' }}>{text}</span>
                    </div>
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