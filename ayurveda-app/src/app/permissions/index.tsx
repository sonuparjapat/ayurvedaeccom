import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, Platform, StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Fonts } from '../../constants/theme'

const PERMS_KEY = 'permissions_requested_v1'

interface PermItem {
  key: string
  icon: string
  title: string
  description: string
  why: string
  request: () => Promise<'granted' | 'denied' | 'undetermined'>
}

async function requestNotifications(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const Notifications = await import('expo-notifications')
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    })
    return status as any
  } catch { return 'denied' }
}

async function requestCamera(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const ImagePicker = await import('expo-image-picker')
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    return status as any
  } catch { return 'denied' }
}

async function requestPhotoLibrary(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const ImagePicker = await import('expo-image-picker')
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    return status as any
  } catch { return 'denied' }
}

const PERM_LIST: PermItem[] = [
  {
    key: 'notifications',
    icon: '🔔',
    title: 'Order Notifications',
    description: 'Get instant updates when your order is shipped, out for delivery, or delivered.',
    why: 'So you never miss a delivery',
    request: requestNotifications,
  },
  {
    key: 'camera',
    icon: '📷',
    title: 'Camera Access',
    description: 'Take photos for your profile picture or to document returns.',
    why: 'For profile picture and returns',
    request: requestCamera,
  },
  {
    key: 'photos',
    icon: '🖼️',
    title: 'Photo Library',
    description: 'Choose photos from your gallery for reviews, profile picture, or product returns.',
    why: 'For reviews and profile picture',
    request: requestPhotoLibrary,
  },
]

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<'intro' | 'requesting' | 'done'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState<Record<string, string>>({})
  const [requesting, setRequesting] = useState(false)

  const done = async () => {
    await AsyncStorage.setItem(PERMS_KEY, 'true')
    router.replace('/')
  }

  const requestAll = async () => {
    setStep('requesting')
    const newResults: Record<string, string> = {}
    for (let i = 0; i < PERM_LIST.length; i++) {
      setCurrentIdx(i)
      setRequesting(true)
      try {
        const status = await PERM_LIST[i].request()
        newResults[PERM_LIST[i].key] = status
      } catch {
        newResults[PERM_LIST[i].key] = 'denied'
      }
      setRequesting(false)
      // Small pause between requests so OS dialogs don't stack
      await new Promise(r => setTimeout(r, 500))
    }
    setResults(newResults)
    setStep('done')
  }

  const openSettings = () => Linking.openSettings()

  const allGranted = PERM_LIST.every(p => results[p.key] === 'granted')
  const anyDenied = PERM_LIST.some(p => results[p.key] === 'denied')

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />
      <LinearGradient
        colors={['#f0fdf4', Colors.cream]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'intro' && (
          <>
            <Animated.View entering={FadeInDown.delay(0)} style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={s.logo}>🌿</Text>
              <Text style={s.headline}>Before we begin</Text>
              <Text style={s.sub}>
                Oroganix needs a few permissions to give you the best experience. You can change these anytime in Settings.
              </Text>
            </Animated.View>

            {PERM_LIST.map((perm, i) => (
              <Animated.View key={perm.key} entering={FadeInDown.delay(i * 100 + 100)} style={s.permCard}>
                <Text style={s.permIcon}>{perm.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.permTitle}>{perm.title}</Text>
                  <Text style={s.permDesc}>{perm.description}</Text>
                  <View style={s.whyBadge}>
                    <Text style={s.whyText}>✓ {perm.why}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}

            <Animated.View entering={FadeInUp.delay(400)} style={{ marginTop: 32, gap: 12 }}>
              <TouchableOpacity style={{ borderRadius: 16, overflow: 'hidden' }} onPress={requestAll}>
                <LinearGradient colors={[Colors.forest, Colors.moss]} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Allow Permissions</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.skipBtn} onPress={done}>
                <Text style={s.skipBtnText}>Skip for Now</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {step === 'requesting' && (
          <Animated.View entering={FadeInDown} style={{ alignItems: 'center', flex: 1, paddingTop: 60 }}>
            <Text style={[s.permIcon, { fontSize: 64, marginBottom: 24 }]}>
              {PERM_LIST[currentIdx]?.icon}
            </Text>
            <Text style={[s.headline, { marginBottom: 12 }]}>
              {requesting ? 'Requesting access…' : 'Got it!'}
            </Text>
            <Text style={[s.sub, { marginBottom: 0 }]}>
              {PERM_LIST[currentIdx]?.title}
            </Text>
            <Text style={[s.permDesc, { textAlign: 'center', marginTop: 8 }]}>
              {PERM_LIST[currentIdx]?.description}
            </Text>
            <Text style={[s.permDesc, { textAlign: 'center', color: Colors.textDim, marginTop: 24, fontSize: 11 }]}>
              {currentIdx + 1} of {PERM_LIST.length}
            </Text>
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View entering={FadeInDown} style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 80, marginBottom: 20 }}>{allGranted ? '🎉' : '✅'}</Text>
            <Text style={[s.headline, { marginBottom: 12 }]}>
              {allGranted ? "You're all set!" : 'Almost ready!'}
            </Text>
            {anyDenied ? (
              <Text style={[s.sub, { marginBottom: 28 }]}>
                Some permissions were not granted. You can enable them anytime in your device Settings for the best experience.
              </Text>
            ) : (
              <Text style={[s.sub, { marginBottom: 28 }]}>
                All permissions granted! You'll receive order updates and can easily manage photos.
              </Text>
            )}

            <View style={{ width: '100%', gap: 10, marginBottom: 24 }}>
              {PERM_LIST.map(p => (
                <View key={p.key} style={s.resultRow}>
                  <Text style={s.permIcon}>{p.icon}</Text>
                  <Text style={[s.permTitle, { flex: 1 }]}>{p.title}</Text>
                  <Text style={{
                    fontFamily: Fonts.bold, fontSize: 12,
                    color: results[p.key] === 'granted' ? Colors.forest : '#dc2626'
                  }}>
                    {results[p.key] === 'granted' ? '✓ Granted' : '✗ Denied'}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={{ borderRadius: 16, overflow: 'hidden', width: '100%', marginBottom: 12 }} onPress={done}>
              <LinearGradient colors={[Colors.forest, Colors.moss]} style={s.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.primaryBtnText}>Start Shopping 🛍️</Text>
              </LinearGradient>
            </TouchableOpacity>

            {anyDenied && (
              <TouchableOpacity style={s.skipBtn} onPress={openSettings}>
                <Text style={[s.skipBtnText, { color: Colors.forest }]}>Open Settings to Change Permissions</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  logo: { fontSize: 56, marginBottom: 16 },
  headline: { fontFamily: Fonts.bold, fontSize: 26, color: Colors.forest, textAlign: 'center', marginBottom: 10 },
  sub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permCard: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 0.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  permIcon: { fontSize: 28, lineHeight: 36 },
  permTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest, marginBottom: 3 },
  permDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, lineHeight: 18 },
  whyBadge: { backgroundColor: Colors.mint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  whyText: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.sage },
  primaryBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: '#fff' },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipBtnText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f8f9f8', borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: Colors.border,
  },
})
