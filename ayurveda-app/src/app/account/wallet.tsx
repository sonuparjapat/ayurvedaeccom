import React, { useEffect, useState } from 'react'
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts, Shadows } from '../../constants/theme'

const TX_COLORS: Record<string, { bg: string; color: string; sign: string }> = {
  credit:   { bg: '#d1fae5', color: '#065f46', sign: '+' },
  debit:    { bg: '#fee2e2', color: '#991b1b', sign: '-' },
  refund:   { bg: '#ede9fe', color: '#5b21b6', sign: '+' },
  cashback: { bg: '#dbeafe', color: '#1e40af', sign: '+' },
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'wallet' | 'loyalty'>('wallet')

  useEffect(() => {
    api.get('/wallet')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const balance = Number(data?.wallet_balance ?? 0)
  const points  = Number(data?.loyalty_points ?? 0)
  const transactions  = data?.transactions  ?? []
  const loyaltyHistory = data?.loyalty_history ?? []

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Back header */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Wallet</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Balance Card */}
        <LinearGradient colors={['#065f46', '#10b981']} style={s.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={s.cardLabel}>Available Balance</Text>
          {loading
            ? <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
            : <Text style={s.balanceText}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          }
          <View style={s.pointsBadge}>
            <Text style={s.pointsText}>⭐ {points.toLocaleString()} Loyalty Points</Text>
          </View>
        </LinearGradient>

        {/* Info */}
        <View style={s.infoBanner}>
          <Text style={s.infoText}>💡 Use wallet balance at checkout to save on your orders</Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {(['wallet', 'loyalty'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'wallet' ? '💳 Transactions' : '⭐ Loyalty'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 16 }}>
          {loading ? (
            <ActivityIndicator color={Colors.forest} style={{ marginTop: 40 }} />
          ) : tab === 'wallet' ? (
            transactions.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>💳</Text>
                <Text style={s.emptyTitle}>No transactions yet</Text>
                <Text style={s.emptySub}>Your wallet history will appear here</Text>
              </View>
            ) : transactions.map((tx: any, i: number) => {
              const style = TX_COLORS[tx.type] ?? TX_COLORS['credit']
              const isCredit = ['credit', 'refund', 'cashback'].includes(tx.type)
              return (
                <Animated.View key={tx.id || i} entering={FadeInDown.delay(i * 50)} style={s.txCard}>
                  <View style={[s.txDot, { backgroundColor: style.bg }]}>
                    <Text style={{ fontSize: 14 }}>{isCredit ? '⬇' : '⬆'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc} numberOfLines={1}>{tx.description || (isCredit ? 'Credited' : 'Debited')}</Text>
                    <Text style={s.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[s.txAmount, { color: style.color }]}>
                    {style.sign}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </Animated.View>
              )
            })
          ) : (
            loyaltyHistory.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>⭐</Text>
                <Text style={s.emptyTitle}>No loyalty points yet</Text>
                <Text style={s.emptySub}>Earn points on every purchase</Text>
              </View>
            ) : loyaltyHistory.map((lp: any, i: number) => (
              <Animated.View key={lp.id || i} entering={FadeInDown.delay(i * 50)} style={s.txCard}>
                <View style={[s.txDot, { backgroundColor: '#fef3c7' }]}>
                  <Text style={{ fontSize: 14 }}>⭐</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txDesc} numberOfLines={1}>{lp.description || 'Points earned'}</Text>
                  <Text style={s.txDate}>
                    {new Date(lp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={[s.txAmount, { color: lp.type === 'earn' ? '#92400e' : '#991b1b' }]}>
                  {lp.type === 'earn' ? '+' : '-'}{lp.points} pts
                </Text>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  backArrow: { fontSize: 24, color: Colors.forest, lineHeight: 28 },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest },
  card: { marginHorizontal: 16, borderRadius: 20, padding: 24, marginBottom: 16, ...Shadows.sm },
  cardLabel: { fontFamily: Fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balanceText: { fontFamily: Fonts.bold, fontSize: 36, color: '#fff', marginBottom: 16 },
  pointsBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  pointsText: { fontFamily: Fonts.medium, fontSize: 13, color: '#fff' },
  infoBanner: { marginHorizontal: 16, backgroundColor: '#d1fae5', borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText: { fontFamily: Fonts.regular, fontSize: 13, color: '#065f46' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', ...Shadows.sm },
  tabText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.darkDim },
  tabTextActive: { color: Colors.forest },
  txCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, ...Shadows.sm },
  txDot: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.dark, marginBottom: 2 },
  txDate: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.darkDim },
  txAmount: { fontFamily: Fonts.bold, fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.dark, marginBottom: 4 },
  emptySub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.darkDim },
})
