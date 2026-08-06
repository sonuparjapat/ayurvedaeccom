'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

export default function JobsPage() {

  const [rows, setRows] =
    useState<any[]>([])
  const socketRef = useRef<Socket | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [query, setQuery] =
    useState('')

  const [status, setStatus] =
    useState('all')

  const load = async () => {
    try {

      setLoading(true)

      const res =
        await axios.get(
          '/admin/jobs?page=1&limit=100'
        )

      setRows(
        res?.data?.data || []
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

    // Socket: live updates instead of polling
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')
    const socket = io(apiBase, { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.emit('join_admin')

    socket.on('job_progress', (data: { id: number; job_type: string; status: string; progress?: number; result?: any; error?: string }) => {
      setRows(prev => {
        const exists = prev.some(r => r.id === data.id)
        if (exists) {
          return prev.map(r => r.id === data.id ? { ...r, ...data } : r)
        }
        // New job — prepend (will be filled properly on next load)
        return [data, ...prev]
      })
      if (data.status === 'completed') toast.success(`Job ${data.job_type} completed`, { icon: '✅' })
      if (data.status === 'failed') toast.error(`Job ${data.job_type} failed: ${data.error || ''}`)
    })

    return () => { socket.disconnect() }
  }, [])

  const filtered =
    useMemo(() => {

      return rows.filter(
        (x:any) => {

          const q =
            query
            .trim()
            .toLowerCase()

          const matchSearch =
            !q ||
            String(
              x.job_type
            )
            .toLowerCase()
            .includes(q) ||
            String(
              x.id
            ).includes(q)

          const matchStatus =
            status === 'all'
              ? true
              : x.status === status

          return (
            matchSearch &&
            matchStatus
          )
        }
      )

    }, [
      rows,
      query,
      status
    ])

  const stats = {
    total:
      rows.length,
    pending:
      rows.filter(
        x =>
          x.status === 'pending'
      ).length,
    processing:
      rows.filter(
        x =>
          x.status === 'processing'
      ).length,
    completed:
      rows.filter(
        x =>
          x.status === 'completed'
      ).length,
    failed:
      rows.filter(
        x =>
          x.status === 'failed'
      ).length,
  }

  const badge = (s:string) => {

    if (s === 'completed')
      return
        'bg-green-100 text-green-700'

    if (s === 'failed')
      return
        'bg-red-100 text-red-700'

    if (s === 'processing')
      return
        'bg-blue-100 text-blue-700'

    return
      'bg-yellow-100 text-yellow-700'
  }

  const downloadFailed =
    (
      item:any
    ) => {

    const data =
      item?.result?.failed || []

    const blob =
      new Blob(
        [
          JSON.stringify(
            data,
            null,
            2
          )
        ],
        {
          type:
            'application/json'
        }
      )

    const url =
      URL.createObjectURL(
        blob
      )

    const a =
      document.createElement(
        'a'
      )

    a.href = url
    a.download =
      `job-${item.id}-failed.json`

    a.click()

    URL.revokeObjectURL(
      url
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold">
            Jobs Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Queue processing control center
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border bg-white"
        >
          Refresh
        </button>

      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">

        {[
          ['Total', stats.total],
          ['Pending', stats.pending],
          ['Running', stats.processing],
          ['Done', stats.completed],
          ['Failed', stats.failed],
        ].map((x:any)=>(
          <div
            key={x[0]}
            className="bg-white border rounded-2xl p-4"
          >
            <div className="text-sm text-gray-500">
              {x[0]}
            </div>

            <div className="text-2xl font-bold mt-1">
              {x[1]}
            </div>
          </div>
        ))}

      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 grid md:grid-cols-3 gap-4">

        <input
          value={query}
          onChange={(e)=>
            setQuery(
              e.target.value
            )
          }
          placeholder="Search by ID or type"
          className="border rounded-xl px-4 py-2"
        />

        <select
          value={status}
          onChange={(e)=>
            setStatus(
              e.target.value
            )
          }
          className="border rounded-xl px-4 py-2"
        >
          <option value="all">
            All Status
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="processing">
            Processing
          </option>
          <option value="completed">
            Completed
          </option>
          <option value="failed">
            Failed
          </option>
        </select>

        <div className="text-sm text-gray-500 flex items-center">
          Showing {filtered.length} jobs
        </div>

      </div>

      {/* Table */}
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
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

            {filtered.map(
              (item:any) => {

              const result =
                item.result || {}

              return (
                <tr
                  key={item.id}
                  className="border-t align-top"
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

                  <td className="p-3 text-xs">

                    {item.status === 'completed' && (
                      <div>
                        Updated:
                        {' '}
                        {result.updated ||
                         result.imported ||
                         0}
                        <br />
                        Failed:
                        {' '}
                        {result.failed?.length ||
                         0}
                      </div>
                    )}

                    {item.status === 'failed' && (
                      <div className="text-red-600">
                        {item.error_text}
                      </div>
                    )}

                  </td>

                  <td className="p-3 space-y-2">

                    {item.result?.failed?.length > 0 && (
                      <button
                        onClick={()=>
                          downloadFailed(item)
                        }
                        className="px-3 py-1 rounded-lg border text-xs"
                      >
                        Failed File
                      </button>
                    )}

                    <div className="text-xs text-gray-400">
                      {new Date(
                        item.created_at
                      ).toLocaleString()}
                    </div>

                  </td>

                </tr>
              )
            })}

            {filtered.length === 0 &&
              !loading && (
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

    </div>
  )
}