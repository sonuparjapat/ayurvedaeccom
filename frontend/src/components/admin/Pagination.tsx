"use client"

import { Pagination as PageType } from "@/app/types/user"
import { useRouter, useSearchParams } from "next/navigation"

interface Props {
  pagination: PageType
}

export default function Pagination({ pagination }: Props) {

  const router = useRouter()
  const params = useSearchParams()

  function go(page: number) {

    const q = new URLSearchParams(params.toString())

    q.set("page", page.toString())

    router.push(`?${q.toString()}`)
  }

  return (
    <div className="flex justify-center gap-2 flex-wrap">

      {Array.from(
        { length: pagination?.totalPages },
        (_, i) => i + 1
      ).map(page => (

        <button
          key={page}
          onClick={() => go(page)}
          className={`px-3 py-1 rounded border
          ${pagination?.page === page
            ? "bg-indigo-600 text-white"
            : "bg-white"
          }`}
        >
          {page}
        </button>

      ))}

    </div>
  )
}