'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Download, FolderTree } from 'lucide-react'
import {
  AdminInfoPanel,
  BulkPageHeader,
  BulkUploadBox,
  BulkSubmitButton,
  BulkJobStatus,
} from '@/components/admin/BulkUi'

const INFO = {
  title: 'How Bulk Category Update Works',
  subtitle: 'Move products to different categories and automatically sync GST, HSN & CESS via CSV',
  purpose:
    'Use this page to reassign products to different categories at scale. When you change a product\'s category, the system automatically updates its GST percentage, HSN code, and CESS from the new category\'s tax settings — saving you from updating tax fields one by one. Download the Category Master CSV first to find the correct category_id values.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must exactly match the SKU in the system.', example: 'APL001', required: true },
    { name: 'category_id', purpose: 'Numeric ID of the target category. Download the Category Master to get valid IDs.', example: '5', required: true },
  ],
  csvExample: `sku,category_id\nAPL001,5\nNK101,12\nPUMA55,3\nHRB200,8`,
  notes: [
    'Download the Category Master CSV first — it lists all valid category_id values with names, GST%, and HSN codes.',
    'Changing category automatically updates GST%, HSN Code, and CESS for the product — no manual tax update needed.',
    'A product can only belong to one category at a time.',
    'Rows with an invalid or non-existent category_id will be skipped.',
    'Sub-categories are listed in the Category Master with their parent shown in brackets.',
  ],
}

export default function BulkCategoryPage() {
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
      const res = await axios.post('/admin/products/bulk-category', form)
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

  const downloadCategoryList = async () => {
    try {
      const res = await axios.get('/admin/products/category-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'categories-master.csv'; a.click()
      toast.success('Category master downloaded')
    } catch {
      toast.error('Download failed')
    }
  }

  const downloadTemplate = () => {
    const csv = `sku,category_id\nAPL001,5\nNK101,12`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-category-template.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <BulkPageHeader
        title="Bulk Category Update"
        subtitle="Reassign products to categories — GST, HSN & CESS auto-sync from the new category"
        icon={<FolderTree size={24} />}
      />

      <div style={{ margin: '20px 0' }}>
        <AdminInfoPanel {...INFO} />
      </div>

      {/* Step 1 — download category master */}
      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>
          Step 1 — Download the Category Master first
        </p>
        <p style={{ fontSize: 12.5, color: '#3b82f6', marginBottom: 12 }}>
          The master CSV lists every category with its ID, name, GST%, HSN code, and parent. Use it to fill the category_id column correctly.
        </p>
        <button
          onClick={downloadCategoryList}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, border: '1.5px solid #93c5fd', background: '#fff', color: '#1d4ed8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Download size={14} />Download Category Master (IDs + GST + HSN)
        </button>
      </div>

      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Step 2 — Upload Your CSV</p>
          <button onClick={downloadTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 9, border: '1.5px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={14} />Download CSV Template
          </button>
        </div>
        <BulkUploadBox
          file={file}
          setFile={setFile}
          hint="Required columns: sku, category_id — get valid IDs from Category Master above"
        />
      </div>

      <BulkSubmitButton loading={loading} text="Update Categories" onClick={submit} />

      {jobId && <BulkJobStatus jobId={jobId} />}
    </div>
  )
}
