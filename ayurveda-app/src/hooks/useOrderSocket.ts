import { useEffect } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { useStore } from '../store'

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://your-api.com/api').replace(/\/api\/?$/, '')

export function useOrderSocket() {
  const user = useStore(s => s.user)

  useEffect(() => {
    if (!user?.id) return

    let socket: any = null

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client')
        socket = io(API_BASE, {
          transports: ['websocket'],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        })

        socket.on('connect', () => {
          socket.emit('join_user', user.id)
        })

        socket.on('order_status_updated', (data: { order_id: number; status: number; status_label: string }) => {
          // Update store so account orders tab reflects new status immediately
          const store = useStore.getState()
          if ((store as any).updateOrderStatus) {
            (store as any).updateOrderStatus(data.order_id, data.status)
          }
          Alert.alert(
            '📦 Order Update',
            `Order #${data.order_id} is now ${data.status_label}`,
            [
              { text: 'View Order', onPress: () => router.push(`/order/${data.order_id}` as any) },
              { text: 'OK', style: 'cancel' },
            ]
          )
        })

        socket.on('admin_replied', (data: { ticket_id: number; subject: string }) => {
          Alert.alert(
            '💬 Support Reply',
            `Your ticket "${data.subject}" has a new reply`,
            [
              { text: 'Open Ticket', onPress: () => router.push('/support' as any) },
              { text: 'Later', style: 'cancel' },
            ]
          )
        })
      } catch {
        // socket.io-client not yet installed — run: npm install
      }
    }

    connect()
    return () => { socket?.disconnect() }
  }, [user?.id])
}
