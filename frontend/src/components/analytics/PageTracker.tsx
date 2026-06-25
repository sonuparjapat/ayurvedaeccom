'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import axios from '@/lib/axios'

function getSessionId() {
  if (typeof window === 'undefined') return null
  let sid = sessionStorage.getItem('_vid')
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    sessionStorage.setItem('_vid', sid)
  }
  return sid
}

export default function PageTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    if (pathname.startsWith('/admin')) return
    lastPath.current = pathname

    const timer = setTimeout(() => {
      axios.post('/analytics/pageview', {
        path: pathname,
        referrer: document.referrer || null,
        session_id: getSessionId(),
      }).catch(() => {})
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
