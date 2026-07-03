import React, { useEffect, useRef, useState } from 'react'
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

// Notification type → display metadata
const TYPE_META: Record<string, { emoji: string; bg: string }> = {
  order_update:  { emoji: '📦', bg: '#dbeafe' },
  support_reply: { emoji: '💬', bg: '#ede9fe' },
  ticket_status: { emoji: '🎫', bg: '#fef3c7' },
  broadcast:     { emoji: '📢', bg: '#d1fae5' },
}

function getHref(n: any): string | null {
  if (n.data?.order_id) return `/order/${n.data.order_id}`
  if (n.data?.ticket_id) return `/support`
  return null
}

function fmtTime(d: string) {
  try {
    const date = new Date(d)
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  } catch { return '' }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const [notifications, setNotifications] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'announcements'>('all')

  const loadData = async () => {
    try {
      const r = await api.get('/notifications')
      setNotifications(r.data.notifications || [])
      setBroadcasts(r.data.broadcasts || [])
    } catch {
      // fallback: try legacy endpoint
      try {
        const r2 = await api.get('/push/notifications')
        setNotifications((r2.data.notifications || []).map((n: any) => ({ ...n, type: 'order_update', is_read: true })))
      } catch { }
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const markRead = async (id: number) => {
    try { await api.put(`/notifications/${id}/read`) } catch { }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    try { await api.put('/notifications/read-all') } catch { }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Merge and sort all items for the "all" tab
  const allItems = [
    ...notifications.map(n => ({ ...n, _kind: 'personal' })),
    ...broadcasts.map(b => ({ ...b, type: 'broadcast', is_read: true, _kind: 'broadcast' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const displayItems = tab === 'all' ? allItems : broadcasts

  // Group by date
  const grouped = displayItems.reduce((acc: any, n: any) => {
    const key = new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  const handlePress = (n: any) => {
    if (!n.is_read && n.id && n._kind === 'personal') markRead(n.id)
    const href = getHref(n)
    if (href) router.push(href as any)
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Header */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadBadgeText}>{unreadCount} unread</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
              <Text style={s.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, tab === 'all' && s.tabActive]}
            onPress={() => setTab('all')}
          >
            <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>
              All{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === 'announcements' && s.tabActive]}
            onPress={() => setTab('announcements')}
          >
            <Text style={[s.tabText, tab === 'announcements' && s.tabTextActive]}>Announcements</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.forest} style={{ marginTop: 60 }} />
        ) : displayItems.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{tab === 'announcements' ? '📢' : '🔔'}</Text>
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptySub}>
              {tab === 'announcements'
                ? 'Admin announcements will appear here'
                : 'Order updates, support replies and announcements will appear here'}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {Object.entries(grouped).map(([date, items]: [string, any]) => (
              <View key={date}>
                <Text style={s.dateLabel}>{date}</Text>
                {items.map((n: any, i: number) => {
                  const meta = TYPE_META[n.type] || TYPE_META.broadcast
                  return (
                    <Animated.View key={n.id || `${n.type}-${i}`} entering={FadeInDown.delay(i * 50)}>
                      <TouchableOpacity
                        style={[s.card, !n.is_read && s.cardUnread]}
                        onPress={() => handlePress(n)}
                        activeOpacity={0.85}
                      >
                        <View style={[s.emojiBox, { backgroundColor: meta.bg }]}>
                          <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                            <Text style={[s.cardTitle, { flex: 1 }]} numberOfLines={1}>{n.title}</Text>
                            {!n.is_read && <View style={s.dot} />}
                          </View>
                          {n.body && <Text style={s.cardBody} numberOfLines={2}>{n.body}</Text>}
                          <Text style={s.cardTime}>{fmtTime(n.created_at)}</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  )
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  backArrow: { fontSize: 24, color: Colors.forest, lineHeight: 28 },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest },
  unreadBadge: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  unreadBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: '#fff' },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  markAllText: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.forest },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 4, ...Shadows.sm },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.forest },
  tabText: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.darkDim },
  tabTextActive: { color: '#fff' },
  dateLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.darkDim, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, ...Shadows.sm },
  cardUnread: { backgroundColor: '#eff6ff', borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  emojiBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.dark, marginBottom: 2 },
  cardBody: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.darkDim, lineHeight: 18 },
  cardTime: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.darkDim, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginTop: 4, flexShrink: 0 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.dark, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.darkDim, textAlign: 'center' },
})
