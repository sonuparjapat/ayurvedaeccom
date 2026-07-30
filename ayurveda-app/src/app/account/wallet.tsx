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

const TIER_COLORS: Record<string, { color: string; bg: string; emoji: string }> = {
  bronze:   { color: '#cd7f32', bg: '#fdf6ee', emoji: '🥉' },
  silver:   { color: '#9e9e9e', bg: '#f5f5f5', emoji: '🥈' },
  gold:     { color: '#d4a017', bg: '#fffde7', emoji: '🥇' },
  platinum: { color: '#7c5cba', bg: '#f3f0ff', emoji: '💎' },
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'wallet' | 'loyalty'>('wallet')
  const [cfg, setCfg] = useState({ loyalty_earn_rate: 0.1, loyalty_redeem_rate: 0.1, loyalty_min_redeem_points: 50, loyalty_max_redeem_percent: 20 })
  const [tierData, setTierData] = useState<any>(null)

  useEffect(() => {
    api.get('/wallet').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/wallet/settings').then(r => { if (r.data?.settings) setCfg(r.data.settings) }).catch(() => {})
    api.get('/wallet/tier').then(r => { if (r.data) setTierData(r.data) }).catch(() => {})
  }, [])

  const ptsPerRupee = cfg.loyalty_earn_rate > 0 ? Math.round(1 / cfg.loyalty_earn_rate) : 10
  const rupeePerPt = cfg.loyalty_redeem_rate || 0.1
  const ptsFor1Rupee = rupeePerPt > 0 ? Math.round(1 / rupeePerPt) : 10

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

        {/* Loyalty Tier Card */}
        {tierData?.tier && (() => {
          const tier = tierData.tier
          const nextTier = tierData.next_tier
          const tc = TIER_COLORS[tier.name] || TIER_COLORS.bronze
          const spent = Number(tier.spent ?? tier.total_spent ?? 0)
          const tierMin = Number(tier.min ?? tier.min_spend ?? 0)
          const nextMin = Number(nextTier?.min ?? nextTier?.min_spend ?? 0)
          const remaining = Number(nextTier?.remaining ?? Math.max(0, nextMin - spent))
          const denominator = nextMin - tierMin
          const progress = nextTier
            ? denominator > 0 ? Math.min(1, (spent - tierMin) / denominator) : 0
            : 1
          return (
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: tc.bg, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: tc.color + '40' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 32 }}>{tc.emoji}</Text>
                  <View>
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Your Tier</Text>
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 20, color: tc.color }}>{tier.label || 'Bronze'}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: '#9ca3af' }}>Total spent</Text>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: '#374151' }}>₹{spent.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              {nextTier && (
                <>
                  <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 99, marginBottom: 6, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.round(progress * 100)}%` as any, backgroundColor: tc.color, borderRadius: 99 }} />
                  </View>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: '#6b7280' }}>
                    Spend ₹{remaining.toLocaleString('en-IN')} more to reach {nextTier.label}
                  </Text>
                </>
              )}
              {tier.benefits?.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {tier.benefits.map((b: string, i: number) => (
                    <View key={i} style={{ backgroundColor: tc.color + '20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: tc.color }}>✓ {b}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })()}

        {/* How it works */}
        <View style={s.howSection}>
          <Text style={s.howTitle}>How it works</Text>
          <View style={s.howRow}>
            {[
              { emoji: '🛍️', label: 'Shop & Earn', desc: `₹${ptsPerRupee} spent = 1 point` },
              { emoji: '💳', label: 'Redeem', desc: `${ptsFor1Rupee} pts = ₹1 off` },
              { emoji: '📦', label: 'Min Redeem', desc: `${cfg.loyalty_min_redeem_points} pts minimum` },
            ].map((item, i) => (
              <View key={i} style={s.howCard}>
                <Text style={s.howEmoji}>{item.emoji}</Text>
                <Text style={s.howCardTitle}>{item.label}</Text>
                <Text style={s.howCardDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
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
  howSection: { marginHorizontal: 16, marginBottom: 16 },
  howTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.forest, marginBottom: 10 },
  howRow: { flexDirection: 'row', gap: 8 },
  howCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', ...Shadows.sm },
  howEmoji: { fontSize: 22, marginBottom: 6 },
  howCardTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.forest, textAlign: 'center', marginBottom: 2 },
  howCardDesc: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.darkDim, textAlign: 'center' },
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
