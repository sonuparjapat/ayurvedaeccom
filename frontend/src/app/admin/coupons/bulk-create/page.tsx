'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Download, Loader2, Tag, Upload, Eye } from 'lucide-react'
import { AdminInfoPanel, BulkJobStatus } from '@/components/admin/BulkUi'
import BulkCsvPreview from '@/components/admin/BulkCsvPreview'

const INFO = {
  title: 'How Bulk Coupon Creation Works',
  subtitle: 'Create many discount coupons at once by uploading a CSV file',
  purpose:
    'Use this page to create multiple coupons in a single upload. Each row in the CSV becomes one new coupon. Duplicate codes are skipped with an error — existing coupons are never overwritten.',
  fields: [
    { name: 'code', purpose: 'Unique coupon code (letters and numbers, automatically uppercased).', example: 'SAVE10', required: true },
    { name: 'type', purpose: '"flat" for a fixed rupee discount, "percent" for a percentage discount.', example: 'percent', required: true },
    { name: 'value', purpose: 'Discount amount. For percent type: 1–100. For flat type: any positive number.', example: '10', required: true },
    { name: 'min_order', purpose: 'Minimum cart total (in ₹) required to use the coupon. Use 0 for no minimum.', example: '500', required: false },
    { name: 'max_discount', purpose: 'Maximum discount cap in ₹ (for percent coupons). Use 0 for no cap.', example: '200', required: false },
    { name: 'usage_limit', purpose: 'Total number of times this coupon can be used across all users. Use 0 for unlimited.', example: '100', required: false },
    { name: 'usage_per_user', purpose: 'How many times a single user can apply this coupon. Default is 1.', example: '1', required: false },
    { name: 'valid_from', purpose: 'Start date in YYYY-MM-DD format. Leave blank for no start restriction.', example: '2025-01-01', required: false },
    { name: 'valid_to', purpose: 'Expiry date in YYYY-MM-DD format. Leave blank for no expiry.', example: '2025-12-31', required: false },
    { name: 'description', purpose: 'Internal note or label for this coupon. Not shown to customers.', example: '10% off for new users', required: false },
    { name: 'is_active', purpose: 'Whether the coupon is active immediately. Use true or false. Defaults to true.', example: 'true', required: false },
  ],
  csvExample: `code,type,value,min_order,max_discount,usage_limit,usage_per_user,valid_from,valid_to,description,is_active\nSAVE10,percent,10,500,200,100,1,2025-01-01,2025-12-31,10% off orders above ₹500,true\nFLAT50,flat,50,300,0,0,2,,,₹50 flat discount,true\nVIP100,flat,100,1000,100,50,1,2025-06-01,2025-06-30,VIP exclusive coupon,true`,
  notes: [
    'Duplicate coupon codes are skipped — existing coupons are never modified by this upload.',
    'Code is automatically uppercased — "save10" and "SAVE10" are treated as the same code.',
    'For percent type, value must be between 1 and 100.',
    'Dates must be in YYYY-MM-DD format (e.g. 2025-06-15). Leave blank for no date restriction.',
    'usage_limit = 0 means unlimited total uses. usage_per_user = 1 is the safest default.',
    'is_active = false creates the coupon in a disabled state — useful to prepare seasonal coupons in advance.',
    'Jobs are processed in the background — track progress below after uploading.',
  ],
}

const TYPE_REFERENCE = [
  { val: 'flat', desc: '₹ fixed amount deducted from cart total', bg: '#eff6ff', color: '#1d4ed8' },
  { val: 'percent', desc: 'Percentage off the cart — cap with max_discount to control maximum saving', bg: '#f0fdf4', color: '#059669' },
]

export default function BulkCouponCreatePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const submit = async (fileOverride?: File) => {
    const f = fileOverride ?? file
    if (!f) return toast.error('Please select a CSV file first')
    try {
      setJobId(null)
      setLoading(true)
      const form = new FormData()
      form.append('file', f)
      const res = await axios.post('/admin/coupons/bulk-create', form)
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

  const downloadTemplate = async () => {
    try {
      const res = await axios.get('/admin/coupons/bulk-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'bulk-coupons-template.csv'; a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Template download failed')
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#fef9c3,#fef08a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', flexShrink: 0 }}>
          <Tag size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Bulk Coupon Create</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Create multiple discount coupons at once from a CSV file — flat or percent discounts</p>
        </div>
      </div>

      {/* Info panel */}
      <div style={{ marginBottom: 20 }}>
        <AdminInfoPanel {...INFO} />
      </div>

      {/* Type reference */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Quick Reference — Coupon Types</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {TYPE_REFERENCE.map(t => (
            <div key={t.val} style={{ padding: '12px 16px', borderRadius: 12, background: t.bg }}>
              <p style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: t.color, margin: '0 0 4px' }}>{t.val}</p>
              <p style={{ fontSize: 12, color: t.color, margin: 0, opacity: 0.8 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Upload Coupons CSV</p>
          <button
            onClick={downloadTemplate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 9, border: '1.5px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={14} />Download CSV Template
          </button>
        </div>

        <label style={{ display: 'block', cursor: 'pointer' }}>
          <div style={{ border: `2px dashed ${file ? '#6ee7b7' : '#d1d5db'}`, borderRadius: 18, padding: '28px 20px', textAlign: 'center', background: file ? '#f0fdf4' : '#fafafa', transition: 'border-color 0.2s,background 0.2s' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: file ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: file ? '#059669' : '#9ca3af' }}>
              <Tag size={22} />
            </div>
            {file ? (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 4, wordBreak: 'break-all' }}>{file.name}</p>
                <span style={{ display: 'inline-block', padding: '2px 10px', background: '#dcfce7', color: '#166534', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>✓ Ready</span>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#374151', marginBottom: 3 }}>Upload CSV File</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Click to browse or drag &amp; drop</p>
              </>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Required columns: code, type, value — all others optional</p>
          <input hidden type="file" accept=".csv" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        </label>

        {file && (
          <button
            onClick={() => setShowPreview(true)}
            style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: '1.5px solid #a5b4fc', background: '#eef2ff', color: '#4338ca', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            <Eye size={14} />Preview &amp; Edit CSV
          </button>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={() => submit()}
        disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 32px', borderRadius: 12, border: 'none', background: loading ? '#fde68a' : 'linear-gradient(135deg,#ca8a04,#eab308)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(202,138,4,0.28)', transition: 'opacity 0.18s' }}
      >
        {loading
          ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />Queueing Job...</>
          : <><Upload size={18} />Create Coupons from CSV</>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>

      {jobId && (
        <>
          <BulkJobStatus jobId={jobId} />
          <button
            onClick={() => { setJobId(null); setFile(null) }}
            style={{ marginTop: 12, padding: '10px 22px', borderRadius: 10, border: '1.5px solid #fde68a', background: '#fff', color: '#92400e', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Upload Another Batch
          </button>
        </>
      )}

      <BulkCsvPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        csvFile={file}
        confirmLabel="Create Coupons — Submit Rows"
        onConfirm={(edited) => { setShowPreview(false); submit(edited) }}
      />
    </div>
  )
}
