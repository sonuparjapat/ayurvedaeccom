import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import api from '../api/axios'

const PROJECT_ID = 'dcbef284-0025-4bac-a63e-27fcc1e7c0f0'

export async function registerPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })

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
