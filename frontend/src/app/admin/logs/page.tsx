'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'

import DynamicTable from '@/components/table/table'
import Pagination from '@/components/Paginationcom'
import AppModal from '@/components/modal/AppModal'

export default function LogsPage() {
  const [rows, setRows] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [page, setPage] =
    useState(1)

  const [pages, setPages] =
    useState(1)

  const [search, setSearch] =
    useState('')

  const [module, setModule] =
    useState('')

  const [selected, setSelected] =
    useState<any>(null)

  const limit = 20

  const load = async () => {
    try {
      setLoading(true)

      const res =
        await axios.get(
          `/admin/logs?page=${page}&limit=${limit}&search=${search}&module=${module}`
        )

      setRows(
        res?.data?.data || []
      )

      setPages(
        res?.data?.pagination?.pages || 1
      )

    } catch {
      toast.error(
        'Failed to load logs'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      load()
    }, 300)

    return () => clearTimeout(t)

  }, [page, search, module])

  const tableRows = rows.map(
    (item:any) => ({
      id: item.id,

      time: new Date(
        item.created_at
      ).toLocaleString(),

      module: item.module,

      action: item.action,

      details: (
        <button
          onClick={() =>
            setSelected(item)
          }
          className="text-indigo-600 font-medium hover:underline"
        >
          View
        </button>
      ),
    })
  )

  const columns = [
    {
      key: 'time',
      label: 'Time',
    },
    {
      key: 'module',
      label: 'Module',
    },
    {
      key: 'action',
      label: 'Action',
    },
    {
      key: 'details',
      label: 'Details',
    },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Admin Logs
        </h1>

        <p className="text-sm text-gray-500">
          Monitor important admin actions
        </p>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4">

        <div className="relative">

          <Search
            size={16}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              )
              setPage(1)
            }}
            placeholder="Search logs..."
            className="w-full border rounded-xl pl-9 pr-3 py-2 bg-white"
          />

        </div>

        <select
          value={module}
          onChange={(e) => {
            setModule(
              e.target.value
            )
            setPage(1)
          }}
          className="border rounded-xl px-3 py-2 bg-white"
        >
          <option value="">
            All Modules
          </option>

          <option value="PRODUCTS">
            PRODUCTS
          </option>

          <option value="STOCK">
            STOCK
          </option>

          <option value="PRICE">
            PRICE
          </option>

          <option value="ORDERS">
            ORDERS
          </option>

        </select>

      </div>

      {/* Table */}
      <DynamicTable
        columns={columns}
        rows={
          loading
            ? []
            : tableRows
        }
        emptyMessage={
          loading
            ? 'Loading logs...'
            : 'No logs found'
        }
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pages}
        onPageChange={setPage}
      />

      {/* Modal */}
      <AppModal
        open={!!selected}
        onClose={() =>
          setSelected(null)
        }
        title="Log Details"
        description="Complete event information"
        width="max-w-2xl"
      >

        <pre className="text-xs whitespace-pre-wrap text-gray-700">
{JSON.stringify(
  selected,
  null,
  2
)}
        </pre>

      </AppModal>

    </div>
  )
}