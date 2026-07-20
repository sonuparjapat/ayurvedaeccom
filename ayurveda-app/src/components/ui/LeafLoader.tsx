import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated'
import { Colors, Fonts } from '../../constants/theme'

interface LeafLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  color?: string
}

export function LeafLoader({ size = 'md', text, color = Colors.emerald }: LeafLoaderProps) {
  const op = useSharedValue(0.25)
  const scale = useSharedValue(0.92)

  useEffect(() => {
    op.value = withRepeat(
      withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.ease) })),
      -1, false,
    )
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0.92, { duration: 700, easing: Easing.inOut(Easing.ease) })),
      -1, false,
    )
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: scale.value }] }))

  const fontSize = size === 'sm' ? 28 : size === 'lg' ? 64 : 44

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Animated.View style={[{ alignItems: 'center' }, style]}>
        <Text style={{ fontSize }}>🌿</Text>
      </Animated.View>
      {text && (
        <Text style={{ fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim, textAlign: 'center' }}>
          {text}
        </Text>
      )}
    </View>
  )
}
