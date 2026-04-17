'use client'

import { useEffect, useState } from 'react'
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
  CheckCircle2, Layers, LucideIcon
} from 'lucide-react'

// ── Typed field component — inline styles win over Tailwind/shadcn resets ──
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
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* Left icon — absolutely positioned, never inside the input flow */}
      <span style={{
        position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 2, color: 'rgba(255,255,255,0.3)',
        width: '16px', height: '16px', flexShrink: 0,
      }}>
        <Icon size={15} strokeWidth={1.8} />
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          paddingTop: '11px',
          paddingBottom: '11px',
          paddingLeft: '42px',          /* always 42px — icon is 13px left + 16px wide + 13px gap */
          paddingRight: rightSlot ? '42px' : '14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border 0.2s, background 0.2s',
          ...inputStyle,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
          e.currentTarget.style.background = 'rgba(99,102,241,0.06)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }}
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

const TAB_CONFIG = [
  { key: 'login',     label: 'Login',      Icon: LogIn },
  { key: 'register',  label: 'Register',   Icon: UserPlus },
  { key: 'otp',       label: 'OTP',        Icon: KeyRound },
  { key: 'mobileOtp', label: 'Mobile',     Icon: Smartphone },
] as const

const HEADERS: Record<AuthMode, { title: string; subtitle: string }> = {
  login:       { title: 'Welcome back',    subtitle: 'Sign in to your account' },
  register:    { title: 'Create account',  subtitle: 'Fill in your details below' },
  otp:         { title: 'OTP login',       subtitle: 'Passwordless sign in via email' },
  mobileOtp:   { title: 'Mobile login',    subtitle: 'Sign in with your phone number' },
  forgot:      { title: 'Reset password',  subtitle: 'We\'ll send a recovery link' },
  verifySent:  { title: 'Check your inbox',subtitle: 'Verification email sent' },
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
      toast.success('Welcome back 👋')
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

  return (
    <Sheet open={openauth} onOpenChange={setOpenauth}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col z-[9999] p-0 border-0"
        style={{ background: 'var(--auth-bg, #0f0f13)' }}
      >
        <style>{`
          .auth-sheet-inner { height: 100%; display: flex; flex-direction: column; overflow-y: auto; }

          /* ── Header ── */
          .auth-header {
            padding: 32px 28px 24px;
            background: linear-gradient(160deg, #1a1a2e 0%, #12122a 60%, #0f0f13 100%);
            position: relative; overflow: hidden; flex-shrink: 0;
          }
          .auth-header::before {
            content: ''; position: absolute; top: -60px; right: -60px;
            width: 200px; height: 200px; border-radius: 50%;
            background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          }
          .auth-header::after {
            content: ''; position: absolute; bottom: -40px; left: -30px;
            width: 160px; height: 160px; border-radius: 50%;
            background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          }

          /* Brand */
          .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; position: relative; z-index: 1; }
          .auth-brand-icon {
            width: 38px; height: 38px; border-radius: 10px;
            background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4);
            display: flex; align-items: center; justify-content: center;
          }
          .auth-brand-name { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; letter-spacing: 0.3px; }

          /* Heading */
          .auth-heading { position: relative; z-index: 1; }
          .auth-title { color: #fff; font-size: 24px; font-weight: 600; margin-bottom: 4px; line-height: 1.2; }
          .auth-subtitle { color: rgba(255,255,255,0.45); font-size: 13.5px; }

          /* Tabs */
          .auth-tabs {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
            background: rgba(255,255,255,0.06); border-radius: 12px;
            padding: 4px; margin-top: 24px; position: relative; z-index: 1;
          }
          .auth-tab {
            display: flex; align-items: center; justify-content: center; gap: 5px;
            padding: 8px 4px; border: none; background: transparent;
            color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 500;
            border-radius: 9px; cursor: pointer; transition: all 0.2s;
          }
          .auth-tab:hover { color: rgba(255,255,255,0.7); }
          .auth-tab.active { background: rgba(99,102,241,0.25); color: #fff; border: 1px solid rgba(99,102,241,0.3); }
          .auth-tab svg { width: 13px; height: 13px; flex-shrink: 0; }

          /* Body */
          .auth-body { padding: 28px 28px 32px; flex: 1; background: #0f0f13; }

          /* Fields */
          .auth-field { margin-bottom: 16px; }
          .auth-label {
            display: block; font-size: 11px; font-weight: 600;
            color: rgba(255,255,255,0.35); letter-spacing: 0.8px;
            text-transform: uppercase; margin-bottom: 7px;
          }
          .auth-input-wrap { position: relative; }
          .auth-input-icon {
            position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
            color: rgba(255,255,255,0.3); display: flex; pointer-events: none;
          }
          .auth-input-icon svg { width: 15px; height: 15px; }
          .auth-input {
            width: 100%; padding: 11px 13px 11px 40px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; font-size: 14px; color: #fff;
            outline: none; transition: border 0.2s, background 0.2s;
          }
          .auth-input::placeholder { color: rgba(255,255,255,0.2); }
          .auth-input:focus { border-color: rgba(99,102,241,0.6); background: rgba(99,102,241,0.06); }
          .auth-eye {
            position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
            background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3);
            padding: 4px; display: flex; transition: color 0.2s;
          }
          .auth-eye:hover { color: rgba(255,255,255,0.6); }
          .auth-eye svg { width: 15px; height: 15px; }

          /* Forgot link */
          .auth-forgot-row { text-align: right; margin: -6px 0 12px; }
          .auth-forgot-btn {
            background: none; border: none; font-size: 12px;
            color: rgba(99,102,241,0.9); cursor: pointer; padding: 0;
          }
          .auth-forgot-btn:hover { text-decoration: underline; }

          /* Primary button */
          .auth-primary-btn {
            width: 100%; padding: 12px 16px; margin-top: 8px;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border: none; border-radius: 10px; color: #fff;
            font-size: 14px; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: opacity 0.2s, transform 0.15s; letter-spacing: 0.2px;
          }
          .auth-primary-btn:hover:not(:disabled) { opacity: 0.88; }
          .auth-primary-btn:active:not(:disabled) { transform: scale(0.98); }
          .auth-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .auth-primary-btn svg { width: 15px; height: 15px; }

          /* Secondary button */
          .auth-secondary-btn {
            width: 100%; padding: 11px 16px; margin-top: 8px;
            background: transparent; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; color: rgba(255,255,255,0.6);
            font-size: 13.5px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 7px;
            transition: all 0.2s;
          }
          .auth-secondary-btn:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; background: rgba(99,102,241,0.06); }
          .auth-secondary-btn svg { width: 14px; height: 14px; }

          /* Info box */
          .auth-info-box {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 12px 14px; background: rgba(99,102,241,0.08);
            border: 1px solid rgba(99,102,241,0.2); border-radius: 10px;
            margin-bottom: 18px;
          }
          .auth-info-box svg { width: 16px; height: 16px; color: #818cf8; flex-shrink: 0; margin-top: 1px; }
          .auth-info-box p { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.5; }

          /* OTP sent badge */
          .auth-sent-badge {
            display: inline-flex; align-items: center; gap: 5px;
            background: rgba(16,185,129,0.12); color: #34d399;
            border-radius: 20px; padding: 3px 10px; font-size: 11.5px; font-weight: 500;
          }
          .auth-sent-badge svg { width: 12px; height: 12px; }

          /* Divider */
          .auth-divider {
            display: flex; align-items: center; gap: 10px; margin: 18px 0;
          }
          .auth-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
          .auth-divider-text { font-size: 12px; color: rgba(255,255,255,0.2); }

          /* Success */
          .auth-success-wrap { text-align: center; padding: 8px 0; }
          .auth-success-icon {
            width: 72px; height: 72px; border-radius: 50%;
            background: rgba(99,102,241,0.1); border: 2px solid rgba(99,102,241,0.25);
            display: inline-flex; align-items: center; justify-content: center;
            margin-bottom: 20px;
          }
          .auth-success-icon svg { width: 30px; height: 30px; color: #818cf8; }
          .auth-success-title { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 8px; }
          .auth-success-sub { font-size: 13.5px; color: rgba(255,255,255,0.4); line-height: 1.7; margin-bottom: 24px; }

          /* Resend section */
          .auth-resend-section {
            margin-top: 20px; padding-top: 18px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }
          .auth-resend-label { font-size: 11px; color: rgba(255,255,255,0.25); text-align: center; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.6px; }

          /* Override Sheet */
          [data-radix-popper-content-wrapper] { z-index: 9999 !important; }
        `}</style>

        <div className="auth-sheet-inner">

          {/* ── HEADER ── */}
          <SheetHeader className="auth-header p-0 space-y-0">
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <Layers size={18} color="rgba(165,180,252,0.9)" />
              </div>
              <span className="auth-brand-name">YourApp</span>
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
                  onClick={() => setAuthMode(key as AuthMode)}
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
                <div className="auth-field">
                  <label className="auth-label">Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <AuthInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    rightSlot={
                      <button type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 0 }}
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                      </button>
                    }
                  />
                </div>
                <div className="auth-forgot-row">
                  <button className="auth-forgot-btn" onClick={() => setAuthMode('forgot')}>Forgot password?</button>
                </div>
                <button className="auth-primary-btn" disabled={loading} onClick={handleLogin}>
                  <LogIn size={15} strokeWidth={2} /> {loading ? 'Signing in…' : 'Sign in to account'}
                </button>
                <div className="auth-resend-section">
                  <div className="auth-resend-label">Email not verified yet?</div>
                  <button className="auth-secondary-btn" onClick={handleResendVerification}>
                    <RefreshCw size={14} strokeWidth={1.8} /> Resend verification email
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER */}
            {authMode === 'register' && (
              <div>
                <div className="auth-field">
                  <label className="auth-label">Full name</label>
                  <AuthInput icon={User} placeholder="John Doe"
                    value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mobile number</label>
                  <AuthInput icon={Phone} type="tel" placeholder="+91 98765 43210"
                    value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <AuthInput icon={Lock} type="password" placeholder="Create a strong password"
                    value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                </div>
                <button className="auth-primary-btn" disabled={loading} onClick={handleRegister}>
                  <UserPlus size={15} strokeWidth={2} /> {loading ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            )}

            {/* OTP LOGIN */}
            {authMode === 'otp' && (
              <div>
                <div className="auth-info-box">
                  <KeyRound size={16} strokeWidth={1.8} style={{ color: '#818cf8', flexShrink: 0, marginTop: '1px' }} />
                  <p>Enter your email to receive a one-time login code. No password needed.</p>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={otpForm.identifier} onChange={e => setOtpForm({ ...otpForm, identifier: e.target.value })} />
                </div>
                {otpSent && (
                  <div className="auth-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                      <label className="auth-label" style={{ margin: 0 }}>Enter OTP</label>
                      <span className="auth-sent-badge"><CheckCircle2 size={12} /> Code sent</span>
                    </div>
                    <AuthInput icon={ShieldCheck} placeholder="6-digit code"
                      value={otpForm.otp} onChange={e => setOtpForm({ ...otpForm, otp: e.target.value })}
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
                      <ShieldCheck size={15} strokeWidth={2} /> {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button className="auth-secondary-btn" disabled={otpTimer > 0} onClick={handleSendOtp}>
                      <RefreshCw size={14} strokeWidth={1.8} /> {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend code'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {authMode === 'forgot' && (
              <div>
                <div className="auth-info-box">
                  <Mail size={16} strokeWidth={1.8} style={{ color: '#818cf8', flexShrink: 0, marginTop: '1px' }} />
                  <p>Enter the email linked to your account and we'll send a secure reset link.</p>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Email address</label>
                  <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button className="auth-primary-btn" disabled={loading} onClick={handleForgotPassword}>
                  <Send size={15} strokeWidth={2} /> {loading ? 'Sending…' : 'Send reset link'}
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
                  <Smartphone size={16} strokeWidth={1.8} style={{ color: '#818cf8', flexShrink: 0, marginTop: '1px' }} />
                  <p>Enter your mobile number to receive a one-time code via SMS.</p>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Mobile number</label>
                  <AuthInput icon={Phone} type="tel" placeholder="+91 98765 43210"
                    value={mobileForm.phone} onChange={e => setMobileForm({ ...mobileForm, phone: e.target.value })} />
                </div>
                {mobileOtpSent && (
                  <div className="auth-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                      <label className="auth-label" style={{ margin: 0 }}>SMS code</label>
                      <span className="auth-sent-badge"><CheckCircle2 size={12} /> SMS sent</span>
                    </div>
                    <AuthInput icon={ShieldCheck} placeholder="6-digit code"
                      value={mobileForm.otp} onChange={e => setMobileForm({ ...mobileForm, otp: e.target.value })}
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
                      <ShieldCheck size={15} strokeWidth={2} /> {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button className="auth-secondary-btn" disabled={mobileOtpTimer > 0} onClick={handleSendMobileOtp}>
                      <RefreshCw size={14} strokeWidth={1.8} /> {mobileOtpTimer > 0 ? `Resend in ${mobileOtpTimer}s` : 'Resend SMS'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* VERIFY SENT */}
            {authMode === 'verifySent' && (
              <div className="auth-success-wrap">
                <div className="auth-success-icon">
                  <Mail size={30} strokeWidth={1.8} style={{ color: '#818cf8' }} />
                </div>
                <div className="auth-success-title">Check your inbox</div>
                <p className="auth-success-sub">
                  We've sent a verification link to your email address. Click the link to activate your account.
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