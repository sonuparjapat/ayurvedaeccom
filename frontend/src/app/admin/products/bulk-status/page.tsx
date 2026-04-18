'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  UploadCloud,
  Loader2
} from 'lucide-react'

export default function BulkStatusPage() {
  const [file, setFile] =
    useState<File|null>(null)

  const [loading, setLoading] =
    useState(false)

  const [report, setReport] =
    useState<any>(null)

  const submit = async () => {
    if (!file) {
      return toast.error(
        'Upload CSV file'
      )
    }

    try {
      setLoading(true)

      const form =
        new FormData()

      form.append('file', file)

      const res =
        await axios.post(
          '/admin/products/bulk-status',
          form
        )

      setReport(res.data)

      toast.success(
        res?.data?.message ||
        'Status updated'
      )

    } catch (err:any) {
      toast.error(
        err?.response?.data?.message ||
        'Update failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Bulk Status Update
        </h1>

        <p className="text-sm text-gray-500">
          Upload CSV with SKU and status
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-4 text-sm text-gray-600">
        Example CSV:
        <pre className="mt-2 text-xs">
sku,status
APL001,active
NK101,inactive
PUMA55,draft
        </pre>
      </div>

      <label className="block">

        <div className="border-2 border-dashed rounded-2xl p-10 text-center bg-white cursor-pointer">
          {file
            ? file.name
            : 'Click to upload CSV'}
        </div>

        <input
          hidden
          type="file"
          accept=".csv"
          onChange={(e)=>
            e.target.files?.[0] &&
            setFile(
              e.target.files[0]
            )
          }
        />

      </label>

      <button
        onClick={submit}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2"
      >
        {loading && (
          <Loader2
            size={18}
            className="animate-spin"
          />
        )}

        <UploadCloud size={18} />
        Update Status
      </button>

      {report && (

      <div className="bg-white border rounded-2xl p-5 space-y-2">

        <div>
          Updated:
          {' '}
          {report?.summary?.updated || 0}
        </div>

        <div>
          Failed:
          {' '}
          {report?.summary?.failed || 0}
        </div>

        <div>
          Total:
          {' '}
          {report?.summary?.total || 0}
        </div>

      </div>

      )}

    </div>
  )
}