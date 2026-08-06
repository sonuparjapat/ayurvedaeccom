'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, Mail, Leaf, ArrowRight, Shield, Sparkles } from 'lucide-react'

export default function UserLogin() {
  const router = useRouter()
  const { login, settings } = useAuth()
  const freeDeliveryLimit = Number((settings||[]).find((s:any)=>s.key==='free_delivery_limit')?.value||500)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validate = () => {
    if (!formData.email) return 'Email required'
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Invalid email'
    if (!formData.password) return 'Password required'
    if (formData.password.length < 6) return 'Min 6 chars'
    return ''
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const msg = validate()
    if (msg) { setError(msg); return }
    try {
      setLoading(true); setError(''); setSuccess('')
      const res = await axios.post('/users/login', formData)
      await login(res.data.user)
      setSuccess('Login Successful')
      setTimeout(() => router.push('/account'), 1000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root {
          min-height: 100svh;
          display: flex;
          background: #f5f1e8;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Left panel ── */
        .login-left {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: linear-gradient(150deg, #0a2016 0%, #0f3d2e 35%, #134e3a 60%, #1a5c45 100%);
          display: none;
        }
        @media (min-width: 900px) { .login-left { display: flex; align-items: center; justify-content: center; } }

        .login-left-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(16,185,129,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 10%, rgba(245,158,11,0.07) 0%, transparent 60%);
        }
        .login-left-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .login-left-content {
          position: relative; z-index: 2;
          padding: 48px;
          max-width: 480px;
          text-align: center;
        }
        .login-orb {
          width: 160px; height: 160px; border-radius: 50%; margin: 0 auto 32px;
          background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(16,185,129,0.20));
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 24px 80px rgba(16,185,129,0.20), inset 0 1px 2px rgba(255,255,255,0.2);
          position: relative; overflow: hidden;
        }
        .login-orb::before {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 50%;
          border-radius: 50%; background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%);
        }
        .login-orb-emoji { font-size: 4rem; position: relative; z-index: 1; }
        .login-brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.4rem; font-weight: 700; color: #f0fdf4;
          letter-spacing: -0.02em; margin-bottom: 12px;
          text-shadow: 0 2px 16px rgba(0,0,0,0.3);
        }
        .login-brand-sub {
          color: rgba(167,243,208,0.75); font-size: 14px; line-height: 1.7;
          letter-spacing: 0.02em; margin-bottom: 40px;
        }
        .login-trust-item {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; padding: 12px 18px; margin-bottom: 10px;
          backdrop-filter: blur(8px);
        }
        .login-trust-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .login-trust-text { color: rgba(209,250,229,0.85); font-size: 13px; font-weight: 500; }

        /* ── Right panel ── */
        .login-right {
          width: 100%; display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          background: linear-gradient(160deg, #f8fffb 0%, #f0fdf4 30%, #fffdf5 65%, #f0fdf4 100%);
          position: relative; overflow: hidden;
        }
        @media (min-width: 900px) { .login-right { width: 480px; flex-shrink: 0; } }

        .login-right-blob1 {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
          top: -80px; right: -80px; pointer-events: none;
        }
        .login-right-blob2 {
          position: absolute; width: 240px; height: 240px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
          bottom: -60px; left: -60px; pointer-events: none;
        }

        .login-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(32px) saturate(1.8);
          -webkit-backdrop-filter: blur(32px) saturate(1.8);
          border: 1px solid rgba(255,255,255,0.75);
          border-radius: 28px;
          padding: 40px 36px;
          box-shadow:
            0 32px 80px rgba(26,58,42,0.10),
            0 8px 24px rgba(26,58,42,0.06),
            inset 0 1px 0 rgba(255,255,255,0.95),
            0 0 0 0.5px rgba(16,185,129,0.08) inset;
        }

        /* Mobile card */
        @media (max-width: 480px) { .login-card { padding: 28px 20px; border-radius: 22px; } }

        .login-card-logo {
          display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px;
        }
        .login-card-logo-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, #059669, #0f3d2e);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(5,150,105,0.35);
        }
        .login-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem; font-weight: 700; color: #0f3d2e;
          letter-spacing: -0.02em; text-align: center; margin-bottom: 4px;
        }
        .login-card-sub {
          text-align: center; color: rgba(26,58,42,0.5); font-size: 13.5px; margin-bottom: 28px;
        }

        /* Alerts */
        .login-alert {
          display: flex; align-items: center; gap: 10px;
          border-radius: 14px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px;
        }
        .login-alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .login-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

        /* Input field */
        .login-field { margin-bottom: 16px; position: relative; }
        .login-input-wrap {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(26,58,42,0.12);
          border-radius: 14px;
          padding: 0 14px;
          height: 50px;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-shadow: inset 0 1.5px 4px rgba(26,58,42,0.04), 0 1px 0 rgba(255,255,255,0.9);
        }
        .login-input-wrap:focus-within {
          border-color: rgba(16,185,129,0.5);
          background: rgba(255,255,255,0.92);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08), inset 0 1px 3px rgba(26,58,42,0.04);
        }
        .login-input-icon { color: rgba(26,58,42,0.35); flex-shrink: 0; }
        .login-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0f3d2e;
          padding: 0 10px;
          height: 100%;
        }
        .login-input::placeholder { color: rgba(26,58,42,0.35); }
        .login-eye-btn {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: rgba(26,58,42,0.4); display: flex; align-items: center;
          transition: color 0.2s;
        }
        .login-eye-btn:hover { color: rgba(26,58,42,0.7); }

        /* Submit button */
        .login-btn {
          width: 100%; height: 52px; border: none; border-radius: 14px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700;
          color: white; letter-spacing: 0.02em;
          background: linear-gradient(135deg, #059669 0%, #0f3d2e 100%);
          box-shadow: 0 6px 24px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(5,150,105,0.42), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
          transform: translateX(-100%) skewX(-15deg); transition: transform 0.5s ease;
        }
        .login-btn:hover::after { transform: translateX(120%) skewX(-15deg); }

        .login-spinner {
          width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: white; border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* Divider */
        .login-divider {
          display: flex; align-items: center; gap: 12px; margin: 22px 0;
        }
        .login-divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(26,58,42,0.10), transparent);
        }
        .login-divider-text { font-size: 11px; color: rgba(26,58,42,0.4); letter-spacing: 0.06em; text-transform: uppercase; }

        /* Trust mini */
        .login-mini-trust {
          display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 20px;
        }
        .login-mini-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10.5px; font-weight: 600; color: rgba(26,58,42,0.55);
          background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.14);
          border-radius: 100px; padding: 4px 10px;
        }
      `}</style>

      <div className="login-root">

        {/* ── Left decorative panel ── */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-grid" />
          <div className="login-left-content">
            <div className="login-orb">
              <span className="login-orb-emoji">🌿</span>
            </div>
            <div className="login-brand-name">Oroganix</div>
            <div className="login-brand-sub">
              Premium Ayurvedic herbs, organic supplements<br />
              and natural wellness products.<br />
              <strong style={{ color: 'rgba(167,243,208,0.95)' }}>100% organic · Lab-tested · Farm-direct</strong>
            </div>
            {[
              { color: '#10b981', text: 'Sourced directly from certified Indian farms' },
              { color: '#f59e0b', text: 'Third-party lab tested for purity & safety' },
              { color: '#60a5fa', text: `Free shipping on orders above ₹${freeDeliveryLimit}` },
            ].map((t, i) => (
              <div key={i} className="login-trust-item">
                <span className="login-trust-dot" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}60` }} />
                <span className="login-trust-text">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right login panel ── */}
        <div className="login-right">
          <div className="login-right-blob1" />
          <div className="login-right-blob2" />

          <div className="login-card">

            {/* Logo mark */}
            <div className="login-card-logo">
              <div className="login-card-logo-icon">
                <Leaf size={22} color="white" />
              </div>
            </div>

            <div className="login-card-title">Welcome back</div>
            <div className="login-card-sub">Sign in to your Oroganix account</div>

            {/* Alerts */}
            {success && (
              <div className="login-alert success">
                <CheckCircle size={16} />
                {success}
              </div>
            )}
            {error && (
              <div className="login-alert error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="login-field">
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="email"
                    className="login-input"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button type="button" className="login-eye-btn" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <div className="login-spinner" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">Secured by</span>
              <div className="login-divider-line" />
            </div>

            <div className="login-mini-trust">
              {[
                { icon: Shield, label: 'SSL Secure' },
                { icon: Sparkles, label: '100% Organic' },
                { icon: Leaf, label: 'FSSAI Certified' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="login-mini-badge">
                  <Icon size={10} />
                  {label}
                </span>
              ))}
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
