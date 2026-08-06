import { useEffect } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { useStore } from '../store'
import { appEvents } from '../utils/appEvents'

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
          appEvents.emit('order_status_updated', data)
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
          appEvents.emit('admin_replied', data)
          Alert.alert(
            '💬 Support Reply',
            `Your ticket "${data.subject}" has a new reply`,
            [
              { text: 'Open Ticket', onPress: () => router.push('/support' as any) },
              { text: 'Later', style: 'cancel' },
            ]
          )
        })

        socket.on('ticket_status_updated', (data: { ticket_id: number; status: string }) => {
          appEvents.emit('ticket_status_updated', data)
          Alert.alert(
            '🎫 Ticket Updated',
            `Your support ticket #${data.ticket_id} is now ${data.status.replace(/_/g, ' ')}`,
            [
              { text: 'View', onPress: () => router.push('/support' as any) },
              { text: 'OK', style: 'cancel' },
            ]
          )
        })

        socket.on('refund_processed', (data: { order_id: number; amount: number }) => {
          appEvents.emit('refund_processed', data)
          Alert.alert(
            '💰 Refund Processed',
            `₹${Number(data.amount).toFixed(2)} has been refunded for Order #${data.order_id}. It will reflect in your original payment method shortly.`,
            [{ text: 'OK' }]
          )
        })

        socket.on('refund_failed', (data: { order_id: number }) => {
          appEvents.emit('refund_failed', data)
          Alert.alert(
            '⚠️ Refund Issue',
            `There was an issue processing your refund for Order #${data.order_id}. Our team will contact you shortly.`,
            [{ text: 'OK' }]
          )
        })

        socket.on('new_notification', (data: { title: string; body: string }) => {
          appEvents.emit('new_notification', data)
          Alert.alert(
            data.title || '🔔 Notification',
            data.body || '',
            [{ text: 'OK' }]
          )
        })

        socket.on('new_broadcast', (data: { title: string; body: string }) => {
          appEvents.emit('new_broadcast', data)
          Alert.alert(
            data.title || '📢 Announcement',
            data.body || '',
            [{ text: 'OK' }]
          )
        })

        socket.on('product_stock_update', (data: { product_id: number; stock: number }) => {
          appEvents.emit('product_stock_update', data)
        })

        socket.on('tracking_updated', (data: { order_id: number; courier_name: string; tracking_number: string }) => {
          appEvents.emit('tracking_updated', data)
          Alert.alert(
            '🚚 Shipment Dispatched',
            `Order #${data.order_id} is on the way!\nCourier: ${data.courier_name}\nTracking: ${data.tracking_number}`,
            [
              { text: 'Track Order', onPress: () => router.push(`/order/${data.order_id}` as any) },
              { text: 'OK', style: 'cancel' },
            ]
          )
        })
      } catch { }
    }

    connect()
    return () => { socket?.disconnect() }
  }, [user?.id])
}
