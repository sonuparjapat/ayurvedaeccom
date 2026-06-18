import { useEffect } from 'react'
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors, Fonts, Shadows } from '../constants/theme'

const { width: W } = Dimensions.get('window')

const NAV_ITEMS = [
  { label: 'Home',     icon: '🏠', route: '/'         },
  { label: 'Browse',   icon: '🔍', route: '/products'  },
  { label: 'Wishlist', icon: '❤️', route: '/wishlist'  },
  { label: 'Account',  icon: '👤', route: '/account'   },
]

export default function BottomNav({ active }: { active: string }) {
  const insets = useSafeAreaInsets()
  const TAB_W = W / NAV_ITEMS.length
  const activeIndex = NAV_ITEMS.findIndex(n => n.route === active)
  const indicatorX = useSharedValue(activeIndex * TAB_W)

  useEffect(() => {
    indicatorX.value = withSpring(activeIndex * TAB_W + TAB_W / 2 - 16, { damping: 18, stiffness: 200 })
  }, [activeIndex])

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }))

  return (
    <View style={[s.bottomNav, { paddingBottom: insets.bottom + 4 }]}>
      <BlurView intensity={Platform.OS === 'ios' ? 60 : 0} tint="light" style={StyleSheet.absoluteFill} />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,1)']} style={StyleSheet.absoluteFill} />
      </View>
      <Animated.View style={[s.navIndicator, indicatorStyle]} />
      {NAV_ITEMS.map((n) => {
        const isActive = active === n.route
        return (
          <TouchableOpacity key={n.label} onPress={() => router.push(n.route as any)} style={s.navItem} activeOpacity={0.7}>
            <Text style={{ fontSize: 22, opacity: isActive ? 1 : 0.38 }}>{n.icon}</Text>
            <Text style={[s.navLabel, isActive ? s.navLabelActive : s.navLabelInactive]}>{n.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 10, borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...Shadows.xl,
  },
  navIndicator: {
    position: 'absolute', top: 0, width: 32, height: 3,
    backgroundColor: Colors.forest, borderRadius: 0,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
  },
  navItem: { alignItems: 'center', gap: 3, flex: 1, paddingBottom: 4 },
  navLabel: { fontSize: 9, fontFamily: Fonts.medium },
  navLabelActive: { color: Colors.forest, fontFamily: Fonts.bold },
  navLabelInactive: { color: '#9ca3af' },
})
