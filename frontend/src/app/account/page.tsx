'use client'

import { Suspense } from "react"
import AccountContent from "./AccountContent"

function AccountSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading your account…</p>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent />
    </Suspense>
  )
}