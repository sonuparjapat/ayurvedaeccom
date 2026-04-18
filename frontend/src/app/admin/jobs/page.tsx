'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import Pagination from '@/components/Paginationcom'

export default function JobsPage() {
  const [rows, setRows] =
    useState<any[]>([])

  const [page, setPage] =
    useState(1)

  const [pages, setPages] =
    useState(1)

  const [loading, setLoading] =
    useState(false)

  const load = async () => {
    try {
      setLoading(true)

      const res =
        await axios.get(
          `/admin/jobs?page=${page}&limit=15`
        )

      setRows(
        res?.data?.data || []
      )

      setPages(
        res?.data?.pagination?.pages || 1
      )

    } catch {
      toast.error(
        'Failed to load jobs'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const t =
      setInterval(
        load,
        5000
      )

    return () =>
      clearInterval(t)

  }, [page])

  const badge = (status:string) => {
    if (status === 'completed')
      return 'bg-green-100 text-green-700'

    if (status === 'failed')
      return 'bg-red-100 text-red-700'

    if (status === 'processing')
      return 'bg-blue-100 text-blue-700'

    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Jobs Queue
          </h1>

          <p className="text-sm text-gray-500">
            Background processing center
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border bg-white text-sm font-medium"
        >
          Refresh
        </button>

      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">
                  ID
                </th>
                <th className="p-3 text-left">
                  Type
                </th>
                <th className="p-3 text-left">
                  Status
                </th>
                <th className="p-3 text-left">
                  Progress
                </th>
                <th className="p-3 text-left">
                  Result
                </th>
                <th className="p-3 text-left">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>

            {rows.map((item:any)=>{

              const result =
                item.result || {}

              return (
                <tr
                  key={item.id}
                  className="border-t"
                >
                  <td className="p-3 font-medium">
                    #{item.id}
                  </td>

                  <td className="p-3">
                    {item.job_type}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${badge(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="p-3 min-w-[180px]">

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black"
                        style={{
                          width:
                            `${item.progress || 0}%`
                        }}
                      />
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      {item.progress || 0}%
                    </div>

                  </td>

                  <td className="p-3 text-xs text-gray-600">

                    {item.status === 'completed' && (
                      <div>
                        Updated:
                        {' '}
                        {result.updated || 0}
                        <br />
                        Failed:
                        {' '}
                        {result.failed?.length || 0}
                      </div>
                    )}

                    {item.status === 'failed' && (
                      <div className="text-red-600">
                        {item.error_text || 'Failed'}
                      </div>
                    )}

                    {item.status === 'pending' &&
                      'Waiting...'}

                    {item.status === 'processing' &&
                      'Running...'}

                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </td>

                </tr>
              )
            })}

            {!loading &&
              rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-500"
                >
                  No jobs found
                </td>
              </tr>
            )}

            </tbody>

          </table>

        </div>

      </div>

      <Pagination
        currentPage={page}
        totalPages={pages}
        onPageChange={setPage}
      />

    </div>
  )
}