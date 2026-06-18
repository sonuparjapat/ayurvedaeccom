import React, { useEffect, useState } from 'react'
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const STATUS_BG: Record<number, string> = {
  0: '#fef3c7', 1: '#dbeafe', 2: '#ede9fe', 3: '#cffafe',
  4: '#ffedd5', 5: '#d1fae5', 6: '#fee2e2', 7: '#fef3c7',
  8: '#ede9fe', 9: '#d1fae5',
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/push/notifications')
      .then(r => setNotifications(r.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const grouped = notifications.reduce((acc: any, n: any) => {
    const date = new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(n)
    return acc
  }, {})

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Header */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.forest} style={{ marginTop: 60 }} />
        ) : notifications.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔔</Text>
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptySub}>Order updates will appear here</Text>
            <TouchableOpacity onPress={() => router.push('/')} style={s.shopBtn}>
              <Text style={s.shopBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {Object.entries(grouped).map(([date, items]: [string, any]) => (
              <View key={date}>
                <Text style={s.dateLabel}>{date}</Text>
                {items.map((n: any, i: number) => (
                  <Animated.View key={n.id || i} entering={FadeInDown.delay(i * 60)}>
                    <TouchableOpacity
                      style={s.card}
                      onPress={() => router.push(`/order/${n.order_id}` as any)}
                      activeOpacity={0.85}
                    >
                      <View style={[s.emojiBox, { backgroundColor: STATUS_BG[n.new_status] ?? '#f3f4f6' }]}>
                        <Text style={{ fontSize: 20 }}>{n.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle} numberOfLines={1}>{n.title}</Text>
                        <Text style={s.cardBody} numberOfLines={2}>{n.body}</Text>
                        <Text style={s.cardTime}>
                          {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  backArrow: { fontSize: 24, color: Colors.forest, lineHeight: 28 },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest },
  dateLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.darkDim, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, ...Shadows.sm },
  emojiBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.dark, marginBottom: 2 },
  cardBody: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.darkDim, lineHeight: 18 },
  cardTime: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.darkDim, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.dark, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.darkDim, textAlign: 'center' },
  shopBtn: { marginTop: 20, backgroundColor: Colors.forest, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  shopBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
})
