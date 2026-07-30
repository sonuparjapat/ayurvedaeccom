'use client'

import { useAuth } from '@/context/auth-context'

interface Props {
  perm: string
  superAdminOnly?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function PermissionGate({ perm, superAdminOnly, children, fallback = null }: Props) {
  const { hasPermission, loginuserdata } = useAuth()

  if (superAdminOnly && Number(loginuserdata?.role) !== 1) return <>{fallback}</>
  if (!hasPermission(perm)) return <>{fallback}</>

  return <>{children}</>
}
