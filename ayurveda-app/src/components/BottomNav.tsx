import { useEffect } from 'react'
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
  interpolateColor, interpolate, Extrapolation,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useStore } from '../store'
import { Colors, Fonts, Shadows } from '../constants/theme'

const { width: W } = Dimensions.get('window')

const NAV_ITEMS = [
  { label: 'Home',    icon: '⌂',   activeIcon: '⌂',  route: '/'        },
  { label: 'Browse',  icon: '◎',   activeIcon: '◎',   route: '/products' },
  { label: 'Wishlist',icon: '♡',   activeIcon: '♥',  route: '/wishlist' },
  { label: 'Account', icon: null,  activeIcon: null,  route: '/account'  },
]

// Single animated tab
function NavTab({
  item, index, activeIndex, tabW, user, cartCount,
}: {
  item: typeof NAV_ITEMS[0]
  index: number
  activeIndex: number
  tabW: number
  user: any
  cartCount: number
}) {
  const isActive = activeIndex === index
  const isAccount = item.route === '/account'

  const scale = useSharedValue(1)
  const labelOpacity = useSharedValue(isActive ? 1 : 0)

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, { damping: 18, stiffness: 260 })
    labelOpacity.value = withTiming(isActive ? 1 : 0, { duration: 200 })
  }, [isActive])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: interpolate(labelOpacity.value, [0, 1], [4, 0], Extrapolation.CLAMP) }],
  }))

  const userInitials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : null

  return (
    <Pressable
      onPress={() => router.push(item.route as any)}
      style={[s.tab, { width: tabW }]}
    >
      <Animated.View style={[s.tabInner, animStyle]}>
        {/* Icon area */}
        <View style={s.iconWrap}>
          {isAccount ? (
            // Account tab — show avatar or login icon
            user ? (
              <View style={[s.avatar, isActive && s.avatarActive]}>
                <LinearGradient
                  colors={isActive ? [Colors.sage, Colors.forest] : ['#d1d5db', '#9ca3af']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={[s.avatarText, isActive && { color: '#fff' }]}>
                  {userInitials || '?'}
                </Text>
                {/* Online dot */}
                <View style={s.onlineDot} />
              </View>
            ) : (
              // Not logged in
              <View style={s.loginIconWrap}>
                <Text style={[s.tabIcon, { opacity: isActive ? 1 : 0.4, color: isActive ? Colors.forest : '#9ca3af' }]}>
                  👤
                </Text>
                {!isActive && (
                  <View style={s.loginBadge}>
                    <Text style={s.loginBadgeText}>Login</Text>
                  </View>
                )}
              </View>
            )
          ) : (
            <Text style={[
              s.tabIcon,
              { color: isActive ? Colors.forest : '#9ca3af', opacity: isActive ? 1 : 0.55 }
            ]}>
              {isActive ? item.activeIcon : item.icon}
            </Text>
          )}
        </View>

        {/* Label */}
        <Animated.Text style={[
          s.label,
          { color: isActive ? Colors.forest : '#9ca3af' },
          isActive ? s.labelActive : s.labelInactive,
          !isAccount && labelStyle,
        ]}>
          {isAccount && user ? (user.name?.split(' ')[0] || 'Account') : item.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  )
}

export default function BottomNav({ active }: { active: string }) {
  const insets = useSafeAreaInsets()
  const user = useStore(s => s.user)
  const cartCount = useStore(s => s.cartCount)

  const TAB_W = W / NAV_ITEMS.length
  const activeIndex = NAV_ITEMS.findIndex(n => n.route === active)

  // Sliding pill indicator
  const pillX = useSharedValue(activeIndex * TAB_W + TAB_W / 2 - 20)
  useEffect(() => {
    pillX.value = withSpring(activeIndex * TAB_W + TAB_W / 2 - 20, {
      damping: 22, stiffness: 240,
    })
  }, [activeIndex, TAB_W])

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }))

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 2 }]}>
      {/* Glass blur layer */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 0}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      {/* Frosted white tint */}
      <View style={[StyleSheet.absoluteFill, s.frosted]} />

      {/* Top border with gradient */}
      <LinearGradient
        colors={['rgba(26,46,30,0.06)', 'rgba(26,46,30,0.12)', 'rgba(26,46,30,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.topBorder}
      />

      {/* Sliding pill indicator */}
      <Animated.View style={[s.pill, pillStyle]} pointerEvents="none">
        <LinearGradient
          colors={[Colors.mint, '#c8f0d8']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={s.pillDot} />
      </Animated.View>

      {/* Tabs */}
      <View style={s.tabs}>
        {NAV_ITEMS.map((item, i) => (
          <NavTab
            key={item.route}
            item={item}
            index={i}
            activeIndex={activeIndex}
            tabW={TAB_W}
            user={user}
            cartCount={cartCount}
          />
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  frosted: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.97)',
  },
  topBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },

  // Sliding pill
  pill: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
  },
  pillDot: {
    position: 'absolute',
    top: 0, left: '50%',
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sage,
    marginLeft: -2,
  },

  tabs: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  tab: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabInner: {
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 36, height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    fontFamily: Fonts.regular,
  },

  // Account avatar
  avatar: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(74,124,94,0.3)',
  },
  avatarActive: {
    borderColor: Colors.sage,
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#fff',
    zIndex: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // Login badge
  loginIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loginBadge: {
    position: 'absolute',
    top: -4, right: -10,
    backgroundColor: Colors.amber,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  loginBadgeText: {
    fontSize: 7,
    fontFamily: Fonts.bold,
    color: '#fff',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Labels
  label: {
    fontSize: 9.5,
    letterSpacing: 0.1,
  },
  labelActive: {
    fontFamily: Fonts.bold,
  },
  labelInactive: {
    fontFamily: Fonts.medium,
  },
})
