import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Animated as RNAnimated, LayoutAnimation, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface FAQItem { id: number; question: string; answer: string }

export default function FAQScreen() {
  const insets = useSafeAreaInsets()
  const [grouped, setGrouped] = useState<Record<string, FAQItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    api.get('/faq')
      .then(r => {
        const data: Record<string, FAQItem[]> = r.data?.faqs || {}
        setGrouped(data)
        const cats = Object.keys(data)
        if (cats.length > 0) setActiveCategory(cats[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(prev => (prev === id ? null : id))
  }

  const categories = Object.keys(grouped)

  const filteredItems: FAQItem[] = search.trim()
    ? categories.flatMap(cat => grouped[cat] || []).filter(
        item =>
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase())
      )
    : activeCategory
    ? grouped[activeCategory] || []
    : []

  const CATEGORY_EMOJI: Record<string, string> = {
    'General': '❓',
    'Products & Quality': '🌿',
    'Orders & Shipping': '📦',
    'Payment': '💳',
    'Returns & Refunds': '↩️',
    'Account': '👤',
    'Other': '💬',
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <LinearGradient colors={[Colors.forest, '#0f2018']} style={[ss.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>FAQ</Text>
          <Text style={ss.headerSub}>Frequently asked questions</Text>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={ss.searchWrap}>
        <View style={ss.searchBox}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={ss.searchInput}
            placeholder="Search questions..."
            placeholderTextColor={Colors.textDim}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: Colors.textDim, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.forest} size="large" />
        </View>
      ) : categories.length === 0 ? (
        <View style={ss.emptyWrap}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>❓</Text>
          <Text style={ss.emptyTitle}>No FAQs yet</Text>
          <Text style={ss.emptySub}>Our support team is adding answers soon.</Text>
        </View>
      ) : (
        <>
          {/* Category tabs — only show when not searching */}
          {!search && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={ss.catRow}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { setActiveCategory(cat); setExpanded(null) }}
                  style={[ss.catChip, activeCategory === cat && ss.catChipActive]}
                >
                  <Text style={ss.catEmoji}>{CATEGORY_EMOJI[cat] || '❓'}</Text>
                  <Text style={[ss.catText, activeCategory === cat && ss.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* FAQ list */}
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.length === 0 ? (
              <View style={ss.emptyWrap}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
                <Text style={ss.emptyTitle}>No results</Text>
                <Text style={ss.emptySub}>Try different keywords</Text>
              </View>
            ) : filteredItems.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggle(item.id)}
                activeOpacity={0.8}
                style={ss.card}
              >
                <View style={ss.cardHeader}>
                  <Text style={ss.question} numberOfLines={expanded === item.id ? undefined : 2}>
                    {item.question}
                  </Text>
                  <Text style={ss.chevron}>{expanded === item.id ? '▲' : '▼'}</Text>
                </View>
                {expanded === item.id && (
                  <View style={ss.answerWrap}>
                    <View style={ss.divider} />
                    <Text style={ss.answer}>{item.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: Fonts.bold, fontSize: 17 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.regular, fontSize: 11 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.cream },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  searchInput: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest },
  catRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  catChipActive: { backgroundColor: Colors.forest, borderColor: Colors.forest },
  catEmoji: { fontSize: 13 },
  catText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.forest },
  catTextActive: { color: '#fff' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  question: { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest, lineHeight: 19 },
  chevron: { fontSize: 10, color: Colors.textDim, marginTop: 3 },
  answerWrap: { marginTop: 10 },
  divider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 10 },
  answer: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, lineHeight: 20 },
})
