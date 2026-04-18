'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Power } from 'lucide-react'
import downloadFailedCsv from '@/app/utils/downloadFailedCsv'
import {
  BulkPageHeader,
  BulkExampleCard,
  BulkUploadBox,
  BulkSubmitButton,
  BulkSummaryStats,
} from '@/components/admin/BulkUi'

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

      form.append(
        'file',
        file
      )

      const res =
        await axios.post(
          '/admin/products/bulk-status',
          form
        )

      setReport(
        res.data
      )

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

      <BulkPageHeader
        title="Bulk Status Update"
        subtitle="Update product status using CSV"
        icon={<Power size={24} />}
      />

      <BulkExampleCard
        title="CSV Example"
        lines={`sku,status
APL001,active
NK101,inactive
PUMA55,draft`}
      />

      <BulkUploadBox
        file={file}
        setFile={setFile}
      />

      <BulkSubmitButton
        loading={loading}
        text="Update Status"
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
      'status_failed_rows.csv'
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