import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Image as ExpoImage } from 'expo-image'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const LOGO_URL = 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'

const { width: W } = Dimensions.get('window')
type Mode = 'login' | 'register' | 'otp' | 'mobileOtp' | 'forgot' | 'verifySent'

// ─── FIELD COMPONENT ─────────────────────────────────────────────────────────
function Field({ label, emoji, rightSlot, ...props }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={fs.wrap}>
      <Text style={fs.label}>{label}</Text>
      <View style={[fs.inputRow, focused && fs.inputRowFocused]}>
        <View style={fs.emojiWrap}>
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </View>
        <TextInput
          style={fs.input}
          placeholderTextColor={Colors.textDim}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightSlot}
      </View>
    </View>
  )
}

function PrimaryBtn({ label, onPress, disabled, loading: isLoading }: any) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden' }} activeOpacity={0.87}>
      <LinearGradient colors={disabled ? ['#9ca3af', '#6b7280'] : [Colors.forest, Colors.moss]} style={fs.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={fs.primaryText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

function SecondaryBtn({ label, onPress, disabled }: any) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[fs.secondaryBtn, disabled && { opacity: 0.4 }]} activeOpacity={0.7}>
      <Text style={fs.secondaryText}>{label}</Text>
    </TouchableOpacity>
  )
}

const fs = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.forest, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 0, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden' },
  inputRowFocused: { borderColor: Colors.forest },
  emojiWrap: { width: 46, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.mint, borderRightWidth: 1, borderRightColor: Colors.border },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.forest, paddingHorizontal: 14, paddingVertical: 14 },
  primaryBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
  secondaryBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 12, backgroundColor: '#fff' },
  secondaryText: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.forest },
})

