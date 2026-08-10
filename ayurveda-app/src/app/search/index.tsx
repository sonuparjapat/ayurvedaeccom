import React, { useCallback, useEffect, useRef, useState } from 'react'
import BottomNav from '../../components/BottomNav'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'

interface Suggestion {
  id: number
  name: string
  slug?: string
  price?: string
  image?: string
  _type: 'product' | 'category'
  brand?: string
  is_bestseller?: boolean
  tags?: string[]
}

const RECENT_KEY = 'recent_searches'

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
    loadRecent()
  }, [])

  const loadRecent = async () => {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
      const raw = await AsyncStorage.getItem(RECENT_KEY)
      if (raw) setRecentSearches(JSON.parse(raw))
    } catch {}
  }

  const saveRecent = async (q: string) => {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
      const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, 8)
      setRecentSearches(updated)
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
  }

  const clearRecent = async () => {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage')
      setRecentSearches([])
      await AsyncStorage.removeItem(RECENT_KEY)
    } catch {}
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setLoading(true)
    try {
      const res = await api.get(`/shop/search/suggestions?q=${encodeURIComponent(q)}`)
      const data = res.data
      const cats: Suggestion[] = (data.categories || []).map((c: any) => ({ ...c, _type: 'category' as const }))
      const prods: Suggestion[] = (data.products || []).map((p: any) => ({
        ...p,
        image: Array.isArray(p.images) ? p.images[0] : (p.image || null),
        _type: 'product' as const,
      }))
      setSuggestions([...cats, ...prods])
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const onChangeText = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300)
  }

  const handleSelect = (item: Suggestion) => {
    Keyboard.dismiss()
    saveRecent(item.name)
    if (item._type === 'category') {
      router.push(`/category/${item.slug || item.id}`)
    } else {
      router.push(`/product/${item.slug || item.id}`)
    }
  }

  const handleRecentSelect = (term: string) => {
    setQuery(term)
    fetchSuggestions(term)
  }

  const handleSubmit = () => {
    if (!query.trim()) return
    saveRecent(query.trim())
    Keyboard.dismiss()
    router.push(`/products?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* SEARCH BAR */}
      <View style={s.bar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={s.inputWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Search products, categories..."
            placeholderTextColor={Colors.textDim}
            value={query}
            onChangeText={onChangeText}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]) }}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CONTENT */}
      {loading && (
        <View style={s.loaderRow}>
          <ActivityIndicator color={Colors.emerald} />
        </View>
      )}

      {/* SUGGESTIONS */}
      {!loading && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, i) => `${item._type}-${item.id}-${i}`}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={s.separator} />}
          renderItem={({ item }) => (
            <Pressable style={s.row} onPress={() => handleSelect(item)}>
              {item._type === 'product' && item.image ? (
                <Image source={{ uri: item.image }} style={s.thumb} />
              ) : (
                <View style={s.iconBox}>
                  <Text style={s.iconEmoji}>{item._type === 'category' ? '🌿' : '📦'}</Text>
                </View>
              )}
              <View style={s.rowText}>
                {item._type === 'product' && item.brand && (
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 10, color: Colors.textDim, marginBottom: 1 }}>{item.brand}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
                  {item.is_bestseller && (
                    <View style={{ backgroundColor: '#f0e4bc', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 8, color: '#92400e' }}>Bestseller</Text>
                    </View>
                  )}
                </View>
                <Text style={s.rowMeta}>
                  {item._type === 'category' ? 'Category' : item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'Product'}
                </Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}

      {/* RECENT SEARCHES (shown when no query) */}
      {!loading && query.length === 0 && recentSearches.length > 0 && (
        <View style={s.recentWrap}>
          <View style={s.recentHeader}>
            <Text style={s.recentTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={s.clearAll}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term, i) => (
            <Pressable key={i} style={s.recentRow} onPress={() => handleRecentSelect(term)}>
              <Text style={s.recentIcon}>🕐</Text>
              <Text style={s.recentTerm}>{term}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* EMPTY STATE when query typed but no results */}
      {!loading && query.length > 0 && suggestions.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🔍</Text>
          <Text style={s.emptyTitle}>No results for "{query}"</Text>
          <Text style={s.emptySubtitle}>Try a different keyword or browse categories</Text>
        </View>
      )}
      <BottomNav active="/search" />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 8,
  },
  backBtn: { padding: 6 },
  backArrow: { fontSize: 22, color: Colors.forest, fontFamily: Fonts.bold },

  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mint,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.forest,
    paddingVertical: 0,
  },
  clearBtn: { fontSize: 14, color: Colors.textDim, paddingHorizontal: 4 },

  loaderRow: { paddingTop: 30, alignItems: 'center' },

  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 68 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.mint },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 20 },
  rowText: { flex: 1 },
  rowName: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.forest },
  rowMeta: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.textDim },

  recentWrap: { paddingTop: 16, paddingHorizontal: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recentTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest },
  clearAll: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.emerald },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  recentIcon: { fontSize: 16 },
  recentTerm: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.forest },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.forest, marginBottom: 6 },
  emptySubtitle: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, textAlign: 'center', paddingHorizontal: 32 },
})
