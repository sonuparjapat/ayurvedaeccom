import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Animated, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Fonts, Radius, Shadows } from '../../constants/theme'

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

/* ─── Per-toast config ───────────────────────────────────────────────────── */

const CONFIG: Record<ToastType, { bg: string; border: string; icon: string; label: string }> = {
  success: { bg: '#0d2e1a',  border: '#22c55e', icon: '✓',  label: '#22c55e' },
  error:   { bg: '#2a0d0d',  border: '#ef4444', icon: '✕',  label: '#ef4444' },
  warning: { bg: '#2a1f00',  border: '#f59e0b', icon: '!',  label: '#f59e0b' },
  info:    { bg: '#0d1f2e',  border: '#38bdf8', icon: 'i',  label: '#38bdf8' },
}

/* ─── Single animated toast ──────────────────────────────────────────────── */

function ToastRow({ item, onDone }: { item: ToastItem; onDone: (id: string) => void }) {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity    = useRef(new Animated.Value(0)).current
  const scale      = useRef(new Animated.Value(0.92)).current
  const cfg        = CONFIG[item.type]

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0,    useNativeDriver: true, damping: 16, stiffness: 240 }),
      Animated.spring(scale,      { toValue: 1,    useNativeDriver: true, damping: 16, stiffness: 240 }),
      Animated.timing(opacity,    { toValue: 1,    duration: 180, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(dismiss, 3500)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: -90, useNativeDriver: true, damping: 18, stiffness: 220 }),
      Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onDone(item.id))
  }, [item.id, onDone])

  return (
    <Animated.View style={[ss.row, { opacity, transform: [{ translateY }, { scale }] }]}>
      <TouchableOpacity onPress={dismiss} activeOpacity={0.85}>
        <View style={[ss.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          {/* Left accent bar */}
          <View style={[ss.bar, { backgroundColor: cfg.border }]} />

          {/* Icon badge */}
          <View style={[ss.iconWrap, { backgroundColor: cfg.border + '22', borderColor: cfg.border + '55' }]}>
            <Text style={[ss.icon, { color: cfg.label }]}>{cfg.icon}</Text>
          </View>

          {/* Message */}
          <Text style={ss.msg} numberOfLines={3}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ─── Container rendered in layout ──────────────────────────────────────── */

export interface ToastRef {
  show: (type: ToastType, message: string) => void
}

export const ToastContainer = React.forwardRef<ToastRef>((_, ref) => {
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<ToastItem[]>([])

  const show = useCallback((type: ToastType, message: string) => {
    const id = String(Date.now() + Math.random())
    setItems(prev => {
      const next = [...prev, { id, type, message }]
      return next.slice(-3) // max 3 toasts at once
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  useImperativeHandle(ref, () => ({ show }), [show])

  if (!items.length) return null

  return (
    <View style={[ss.container, { top: insets.top + 12 }]} pointerEvents="box-none">
      {items.map(item => (
        <ToastRow key={item.id} item={item} onDone={remove} />
      ))}
    </View>
  )
})

ToastContainer.displayName = 'ToastContainer'

/* ─── Global singleton ───────────────────────────────────────────────────── */

let _ref: ToastRef | null = null

export function setToastRef(r: ToastRef | null) {
  _ref = r
}

export const toast = {
  success: (msg: string) => _ref?.show('success', msg),
  error:   (msg: string) => _ref?.show('error',   msg),
  warning: (msg: string) => _ref?.show('warning', msg),
  info:    (msg: string) => _ref?.show('info',    msg),
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const ss = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  row: {
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingRight: 16,
    ...Shadows.xl,
    shadowColor: '#000',
  },
  bar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 12,
    marginLeft: 2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    lineHeight: 17,
  },
  msg: {
    flex: 1,
    color: '#e8f5ee',
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
})
