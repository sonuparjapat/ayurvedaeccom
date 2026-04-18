'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { IndianRupee } from 'lucide-react'

import {
  BulkPageHeader,
  BulkExampleCard,
  BulkUploadBox,
  BulkSubmitButton,
  BulkSummaryStats,
} from '@/components/admin/BulkUi'

export default function BulkPricePage() {
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
          '/admin/products/bulk-price',
          form
        )

      setReport(
        res.data
      )

      toast.success(
        res?.data?.message ||
        'Prices updated'
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
        title="Bulk Price Update"
        subtitle="Update price and compare price using CSV"
        icon={<IndianRupee size={24} />}
      />

      <BulkExampleCard
        title="CSV Example"
        lines={`sku,price,compareprice
APL001,74999,89999
NK101,2499,3999
PUMA55,1999,2999`}
      />

      <BulkUploadBox
        file={file}
        setFile={setFile}
      />

      <BulkSubmitButton
        loading={loading}
        text="Update Prices"
        onClick={submit}
      />

      <BulkSummaryStats
        report={report}
      />

    </div>
  )
}