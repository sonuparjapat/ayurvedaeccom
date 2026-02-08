"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useState } from "react"

export default function SearchBar() {

  const router = useRouter()
  const params = useSearchParams()

  const [search, setSearch] = useState(
    params.get("search") || ""
  )

  function handleSubmit(e: FormEvent) {

    e.preventDefault()

    const q = new URLSearchParams(params.toString())

    q.set("search", search)
    q.set("page", "1")

    router.push(`?${q.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full md:w-1/3"
    >

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search user..."
        className="w-full border px-4 py-2 rounded-l-md focus:ring-2 focus:ring-indigo-500"
      />

      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 rounded-r-md"
      >
        Search
      </button>

    </form>
  )
}