// src/app/onboarding/index.tsx
import React, { useRef, useState } from 'react'
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Fonts } from '../../constants/theme'

const { width: W, height: H } = Dimensions.get('window')

const SLIDES = [
  {
    key: '1',
    emoji: '🌿',
    title: 'Pure Ayurvedic\nWellness',
    sub: 'Discover 100% natural products rooted in ancient Ayurvedic wisdom, ethically sourced from Indian farms.',
    bg1: '#0a1f12',
    bg2: '#1a3a2a',
    accent: Colors.emerald,
  },
  {
    key: '2',
    emoji: '🧪',
    title: 'Lab Tested &\nCertified',
    sub: 'Every product undergoes rigorous quality testing. What you see is exactly what you get — pure, safe, effective.',
    bg1: '#0d1a10',
    bg2: '#1e3a20',
    accent: '#10b981',
  },
  {
    key: '3',
    emoji: '🚚',
    title: 'Farm to\nDoorstep',
    sub: 'Fast delivery, easy returns, and a loyalty program that rewards your wellness journey from day one.',
    bg1: '#112010',
    bg2: '#0f2a1a',
    accent: Colors.gold,
  },
]

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const flatRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const dotScale = useSharedValue(1)

  const finish = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', '1')
    router.replace('/')
  }

  const next = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
      setCurrentIndex(i => i + 1)
      dotScale.value = withSpring(1.3, { damping: 10 }, () => { dotScale.value = withSpring(1) })
    } else {
      finish()
    }
  }

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }))

  return (
    <View style={{ flex: 1, backgroundColor: '#0a1f12' }}>
      <StatusBar barStyle="light-content" />

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={s => s.key}
        renderItem={({ item: slide }) => (
          <LinearGradient colors={[slide.bg1, slide.bg2]} style={{ width: W, height: H }}>
            {/* Top decorative blob */}
            <View style={[s.blob, { backgroundColor: slide.accent + '18', top: H * 0.06, right: -60 }]} />
            <View style={[s.blob, { backgroundColor: slide.accent + '0e', bottom: H * 0.25, left: -80, width: 220, height: 220 }]} />

            <View style={[s.slide, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
              {/* Emoji orb */}
              <Animated.View entering={FadeIn.delay(100)} style={[s.orb, { backgroundColor: slide.accent + '22', borderColor: slide.accent + '44' }]}>
                <Text style={s.emoji}>{slide.emoji}</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200)}>
                <Text style={s.title}>{slide.title}</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300)}>
                <Text style={s.sub}>{slide.sub}</Text>
              </Animated.View>

              {/* Accent line */}
              <View style={[s.accentLine, { backgroundColor: slide.accent }]} />
            </View>
          </LinearGradient>
        )}
      />

      {/* Controls overlay */}
      <View style={[s.controls, { paddingBottom: insets.bottom + 32 }]}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[s.dot, {
                backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                width: i === currentIndex ? 24 : 8,
              }, i === currentIndex && dotStyle]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24 }}>
          <TouchableOpacity onPress={finish} style={s.skipBtn} activeOpacity={0.7}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }} activeOpacity={0.88}>
            <LinearGradient colors={[Colors.emerald, '#059669']} style={s.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.nextText}>{currentIndex === SLIDES.length - 1 ? '🌿  Get Started' : 'Next  →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  slide: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  orb: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 40, borderWidth: 1.5 },
  emoji: { fontSize: 64 },
  title: { fontFamily: Fonts.bold, fontSize: 34, color: '#fff', textAlign: 'center', lineHeight: 42, marginBottom: 20 },
  sub: { fontFamily: Fonts.regular, fontSize: 16, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 26, marginBottom: 28 },
  accentLine: { width: 48, height: 3, borderRadius: 2 },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, gap: 20 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  skipBtn: { paddingVertical: 16, paddingHorizontal: 12 },
  skipText: { color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.medium, fontSize: 15 },
  nextBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  nextText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
})
