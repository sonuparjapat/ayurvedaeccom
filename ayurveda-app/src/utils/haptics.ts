import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

// expo-haptics is native-only — silently no-op on web
export function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) {
  if (Platform.OS === 'web') return
  Haptics.impactAsync(style)
}

export function notify(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  if (Platform.OS === 'web') return
  Haptics.notificationAsync(type)
}

export { Haptics }
