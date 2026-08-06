import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { toast } from '../../components/ui/Toast'
import { Colors, Fonts } from '../../constants/theme'
import { useStore } from '../../store'

interface Subscription {
  id: number
  product_id: number
  product_name: string
  price: string
  images: string
  quantity: number
  frequency_days: number
  status: 'active' | 'paused' | 'cancelled'
  next_order_date: string | null
  created_at: string
}

const FREQ_LABEL: Record<number, string> = {
  7: 'Weekly', 14: 'Every 2 weeks', 30: 'Monthly',
  60: 'Every 2 months', 90: 'Every 3 months',
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:    { bg: '#d1fae5', color: '#065f46' },
  paused:    { bg: '#fef9c3', color: '#92400e' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
}

const getImage = (images: any): string => {
  try {
    const arr = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(arr) ? arr[0] || '' : ''
  } catch { return '' }
}

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets()
  const user = useStore(s => s.user)
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/auth'); return }
    api.get('/subscriptions/my')
      .then(r => setSubs(r.data?.data || []))
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false))
  }, [])

  const togglePause = async (sub: Subscription) => {
    const newStatus = sub.status === 'paused' ? 'active' : 'paused'
    try {
      await api.put(`/subscriptions/${sub.id}`, { status: newStatus })
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s))
      toast.success(newStatus === 'paused' ? 'Subscription paused' : 'Subscription resumed')
    } catch { toast.error('Could not update subscription') }
  }

  const cancelSub = (sub: Subscription) => {
    Alert.alert(
      'Cancel Subscription',
      `Stop repeat orders for "${sub.product_name}"?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/subscriptions/${sub.id}`)
              setSubs(prev => prev.filter(s => s.id !== sub.id))
              toast.success('Subscription cancelled')
            } catch { toast.error('Could not cancel') }
          },
        },
      ]
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <LinearGradient colors={[Colors.forest, '#0f2018']} style={[ss.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>Subscriptions</Text>
          <Text style={ss.headerSub}>Manage your repeat orders</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.forest} size="large" />
        </View>
      ) : subs.length === 0 ? (
        <View style={ss.emptyWrap}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🔁</Text>
          <Text style={ss.emptyTitle}>No subscriptions yet</Text>
          <Text style={ss.emptySub}>Subscribe to products for automatic repeat orders at a set frequency.</Text>
          <TouchableOpacity onPress={() => router.push('/products')} style={{ marginTop: 20, borderRadius: 13, overflow: 'hidden' }}>
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={{ paddingHorizontal: 28, paddingVertical: 13 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 14 }}>Browse Products</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {subs.map((sub, i) => {
            const img = getImage(sub.images)
            const statusStyle = STATUS_STYLE[sub.status] || STATUS_STYLE.active

            return (
              <Animated.View
                key={sub.id}
                entering={FadeInDown.delay(i * 60).duration(400)}
                style={[ss.card, sub.status === 'cancelled' && { opacity: 0.6 }]}
              >
                <View style={ss.cardTop}>
                  {/* Product image */}
                  <View style={ss.imgWrap}>
                    {img ? (
                      <ExpoImage source={{ uri: img }} style={ss.img} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[ss.img, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.mint }]}>
                        <Text style={{ fontSize: 28 }}>🌿</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <Text style={ss.productName} numberOfLines={2}>{sub.product_name}</Text>
                      <View style={[ss.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[ss.statusText, { color: statusStyle.color }]}>{sub.status.toUpperCase()}</Text>
                      </View>
                    </View>

                    <Text style={ss.meta}>
                      {FREQ_LABEL[sub.frequency_days] || `Every ${sub.frequency_days} days`}  ·  Qty {sub.quantity}
                    </Text>

                    <Text style={ss.price}>₹{Number(sub.price || 0).toLocaleString('en-IN')}</Text>

                    {sub.next_order_date && sub.status === 'active' && (
                      <Text style={ss.nextOrder}>
                        Next: {new Date(sub.next_order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                {sub.status !== 'cancelled' && (
                  <View style={ss.actions}>
                    <TouchableOpacity
                      onPress={() => togglePause(sub)}
                      style={ss.actionBtn}
                    >
                      <Text style={ss.actionBtnText}>
                        {sub.status === 'paused' ? '▶  Resume' : '⏸  Pause'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => cancelSub(sub)}
                      style={[ss.actionBtn, ss.cancelBtn]}
                    >
                      <Text style={[ss.actionBtnText, { color: '#ef4444' }]}>✕  Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 17 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 11 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.forest, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  imgWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.mint },
  img: { width: '100%', height: '100%' },
  productName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 18, flex: 1 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },
  meta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, marginBottom: 4 },
  price: { fontFamily: Fonts.displayBold, fontSize: 16, color: Colors.forest },
  nextOrder: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.moss, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
  actionBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.forest },
  cancelBtn: { borderColor: 'rgba(239,68,68,0.2)' },
})
