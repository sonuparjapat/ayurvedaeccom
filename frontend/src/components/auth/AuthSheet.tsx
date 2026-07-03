'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/auth-context'
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet'
import {
  User, Mail, Lock, Phone, Eye, EyeOff,
  ArrowRight, Send, ShieldCheck, Smartphone,
  RefreshCw, LogIn, UserPlus, KeyRound,
  CheckCircle2, LucideIcon, Leaf, Sprout,
  FlowerIcon, BookOpen
} from 'lucide-react'

// ── Typed field component ──
interface AuthInputProps {
  icon: LucideIcon
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  rightSlot?: React.ReactNode
  inputStyle?: React.CSSProperties
}
function AuthInput({ icon: Icon, type = 'text', placeholder, value, onChange, rightSlot, inputStyle }: AuthInputProps) {
  return (
    <div className="auth-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 2, color: '#7eb87a',
        width: '16px', height: '16px', flexShrink: 0,
      }}>
        <Icon size={15} strokeWidth={1.8} />
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={rightSlot ? 'has-right' : undefined}
        style={inputStyle}
      />
      {rightSlot && (
        <span style={{
          position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          {rightSlot}
        </span>
      )}
    </div>
  )
}

type AuthMode = 'login' | 'register' | 'otp' | 'mobileOtp' | 'forgot' | 'verifySent'

