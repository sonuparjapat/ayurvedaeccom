import { useEffect } from 'react'
import { router } from 'expo-router'
import { useStore } from '../store'
import { appEvents } from '../utils/appEvents'
import { toast } from '../components/ui/Toast'

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

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
          toast.show(
            `📦 Order #${data.order_id} is now ${data.status_label}`,
            'success',
            { duration: 6000, onPress: () => router.push(`/order/${data.order_id}` as any) }
          )
        })

        socket.on('admin_replied', (data: { ticket_id: number; subject: string }) => {
          appEvents.emit('admin_replied', data)
          toast.show(
            `💬 Support reply: "${data.subject}"`,
            'info',
            { duration: 6000, onPress: () => router.push(`/support?ticket=${data.ticket_id}` as any) }
          )
        })

        socket.on('ticket_status_updated', (data: { ticket_id: number; status: string }) => {
          appEvents.emit('ticket_status_updated', data)
          toast.show(
            `🎫 Ticket #${data.ticket_id} is now ${data.status.replace(/_/g, ' ')}`,
            'info',
            { duration: 5000 }
          )
        })

        socket.on('refund_processed', (data: { order_id: number; amount: number }) => {
          appEvents.emit('refund_processed', data)
          toast.show(
            `💰 Refund of ₹${Number(data.amount).toFixed(2)} processed for Order #${data.order_id}`,
            'success',
            { duration: 7000 }
          )
        })

        socket.on('refund_failed', (data: { order_id: number }) => {
          appEvents.emit('refund_failed', data)
          toast.show(
            `⚠️ Refund issue for Order #${data.order_id} — our team will contact you.`,
            'error',
            { duration: 8000 }
          )
        })

        socket.on('new_notification', (data: { title: string; body: string }) => {
          appEvents.emit('new_notification', data)
          toast.show(data.title || '🔔 Notification', 'info', { duration: 5000 })
        })

        socket.on('new_broadcast', (data: { title: string; body: string }) => {
          appEvents.emit('new_broadcast', data)
          toast.show(data.title || '📢 Announcement', 'info', { duration: 5000 })
        })

        socket.on('product_stock_update', (data: { product_id: number; stock: number }) => {
          appEvents.emit('product_stock_update', data)
        })

        socket.on('tracking_updated', (data: { order_id: number; courier_name: string; tracking_number: string }) => {
          appEvents.emit('tracking_updated', data)
          toast.show(
            `🚚 Order #${data.order_id} dispatched via ${data.courier_name}`,
            'success',
            { duration: 7000, onPress: () => router.push(`/order/${data.order_id}` as any) }
          )
        })
      } catch { }
    }

    connect()
    return () => { socket?.disconnect() }
  }, [user?.id])
}
