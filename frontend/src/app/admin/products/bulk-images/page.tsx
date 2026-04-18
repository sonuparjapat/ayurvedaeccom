'use client'

import { useState } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import {
  ImageIcon,
  Upload,
  FileArchive,
  FileSpreadsheet,
  CheckCircle2,
  Loader2
} from 'lucide-react'

export default function BulkImagesPage() {

  const [csvFile, setCsvFile] =
    useState<File | null>(null)

  const [zipFile, setZipFile] =
    useState<File | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [job, setJob] =
    useState<any>(null)

  const submit = async () => {
    try {

      if (!csvFile) {
        return toast.error(
          'Please upload CSV file'
        )
      }

      const form =
        new FormData()

      form.append(
        'file',
        csvFile
      )

      if (zipFile) {
        form.append(
          'zip',
          zipFile
        )
      }

      setLoading(true)

      const res =
        await axios.post(
          '/admin/products/bulk-images',
          form
        )

      setJob(
        res?.data?.data || null
      )

      toast.success(
        res?.data?.message ||
        'Queued successfully'
      )

    } catch (err:any) {

      toast.error(
        err?.response?.data?.message ||
        'Upload failed'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border rounded-2xl p-6">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <ImageIcon size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Bulk Images Upload
            </h1>

            <p className="text-sm text-gray-500">
              Queue based product image import system
            </p>
          </div>

        </div>

      </div>

      {/* Upload Cards */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* CSV */}
        <label className="bg-white border rounded-2xl p-6 cursor-pointer hover:border-black transition block">

          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet size={20} />
            <h2 className="font-semibold">
              Upload CSV
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Required file with SKU, mode and image_urls
          </p>

          <div className="text-sm font-medium">
            {csvFile
              ? csvFile.name
              : 'Choose CSV file'}
          </div>

          <input
            hidden
            type="file"
            accept=".csv"
            onChange={(e) =>
              setCsvFile(
                e.target.files?.[0] || null
              )
            }
          />

        </label>

        {/* ZIP */}
        <label className="bg-white border rounded-2xl p-6 cursor-pointer hover:border-black transition block">

          <div className="flex items-center gap-3 mb-3">
            <FileArchive size={20} />
            <h2 className="font-semibold">
              Upload ZIP
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Optional local images named by SKU
          </p>

          <div className="text-sm font-medium">
            {zipFile
              ? zipFile.name
              : 'Choose ZIP file'}
          </div>

          <input
            hidden
            type="file"
            accept=".zip"
            onChange={(e) =>
              setZipFile(
                e.target.files?.[0] || null
              )
            }
          />

        </label>

      </div>

      {/* Example */}
      <div className="bg-white border rounded-2xl p-6 space-y-4">

        <h2 className="font-semibold">
          CSV Format Example
        </h2>

        <pre className="text-sm bg-gray-50 rounded-xl p-4 overflow-x-auto">
{`sku,mode,image_urls
NK101,append,https://site.com/a.jpg
APL001,replace,https://site.com/1.jpg|https://site.com/2.jpg`}
        </pre>

        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">

          <div>
            <strong>append:</strong> keep old images and add new
          </div>

          <div>
            <strong>replace:</strong> remove old and use new
          </div>

          <div>
            ZIP names example:
            <br />
            NK101-1.jpg
          </div>

          <div>
            ZIP gets priority if both ZIP and links exist
          </div>

        </div>

      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full md:w-auto px-6 py-3 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />
            Queueing...
          </>
        ) : (
          <>
            <Upload size={18} />
            Start Bulk Upload
          </>
        )}
      </button>

      {/* Success Card */}
      {job && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">

          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 size={22} />
            <h2 className="font-semibold">
              Job Queued Successfully
            </h2>
          </div>

          <div className="text-sm text-gray-700">
            Job ID:
            <span className="font-semibold ml-2">
              #{job.jobId}
            </span>
          </div>

          <div className="text-sm text-gray-700">
            Status:
            <span className="font-semibold ml-2 capitalize">
              {job.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/jobs"
              className="px-5 py-2 rounded-xl bg-black text-white text-sm font-semibold"
            >
              Track Jobs
            </Link>

            <button
              onClick={() => setJob(null)}
              className="px-5 py-2 rounded-xl border text-sm font-semibold"
            >
              Upload Another
            </button>

          </div>

        </div>
      )}

    </div>
  )
}