"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChangeEvent } from "react"

export default function Filter() {

  const router = useRouter()
  const params = useSearchParams()

  function changeRole(e: ChangeEvent<HTMLSelectElement>) {

    const q = new URLSearchParams(params.toString())

    q.set("role", e.target.value)
    q.set("page", "1")

    router.push(`?${q.toString()}`)
  }

  return (
    <select
      onChange={changeRole}
      defaultValue={params.get("role") || ""}
      className="border px-4 py-2 rounded-md"
    >

      <option value="">All</option>
      <option value="1">Super Admin</option>
      <option value="2">Admin</option>
      <option value="3">User</option>

    </select>
  )
}