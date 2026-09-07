'use client'

import { useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { ImageIcon, Upload, FileArchive, FileSpreadsheet, Loader2, Download, Eye } from 'lucide-react'
import { AdminInfoPanel, BulkJobStatus } from '@/components/admin/BulkUi'
import BulkCsvPreview from '@/components/admin/BulkCsvPreview'

const INFO = {
  title: 'How Bulk Image Upload Works',
  subtitle: 'Replace or append product images using image URLs in CSV and/or a ZIP of local files',
  purpose:
    'Use this page to update product images for many products at once. You can provide images in two ways: via URLs in a CSV (ideal for images already hosted online), or via a ZIP file of local image files named after the product SKU. Both methods can be used together — the ZIP file takes priority when a product appears in both.',
  fields: [
    { name: 'sku', purpose: 'Unique product identifier. Must match the SKU in the system exactly.', example: 'NK101', required: true },
    {
      name: 'mode',
      purpose: 'How images are applied. "append" adds new images alongside existing ones. "replace" removes all existing images and uses the new ones.',
      example: 'replace',
      required: true,
    },
    {
      name: 'image_urls',
      purpose: 'Pipe-separated (|) list of image URLs to assign. Leave blank if using a ZIP file for this product.',
      example: 'https://cdn.example.com/img1.jpg|https://cdn.example.com/img2.jpg',
      required: false,
    },
  ],
  csvExample: `sku,mode,image_urls\nNK101,replace,https://site.com/nk101-1.jpg|https://site.com/nk101-2.jpg\nAPL001,append,https://site.com/apl001-3.jpg\nHRB200,prepend,https://site.com/hrb200-new-main.jpg\nPUMA55,replace,`,
  notes: [
    '"replace" removes ALL existing images and uses only the new ones. "append" adds new images after existing ones. "prepend" adds new images BEFORE existing ones — making them the primary/card image.',
    'Image order matters — the first URL in image_urls (or SKU-1.jpg from ZIP) becomes the primary image shown on product cards, search results, and the cart.',
    'Use "prepend" when you have a better main photo to set as primary without losing existing images.',
    'Separate multiple image URLs with a pipe character | (no spaces). Example: https://cdn.com/img1.jpg|https://cdn.com/img2.jpg',
    'For ZIP uploads: name files as SKU-1.jpg (primary), SKU-2.jpg, SKU-3.jpg — the number suffix controls display order.',
    'If a product appears in both the CSV and ZIP, the ZIP images are used (ZIP takes priority).',
    'Supported image formats: JPG, JPEG, PNG, WEBP.',
    'Jobs are queued and processed in the background — track progress in the Jobs page.',
    'Maximum recommended ZIP size: 200 MB. For larger batches, split into multiple uploads.',
  ],
}

export default function BulkImagesPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const submit = async (fileOverride?: File) => {
    const f = fileOverride ?? csvFile
    if (!f) return toast.error('Please select a CSV file first')
    try {
      setJobId(null)
      setLoading(true)
      const form = new FormData()
      form.append('file', f)
      if (zipFile) form.append('imagesZip', zipFile)
      const res = await axios.post('/admin/products/bulk-images', form)
      const id = res.data?.data?.jobId
      if (id) {
        setJobId(id)
        toast.success('Files uploaded — tracking progress below…')
      } else {
        toast.error('Upload succeeded but no job ID returned')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed — check your files and try again')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `sku,mode,image_urls\nNK101,replace,https://example.com/nk101-1.jpg\nAPL001,append,`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-images-template.csv'; a.click()
  }

  const zone = (file: File | null, icon: React.ReactNode, label: string, ext: string, hint: string, onSet: (f: File) => void) => (
    <label style={{ display: 'block', cursor: 'pointer' }}>
      <div style={{ border: `2px dashed ${file ? '#6ee7b7' : '#d1d5db'}`, borderRadius: 18, padding: '28px 20px', textAlign: 'center', background: file ? '#f0fdf4' : '#fafafa', transition: 'border-color 0.2s,background 0.2s' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: file ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: file ? '#059669' : '#9ca3af' }}>
          {icon}
        </div>
        {file ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 4, wordBreak: 'break-all' }}>{file.name}</p>
            <span style={{ display: 'inline-block', padding: '2px 10px', background: '#dcfce7', color: '#166534', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>✓ Ready</span>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#374151', marginBottom: 3 }}>{label}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Click to browse or drag &amp; drop</p>
          </>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{hint}</p>
      <input hidden type="file" accept={ext} onChange={e => e.target.files?.[0] && onSet(e.target.files[0])} />
    </label>
  )

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 48px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
          <ImageIcon size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Bulk Images Upload</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Queue-based product image import — replace or append images via CSV + optional ZIP</p>
        </div>
      </div>

      {/* Info panel */}
      <div style={{ marginBottom: 20 }}>
        <AdminInfoPanel {...INFO} />
      </div>

      {/* Mode reference */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Quick Reference — Mode Values</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {[
            { val: 'replace', desc: 'Remove ALL current images and use only the new ones', bg: '#fef2f2', color: '#dc2626' },
            { val: 'append', desc: 'Keep existing images and add new ones at the end (existing primary stays)', bg: '#f0fdf4', color: '#059669' },
            { val: 'prepend', desc: 'Add new images at the START — they become the new primary/card image', bg: '#eff6ff', color: '#1d4ed8' },
          ].map(m => (
            <div key={m.val} style={{ padding: '12px 16px', borderRadius: 12, background: m.bg }}>
              <p style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: m.color, margin: '0 0 4px' }}>{m.val}</p>
              <p style={{ fontSize: 12, color: m.color, margin: 0, opacity: 0.8 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={18} color="#374151" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>CSV File <span style={{ color: '#dc2626', fontSize: 11 }}>Required</span></span>
            </div>
            <button onClick={downloadTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#f8fafc', color: '#374151', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={12} />Template
            </button>
          </div>
          {zone(csvFile, <FileSpreadsheet size={22} />, 'Upload CSV File', '.csv', 'Columns: sku, mode, image_urls', f => setCsvFile(f))}
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FileArchive size={18} color="#374151" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>ZIP File <span style={{ color: '#059669', fontSize: 11 }}>Optional</span></span>
          </div>
          {zone(zipFile, <FileArchive size={22} />, 'Upload ZIP of Images', '.zip', 'Name files as SKU-1.jpg, SKU-2.jpg etc.', f => setZipFile(f))}
        </div>
      </div>

      {/* Submit */}
      {csvFile && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowPreview(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: '1.5px solid #a5b4fc', background: '#eef2ff', color: '#4338ca', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            <Eye size={14} />Preview &amp; Edit CSV
          </button>
        </div>
      )}

      <button
        onClick={() => submit()}
        disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 32px', borderRadius: 12, border: 'none', background: loading ? '#bfdbfe' : 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.22)', transition: 'opacity 0.18s' }}
      >
        {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />Queueing Job...</> : <><Upload size={18} />Start Bulk Image Upload</>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>

      {jobId && (
        <>
          <BulkJobStatus jobId={jobId} />
          <button
            onClick={() => { setJobId(null); setCsvFile(null); setZipFile(null) }}
            style={{ marginTop: 12, padding: '10px 22px', borderRadius: 10, border: '1.5px solid #6ee7b7', background: '#fff', color: '#065f46', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Upload Another Batch
          </button>
        </>
      )}

      <BulkCsvPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        csvFile={csvFile}
        confirmLabel="Submit Image Upload Rows"
        onConfirm={(edited) => { setShowPreview(false); submit(edited) }}
      />
    </div>
  )
}
