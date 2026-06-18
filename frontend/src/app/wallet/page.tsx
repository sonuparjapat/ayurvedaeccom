'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Gift, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const TX_TYPE_STYLE: Record<string, { label: string; color: string; icon: any }> = {
  credit:  { label: 'Credited',  color: 'text-green-600', icon: <ArrowDownLeft size={14} className="text-green-600" /> },
  debit:   { label: 'Debited',   color: 'text-red-500',   icon: <ArrowUpRight  size={14} className="text-red-500"  /> },
  refund:  { label: 'Refund',    color: 'text-purple-600',icon: <ArrowDownLeft size={14} className="text-purple-600" /> },
  cashback:{ label: 'Cashback',  color: 'text-blue-600',  icon: <Gift          size={14} className="text-blue-600"  /> },
}

export default function WalletPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'wallet' | 'loyalty'>('wallet')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/wallet')
      setData(res.data)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 space-y-4 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
      </div>
    )
  }

  const balance = data?.wallet_balance ?? 0
  const points  = data?.loyalty_points ?? 0
  const transactions = data?.transactions ?? []
  const loyaltyHistory = data?.loyalty_history ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Balance Card */}
        <div className="bg-linear-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={22} />
              <span className="font-semibold text-lg">My Wallet</span>
            </div>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={load}>
              <RefreshCw size={14} />
            </Button>
          </div>
          <p className="text-white/70 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold tracking-tight">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 w-fit">
            <Gift size={15} />
            <span className="text-sm font-medium">{points.toLocaleString()} Loyalty Points</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          💡 Wallet balance can be used at checkout. Earn points on every purchase!
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {(['wallet', 'loyalty'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t === 'wallet' ? '💳 Transactions' : '⭐ Loyalty Points'}
            </button>
          ))}
        </div>

        {/* Wallet Transactions */}
        {tab === 'wallet' && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-gray-400 text-sm mt-1">Your wallet history will appear here</p>
                <Link href="/products">
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Start Shopping</Button>
                </Link>
              </div>
            ) : transactions.map((tx: any, i: number) => {
              const style = TX_TYPE_STYLE[tx.type] ?? TX_TYPE_STYLE['credit']
              const isCredit = tx.type === 'credit' || tx.type === 'refund' || tx.type === 'cashback'
              return (
                <div key={tx.id || i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-xs">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{tx.description || style.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`font-bold text-base ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Loyalty Points */}
        {tab === 'loyalty' && (
          <div className="space-y-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
              <TrendingUp size={16} />
              <span>You have <strong>{points.toLocaleString()} points</strong> — redeemable at checkout</span>
            </div>
            {loyaltyHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Gift size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No loyalty points yet</p>
                <p className="text-gray-400 text-sm mt-1">Earn points by shopping with us</p>
              </div>
            ) : loyaltyHistory.map((lp: any, i: number) => (
              <div key={lp.id || i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Gift size={14} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{lp.description || 'Points earned'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(lp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className={`font-bold text-base ${lp.type === 'earn' ? 'text-amber-600' : 'text-red-500'}`}>
                  {lp.type === 'earn' ? '+' : '-'}{lp.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
