'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { ImageIcon } from 'lucide-react'

import {
  BulkPageHeader,
  BulkExampleCard,
  BulkSubmitButton,
  BulkSummaryStats,
} from '@/components/admin/BulkUi'

export default function BulkImagesPage() {
  const [csvFile, setCsvFile] =
    useState<File|null>(null)

  const [zipFile, setZipFile] =
    useState<File|null>(null)

  const [loading, setLoading] =
    useState(false)

  const [report, setReport] =
    useState<any>(null)

  const submit = async () => {
    if (!csvFile) {
      return toast.error(
        'CSV file required'
      )
    }

    try {
      setLoading(true)

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

      const res =
        await axios.post(
          '/admin/products/bulk-images',
          form
        )

      setReport(
        res.data
      )

      toast.success(
        res?.data?.message ||
        'Images updated'
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

      <BulkPageHeader
        title="Bulk Images Update"
        subtitle="Update product images using CSV links or ZIP files"
        icon={<ImageIcon size={24} />}
      />

      <BulkExampleCard
        title="CSV Example"
        lines={`sku,mode,image_urls
APL001,replace,https://site.com/1.jpg|https://site.com/2.jpg
NK101,append,`}
      />

      <div className="grid md:grid-cols-2 gap-4">

        <label className="block">
          <div className="border-2 border-dashed rounded-2xl p-8 bg-white text-center cursor-pointer">
            {csvFile
              ? csvFile.name
              : 'Upload CSV'}
          </div>

          <input
            hidden
            type="file"
            accept=".csv"
            onChange={(e)=>
              e.target.files?.[0] &&
              setCsvFile(
                e.target.files[0]
              )
            }
          />
        </label>

        <label className="block">
          <div className="border-2 border-dashed rounded-2xl p-8 bg-white text-center cursor-pointer">
            {zipFile
              ? zipFile.name
              : 'Upload ZIP (optional)'}
          </div>

          <input
            hidden
            type="file"
            accept=".zip"
            onChange={(e)=>
              e.target.files?.[0] &&
              setZipFile(
                e.target.files[0]
              )
            }
          />
        </label>

      </div>

      <BulkSubmitButton
        loading={loading}
        text="Update Images"
        onClick={submit}
      />

      <BulkSummaryStats
        report={report}
      />

    </div>
  )
}