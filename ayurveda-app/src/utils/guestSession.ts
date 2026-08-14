import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/axios'

export const getGuestSession = async (
  forceFresh = false
) => {
  let sessionId = null

  if (!forceFresh) {
    sessionId =
      await AsyncStorage.getItem(
        'guest_session_id'
      )
  }

  if (sessionId) {
    return sessionId
  }

  try {
    const res = await api.post(
      '/cart/guest-session'
    )

    sessionId = res.data?.sessionId

    if (sessionId) {
      await AsyncStorage.setItem(
        'guest_session_id',
        sessionId
      )
    }

    return sessionId

  } catch {
    return null
  }
}