import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import api from '../api/axios'

const PROJECT_ID = 'dcbef284-0025-4bac-a63e-27fcc1e7c0f0'

const isExpoGo = Constants.appOwnership === 'expo'

// Call once on app boot (before login) so foreground alerts work immediately.
export async function setupNotificationHandler() {
  try {
    if (isExpoGo) return
    const Notifications = await import('expo-notifications')
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })
  } catch {}
}

export async function registerPushToken(): Promise<string | null> {
  try {
    if (isExpoGo) return null
    if (!Device.isDevice) return null

    const Notifications = await import('expo-notifications')

    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return null

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      })
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
    return token
  } catch {
    return null
  }
}

export async function savePushTokenToServer(token: string) {
  try {
    await api.post('/push/token', { token, device_type: Platform.OS })
  } catch (e) {
    console.warn('[Push] Token save failed', e)
  }
}

export async function deletePushToken() {
  try {
    await api.delete('/push/token')
  } catch {}
}
