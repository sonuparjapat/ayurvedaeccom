'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Package, Download, Eye } from 'lucide-react'
import {
  AdminInfoPanel,
  BulkPageHeader,
  BulkUploadBox,
  BulkSubmitButton,
  BulkJobStatus,
} from '@/components/admin/BulkUi'
import BulkCsvPreview from '@/components/admin/BulkCsvPreview'

const INFO = {
  title: 'How Bulk Stock Update Works',
  subtitle: 'Set, add to, or subtract from inventory for many products at once via CSV',
  purpose:
    'Use this page to update stock/inventory for multiple products at the same time. Three modes: set (overwrite), add (receive stock), subtract (reduce stock). Upload a CSV with each product SKU, the quantity, and an optional mode column.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must exactly match the SKU in the system.', example: 'APL001', required: true },
    { name: 'inventory', purpose: 'Quantity to apply. For set mode: new stock level. For add/subtract: the amount to add or remove.', example: '150', required: true },
    { name: 'mode', purpose: '"set" overwrites stock, "add" adds to existing, "subtract" deducts from existing (never goes below 0). Default: set.', example: 'add', required: false },
  ],
  csvExample: `sku,inventory,mode\nAPL001,150,set\nNK101,40,add\nPUMA55,10,subtract\nHRB200,300,set`,
  notes: [
    '"set" replaces the current stock. "add" adds to it. "subtract" deducts from it (minimum result is 0 — never negative).',
    'Omitting the mode column defaults to "set" for every row.',
    'Use "add" after receiving a stock delivery — e.g. if stock is 20 and you add 50, it becomes 70.',
    'Use "subtract" to correct overstock or remove damaged units without a full stock-take.',
    'Only whole numbers are accepted for inventory (no decimals).',
    'SKUs not found in the system will be skipped with an error row.',
    'Products with variants manage stock per-variant — use variant SKUs.',
  ],
}

const MODE_REFERENCE = [
  { val: 'set', desc: 'Overwrites the current stock with the exact value you enter', bg: '#eff6ff', color: '#1d4ed8' },
  { val: 'add', desc: 'Adds your value to the existing stock (e.g. receive a shipment)', bg: '#f0fdf4', color: '#059669' },
  { val: 'subtract', desc: 'Deducts your value from existing stock, minimum result is 0', bg: '#fef2f2', color: '#dc2626' },
]

export default function BulkStockPage() {
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
      const res = await axios.post('/admin/products/bulk-stock', form)
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
    const csv = `sku,inventory,mode\nAPL001,150,set\nNK101,50,add\nPUMA55,10,subtract`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-stock-template.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <BulkPageHeader
        title="Bulk Stock Update"
        subtitle="Set, add to, or subtract from inventory for multiple products via CSV"
        icon={<Package size={24} />}
      />

      <div style={{ margin: '20px 0' }}>
        <AdminInfoPanel {...INFO} />
      </div>

      {/* Mode reference */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Quick Reference — Mode Values</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {MODE_REFERENCE.map(m => (
            <div key={m.val} style={{ padding: '12px 16px', borderRadius: 12, background: m.bg }}>
              <p style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: m.color, margin: '0 0 4px' }}>{m.val}</p>
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
          hint="Required columns: sku, inventory — optional: mode (set / add / subtract, default: set)"
        />
        {file && (
          <button onClick={() => setShowPreview(true)} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: '1.5px solid #a5b4fc', background: '#eef2ff', color: '#4338ca', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Eye size={14} />Preview &amp; Edit CSV
          </button>
        )}
      </div>

      <BulkSubmitButton loading={loading} text="Update Stock" onClick={() => submit()} />

      {jobId && <BulkJobStatus jobId={jobId} />}

      <BulkCsvPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        csvFile={file}
        confirmLabel="Update Stock — Submit Rows"
        onConfirm={(edited) => { setShowPreview(false); submit(edited) }}
      />
    </div>
  )
}