// Static — defined outside the component so the string is never re-created on render
const AUTH_STYLES = `
  .auth-sheet-inner {
    height: 100%; display: flex; flex-direction: column;
    overflow-y: auto; background: #faf7f2;
  }
  .auth-header {
    padding: 28px 24px 22px;
    background: linear-gradient(160deg, #eef7ec 0%, #e8f3e6 55%, #f0ede6 100%);
    position: relative; overflow: hidden; flex-shrink: 0;
    border-bottom: 1px solid rgba(126,184,122,0.2);
  }
  .auth-header::before {
    content: ''; position: absolute; top: -55px; right: -55px;
    width: 190px; height: 190px; border-radius: 50%;
    background: radial-gradient(circle, rgba(126,184,122,0.18) 0%, transparent 70%);
  }
  .auth-header::after {
    content: ''; position: absolute; bottom: -35px; left: -25px;
    width: 150px; height: 150px; border-radius: 50%;
    background: radial-gradient(circle, rgba(193,123,42,0.1) 0%, transparent 70%);
  }
  .auth-leaf-deco {
    position: absolute; top: 14px; right: 22px; z-index: 0;
    opacity: 0.12; color: #4e8a5f;
  }
  .auth-brand {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px; position: relative; z-index: 1;
  }
  .auth-brand-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(126,184,122,0.22);
    border: 1.5px solid rgba(78,138,95,0.35);
    display: flex; align-items: center; justify-content: center;
  }
  .auth-brand-name {
    color: #1e3a2a; font-size: 14px;
    font-weight: 700; letter-spacing: 0.3px; line-height: 1.2;
  }
  .auth-brand-tag {
    color: #7a9e7e; font-size: 9.5px;
    letter-spacing: 1.3px; text-transform: uppercase;
  }
  .auth-heading { position: relative; z-index: 1; }
  .auth-title {
    color: #1e3a2a; font-size: 22px;
    font-weight: 700; margin-bottom: 4px; line-height: 1.2;
  }
  .auth-subtitle { color: #7a9e7e; font-size: 13px; }
  .auth-tabs {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px;
    background: rgba(0,0,0,0.04);
    border: 1.5px solid rgba(126,184,122,0.22);
    border-radius: 10px; padding: 3px;
    margin-top: 20px; position: relative; z-index: 1;
  }
  .auth-tab {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px;
    padding: 7px 4px; border: none; background: transparent;
    color: #9ab89a; font-size: 10px; font-weight: 500;
    border-radius: 7px; cursor: pointer; transition: color 0.15s, background 0.15s;
    letter-spacing: 0.3px;
  }
  .auth-tab:hover { color: #4e8a5f; background: rgba(126,184,122,0.08); }
  .auth-tab.active {
    background: #fff; color: #3a6b4a;
    border: 1.5px solid rgba(78,138,95,0.28);
    box-shadow: 0 1px 4px rgba(78,138,95,0.12);
    font-weight: 600;
  }
  .auth-tab svg { width: 13px; height: 13px; flex-shrink: 0; }
  .auth-body { padding: 24px 24px 30px; flex: 1; background: #faf7f2; }
  .herb-divider {
    display: flex; align-items: center; gap: 8px;
    margin: 2px 0 18px; color: #b0c8af; font-size: 10px; letter-spacing: 1.2px;
  }
  .herb-divider::before, .herb-divider::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(126,184,122,0.35), transparent);
  }
  .auth-field { margin-bottom: 15px; }
  .auth-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 10.5px; font-weight: 700;
    color: #5a7a5e; letter-spacing: 0.9px;
    text-transform: uppercase; margin-bottom: 6px;
  }
  .auth-label-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: #7eb87a; flex-shrink: 0;
  }
  .auth-forgot-row { text-align: right; margin: -4px 0 12px; }
  .auth-forgot-btn {
    background: none; border: none; font-size: 11.5px;
    color: #4e8a5f; cursor: pointer; padding: 0; font-weight: 500;
  }
  .auth-forgot-btn:hover { text-decoration: underline; color: #3a6b4a; }
  .auth-primary-btn {
    width: 100%; padding: 12px 16px; margin-top: 6px;
    background: linear-gradient(135deg, #4e8a5f 0%, #3a6b4a 100%);
    border: none; border-radius: 10px; color: #fff;
    font-size: 13.5px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    letter-spacing: 0.3px;
    box-shadow: 0 2px 12px rgba(58,107,74,0.25);
  }
  .auth-primary-btn:hover:not(:disabled) { opacity: 0.90; box-shadow: 0 4px 18px rgba(58,107,74,0.32); }
  .auth-primary-btn:active:not(:disabled) { transform: scale(0.98); }
  .auth-primary-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  .auth-primary-btn svg { width: 15px; height: 15px; }
  .auth-secondary-btn {
    width: 100%; padding: 10px 16px; margin-top: 8px;
    background: #fff; border: 1.5px solid #dde8db;
    border-radius: 10px; color: #5a7a5e;
    font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .auth-secondary-btn:hover { border-color: #7eb87a; color: #3a6b4a; background: #f4f9f3; }
  .auth-secondary-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .auth-secondary-btn svg { width: 14px; height: 14px; }
  .auth-info-box {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 11px 13px;
    background: rgba(126,184,122,0.1);
    border: 1.5px solid rgba(126,184,122,0.28);
    border-radius: 9px; margin-bottom: 16px;
  }
  .auth-info-box svg { width: 16px; height: 16px; color: #4e8a5f; flex-shrink: 0; margin-top: 1px; }
  .auth-info-box p { font-size: 12.5px; color: #5a7a5e; line-height: 1.55; }
  .auth-sent-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(78,138,95,0.12); color: #3a6b4a;
    border-radius: 20px; padding: 2px 9px; font-size: 11px; font-weight: 600;
    border: 1px solid rgba(78,138,95,0.22);
  }
  .auth-sent-badge svg { width: 11px; height: 11px; }
  .auth-success-wrap { text-align: center; padding: 8px 0; }
  .auth-success-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(78,138,95,0.1);
    border: 2px solid rgba(78,138,95,0.25);
    display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
  }
  .auth-success-icon svg { width: 30px; height: 30px; color: #4e8a5f; }
  .auth-success-title { font-size: 19px; font-weight: 700; color: #1e3a2a; margin-bottom: 8px; }
  .auth-success-sub { font-size: 13px; color: #7a9e7e; line-height: 1.7; margin-bottom: 22px; }
  .auth-resend-section { margin-top: 18px; padding-top: 16px; border-top: 1px solid #e8e2d8; }
  .auth-resend-label {
    font-size: 10.5px; color: #9ab89a; text-align: center; margin-bottom: 8px;
    text-transform: uppercase; letter-spacing: 0.7px;
  }
  .auth-trust-badges { display: flex; gap: 6px; margin-top: 20px; flex-wrap: wrap; }
  .auth-badge {
    background: rgba(78,138,95,0.08); color: #4e8a5f;
    border: 1px solid rgba(78,138,95,0.2);
    border-radius: 20px; padding: 3px 10px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.3px;
  }
  .auth-badge-amber {
    background: rgba(193,123,42,0.08); color: #a06828;
    border: 1px solid rgba(193,123,42,0.22);
  }
  /* Focus styles via CSS — avoids JS DOM mutation on focus/blur */
  .auth-input-wrap input {
    width: 100%; padding: 11px 14px 11px 42px;
    background: #f9f6f0; border: 1.5px solid #e0d8cc;
    border-radius: 9px; font-size: 14px; color: #2d2a20;
    outline: none; box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .auth-input-wrap input.has-right { padding-right: 42px; }
  .auth-input-wrap input:focus {
    border-color: #7eb87a;
    background: #f4f9f3;
    box-shadow: 0 0 0 3px rgba(126,184,122,0.12);
  }
  [data-radix-popper-content-wrapper] { z-index: 9999 !important; }
`

