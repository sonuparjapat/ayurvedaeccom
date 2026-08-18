import AsyncStorage from '@react-native-async-storage/async-storage'

const REVIEW_REQUESTED_KEY = 'store_review_requested'
const DELIVERED_COUNT_KEY = 'delivered_orders_seen'
const TRIGGER_AT = 2

export async function maybeRequestStoreReview() {
  try {
    const alreadyAsked = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY)
    if (alreadyAsked) return

    let StoreReview: any = null
    try { StoreReview = require('expo-store-review') } catch { return }

    const isAvailable = await StoreReview.isAvailableAsync()
    if (!isAvailable) return

    const raw = await AsyncStorage.getItem(DELIVERED_COUNT_KEY)
    const count = raw ? parseInt(raw, 10) : 0
    const next = count + 1
    await AsyncStorage.setItem(DELIVERED_COUNT_KEY, String(next))

    if (next >= TRIGGER_AT) {
      await StoreReview.requestReview()
      await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, '1')
    }
  } catch { }
}
