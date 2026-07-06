import React, { useEffect, useRef, useState } from 'react'
import { toast } from '../../components/ui/Toast'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { useStore } from '../../store'
import { Colors, Fonts, Radius, Shadows } from '../../constants/theme'

type Ticket = {
  id: number
  subject: string
  category: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  message_count: string
}

type Message = {
  id: number
  sender_type: 'user' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open: { bg: '#dbeafe', text: '#1d4ed8' },
  in_progress: { bg: '#fef9c3', text: '#b45309' },
  resolved: { bg: '#dcfce7', text: '#15803d' },
  closed: { bg: '#f3f4f6', text: '#6b7280' },
}

const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  low: { bg: '#f3f4f6', text: '#374151' },
  medium: { bg: '#dbeafe', text: '#1d4ed8' },
  high: { bg: '#ffedd5', text: '#c2410c' },
  urgent: { bg: '#fee2e2', text: '#b91c1c' },
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useStore() as any
  const [view, setView] = useState<'list' | 'create' | 'chat'>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const flatRef = useRef<FlatList>(null)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const r = await api.get('/support/tickets')
      setTickets(r.data.tickets || [])
    } catch { } finally { setLoading(false) }
  }

  const loadChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    try {
      const r = await api.get(`/support/tickets/${ticket.id}`)
      setMessages(r.data.messages || [])
      setView('chat')
    } catch { }
  }

  useEffect(() => {
    if (!user) { router.replace('/auth'); return }
    loadTickets()
  }, [user])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200)
    }
  }, [messages])

  const createTicket = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.warning('Please fill subject and message')
      return
    }
    setSubmitting(true)
    try {
      const r = await api.post('/support/tickets', form)
      setForm({ subject: '', category: 'general', priority: 'medium', message: '' })
      await loadTickets()
      await loadChat({ ...r.data.ticket, message_count: '1' })
    } catch { toast.error('Failed to submit') } finally { setSubmitting(false) }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket) return
    setSending(true)
    try {
      const r = await api.post(`/support/tickets/${selectedTicket.id}/reply`, { message: reply.trim() })
      setMessages(prev => [...prev, r.data.message])
      setReply('')
    } catch { toast.error('Failed to send') } finally { setSending(false) }
  }

  const closeTicket = async () => {
    if (!selectedTicket) return
    Alert.alert('Close Ticket', 'Mark this ticket as closed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close', style: 'destructive', onPress: async () => {
          try {
            await api.put(`/support/tickets/${selectedTicket.id}/close`)
            setSelectedTicket(p => p ? { ...p, status: 'closed' } : p)
          } catch { }
        }
      }
    ])
  }

  if (!user) return null

  // ── CHAT VIEW ──────────────────────────────────────────────────────────
  if (view === 'chat' && selectedTicket) {
    const sc = STATUS_COLOR[selectedTicket.status] || STATUS_COLOR.open
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.cream }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[Colors.forest, Colors.moss]} style={[s.chatHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => { setView('list'); loadTickets() }} style={s.backBtn}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.chatTitle} numberOfLines={1}>{selectedTicket.subject}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={[s.badge, { backgroundColor: sc.bg }]}>
                <Text style={[s.badgeText, { color: sc.text }]}>{selectedTicket.status.replace('_', ' ')}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>#{selectedTicket.id}</Text>
            </View>
          </View>
          {selectedTicket.status !== 'closed' && (
            <TouchableOpacity onPress={closeTicket} style={s.closeBtn}>
              <Text style={{ color: '#fca5a5', fontSize: 12 }}>Close</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          renderItem={({ item: msg }) => (
            <View style={[s.msgRow, msg.sender_type === 'user' ? s.msgRowUser : s.msgRowAdmin]}>
              <View style={[s.msgBubble, msg.sender_type === 'user' ? s.bubbleUser : s.bubbleAdmin]}>
                {msg.sender_type === 'admin' && (
                  <Text style={s.msgSender}>{msg.sender_name || 'Support Team'}</Text>
                )}
                <Text style={[s.msgText, msg.sender_type === 'user' && { color: '#fff' }]}>{msg.message}</Text>
                <Text style={[s.msgTime, msg.sender_type === 'user' && { color: 'rgba(255,255,255,0.6)' }]}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        />

        {selectedTicket.status === 'closed' ? (
          <View style={[s.replyBar, { paddingBottom: insets.bottom + 8 }]}>
            <Text style={{ color: Colors.textDim, fontSize: 13, textAlign: 'center' }}>Ticket is closed</Text>
          </View>
        ) : (
          <View style={[s.replyBar, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Type your reply..."
              placeholderTextColor={Colors.textDim}
              style={s.replyInput}
              multiline
            />
            <TouchableOpacity
              onPress={sendReply}
              disabled={sending || !reply.trim()}
              style={[s.sendBtn, { opacity: sending || !reply.trim() ? 0.5 : 1 }]}
            >
              <LinearGradient colors={[Colors.forest, Colors.moss]} style={s.sendGrad}>
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendIcon}>➤</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    )
  }

  // ── CREATE VIEW ────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: Colors.cream }} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[Colors.forest, Colors.moss]} style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => setView('list')} style={s.backBtn}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Ticket</Text>
        </LinearGradient>

        <View style={s.formCard}>
          <Text style={s.label}>Subject</Text>
          <TextInput
            value={form.subject}
            onChangeText={t => setForm(p => ({ ...p, subject: t }))}
            placeholder="Brief description of your issue"
            placeholderTextColor={Colors.textDim}
            style={s.input}
          />

          <Text style={s.label}>Category</Text>
          <View style={s.pickerRow}>
            {['general', 'order', 'payment', 'return', 'product', 'other'].map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setForm(p => ({ ...p, category: cat }))}
                style={[s.chip, form.category === cat && s.chipActive]}
              >
                <Text style={[s.chipText, form.category === cat && s.chipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Priority</Text>
          <View style={s.pickerRow}>
            {['low', 'medium', 'high', 'urgent'].map(pr => (
              <TouchableOpacity
                key={pr}
                onPress={() => setForm(p => ({ ...p, priority: pr }))}
                style={[s.chip, form.priority === pr && s.chipActive]}
              >
                <Text style={[s.chipText, form.priority === pr && s.chipTextActive]}>
                  {pr.charAt(0).toUpperCase() + pr.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Message</Text>
          <TextInput
            value={form.message}
            onChangeText={t => setForm(p => ({ ...p, message: t }))}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={Colors.textDim}
            style={[s.input, { height: 120, textAlignVertical: 'top' }]}
            multiline
          />

          <TouchableOpacity
            onPress={createTicket}
            disabled={submitting}
            style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
          >
            <LinearGradient colors={[Colors.forest, Colors.moss]} style={s.submitBtn}>
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.submitText}>Submit Ticket</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Colors.forest, Colors.moss]} style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Support</Text>
        <TouchableOpacity
          onPress={() => setView('create')}
          style={[s.backBtn, { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, borderRadius: 10 }]}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontFamily: Fonts.medium }}>+ New</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.moss} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
          <Text style={{ fontSize: 16, color: Colors.textDim, textAlign: 'center', fontFamily: Fonts.medium }}>
            No support tickets yet{'\n'}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textDim, textAlign: 'center' }}>
            Need help? Tap "+ New" to create your first ticket
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshing={loading}
          onRefresh={loadTickets}
          renderItem={({ item: t }) => {
            const sc = STATUS_COLOR[t.status] || STATUS_COLOR.open
            const pc = PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.medium
            return (
              <TouchableOpacity onPress={() => loadChat(t)} activeOpacity={0.85}>
                <View style={[s.ticketCard, Shadows.sm]}>
                  <View style={s.ticketBadges}>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>{t.status.replace('_', ' ')}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: pc.bg }]}>
                      <Text style={[s.badgeText, { color: pc.text }]}>{t.priority}</Text>
                    </View>
                    <Text style={s.catText}>{t.category}</Text>
                  </View>
                  <Text style={s.ticketSubject} numberOfLines={2}>{t.subject}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={s.ticketMeta}>{t.message_count} msg{Number(t.message_count) !== 1 ? 's' : ''}</Text>
                    <Text style={s.ticketMeta}>{new Date(t.updated_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontFamily: Fonts.bold, textAlign: 'center' },
  chatTitle: { color: '#fff', fontSize: 15, fontFamily: Fonts.bold },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  ticketCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 14 },
  ticketBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: Fonts.medium, textTransform: 'capitalize' },
  catText: { fontSize: 10, color: Colors.textDim, fontFamily: Fonts.regular },
  ticketSubject: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.forest },
  ticketMeta: { fontSize: 11, color: Colors.textDim },
  formCard: { margin: 16, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 20, ...Shadows.md },
  label: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.forest, marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.regular, color: Colors.dark },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cream },
  chipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  chipText: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.textDim },
  chipTextActive: { color: '#fff' },
  submitBtn: { alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 14 },
  submitText: { color: '#fff', fontSize: 15, fontFamily: Fonts.bold },
  msgRow: { flexDirection: 'row', marginBottom: 12 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAdmin: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: Colors.forest, borderBottomRightRadius: 4 },
  bubbleAdmin: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadows.sm },
  msgSender: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.moss, marginBottom: 4 },
  msgText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.dark, lineHeight: 20 },
  msgTime: { fontSize: 10, color: Colors.textDim, marginTop: 4, alignSelf: 'flex-end' },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  replyInput: { flex: 1, maxHeight: 100, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.regular, color: Colors.dark },
  sendBtn: { width: 44, height: 44 },
  sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 16 },
})
