import React, { useEffect, useState } from 'react'
import {
  Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useStore } from '../../store'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'
import { toast } from '../../components/ui/Toast'
import { registerPushToken, savePushTokenToServer, deletePushToken } from '../../utils/pushNotifications'

let SecureStore: any = null
try { SecureStore = require('expo-secure-store') } catch {}

const APP_VERSION = '1.0.0'

function SettingRow({
  emoji, label, sub, onPress, right, danger = false, delay = 0,
}: {
  emoji: string; label: string; sub?: string; onPress?: () => void
  right?: React.ReactNode; danger?: boolean; delay?: number
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={s.row}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress && !right}
      >
        <View style={s.rowLeft}>
          <Text style={s.rowEmoji}>{emoji}</Text>
          <View>
            <Text style={[s.rowLabel, danger && { color: '#ef4444' }]}>{label}</Text>
            {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
          </View>
        </View>
        {right ?? (onPress ? <Text style={s.chevron}>›</Text> : null)}
      </TouchableOpacity>
    </Animated.View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { user, setUser } = useStore()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [promoEmails, setPromoEmails] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('biometric_enabled').then(v => setBiometricEnabled(v === '1'))
    let LA: any = null
    try { LA = require('expo-local-authentication') } catch {}
    if (LA) {
      Promise.all([LA.hasHardwareAsync(), LA.isEnrolledAsync()])
        .then(([hw, en]: [boolean, boolean]) => setBiometricAvailable(hw && en))
        .catch(() => {})
    }
    AsyncStorage.getItem('push_disabled').then(v => { if (v === 'true') setPushEnabled(false) })
    AsyncStorage.getItem('notification_prefs_v1').then(raw => {
      if (!raw) return
      try {
        const prefs = JSON.parse(raw)
        if (typeof prefs.orderUpdates === 'boolean') setOrderUpdates(prefs.orderUpdates)
        if (typeof prefs.promoEmails === 'boolean') setPromoEmails(prefs.promoEmails)
      } catch { }
    })
  }, [])

  const saveNotifPrefs = (prefs: { orderUpdates: boolean; promoEmails: boolean }) => {
    AsyncStorage.setItem('notification_prefs_v1', JSON.stringify(prefs)).catch(() => {})
  }

  const handleOrderUpdatesToggle = (val: boolean) => {
    setOrderUpdates(val)
    saveNotifPrefs({ orderUpdates: val, promoEmails })
  }

  const handlePromoEmailsToggle = (val: boolean) => {
    setPromoEmails(val)
    saveNotifPrefs({ orderUpdates, promoEmails: val })
  }

  const handlePushToggle = async (val: boolean) => {
    setPushEnabled(val)
    if (!val) {
      await AsyncStorage.setItem('push_disabled', 'true')
      await deletePushToken()
    } else {
      await AsyncStorage.setItem('push_disabled', 'false')
      const token = await registerPushToken()
      if (token) await savePushTokenToServer(token)
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/users/logout').catch(() => {})
            await AsyncStorage.multiRemove(['stored_user', 'auth_token', 'guest_session_id', 'biometric_enabled'])
            if (SecureStore) await SecureStore.deleteItemAsync('biometric_token').catch(() => {})
            setUser(null)
            router.replace('/')
          } catch {
            setUser(null)
            router.replace('/')
          }
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/account')
              await AsyncStorage.multiRemove(['stored_user', 'auth_token', 'guest_session_id', 'biometric_enabled'])
            if (SecureStore) await SecureStore.deleteItemAsync('biometric_token').catch(() => {})
              setUser(null)
              toast.success('Account deleted')
              router.replace('/')
            } catch {
              toast.error('Failed to delete account')
            }
          },
        },
      ]
    )
  }

  const handleClearCache = async () => {
    setClearing(true)
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter(k => k.startsWith('cache_'))
      if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys)
      toast.success('Cache cleared')
    } catch {
      toast.error('Failed to clear cache')
    } finally {
      setClearing(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.forest, Colors.moss]}
        style={s.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <SectionHeader title="Account" />
        <View style={s.card}>
          <SettingRow
            emoji="👤"
            label="Edit Profile"
            sub="Name, phone, email"
            onPress={() => router.push('/account')}
            delay={50}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="📍"
            label="Saved Addresses"
            sub="Manage delivery locations"
            onPress={() => router.push('/account')}
            delay={100}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="💳"
            label="Wallet & Credits"
            sub={user ? `Balance in your wallet` : 'Login to view'}
            onPress={() => router.push('/account/wallet' as any)}
            delay={150}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={s.card}>
          <SettingRow
            emoji="🔔"
            label="Push Notifications"
            sub="Alerts for orders and offers"
            delay={200}
            right={
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                trackColor={{ false: '#e5e7eb', true: Colors.sage }}
                thumbColor="#fff"
              />
            }
          />
          <View style={s.divider} />
          <SettingRow
            emoji="📦"
            label="Order Updates"
            sub="Shipping and delivery alerts"
            delay={250}
            right={
              <Switch
                value={orderUpdates}
                onValueChange={handleOrderUpdatesToggle}
                trackColor={{ false: '#e5e7eb', true: Colors.sage }}
                thumbColor="#fff"
              />
            }
          />
          <View style={s.divider} />
          <SettingRow
            emoji="📧"
            label="Promotional Emails"
            sub="Deals, offers and newsletters"
            delay={300}
            right={
              <Switch
                value={promoEmails}
                onValueChange={handlePromoEmailsToggle}
                trackColor={{ false: '#e5e7eb', true: Colors.sage }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Security */}
        {biometricAvailable && (
          <>
            <SectionHeader title="Security" />
            <View style={s.card}>
              <SettingRow
                emoji="🔐"
                label="Quick Login (Biometric)"
                sub={biometricEnabled ? 'Tap to disable Face ID / Fingerprint login' : 'Enable Face ID / Fingerprint login'}
                delay={325}
                right={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={async (val) => {
                      if (val) {
                        setBiometricEnabled(true)
                        await AsyncStorage.setItem('biometric_enabled', '1')
                      } else {
                        setBiometricEnabled(false)
                        await AsyncStorage.removeItem('biometric_enabled')
                        if (SecureStore) await SecureStore.deleteItemAsync('biometric_token').catch(() => {})
                      }
                    }}
                    trackColor={{ false: '#e5e7eb', true: Colors.emerald }}
                    thumbColor="#fff"
                  />
                }
              />
            </View>
          </>
        )}

        {/* Help & Support */}
        <SectionHeader title="Help & Support" />
        <View style={s.card}>
          <SettingRow
            emoji="💬"
            label="Support Tickets"
            sub="Get help with an issue"
            onPress={() => router.push('/support' as any)}
            delay={350}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="❓"
            label="FAQ"
            sub="Common questions answered"
            onPress={() => router.push('/faq' as any)}
            delay={400}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="📖"
            label="User Manual"
            sub="How to use the app"
            onPress={() => router.push('/blog' as any)}
            delay={450}
          />
        </View>

        {/* App */}
        <SectionHeader title="App" />
        <View style={s.card}>
          <SettingRow
            emoji="🗑️"
            label={clearing ? 'Clearing…' : 'Clear Cache'}
            sub="Free up storage space"
            onPress={clearing ? undefined : handleClearCache}
            delay={500}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="⭐"
            label="Rate the App"
            sub="Share your feedback"
            onPress={() => {}}
            delay={550}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="📤"
            label="Share App"
            sub="Tell friends about Oroganix"
            onPress={async () => {
              const { Share } = await import('react-native')
              Share.share({ message: 'Check out Oroganix — Premium Ayurvedic Products! Download now.' })
            }}
            delay={600}
          />
          <View style={s.divider} />
          <SettingRow
            emoji="ℹ️"
            label="App Version"
            sub={APP_VERSION}
            delay={650}
          />
        </View>

        {/* Danger zone */}
        {user && (
          <>
            <SectionHeader title="Account Actions" />
            <View style={s.card}>
              <SettingRow
                emoji="🚪"
                label="Logout"
                onPress={handleLogout}
                danger
                delay={700}
              />
              <View style={s.divider} />
              <SettingRow
                emoji="💀"
                label="Delete Account"
                sub="Permanently delete all data"
                onPress={handleDeleteAccount}
                danger
                delay={750}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f6f0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', fontFamily: 'System', lineHeight: 32 },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bold, color: '#fff' },
  scroll: { paddingTop: 12 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.sage, textTransform: 'uppercase', letterSpacing: 1.2 },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    ...Shadows.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.forest },
  rowSub: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textDim, marginTop: 1 },
  chevron: { fontSize: 20, color: '#d1d5db', fontFamily: 'System' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 56 },
})
