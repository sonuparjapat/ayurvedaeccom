// src/app/_layout.tsx
import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import { Stack, router } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import {
  useFonts,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular,
} from '@expo-google-fonts/cormorant-garamond'
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { useBootstrap } from '../hooks/useBootstrap'
import { useOrderSocket } from '../hooks/useOrderSocket'
import { useStore } from '../store'
import { Colors } from '../constants/theme'
import { ToastContainer, ToastRef, setToastRef } from '../components/ui/Toast'

function usePushDeepLink() {
  useEffect(() => {
    let sub: any

    ;(async () => {
      try {
        const Notifications = await import('expo-notifications')
        sub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as Record<string, any>
          if (data?.type === 'order_update' && data?.order_id) {
            router.push(`/order/${data.order_id}`)
          }
        })
      } catch { }
    })()

    return () => { sub?.remove?.() }
  }, [])
}

function Inner() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_700Bold,
    CormorantGaramond_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  })
  useBootstrap()
  const bootstrapped = useStore((s) => s.bootstrapped)
  useOrderSocket()
  usePushDeepLink()
  const authOpen = useStore((s) => s.authOpen)
  const setAuthOpen = useStore((s) => s.setAuthOpen)

  useEffect(() => {
    if (authOpen && bootstrapped) {
      setAuthOpen(false)
      router.push('/auth')
    }
  }, [authOpen, bootstrapped])

  if (!fontsLoaded || !bootstrapped) {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={Colors.emerald} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="category/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="cart/index" />
      <Stack.Screen name="checkout/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="wishlist/index" />
      <Stack.Screen name="account/index" />
      <Stack.Screen name="account/wallet" options={{ presentation: 'card' }} />
      <Stack.Screen name="account/notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="auth/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="search/index" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="support/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="faq/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="blog/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="blog/[slug]" options={{ presentation: 'card' }} />
      <Stack.Screen name="account/subscriptions" options={{ presentation: 'card' }} />
      <Stack.Screen name="quiz/index" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="onboarding/index" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
    </Stack>
  )
}
// console.log("hi")
// ToastHost sits outside Inner — survives navigation and font-loading
function ToastHost() {
  const ref = useRef<ToastRef>(null)
  useEffect(() => { setToastRef(ref.current) }, [])
  return <ToastContainer ref={ref} />
}

function OfflineBanner() {
  const isOnline = useNetworkStatus()
  if (isOnline) return null
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={s.offlineBanner}>
      <Text style={s.offlineText}>📡 No internet connection</Text>
    </Animated.View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Inner />
      <OfflineBanner />
      <ToastHost />
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  offlineBanner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 16,
    alignItems: 'center', zIndex: 9999,
  },
  offlineText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
