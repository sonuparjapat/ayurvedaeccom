import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import api from '../api/axios'
import { useStore } from '../store'
import { getGuestSession } from '../utils/guestSession'
import { registerPushToken, savePushTokenToServer } from '../utils/pushNotifications'

const CACHE_KEYS = {
  categories: 'cache_categories',
  companyData: 'cache_company',
  categoriesTs: 'cache_categories_ts',
  companyTs: 'cache_company_ts',
}
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

async function readCache<T>(key: string, tsKey: string): Promise<T | null> {
  try {
    const [raw, ts] = await AsyncStorage.multiGet([key, tsKey])
    const data = raw[1]; const time = ts[1]
    if (!data || !time) return null
    if (Date.now() - Number(time) > CACHE_TTL) return null
    return JSON.parse(data)
  } catch { return null }
}

async function writeCache(key: string, tsKey: string, data: any) {
  try {
    await AsyncStorage.multiSet([[key, JSON.stringify(data)], [tsKey, String(Date.now())]])
  } catch { }
}

export function useBootstrap() {
  const { setUser, setCategories, setCompanyData, setBootstrapped } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => { run() }, [])

  const run = async () => {
    // 1. Restore cached data instantly so the UI renders without waiting
    const [cachedCats, cachedCompany] = await Promise.all([
      readCache<any[]>(CACHE_KEYS.categories, CACHE_KEYS.categoriesTs),
      readCache<any[]>(CACHE_KEYS.companyData, CACHE_KEYS.companyTs),
    ])
    if (cachedCats) setCategories(cachedCats)
    if (cachedCompany) setCompanyData(cachedCompany)

    // 2. Restore stored user from AsyncStorage so UI can render auth-aware
    try {
      const storedUser = await AsyncStorage.getItem('stored_user')
      if (storedUser) setUser(JSON.parse(storedUser))
    } catch { }

    // Mark bootstrapped immediately with cached data — screens render NOW
    setBootstrapped(true)
    setLoading(false)

    // Check first launch — show onboarding if never seen
    try {
      const seen = await AsyncStorage.getItem('has_seen_onboarding')
      if (!seen) { router.replace('/onboarding'); return }
    } catch { }

    // 3. Background: validate session, refresh APIs, update state silently
    try {
      await getGuestSession()

      const [userRes, catRes, companyRes] = await Promise.allSettled([
        api.get('/users/me'),
        api.get('/shop/categories'),
        api.get('/company'),
      ])

      if (userRes.status === 'fulfilled') {
        const u = userRes.value.data?.user || null
        setUser(u)
        if (u) {
          await AsyncStorage.setItem('stored_user', JSON.stringify(u))
          await Promise.allSettled([fetchCart(), fetchWishlist(), fetchUnreadNotifs()])
          // Register push token for authenticated users
          try {
            const token = await registerPushToken()
            if (token) await savePushTokenToServer(token)
          } catch { }
        } else {
          await AsyncStorage.removeItem('stored_user')
          await fetchCartGuest()
        }
      } else {
        // Token invalid or network error — clear stored user
        await AsyncStorage.removeItem('stored_user')
        setUser(null)
        await fetchCartGuest()
      }

      if (catRes.status === 'fulfilled') {
        const rows =
          catRes.value.data?.data?.rows ||
          catRes.value.data?.rows ||
          catRes.value.data?.data ||
          []
        const list = Array.isArray(rows) ? rows : []
        setCategories(list)
        writeCache(CACHE_KEYS.categories, CACHE_KEYS.categoriesTs, list)
      }

      if (companyRes.status === 'fulfilled') {
        const d = companyRes.value.data?.data || []
        setCompanyData(d)
        writeCache(CACHE_KEYS.companyData, CACHE_KEYS.companyTs, d)
      }
    } catch (e) {
      console.warn('[Bootstrap background refresh error]', e)
    }
  }

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart')
      const items = res.data?.items || []
      useStore.getState().setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
    } catch (e) {
      console.warn('[Bootstrap cart error]', e)
    }
  }

  const fetchCartGuest = async () => {
    try {
      const sessionId = await AsyncStorage.getItem('guest_session_id')
      if (!sessionId) return
      const res = await api.get(`/cart?sessionId=${sessionId}`)
      const items = res.data?.items || []
      useStore.getState().setCartData({ items, subtotal: res.data?.subtotal || 0, totalItems: items.length })
    } catch { }
  }

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/shop')
      const items = res.data?.data || res.data?.items || []
      useStore.getState().setWishlistData({ items, loading: false, totalItems: items.length })
    } catch { }
  }

  const fetchUnreadNotifs = async () => {
    try {
      const res = await api.get('/notifications?is_read=false&limit=1')
      const count = res.data?.pagination?.total || res.data?.total || 0
      useStore.getState().setUnreadNotificationCount(Number(count))
    } catch { }
  }

  return { loading }
}