// ─── OTP INPUT ────────────────────────────────────────────────────────────────
function OtpResend({ timer, onResend }: { timer: number; onResend: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 6 }}>
      <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim }}>Didn't receive it?</Text>
      <TouchableOpacity onPress={onResend} disabled={timer > 0}>
        <Text style={[{ fontFamily: Fonts.bold, fontSize: 13 }, timer > 0 ? { color: Colors.textDim } : { color: Colors.forest }]}>
          {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const insets = useSafeAreaInsets()
  const { setUser, setAuthOpen, setCartData, setWishlistData } = useStore()

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const [mobileOtpSent, setMobileOtpSent] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [otpForm, setOtpForm] = useState({ identifier: '', otp: '' })
  const [mobileForm, setMobileForm] = useState({ phone: '', otp: '' })
  const [forgotEmail, setForgotEmail] = useState('')

  useEffect(() => {
    if (otpTimer <= 0) return
    const t = setInterval(() => setOtpTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [otpTimer])

  const afterLogin = async (user: any, responseData?: any) => {
    try {
      setUser(user)
      setAuthOpen(false)
      await AsyncStorage.setItem('stored_user', JSON.stringify(user))
      const sessionId = await AsyncStorage.getItem('guest_session_id')
      if (sessionId && user?.role === 3) {
        try {
          await api.post('/cart/merge', { sessionId })
          await AsyncStorage.removeItem('guest_session_id')
        } catch { }
      }
      const [cartRes, wishRes, meRes] = await Promise.allSettled([
        api.get('/cart'),
        api.get('/shop'),
        api.get('/users/me'),
      ])
      if (cartRes.status === 'fulfilled') {
        const items = cartRes.value.data?.items || []
        setCartData({ items, subtotal: cartRes.value.data?.subtotal || 0, totalItems: items.length })
      }
      if (wishRes.status === 'fulfilled') {
        const wishItems = wishRes.value.data?.data || []
        setWishlistData({ items: wishItems, loading: false, totalItems: wishItems.length })
      }
      if (meRes.status === 'fulfilled') {
        const fullUser = meRes.value.data?.user || user
        setUser(fullUser)
        await AsyncStorage.setItem('stored_user', JSON.stringify(fullUser))
      }
    } catch { }
    router.back()
  }

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { Alert.alert('Required', 'Fill all fields'); return }
    setLoading(true)
    try {
      const res = await api.post('/users/login', loginForm)
      if (res.data?.token) await AsyncStorage.setItem('auth_token', res.data.token)
      await afterLogin(res.data.user, res.data)
    } catch (e: any) {
      Alert.alert('Login Failed', e?.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!regForm.name || !regForm.email || !regForm.password) { Alert.alert('Required', 'Fill all fields'); return }
    setLoading(true)
    try {
      await api.post('/users/register', regForm)
      setMode('verifySent')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const sendOtp = async () => {
    if (!otpForm.identifier) { Alert.alert('Required', 'Enter email'); return }
    setLoading(true)
    try {
      await api.post('/users/send-login-otp', { identifier: otpForm.identifier })
      setOtpSent(true); setOtpTimer(30)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    setLoading(true)
    try {
      const res = await api.post('/users/verify-login-otp', otpForm)
      if (res.data?.token) await AsyncStorage.setItem('auth_token', res.data.token)
      await afterLogin(res.data.user, res.data)
    } catch (e: any) {
      Alert.alert('Invalid OTP', e?.response?.data?.message || 'Try again')
    } finally { setLoading(false) }
  }

  const sendMobileOtp = async () => {
    if (!mobileForm.phone) { Alert.alert('Required', 'Enter phone'); return }
    setLoading(true)
    try {
      await api.post('/users/send-mobile-otp', { phone: mobileForm.phone })
      setMobileOtpSent(true); setOtpTimer(30)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  const verifyMobileOtp = async () => {
    setLoading(true)
    try {
      const res = await api.post('/users/verify-mobile-otp', mobileForm)
      await afterLogin(res.data.user, res.data)
    } catch (e: any) {
      Alert.alert('Invalid OTP', e?.response?.data?.message || 'Try again')
    } finally { setLoading(false) }
  }

  const sendForgot = async () => {
    if (!forgotEmail) { Alert.alert('Required', 'Enter email'); return }
    setLoading(true)
    try {
      const res = await api.post('/users/forgot-password', { email: forgotEmail })
      Alert.alert('Email Sent!', res.data?.message || 'Reset link sent to your email')
      setMode('login')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  const TAB_MODES: { key: Mode; label: string; icon: string }[] = [
    { key: 'login',     label: 'Login',      icon: '🔑' },
    { key: 'register',  label: 'Register',   icon: '✨' },
    { key: 'otp',       label: 'Email OTP',  icon: '📧' },
    { key: 'mobileOtp', label: 'Mobile OTP', icon: '📱' },
  ]

  const HEADINGS: Record<Mode, { title: string; sub: string }> = {
    login:      { title: 'Welcome back 👋', sub: 'Sign in to your wellness journey' },
    register:   { title: 'Join the journey ✨', sub: 'Create your organic account' },
    otp:        { title: 'OTP Login 📧', sub: 'Passwordless sign in via email' },
    mobileOtp:  { title: 'Mobile Login 📱', sub: 'Sign in with your phone number' },
    forgot:     { title: 'Reset Password 🔒', sub: "We'll send a secure reset link" },
    verifySent: { title: 'Check Inbox 📬', sub: 'Verification email has been sent' },
  }

  const h = HEADINGS[mode]

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>

          {/* Header */}
          <LinearGradient colors={['#071410', Colors.forest, '#1a3a2a']} style={[ss.header, { paddingTop: insets.top + 12 }]}>
            <View style={ss.blob1} />
            <View style={ss.blob2} />

            {/* Close */}
            <TouchableOpacity onPress={() => router.back()} style={ss.closeBtn}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>

            {/* Brand */}
            <Animated.View entering={FadeIn.delay(80)} style={ss.brandRow}>
              <ExpoImage source={{ uri: LOGO_URL }} style={{ width: 140, height: 40 }} contentFit="contain" transition={200} />
            </Animated.View>

            {/* Heading */}
            <Animated.View entering={FadeInDown.delay(120)} style={{ marginBottom: 20 }}>
              <Text style={ss.heading}>{h.title}</Text>
              <Text style={ss.subheading}>{h.sub}</Text>
            </Animated.View>

            {/* Mode tabs */}
            {!['forgot', 'verifySent'].includes(mode) && (
              <Animated.View entering={FadeInDown.delay(160)}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {TAB_MODES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => { setMode(t.key); setOtpSent(false); setMobileOtpSent(false) }}
                      style={[ss.modeTab, mode === t.key && ss.modeTabActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 13 }}>{t.icon}</Text>
                      <Text style={[ss.modeTabText, mode === t.key && ss.modeTabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </LinearGradient>

          {/* Form body */}
          <Animated.View entering={FadeInUp.delay(180)} style={[ss.formBody, { paddingBottom: insets.bottom + 36 }]}>

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <>
                <Field label="Email Address" placeholder="you@example.com" emoji="📧"
                  value={loginForm.email} keyboardType="email-address"
                  onChangeText={(t: string) => setLoginForm(p => ({ ...p, email: t }))} />
                <Field label="Password" placeholder="Your password" emoji="🔒"
                  value={loginForm.password} secureTextEntry={!showPass}
                  onChangeText={(t: string) => setLoginForm(p => ({ ...p, password: t }))}
                  rightSlot={
                    <TouchableOpacity onPress={() => setShowPass(s => !s)} style={{ paddingRight: 14 }}>
                      <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  }
                />
                <TouchableOpacity onPress={() => setMode('forgot')} style={ss.forgotLink}>
                  <Text style={ss.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
                <PrimaryBtn label={loading ? 'Signing in...' : '🔑  Sign In'} onPress={handleLogin} disabled={loading} />
                <View style={ss.divider}>
                  <View style={ss.divLine} />
                  <Text style={ss.divText}>or</Text>
                  <View style={ss.divLine} />
                </View>
                <SecondaryBtn label="Create new account →" onPress={() => setMode('register')} />
                <View style={ss.trustRow}>
                  {['🌿 100% Organic', '✨ Ayurvedic', '🛡️ Lab Tested'].map(b => (
                    <View key={b} style={ss.trustBadge}>
                      <Text style={ss.trustBadgeText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <>
                <Field label="Full Name" placeholder="Your full name" emoji="👤"
                  value={regForm.name} onChangeText={(t: string) => setRegForm(p => ({ ...p, name: t }))} />
                <Field label="Email Address" placeholder="you@example.com" emoji="📧"
                  value={regForm.email} keyboardType="email-address"
                  onChangeText={(t: string) => setRegForm(p => ({ ...p, email: t }))} />
                <Field label="Phone (optional)" placeholder="+91 98765 43210" emoji="📱"
                  value={regForm.phone} keyboardType="phone-pad"
                  onChangeText={(t: string) => setRegForm(p => ({ ...p, phone: t }))} />
                <Field label="Password" placeholder="Create a strong password" emoji="🔒"
                  value={regForm.password} secureTextEntry
                  onChangeText={(t: string) => setRegForm(p => ({ ...p, password: t }))} />
                <PrimaryBtn label={loading ? 'Creating Account...' : '✨  Create Account'} onPress={handleRegister} disabled={loading} />
                <SecondaryBtn label="← Back to Login" onPress={() => setMode('login')} />
              </>
            )}

            {/* ── EMAIL OTP ── */}
            {mode === 'otp' && (
              <>
                <View style={ss.infoBox}>
                  <Text style={ss.infoBoxIcon}>💡</Text>
                  <Text style={ss.infoBoxText}>Enter your email to receive a one-time sign-in code. No password needed.</Text>
                </View>
                <Field label="Email Address" placeholder="you@example.com" emoji="📧"
                  value={otpForm.identifier} keyboardType="email-address"
                  onChangeText={(t: string) => setOtpForm(p => ({ ...p, identifier: t }))} />
                {otpSent && (
                  <>
                    <Field label="6-Digit OTP Code" placeholder="Enter OTP" emoji="🔐"
                      value={otpForm.otp} keyboardType="number-pad"
                      onChangeText={(t: string) => setOtpForm(p => ({ ...p, otp: t }))} />
                    <OtpResend timer={otpTimer} onResend={sendOtp} />
                  </>
                )}
                {!otpSent
                  ? <PrimaryBtn label={loading ? 'Sending...' : '📧  Send OTP'} onPress={sendOtp} disabled={loading} />
                  : <PrimaryBtn label={loading ? 'Verifying...' : '✓  Verify & Sign In'} onPress={verifyOtp} disabled={loading} />
                }
                <SecondaryBtn label="← Back to Login" onPress={() => setMode('login')} />
              </>
            )}

            {/* ── MOBILE OTP ── */}
            {mode === 'mobileOtp' && (
              <>
                <View style={ss.infoBox}>
                  <Text style={ss.infoBoxIcon}>📱</Text>
                  <Text style={ss.infoBoxText}>Enter your mobile number to receive a one-time SMS code.</Text>
                </View>
                <Field label="Mobile Number" placeholder="+91 98765 43210" emoji="📱"
                  value={mobileForm.phone} keyboardType="phone-pad"
                  onChangeText={(t: string) => setMobileForm(p => ({ ...p, phone: t }))} />
                {mobileOtpSent && (
                  <>
                    <Field label="6-Digit SMS Code" placeholder="Enter OTP" emoji="🔐"
                      value={mobileForm.otp} keyboardType="number-pad"
                      onChangeText={(t: string) => setMobileForm(p => ({ ...p, otp: t }))} />
                    <OtpResend timer={otpTimer} onResend={sendMobileOtp} />
                  </>
                )}
                {!mobileOtpSent
                  ? <PrimaryBtn label={loading ? 'Sending SMS...' : '📱  Send SMS Code'} onPress={sendMobileOtp} disabled={loading} />
                  : <PrimaryBtn label={loading ? 'Verifying...' : '✓  Verify & Sign In'} onPress={verifyMobileOtp} disabled={loading} />
                }
                <SecondaryBtn label="← Back to Login" onPress={() => setMode('login')} />
              </>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === 'forgot' && (
              <>
                <View style={ss.infoBox}>
                  <Text style={ss.infoBoxIcon}>🔒</Text>
                  <Text style={ss.infoBoxText}>Enter your account email and we'll send a secure password reset link.</Text>
                </View>
                <Field label="Email Address" placeholder="you@example.com" emoji="📧"
                  value={forgotEmail} keyboardType="email-address"
                  onChangeText={setForgotEmail} />
                <PrimaryBtn label={loading ? 'Sending...' : '📧  Send Reset Link'} onPress={sendForgot} disabled={loading} />
                <SecondaryBtn label="← Back to Login" onPress={() => setMode('login')} />
              </>
            )}

            {/* ── VERIFY SENT ── */}
            {mode === 'verifySent' && (
              <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center', paddingVertical: 20 }}>
                <LinearGradient colors={[Colors.mint, '#fff']} style={ss.successOrb}>
                  <Text style={{ fontSize: 52 }}>📬</Text>
                </LinearGradient>
                <Text style={ss.successTitle}>Check Your Inbox</Text>
                <Text style={ss.successSub}>
                  We've sent a verification link to{'\n'}
                  <Text style={{ color: Colors.forest, fontFamily: Fonts.bold }}>{regForm.email}</Text>
                  {'\n\n'}Click the link to activate your account.
                </Text>
                <View style={{ width: '100%', gap: 10 }}>
                  <PrimaryBtn label="🔑  Go to Login" onPress={() => setMode('login')} />
                  <SecondaryBtn label="Use different email" onPress={() => setMode('register')} />
                </View>
              </Animated.View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const ss = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 28, position: 'relative', overflow: 'hidden' },
  blob1: { position: 'absolute', top: -60, right: -60, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(16,185,129,0.1)' },
  blob2: { position: 'absolute', bottom: -50, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(201,168,76,0.07)' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 20 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  brandOrb: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: '#fff', fontFamily: Fonts.bold, fontSize: 18 },
  brandTag: { color: 'rgba(255,255,255,0.45)', fontFamily: Fonts.regular, fontSize: 10, letterSpacing: 0.5 },

  heading: { color: '#fff', fontFamily: Fonts.displayBold, fontSize: 30, marginBottom: 6 },
  subheading: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 13 },

  modeTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' },
  modeTabActive: { backgroundColor: '#fff' },
  modeTabText: { color: 'rgba(255,255,255,0.65)', fontFamily: Fonts.medium, fontSize: 12 },
  modeTabTextActive: { color: Colors.forest, fontFamily: Fonts.bold },

  formBody: { padding: 22, backgroundColor: Colors.cream },

  forgotLink: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 },
  forgotText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.sage },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  divLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(26,46,30,0.15)' },
  divText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim },

  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'center' },
  trustBadge: { backgroundColor: Colors.mint, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 0.5, borderColor: '#bbf7d0' },
  trustBadgeText: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.sage },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.mint, borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 0.5, borderColor: '#bbf7d0' },
  infoBoxIcon: { fontSize: 18 },
  infoBoxText: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.sage, lineHeight: 20 },

  successOrb: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 22, borderWidth: 1.5, borderColor: '#bbf7d0' },
  successTitle: { fontFamily: Fonts.displayBold, fontSize: 26, color: Colors.forest, marginBottom: 10, textAlign: 'center' },
  successSub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 23, marginBottom: 28 },
})
