'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Download, Loader2, Zap, Upload, Eye } from 'lucide-react'
import { AdminInfoPanel, BulkJobStatus } from '@/components/admin/BulkUi'
import BulkCsvPreview from '@/components/admin/BulkCsvPreview'

const FIELDS = [
  { name: 'title',          purpose: 'Name of the flash sale shown to customers',                     example: 'Diwali Mega Sale',       required: true  },
  { name: 'discount_type',  purpose: 'Type of discount — percent (%) or flat (₹)',                    example: 'percent',                required: true  },
  { name: 'discount_value', purpose: 'How much discount — number (20 = 20% or ₹20)',                  example: '20',                     required: true  },
  { name: 'starts_at',      purpose: 'Sale start date-time in YYYY-MM-DD HH:MM format',               example: '2025-10-20 10:00',       required: true  },
  { name: 'ends_at',        purpose: 'Sale end date-time — must be after starts_at',                  example: '2025-10-20 22:00',       required: true  },
  { name: 'description',    purpose: 'Optional short description shown on the sale banner',            example: '20% off site-wide',      required: false },
  { name: 'max_uses',       purpose: 'Maximum total activations across all users (blank = unlimited)', example: '500',                    required: false },
  { name: 'is_active',      purpose: 'true = sale goes live at starts_at, false = stays hidden',      example: 'true',                   required: false },
]

const CSV_EXAMPLE = `title,discount_type,discount_value,starts_at,ends_at,description,max_uses,is_active
Diwali Flash Sale,percent,20,2025-10-20 10:00,2025-10-20 22:00,20% off site-wide for Diwali,500,true
Summer Special,flat,100,2025-05-01 09:00,2025-05-01 21:00,Flat ₹100 off all orders,,true`

const NOTES = [
  'discount_type must be exactly "percent" or "flat" (lowercase).',
  'percent discount_value cannot exceed 100.',
  'starts_at and ends_at must be in YYYY-MM-DD HH:MM format. ends_at must be after starts_at.',
  'Flash sales created here have no products yet — add products via Flash Sales → Edit after creation.',
  'is_active defaults to true if left blank. Use false to create sales in draft mode.',
  'max_uses blank = unlimited activations.',
]

export default function BulkFlashSalePage() {
  const [file, setFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const downloadTemplate = async () => {
    try {
      const res = await axios.get('/admin/flash-sales/bulk-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-flash-sales-template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Template download failed')
    }
  }

  const submit = async (finalFile: File) => {
    setSubmitting(true)
    setShowPreview(false)
    try {
      const form = new FormData()
      form.append('file', finalFile)
      const res = await axios.post('/admin/flash-sales/bulk-create', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.data?.jobId) {
        setJobId(res.data.data.jobId)
        toast.success('Flash sale creation job queued!')
      } else {
        toast.error('Unexpected response from server')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
          <Zap size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Bulk Flash Sale Creation
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Create multiple flash sales at once from a CSV file. Products are added via the Flash Sales page after creation.
          </p>
        </div>
      </div>

      {/* Type reference cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        {[
          { type: 'percent', label: 'Percent Discount', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', eg: 'discount_value=20 → 20% off' },
          { type: 'flat',    label: 'Flat Discount',    color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe', eg: 'discount_value=100 → ₹100 off' },
        ].map(t => (
          <div key={t.type} style={{ background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: t.color, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.label}</p>
            <p style={{ fontSize: 12, color: '#374151', margin: '0 0 6px', lineHeight: 1.5 }}>discount_type = <strong>{t.type}</strong></p>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.color, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 6, padding: '2px 8px' }}>{t.eg}</span>
          </div>
        ))}
      </div>

      {/* Info panel */}
      <AdminInfoPanel
        title="Flash Sale CSV Format"
        subtitle="One row per flash sale — add products via the Flash Sales page after creation"
        purpose="Each row in your CSV creates one flash sale. The sale will have no products initially — use Flash Sales → Edit to add products and set individual stock limits or special prices per product."
        fields={FIELDS}
        csvExample={CSV_EXAMPLE}
        notes={NOTES}
      />

      {/* File upload zone */}
      {!jobId && (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Upload Flash Sale CSV</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              onClick={downloadTemplate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #fcd34d', background: '#fef9c3', color: '#92400e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Download size={14} /> Download Template
            </button>
          </div>

          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ border: `2px dashed ${file ? '#f59e0b' : '#d1d5db'}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center', background: file ? '#fefce8' : '#fafafa', transition: 'all 0.2s' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#d97706' }}>
                <Upload size={18} />
              </div>
              {file ? (
                <>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#92400e', marginBottom: 4, wordBreak: 'break-all' }}>{file.name}</p>
                  <span style={{ display: 'inline-block', padding: '2px 10px', background: '#fde68a', color: '#78350f', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>✓ Ready to upload</span>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Drag & drop or click to browse</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Only .csv files supported</p>
                </>
              )}
            </div>
            <input hidden type="file" accept=".csv" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {file && (
              <button
                onClick={() => setShowPreview(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: '1.5px solid #fcd34d', background: '#fef3c7', color: '#92400e', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
              >
                <Eye size={15} /> Preview CSV
              </button>
            )}
            <button
              onClick={() => file && submit(file)}
              disabled={!file || submitting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 10, border: 'none',
                background: (!file || submitting) ? '#d1d5db' : 'linear-gradient(135deg,#d97706,#f59e0b)',
                color: (!file || submitting) ? '#9ca3af' : '#fff', fontSize: 14, fontWeight: 700,
                cursor: (!file || submitting) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              Create Flash Sales
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </div>
      )}

      {/* Job tracker */}
      {jobId && <BulkJobStatus jobId={jobId} />}

      {/* CSV preview modal */}
      <BulkCsvPreview
        open={showPreview}
        csvFile={file}
        onClose={() => setShowPreview(false)}
        onConfirm={(editedFile) => { setFile(editedFile); submit(editedFile) }}
        confirmLabel="Create Flash Sales — Submit Rows"
      />
    </div>
  )
}