const TAB_CONFIG = [
  { key: 'login',     label: 'Login',    Icon: LogIn },
  { key: 'register',  label: 'Register', Icon: UserPlus },
  { key: 'otp',       label: 'OTP',      Icon: KeyRound },
  { key: 'mobileOtp', label: 'Mobile',   Icon: Smartphone },
] as const

const HEADERS: Record<AuthMode, { title: string; subtitle: string }> = {
  login:      { title: 'Welcome back',      subtitle: 'Sign in to your wellness journey' },
  register:   { title: 'Join the journey',  subtitle: 'Create your organic wellness account' },
  otp:        { title: 'OTP login',         subtitle: 'Passwordless sign in via email' },
  mobileOtp:  { title: 'Mobile login',      subtitle: 'Sign in with your phone number' },
  forgot:     { title: 'Reset password',    subtitle: 'We\'ll send you a recovery link' },
  verifySent: { title: 'Check your inbox',  subtitle: 'Verification email has been sent' },
}

export function AuthSheet() {
  const router = useRouter()
  const {
    openauth, setOpenauth, authMode, setAuthMode,
    login, postLoginRedirect, setPostLoginRedirect,
  } = useAuth()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [mobileOtpSent, setMobileOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [mobileOtpTimer, setMobileOtpTimer] = useState(0)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [otpForm, setOtpForm] = useState({ identifier: '', otp: '' })
  const [mobileForm, setMobileForm] = useState({ phone: '', otp: '' })
  const [forgotEmail, setForgotEmail] = useState('')

  useEffect(() => {
    if (otpTimer <= 0) return
    const t = setInterval(() => setOtpTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [otpTimer])

  useEffect(() => {
    if (mobileOtpTimer <= 0) return
    const t = setInterval(() => setMobileOtpTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [mobileOtpTimer])

  const handlePostLogin = () => {
    setOpenauth(false)
    if (postLoginRedirect) {
      router.push(postLoginRedirect)
      setPostLoginRedirect('')
    } else {
      router.refresh()
    }
    router.refresh()
  }

  const handleLogin = async () => {
    try {
      setLoading(true)
      const res = await axios.post('/users/login', loginForm)
      await login(res.data.user)
      toast.success('Welcome back 🌿')
      handlePostLogin()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }


  const handleRegister = async () => {
    try {
      setLoading(true)
      await axios.post('/users/register', registerForm)
      toast.success('Account created successfully')
      setAuthMode('verifySent')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const handleForgotPassword = async () => {
    try {
      setLoading(true)
      const res = await axios.post('/users/forgot-password', { email: forgotEmail })
      toast.success(res?.data?.message || 'Reset link sent')
      setAuthMode('login')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to process request')
    } finally { setLoading(false) }
  }

  const handleSendOtp = async () => {
    try {
      setLoading(true)
      const res = await axios.post('/users/send-login-otp', { identifier: otpForm.identifier })
      toast.success(res?.data?.message || 'OTP sent successfully')
      setOtpSent(true)
      setOtpTimer(30)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    try {
      setLoading(true)
      const res = await axios.post('/users/verify-login-otp', otpForm)
      await login(res.data.user)
      toast.success('Login successful')
      handlePostLogin()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleSendMobileOtp = async () => {
    try {
      setLoading(true)
      const res = await axios.post('/users/send-mobile-otp', { phone: mobileForm.phone })
      toast.success(res?.data?.message || 'OTP sent')
      setMobileOtpSent(true)
      setMobileOtpTimer(30)
      if (res?.data?.otp) toast.success(`Dev OTP: ${res.data.otp}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyMobileOtp = async () => {
    try {
      setLoading(true)
      const res = await axios.post('/users/verify-mobile-otp', mobileForm)
      await login(res.data.user)
      toast.success('Login successful')
      handlePostLogin()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleResendVerification = async () => {
    try {
      const res = await axios.post('/users/resend-verification', { email: registerForm.email })
      toast.success(res.data.message)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to resend')
    }
  }

  const header = HEADERS[authMode as AuthMode] || HEADERS.login

  // ── Google Sign-In ──
  const gBtnRef = useRef<HTMLDivElement>(null)

  // Stable callback — called by Google with the signed id_token JWT
  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      setLoading(true)
      const res = await axios.post('/users/google-login', { id_token: response.credential })
      if (res.data?.token) {
        document.cookie = `auth_token=${res.data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
      }
      await login(res.data.user)
      toast.success('Welcome 🌿')
      handlePostLogin()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Google login failed')
      setLoading(false)
    }
  }, [login]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!openauth) return

    const initGoogle = () => {
      const g = (window as any).google
      if (!g?.accounts?.id) return // script not ready yet
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.warn('[Auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set')
        return
      }
      if (!gBtnRef.current) return

      // Initialize once with our callback
      g.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: false,
      })

      // Render Google's official button — always shows the account picker on click
      if (!gBtnRef.current.hasChildNodes()) {
        g.accounts.id.renderButton(gBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: gBtnRef.current.offsetWidth || 360,
          logo_alignment: 'center',
        })
      }
    }

    initGoogle()
    // Retry after brief delays in case the Google script hasn't finished loading
    const t1 = setTimeout(initGoogle, 300)
    const t2 = setTimeout(initGoogle, 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      // Cancel any pending One Tap prompt when sheet closes
      ;(window as any).google?.accounts?.id?.cancel()
    }
  }, [openauth, handleCredentialResponse])

  return (
    <Sheet open={openauth} onOpenChange={setOpenauth}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col z-[9999] p-0 border-0"
        style={{ background: '#faf7f2' }}
      >
        <style>{AUTH_STYLES}</style>

        <div className="auth-sheet-inner">

          {/* ── HEADER ── */}
          <SheetHeader className="auth-header p-0 space-y-0">
            {/* Decorative leaf */}
            <div className="auth-leaf-deco">
              <Leaf size={72} strokeWidth={1} />
            </div>

            {/* Brand */}
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <Sprout size={19} color="#4e8a5f" strokeWidth={1.7} />
              </div>
              <div>
                <div className="auth-brand-name">VanaOrganic</div>
                <div className="auth-brand-tag">Pure · Natural · Ayurvedic</div>
              </div>
            </div>

            <div className="auth-heading">
              <div className="auth-title">{header.title}</div>
              <div className="auth-subtitle">{header.subtitle}</div>
            </div>

            <nav className="auth-tabs" aria-label="Authentication modes">
              {TAB_CONFIG.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`auth-tab${authMode === key ? ' active' : ''}`}
                  onClick={() => startTransition(() => setAuthMode(key as AuthMode))}
                >
                  <Icon size={13} strokeWidth={1.8} /> {label}
                </button>
              ))}
            </nav>
          </SheetHeader>

          {/* ── BODY ── */}
          <div className="auth-body">

            {/* LOGIN */}
            {authMode === 'login' && (
              <div>
                <div className="herb-divider">✦ &nbsp; secure login &nbsp; ✦</div>

                <div className="auth-field">
                  <label className="auth-label">
                    <span className="auth-label-dot" />
                    Email address
                  </label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>

                <div className="auth-field">
                  <label className="auth-label">
                    <span className="auth-label-dot" />
                    Password
                  </label>
                  <AuthInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    rightSlot={
                      <button type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ab89a', display: 'flex', padding: 0 }}
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                      </button>
                    }
                  />
                </div>

                <div className="auth-forgot-row">
                  <button className="auth-forgot-btn" onClick={() => setAuthMode('forgot')}>
                    Forgot password?
                  </button>
                </div>

                <button className="auth-primary-btn" disabled={loading} onClick={handleLogin}>
                  <Leaf size={15} strokeWidth={2} />
                  {loading ? 'Signing in…' : 'Sign in to account'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(26,46,30,0.1)' }} />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(26,46,30,0.1)' }} />
                </div>

                {/* Google renders its own button here — always shows the account picker */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '44px' }}>
                  <div ref={gBtnRef} style={{ width: '100%' }} />
                </div>
                {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                  <p style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', marginTop: 6 }}>
                    Google Sign-In not configured — set NEXT_PUBLIC_GOOGLE_CLIENT_ID
                  </p>
                )}

                <div className="auth-resend-section">
                  <div className="auth-resend-label">Email not verified yet?</div>
                  <button className="auth-secondary-btn" onClick={handleResendVerification}>
                    <RefreshCw size={14} strokeWidth={1.8} /> Resend verification email
                  </button>
                </div>

                <div className="auth-trust-badges">
                  <span className="auth-badge">🌿 100% Organic</span>
                  <span className="auth-badge auth-badge-amber">✨ Ayurvedic</span>
                  <span className="auth-badge">🛡 Lab Tested</span>
                </div>
              </div>
            )}

            {/* REGISTER */}
            {authMode === 'register' && (
              <div>
                <div className="herb-divider">✦ &nbsp; create account &nbsp; ✦</div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Full name</label>
                  <AuthInput icon={User} placeholder="Your full name"
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
                </div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
                </div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Mobile number</label>
                  <AuthInput icon={Phone} type="tel" placeholder="+91 98765 43210"
                    value={registerForm.phone}
                    onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                </div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Password</label>
                  <AuthInput icon={Lock} type="password" placeholder="Create a strong password"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                </div>

                <button className="auth-primary-btn" disabled={loading} onClick={handleRegister}>
                  <Sprout size={15} strokeWidth={2} />
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            )}

            {/* OTP LOGIN */}
            {authMode === 'otp' && (
              <div>
                <div className="auth-info-box">
                  <KeyRound size={16} strokeWidth={1.8} />
                  <p>Enter your email to receive a one-time login code. No password needed.</p>
                </div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={otpForm.identifier}
                    onChange={e => setOtpForm({ ...otpForm, identifier: e.target.value })} />
                </div>

                {otpSent && (
                  <div className="auth-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label className="auth-label" style={{ margin: 0 }}><span className="auth-label-dot" /> Enter OTP</label>
                      <span className="auth-sent-badge"><CheckCircle2 size={11} /> Code sent</span>
                    </div>
                    <AuthInput icon={ShieldCheck} placeholder="6-digit code"
                      value={otpForm.otp}
                      onChange={e => setOtpForm({ ...otpForm, otp: e.target.value })}
                      inputStyle={{ letterSpacing: '6px', fontWeight: 600 }} />
                  </div>
                )}

                {!otpSent ? (
                  <button className="auth-primary-btn" disabled={loading || otpTimer > 0} onClick={handleSendOtp}>
                    <Send size={15} strokeWidth={2} />
                    {loading ? 'Sending OTP…' : otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Send OTP code'}
                  </button>
                ) : (
                  <>
                    <button className="auth-primary-btn" disabled={loading} onClick={handleVerifyOtp}>
                      <ShieldCheck size={15} strokeWidth={2} />
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button className="auth-secondary-btn" disabled={otpTimer > 0} onClick={handleSendOtp}>
                      <RefreshCw size={14} strokeWidth={1.8} />
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend code'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {authMode === 'forgot' && (
              <div>
                <div className="auth-info-box">
                  <Mail size={16} strokeWidth={1.8} />
                  <p>Enter the email linked to your account and we'll send a secure reset link.</p>
                </div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} />
                </div>

                <button className="auth-primary-btn" disabled={loading} onClick={handleForgotPassword}>
                  <Send size={15} strokeWidth={2} />
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
                <button className="auth-secondary-btn" onClick={() => setAuthMode('login')}>
                  ← Back to login
                </button>
              </div>
            )}

            {/* MOBILE OTP */}
            {authMode === 'mobileOtp' && (
              <div>
                <div className="auth-info-box">
                  <Smartphone size={16} strokeWidth={1.8} />
                  <p>Enter your mobile number to receive a one-time code via SMS.</p>
                </div>

                <div className="auth-field">
                  <label className="auth-label"><span className="auth-label-dot" /> Mobile number</label>
                  <AuthInput icon={Phone} type="tel" placeholder="+91 98765 43210"
                    value={mobileForm.phone}
                    onChange={e => setMobileForm({ ...mobileForm, phone: e.target.value })} />
                </div>

                {mobileOtpSent && (
                  <div className="auth-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label className="auth-label" style={{ margin: 0 }}><span className="auth-label-dot" /> SMS code</label>
                      <span className="auth-sent-badge"><CheckCircle2 size={11} /> SMS sent</span>
                    </div>
                    <AuthInput icon={ShieldCheck} placeholder="6-digit code"
                      value={mobileForm.otp}
                      onChange={e => setMobileForm({ ...mobileForm, otp: e.target.value })}
                      inputStyle={{ letterSpacing: '6px', fontWeight: 600 }} />
                  </div>
                )}

                {!mobileOtpSent ? (
                  <button className="auth-primary-btn" disabled={loading || mobileOtpTimer > 0} onClick={handleSendMobileOtp}>
                    <Send size={15} strokeWidth={2} />
                    {loading ? 'Sending…' : mobileOtpTimer > 0 ? `Resend in ${mobileOtpTimer}s` : 'Send SMS code'}
                  </button>
                ) : (
                  <>
                    <button className="auth-primary-btn" disabled={loading} onClick={handleVerifyMobileOtp}>
                      <ShieldCheck size={15} strokeWidth={2} />
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button className="auth-secondary-btn" disabled={mobileOtpTimer > 0} onClick={handleSendMobileOtp}>
                      <RefreshCw size={14} strokeWidth={1.8} />
                      {mobileOtpTimer > 0 ? `Resend in ${mobileOtpTimer}s` : 'Resend SMS'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* VERIFY SENT */}
            {authMode === 'verifySent' && (
              <div className="auth-success-wrap">
                <div className="auth-success-icon">
                  <Mail size={30} strokeWidth={1.8} />
                </div>
                <div className="auth-success-title">Check your inbox</div>
                <p className="auth-success-sub">
                  We've sent a verification link to your email address. Click the link to activate your account and begin your wellness journey.
                </p>
                <button className="auth-primary-btn" onClick={() => setAuthMode('login')}>
                  <ArrowRight size={15} strokeWidth={2} /> Go to login
                </button>
                <button className="auth-secondary-btn" onClick={() => setAuthMode('register')}>
                  Use a different email
                </button>
              </div>
            )}

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}