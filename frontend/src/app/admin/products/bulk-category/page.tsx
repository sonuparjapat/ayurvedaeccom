'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Download, FolderTree } from 'lucide-react'
import downloadFailedCsv from '@/app/utils/downloadFailedCsv'
import {
  BulkPageHeader,
  BulkExampleCard,
  BulkUploadBox,
  BulkSubmitButton,
  BulkSummaryStats,
} from '@/components/admin/BulkUi'

export default function BulkCategoryPage() {
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

      form.append(
        'file',
        file
      )

      const res =
        await axios.post(
          '/admin/products/bulk-category',
          form
        )

      setReport(
        res.data
      )

      toast.success(
        res?.data?.message ||
       'Category updated with tax sync'
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
 const downloadCategoryList = async () => {
    try {
      const res = await axios.get('/admin/products/category-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'categories-master.csv'
      a.click()
      toast.success('Categories downloaded')
    } catch {
      toast.error('Download failed')
    }
  }
  return (
    <div className="space-y-6">
  <button
          onClick={downloadCategoryList}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          <Download size={18} />
    Download Category Master (IDs + GST + HSN)
        </button>
      <BulkPageHeader
        title="Bulk Category Update"
      subtitle="Update product category using CSV (GST / HSN auto updates from selected category)"
        icon={<FolderTree size={24} />}
      />

      <BulkExampleCard
        title="CSV Example"
lines={`sku,category_id
APL001,5
NK101,12

Only category_id allowed.

Download Category List to get valid ids.

Changing category also updates GST%, HSN Code and CESS automatically.`}
      />

      <BulkUploadBox
        file={file}
        setFile={setFile}
      />

      <BulkSubmitButton
        loading={loading}
        text="Update Categories"
        onClick={submit}
      />

      <BulkSummaryStats
        report={report}
      />
{report?.failed?.length > 0 && (

<button
  onClick={() =>
    downloadFailedCsv(
      report.failed,
      'category_failed_rows.csv'
    )
  }
  className="px-5 py-3 rounded-xl bg-red-600 text-white font-semibold"
>
  Download Failed CSV
</button>

)}
    </div>
  )
}