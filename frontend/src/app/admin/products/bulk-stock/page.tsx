'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Package, Download } from 'lucide-react'
import downloadFailedCsv from '@/app/utils/downloadFailedCsv'
import {
  AdminInfoPanel,
  BulkPageHeader,
  BulkUploadBox,
  BulkSubmitButton,
  BulkSummaryStats,
} from '@/components/admin/BulkUi'

const INFO = {
  title: 'How Bulk Stock Update Works',
  subtitle: 'Set exact inventory quantities for many products at once via CSV',
  purpose:
    'Use this page to set the current stock/inventory count for multiple products at the same time. This is useful after a stock-take, restocking event, or warehouse sync. Upload a CSV with each product SKU and the new quantity — the system overwrites the current inventory.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must exactly match the SKU in the system.', example: 'APL001', required: true },
    { name: 'inventory', purpose: 'New stock quantity (whole number). Sets the exact inventory — 0 means out of stock.', example: '150', required: true },
  ],
  csvExample: `sku,inventory\nAPL001,150\nNK101,40\nPUMA55,0\nHRB200,300`,
  notes: [
    'inventory value replaces the current stock — it does NOT add to it.',
    'Set inventory to 0 to mark a product as out-of-stock.',
    'Only whole numbers are accepted (no decimals).',
    'SKUs not found in the system will be skipped with an error row.',
    'Products with variants manage stock per-variant — use variant SKUs in this CSV.',
  ],
}

export default function BulkStockPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const submit = async () => {
    if (!file) return toast.error('Please upload a CSV file first')
    try {
      setLoading(true)
      const form = new FormData()
      form.append('file', file)
      const res = await axios.post('/admin/products/bulk-stock', form)
      setReport(res.data)
      toast.success(res?.data?.message || 'Stock updated successfully')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `sku,inventory\nAPL001,150\nNK101,40`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-stock-template.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <BulkPageHeader
        title="Bulk Stock Update"
        subtitle="Set exact inventory quantities for multiple products via CSV"
        icon={<Package size={24} />}
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
          hint="Required columns: sku, inventory"
        />
      </div>

      <BulkSubmitButton loading={loading} text="Update Stock" onClick={submit} />

      {report && (
        <div style={{ marginTop: 20 }}>
          <BulkSummaryStats report={report} />
          {report?.failed?.length > 0 && (
            <div style={{ marginTop: 14, background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, color: '#991b1b', fontWeight: 700, marginBottom: 10 }}>
                {report.failed.length} rows failed — download to review errors
              </p>
              <button
                onClick={() => downloadFailedCsv(report.failed, 'stock_failed_rows.csv')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10, border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Download size={14} />Download Failed Rows CSV
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
