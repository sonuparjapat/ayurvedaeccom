'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import Pagination from '@/components/Paginationcom'

export default function ImportHistoryPage() {
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

  const [action, setAction] =
    useState('')

  const load = async () => {
    try {
      setLoading(true)

      const res =
        await axios.get(
          `/admin/logs?page=${page}&limit=20&search=${search}&module=PRODUCTS`
        )

      let data =
        res?.data?.data || []

      if (action) {
        data = data.filter(
          (x:any)=>
            x.action === action
        )
      }

      setRows(data)

      setPages(
        res?.data?.pagination
          ?.pages || 1
      )

    } catch {
      toast.error(
        'Failed to load history'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t =
      setTimeout(() => {
        load()
      }, 300)

    return () =>
      clearTimeout(t)

  }, [page, search, action])

  const total =
    rows.length

  const totalFailed =
    rows.reduce(
      (sum, r) =>
        sum +
        Number(
          r.details?.failed || 0
        ),
      0
    )

  const totalUpdated =
    rows.reduce(
      (sum, r) =>
        sum +
        Number(
          r.details?.updated || 0
        ),
      0
    )

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Import History
        </h1>

        <p className="text-sm text-gray-500">
          Search and track bulk actions
        </p>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4">

        <input
          value={search}
          onChange={(e)=>{
            setSearch(
              e.target.value
            )
            setPage(1)
          }}
          placeholder="Search..."
          className="border rounded-xl px-3 py-2 bg-white"
        />

        <select
          value={action}
          onChange={(e)=>{
            setAction(
              e.target.value
            )
            setPage(1)
          }}
          className="border rounded-xl px-3 py-2 bg-white"
        >
          <option value="">
            All Actions
          </option>

          <option value="BULK_IMPORT">
            BULK_IMPORT
          </option>

          <option value="BULK_STOCK_UPDATE">
            BULK_STOCK_UPDATE
          </option>

          <option value="BULK_PRICE_UPDATE">
            BULK_PRICE_UPDATE
          </option>

          <option value="BULK_STATUS_UPDATE">
            BULK_STATUS_UPDATE
          </option>

          <option value="BULK_CATEGORY_UPDATE">
            BULK_CATEGORY_UPDATE
          </option>

          <option value="BULK_IMAGES_UPDATE">
            BULK_IMAGES_UPDATE
          </option>

        </select>

      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Actions
          </p>
          <h2 className="text-3xl font-bold">
            {total}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Updated
          </p>
          <h2 className="text-3xl font-bold">
            {totalUpdated}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">
            Failed
          </p>
          <h2 className="text-3xl font-bold text-red-600">
            {totalFailed}
          </h2>
        </div>

      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">
                  Time
                </th>
                <th className="p-3 text-left">
                  Action
                </th>
                <th className="p-3 text-left">
                  Updated
                </th>
                <th className="p-3 text-left">
                  Failed
                </th>
              </tr>
            </thead>

            <tbody>

            {rows.map((item:any)=>(
              <tr
                key={item.id}
                className="border-t"
              >
                <td className="p-3">
                  {new Date(
                    item.created_at
                  ).toLocaleString()}
                </td>

                <td className="p-3">
                  {item.action}
                </td>

                <td className="p-3">
                  {item.details?.updated || 0}
                </td>

                <td className="p-3 text-red-600">
                  {item.details?.failed || 0}
                </td>
              </tr>
            ))}

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