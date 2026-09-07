'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Power, Download } from 'lucide-react'
import {
  AdminInfoPanel,
  BulkPageHeader,
  BulkUploadBox,
  BulkSubmitButton,
  BulkJobStatus,
} from '@/components/admin/BulkUi'

const INFO = {
  title: 'How Bulk Status Update Works',
  subtitle: 'Publish, unpublish, or draft multiple products at once via CSV',
  purpose:
    'Use this page to change the visibility/status of many products simultaneously. For example: publish all new arrivals, unpublish discontinued items, or move seasonal products to draft. Upload a CSV with SKU and the desired status value.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must exactly match the SKU in the system.', example: 'APL001', required: true },
    {
      name: 'status',
      purpose: 'New status for the product. Controls whether it is visible on the storefront.',
      example: 'active',
      required: true,
    },
  ],
  csvExample: `sku,status\nAPL001,active\nNK101,inactive\nPUMA55,draft\nHRB200,active`,
  notes: [
    'Accepted values for status: active (visible on storefront), inactive (hidden), draft (admin-only preview).',
    'Status is case-insensitive — "Active", "ACTIVE", and "active" all work.',
    'Rows with an unrecognised status value will be skipped with a validation error.',
    'Changing status to inactive immediately removes the product from customer-facing pages.',
    'Draft products remain visible in the admin panel but are hidden from shoppers.',
  ],
}

export default function BulkStatusPage() {
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
      const res = await axios.post('/admin/products/bulk-status', form)
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
    const csv = `sku,status\nAPL001,active\nNK101,inactive`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-status-template.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <BulkPageHeader
        title="Bulk Status Update"
        subtitle="Publish, unpublish, or draft multiple products simultaneously via CSV"
        icon={<Power size={24} />}
      />

      <div style={{ margin: '20px 0' }}>
        <AdminInfoPanel {...INFO} />
      </div>

      {/* Accepted values quick reference */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Quick Reference — Valid Status Values</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { val: 'active', label: 'Visible on storefront', bg: '#dcfce7', color: '#166534' },
            { val: 'inactive', label: 'Hidden from customers', bg: '#fef2f2', color: '#991b1b' },
            { val: 'draft', label: 'Admin preview only', bg: '#f3f4f6', color: '#374151' },
          ].map(s => (
            <div key={s.val} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: s.bg }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 12, color: s.color, opacity: 0.85 }}>— {s.label}</span>
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
          hint="Required columns: sku, status — valid values: active / inactive / draft"
        />
      </div>

      <BulkSubmitButton loading={loading} text="Update Status" onClick={submit} />

      {jobId && <BulkJobStatus jobId={jobId} />}
    </div>
  )
}
