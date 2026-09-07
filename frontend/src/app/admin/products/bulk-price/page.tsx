'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { IndianRupee, Download, Eye } from 'lucide-react'
import {
  AdminInfoPanel,
  BulkPageHeader,
  BulkUploadBox,
  BulkSubmitButton,
  BulkJobStatus,
} from '@/components/admin/BulkUi'
import BulkCsvPreview from '@/components/admin/BulkCsvPreview'

const INFO = {
  title: 'How Bulk Price Update Works',
  subtitle: 'Set exact prices or apply a percentage increase / decrease to many products at once',
  purpose:
    'Use this page to update selling price, MRP, and cost price for multiple products. Three modes: set (enter the exact new price), percent_increase (raise prices by X%), percent_decrease (lower prices by X%). Upload a CSV with SKUs, values, and an optional mode column.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must exactly match the SKU in the system.', example: 'APL001', required: true },
    { name: 'price', purpose: 'In "set" mode: the new selling price in ₹. In percent modes: the percentage to apply (1–100).', example: '499 or 10', required: true },
    { name: 'compareprice', purpose: 'Original / MRP price shown with strikethrough. In percent modes this is auto-calculated.', example: '699', required: false },
    { name: 'cost_price', purpose: 'Your purchase / cost price (not shown to customers). In percent modes this is auto-calculated.', example: '300', required: false },
    { name: 'mode', purpose: '"set" = enter exact prices. "percent_increase" = raise by %. "percent_decrease" = lower by %. Default: set.', example: 'percent_increase', required: false },
  ],
  csvExample: `sku,price,compareprice,cost_price,mode\nAPL001,499,699,300,set\nNK101,10,,,percent_increase\nPUMA55,15,,,percent_decrease\nHRB200,149,199,,set`,
  notes: [
    'In "set" mode: price is the exact new selling price in ₹. compareprice and cost_price are optional — leave blank to keep existing.',
    'In "percent_increase" / "percent_decrease" mode: the price column is the percentage (e.g. 10 = 10%). Selling price, MRP, and cost price are all adjusted by the same percentage automatically.',
    'Percentage must be between 1 and 100. Selling price will never go below ₹1.',
    'Omitting the mode column defaults to "set" for every row.',
    'SKU column is mandatory — rows with unknown SKUs are skipped.',
  ],
}

const MODE_REFERENCE = [
  { val: 'set', desc: 'Enter exact new prices — price column = ₹ value', bg: '#eff6ff', color: '#1d4ed8' },
  { val: 'percent_increase', desc: 'Raise all prices by X% — price column = percentage (1–100)', bg: '#f0fdf4', color: '#059669' },
  { val: 'percent_decrease', desc: 'Lower all prices by X% — price column = percentage (1–100)', bg: '#fef2f2', color: '#dc2626' },
]

export default function BulkPricePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const submit = async (fileOverride?: File) => {
    const f = fileOverride ?? file
    if (!f) return toast.error('Please select a CSV file first')
    try {
      setLoading(true)
      setJobId(null)
      const form = new FormData()
      form.append('file', f)
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
    const csv = `sku,price,compareprice,cost_price,mode\nAPL001,499,699,300,set\nNK101,10,,,percent_increase\nPUMA55,15,,,percent_decrease`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-price-template.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <BulkPageHeader
        title="Bulk Price Update"
        subtitle="Set exact prices or apply a percentage change to multiple products via CSV"
        icon={<IndianRupee size={24} />}
      />

      <div style={{ margin: '20px 0' }}>
        <AdminInfoPanel {...INFO} />
      </div>

      {/* Mode reference */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Quick Reference — Mode Values</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
          {MODE_REFERENCE.map(m => (
            <div key={m.val} style={{ padding: '12px 16px', borderRadius: 12, background: m.bg }}>
              <p style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: m.color, margin: '0 0 4px' }}>{m.val}</p>
              <p style={{ fontSize: 12, color: m.color, margin: 0, opacity: 0.85 }}>{m.desc}</p>
            </div>
          ))}
        </div>
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
          hint="Required: sku, price — optional: compareprice, cost_price, mode (set / percent_increase / percent_decrease)"
        />
        {file && (
          <button onClick={() => setShowPreview(true)} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: '1.5px solid #a5b4fc', background: '#eef2ff', color: '#4338ca', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Eye size={14} />Preview &amp; Edit CSV
          </button>
        )}
      </div>

      <BulkSubmitButton loading={loading} text="Update Prices" onClick={() => submit()} />

      {jobId && <BulkJobStatus jobId={jobId} />}

      <BulkCsvPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        csvFile={file}
        confirmLabel={`Update Prices — Submit ${file ? '' : '0'} Rows`}
        onConfirm={(edited) => { setShowPreview(false); submit(edited) }}
      />
    </div>
  )
}
