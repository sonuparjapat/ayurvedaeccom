import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkConnection = async () => {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 3000)
      const res = await fetch('https://1.1.1.1', { method: 'HEAD', signal: ctrl.signal })
      clearTimeout(t)
      setIsOnline(res.ok || res.type === 'opaque')
    } catch {
      setIsOnline(false)
    }
  }

  useEffect(() => {
    checkConnection()
    intervalRef.current = setInterval(checkConnection, 10000)

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkConnection()
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      sub.remove()
    }
  }, [])

  return isOnline
}
