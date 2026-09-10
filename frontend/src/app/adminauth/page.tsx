'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'

type Step = 'credentials' | 'otp'

export default function AdminAuthPage() {
  const router = useRouter()
  const { login, loginuserdata, loading } = useAuth()

  const [step, setStep]                   = useState<Step>('credentials')
  const [isLoading, setIsLoading]         = useState(false)
  const [showPassword, setShowPassword]   = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError]                 = useState('')

  /* Step 1 */
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  /* Step 2 — 6 individual OTP digit boxes */
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (!loading && loginuserdata && [1, 2].includes(Number(loginuserdata.role))) {
      router.replace('/admin/dashboard')
    }
  }, [loginuserdata, loading])

  /* ── Step 1: password ── */
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }
    if (password.length < 6) { setError('Minimum 6 characters'); return }

    setIsLoading(true)
    try {
      const res = await axios.post('/auth/login', { email, password })
      if (res.data?.requiresOtp) {
        setStep('otp')
        setTimeout(() => digitRefs[0].current?.focus(), 100)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Step 2: OTP ── */
  const handleDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    if (val && idx < 5) digitRefs[idx + 1].current?.focus()
    if (next.every(d => d !== '')) {
      verifyOtp(next.join(''))
    }
  }

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      digitRefs[idx - 1].current?.focus()
    }
  }

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      verifyOtp(pasted)
    }
  }

  const verifyOtp = async (otp: string) => {
    setError('')
    setIsLoading(true)
    try {
      const res = await axios.post('/auth/verify-2fa', { email, otp })
      if (res.data?.success) {
        setSuccessMessage('Login successful! Redirecting...')
        login(res.data.admin)
        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => digitRefs[0].current?.focus(), 50)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length < 6) { setError('Enter all 6 digits'); return }
    verifyOtp(otp)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-3 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'otp' ? <Mail className="w-7 h-7 text-white" /> : <Shield className="w-7 h-7 text-white" />}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              {step === 'otp' ? 'Verify Your Identity' : 'Admin Login'}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'otp'
                ? `A 6-digit code was sent to ${email}`
                : 'Enter your admin credentials'}
            </p>
          </CardHeader>

          <CardContent>
            {/* SUCCESS */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ERROR */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP 1: Credentials ── */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Admin Email</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="absolute right-0 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Continue'}
                </Button>
              </form>
            )}

            {/* ── STEP 2: OTP boxes ── */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block text-center text-gray-600">
                    Enter the 6-digit code
                  </label>
                  <div className="flex gap-2 justify-center" onPaste={handleDigitPaste}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={digitRefs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigit(i, e.target.value)}
                        onKeyDown={e => handleDigitKeyDown(i, e)}
                        className="w-11 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:border-emerald-500 bg-white text-gray-900"
                        style={{ borderColor: d ? '#059669' : '#d1d5db' }}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-3">
                    You can also paste the code directly
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isLoading || digits.some(d => !d)}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setDigits(['', '', '', '', '', '']); setError('') }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  ← Back to login
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          This panel is restricted to authorised administrators only.
        </p>
      </motion.div>
    </div>
  )
}
