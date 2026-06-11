// src/app/_layout.tsx
import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, router } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular,
} from '@expo-google-fonts/cormorant-garamond'
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { useBootstrap } from '../hooks/useBootstrap'
import { useStore } from '../store'
import { Colors } from '../constants/theme'

function Inner() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_700Bold,
    CormorantGaramond_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  })
  const { loading } = useBootstrap()
  const bootstrapped = useStore((s) => s.bootstrapped)
  const authOpen = useStore((s) => s.authOpen)
  const setAuthOpen = useStore((s) => s.setAuthOpen)

  // Global auth gate — any screen calling setAuthOpen(true) triggers navigation
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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="category/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="cart/index" />
      <Stack.Screen name="checkout/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="wishlist/index" />
      <Stack.Screen name="account/index" />
      <Stack.Screen name="auth/index" />
      <Stack.Screen name="search/index" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="support/index" options={{ presentation: 'card' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Inner />
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
})