'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

export function useOrderSocket(userId: number | string | undefined) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.emit('join_user', userId)

    socket.on('order_status_updated', (data: { order_id: number; status: number; status_label: string }) => {
      toast.success(`Order #${data.order_id} updated: ${data.status_label}`, {
        duration: 6000,
        icon: '📦',
      })
    })

    socket.on('ticket_status_updated', (data: { ticket_id: number; status: string }) => {
      toast.success(`Support ticket #${data.ticket_id} is now ${data.status.replace('_', ' ')}`, {
        duration: 5000,
        icon: '🎫',
      })
    })

    socket.on('admin_replied', (data: { ticket_id: number; subject: string }) => {
      toast.success(`Support replied on: "${data.subject}"`, {
        duration: 6000,
        icon: '💬',
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [userId])

  return socketRef
}
