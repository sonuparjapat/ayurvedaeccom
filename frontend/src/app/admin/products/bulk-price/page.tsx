'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { IndianRupee, Download } from 'lucide-react'
import {
  AdminInfoPanel,
  BulkPageHeader,
  BulkUploadBox,
  BulkSubmitButton,
  BulkJobStatus,
} from '@/components/admin/BulkUi'

const INFO = {
  title: 'How Bulk Price Update Works',
  subtitle: 'Update selling price and compare (MRP) price for many products at once via CSV',
  purpose:
    'Use this page to change the selling price and/or the compare-at price (MRP shown with strikethrough) for multiple products simultaneously. Upload a CSV with SKUs and new prices — the system updates each matching product in seconds.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must exactly match the SKU in the system.', example: 'APL001', required: true },
    { name: 'price', purpose: 'New selling price in INR (₹). This is what the customer pays.', example: '499', required: true },
    { name: 'compareprice', purpose: 'Original / MRP price shown with strikethrough on product page. Must be ≥ price.', example: '699', required: false },
  ],
  csvExample: `sku,price,compareprice\nAPL001,499,699\nNK101,299,399\nPUMA55,1299,1799\nHRB200,149,`,
  notes: [
    'SKU column is mandatory — rows with unknown SKUs will be skipped with an error.',
    'price must be a positive number. Decimal is allowed (e.g. 49.99).',
    'Leave compareprice blank to keep the existing MRP unchanged.',
    'compareprice must be ≥ price. If it is lower the row will fail validation.',
    'Download the failed CSV after upload to see which rows were rejected and why.',
  ],
}

export default function BulkPricePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)

  const submit = async () => {
    if (!file) return toast.error('Please select a CSV file first')
    try {
      setLoading(true)
      setJobId(null)
      const form = new FormData()
      form.append('file', file)
      const res = await axios.post('/admin/products/bulk-price', form)
      const id = res.data?.data?.jobId
      if (id) {
        setJobId(id)
        toast.success('CSV uploaded — tracking progress below…')
      } else {
        toast.error('Upload succeeded but no job ID returned')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed — check your file and try again')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `sku,price,compareprice\nAPL001,499,699\nNK101,299,399`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-price-template.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <BulkPageHeader
        title="Bulk Price Update"
        subtitle="Update selling price and MRP for multiple products via CSV"
        icon={<IndianRupee size={24} />}
      />

      <div style={{ margin: '20px 0' }}>
        <AdminInfoPanel {...INFO} />
      </div>

      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Upload CSV File</p>
          <button onClick={downloadTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 9, border: '1.5px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={14} />Download Template
          </button>
        </div>
        <BulkUploadBox
          file={file}
          setFile={setFile}
          hint="Required columns: sku, price — compareprice is optional"
        />
      </div>

      <BulkSubmitButton loading={loading} text="Update Prices" onClick={submit} />

      {jobId && <BulkJobStatus jobId={jobId} />}
    </div>
  )
}
