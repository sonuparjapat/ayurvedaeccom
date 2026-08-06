import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'
import { LeafLoader } from '../../components/ui/LeafLoader'
import { useStore } from '../../store'

/* ─── Type metadata ─── */
const TYPE_META: Record<string, { emoji: string; bg: string; dot: string; label: string }> = {
  order_update:  { emoji: '📦', bg: '#d1fae5', dot: Colors.emerald, label: 'Order' },
  support_reply: { emoji: '💬', bg: '#ede9fe', dot: '#7c3aed', label: 'Support' },
  ticket_status: { emoji: '🎫', bg: '#fef3c7', dot: '#d97706', label: 'Ticket' },
  broadcast:     { emoji: '📢', bg: '#fef9ec', dot: Colors.gold,   label: 'Announcement' },
}

const TYPE_OPTIONS = [
  { value: 'all',           label: 'All Types' },
  { value: 'order_update',  label: 'Orders' },
  { value: 'support_reply', label: 'Support' },
  { value: 'ticket_status', label: 'Tickets' },
]

const READ_OPTIONS = [
  { value: 'all',   label: 'All' },
  { value: 'false', label: 'Unread' },
  { value: 'true',  label: 'Read' },
]

function fmtTime(d: string) {
  try {
    const date = new Date(d)
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    if (diffH < 48) return 'Yesterday'
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  } catch { return '' }
}

function fmtGroupDate(d: string) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getHref(n: any): string | null {
  if (n.data?.order_id) return `/order/${n.data.order_id}`
  if (n.data?.ticket_id) return `/support`
  return null
}

/* ─── Filter Modal ─── */
function FilterModal({
  visible, onClose,
  typeFilter, setTypeFilter,
  readFilter, setReadFilter,
  onApply,
}: {
  visible: boolean; onClose: () => void
  typeFilter: string; setTypeFilter: (v: string) => void
  readFilter: string; setReadFilter: (v: string) => void
  onApply: () => void
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={fm.overlay}>
        <View style={fm.sheet}>
          <View style={fm.handle} />
          <Text style={fm.title}>Filter Notifications</Text>

          <Text style={fm.sectionLabel}>Notification Type</Text>
          <View style={fm.chipRow}>
            {TYPE_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                onPress={() => setTypeFilter(o.value)}
                style={[fm.chip, typeFilter === o.value && fm.chipActive]}
              >
                <Text style={[fm.chipText, typeFilter === o.value && fm.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={fm.sectionLabel}>Read Status</Text>
          <View style={fm.chipRow}>
            {READ_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                onPress={() => setReadFilter(o.value)}
                style={[fm.chip, readFilter === o.value && fm.chipActive]}
              >
                <Text style={[fm.chipText, readFilter === o.value && fm.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={fm.btnRow}>
            <TouchableOpacity
              onPress={() => { setTypeFilter('all'); setReadFilter('all') }}
              style={fm.btnClear}
            >
              <Text style={fm.btnClearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onApply(); onClose() }} style={fm.btnApply}>
              <Text style={fm.btnApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const fm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.dark, marginBottom: 20 },
  sectionLabel: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  chipText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },
  chipTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnClear: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  btnClearText: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textDim },
  btnApply: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: Colors.forest, alignItems: 'center' },
  btnApplyText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
})

/* ─── Main Screen ─── */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const user = useStore(s => s.user)
  const setUnreadNotificationCount = useStore(s => s.setUnreadNotificationCount)

  useEffect(() => { if (!user) { router.replace('/auth'); return } }, [user])

  // Clear global badge when this screen is opened
  useEffect(() => { setUnreadNotificationCount(0) }, [])

  const [notifications, setNotifications] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({ page: 1, total_pages: 1, has_next: false })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const [tab, setTab] = useState<'all' | 'announcements'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Pending filter state for the modal (only apply on "Apply")
  const [pendingType, setPendingType] = useState('all')
  const [pendingRead, setPendingRead] = useState('all')

  const activeFilterCount = [typeFilter !== 'all' ? 1 : 0, readFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)

  const loadData = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const params: any = { page: p, limit: 20 }
      if (typeFilter !== 'all') params.type = typeFilter
      if (readFilter !== 'all') params.is_read = readFilter

      const r = await api.get('/notifications', { params })
      const newItems = r.data.notifications || []

      if (append) {
        setNotifications(prev => [...prev, ...newItems])
      } else {
        setNotifications(newItems)
        setBroadcasts(r.data.broadcasts || [])
      }

      setPagination(r.data.pagination || { page: 1, total_pages: 1, has_next: false })
      setUnreadCount(r.data.unread_count || 0)
    } catch {
      if (!append) {
        // fallback
        try {
          const r2 = await api.get('/push/notifications')
          setNotifications((r2.data.notifications || []).map((n: any) => ({ ...n, type: 'order_update', is_read: true })))
        } catch { }
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [typeFilter, readFilter])

  useEffect(() => {
    setPage(1)
    loadData(1, false)
  }, [tab, typeFilter, readFilter])

  const loadMore = () => {
    if (!pagination.has_next || loadingMore) return
    const next = page + 1
    setPage(next)
    loadData(next, true)
  }

  const markRead = async (id: number) => {
    try { await api.put(`/notifications/${id}/read`) } catch { }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    try {
      setMarkingAll(true)
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { }
    finally { setMarkingAll(false) }
  }

  const handlePress = (n: any) => {
    if (!n.is_read && n.id && n._kind === 'personal') markRead(n.id)
    const href = getHref(n)
    if (href) router.push(href as any)
  }

  // Build display list
  const displayItems = tab === 'announcements'
    ? broadcasts.map(b => ({ ...b, type: 'broadcast', is_read: true, _kind: 'broadcast' }))
    : notifications.map(n => ({ ...n, _kind: 'personal' }))

  // Group by date
  const grouped: { dateLabel: string; items: any[] }[] = []
  displayItems.forEach(n => {
    const label = fmtGroupDate(n.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.dateLabel === label) {
      last.items.push(n)
    } else {
      grouped.push({ dateLabel: label, items: [n] })
    }
  })

  // Flatten for FlatList with section headers
  const flatData: any[] = []
  grouped.forEach(g => {
    flatData.push({ _type: 'header', label: g.dateLabel, count: g.items.length })
    g.items.forEach(item => flatData.push({ _type: 'item', ...item }))
  })

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item._type === 'header') {
      return (
        <View style={s.dateHeader}>
          <Text style={s.dateLabel}>{item.label}</Text>
          <View style={s.dateLine} />
          <Text style={s.dateCount}>{item.count}</Text>
        </View>
      )
    }

    const n = item
    const meta = TYPE_META[n.type] || TYPE_META.broadcast
    const isUnread = n.is_read === false

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 200))}>
        <TouchableOpacity
          style={[s.card, isUnread && s.cardUnread]}
          onPress={() => handlePress(n)}
          activeOpacity={0.82}
        >
          <View style={[s.emojiBox, { backgroundColor: meta.bg }]}>
            <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={[s.cardTitle, { flex: 1 }]} numberOfLines={1}>{n.title}</Text>
              {isUnread && <View style={[s.dot, { backgroundColor: meta.dot }]} />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <View style={[s.typePill, { backgroundColor: meta.bg }]}>
                <Text style={[s.typePillText, { color: meta.dot }]}>{meta.label}</Text>
              </View>
              <Text style={s.cardTime}>{fmtTime(n.created_at)}</Text>
            </View>
            {n.body && <Text style={s.cardBody} numberOfLines={2}>{n.body}</Text>}
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <LinearGradient colors={[Colors.forest, Colors.moss]} style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.subTitle}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => { setPendingType(typeFilter); setPendingRead(readFilter); setFilterOpen(true) }}
            style={[s.iconBtn, activeFilterCount > 0 && s.iconBtnActive]}
          >
            <Text style={{ fontSize: 15 }}>⚙️</Text>
            {activeFilterCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={s.markAllBtn} disabled={markingAll}>
              <Text style={s.markAllText}>{markingAll ? '…' : '✓ All'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, tab === 'all' && s.tabActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>
            Activity{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'announcements' && s.tabActive]}
          onPress={() => setTab('announcements')}
        >
          <Text style={[s.tabText, tab === 'announcements' && s.tabTextActive]}>Announcements</Text>
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {activeFilterCount > 0 && tab === 'all' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {typeFilter !== 'all' && (
              <View style={s.activeChip}>
                <Text style={s.activeChipText}>{TYPE_OPTIONS.find(o => o.value === typeFilter)?.label}</Text>
                <TouchableOpacity onPress={() => setTypeFilter('all')}>
                  <Text style={s.activeChipX}> ×</Text>
                </TouchableOpacity>
              </View>
            )}
            {readFilter !== 'all' && (
              <View style={s.activeChip}>
                <Text style={s.activeChipText}>{readFilter === 'false' ? 'Unread' : 'Read'}</Text>
                <TouchableOpacity onPress={() => setReadFilter('all')}>
                  <Text style={s.activeChipX}> ×</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => { setTypeFilter('all'); setReadFilter('all') }} style={s.clearChip}>
              <Text style={s.clearChipText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <View style={{ marginTop: 80, alignItems: 'center' }}>
          <LeafLoader size="md" text="Loading notifications…" />
        </View>
      ) : flatData.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>{tab === 'announcements' ? '📢' : '🔔'}</Text>
          <Text style={s.emptyTitle}>No notifications found</Text>
          <Text style={s.emptySub}>
            {activeFilterCount > 0
              ? 'Try clearing your filters'
              : tab === 'announcements'
                ? 'Admin announcements will appear here'
                : 'Order updates, support replies and announcements will appear here'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={() => { setTypeFilter('all'); setReadFilter('all') }}
              style={s.clearBtn}
            >
              <Text style={s.clearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, i) => item._type === 'header' ? `h-${item.label}` : `n-${item.id || i}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 32 }}
          onEndReached={tab === 'all' ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ marginTop: 16, alignItems: 'center' }}><LeafLoader size="sm" /></View>
            ) : tab === 'all' && !pagination.has_next && flatData.length > 10 ? (
              <Text style={s.endText}>You've seen all notifications</Text>
            ) : null
          }
        />
      )}

      {/* Filter modal */}
      <FilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        typeFilter={pendingType}
        setTypeFilter={setPendingType}
        readFilter={pendingRead}
        setReadFilter={setPendingRead}
        onApply={() => { setTypeFilter(pendingType); setReadFilter(pendingRead) }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#fff', lineHeight: 28 },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: '#fff' },
  subTitle: { fontFamily: Fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  filterBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ef4444', borderRadius: 6, width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontFamily: Fonts.bold, fontSize: 8, color: '#fff' },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  markAllText: { fontFamily: Fonts.medium, fontSize: 12, color: '#fff' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 4, ...Shadows.sm },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.forest },
  tabText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textDim },
  tabTextActive: { color: '#fff', fontFamily: Fonts.bold },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.forest, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  activeChipText: { fontFamily: Fonts.medium, fontSize: 12, color: '#fff' },
  activeChipX: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
  clearChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  clearChipText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textDim },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  dateLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dateCount: { fontFamily: Fonts.regular, fontSize: 11, color: '#d1d5db' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, ...Shadows.sm },
  cardUnread: { backgroundColor: 'rgba(16,185,129,0.06)', borderLeftWidth: 3, borderLeftColor: Colors.emerald },
  emojiBox: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.dark },
  cardBody: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, lineHeight: 18, marginTop: 4 },
  cardTime: { fontFamily: Fonts.regular, fontSize: 11, color: '#9ca3af' },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typePillText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  empty: { flex: 1, alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.dark, marginBottom: 6 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDim, textAlign: 'center' },
  clearBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.forest, borderRadius: 14 },
  clearBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
  endText: { textAlign: 'center', fontFamily: Fonts.regular, fontSize: 12, color: '#d1d5db', paddingVertical: 16 },
})
