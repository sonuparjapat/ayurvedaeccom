'use client'

import { useState,useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import {
  UploadCloud,
  FileSpreadsheet,
  FileArchive,
  Download,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

export default function BulkUploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
const [result, setResult] =
  useState<any>(null)

const [importing, setImporting] =
  useState(false)

const [finalReport, setFinalReport] =
  useState<any>(null)

const [validationJobId, setValidationJobId] =
  useState<number | null>(null)
 const pollRef = useRef<any>(null)
const [importJobId, setImportJobId] =
  useState<number | null>(null)
const [progress, setProgress] = useState(0)
const [progressText, setProgressText] =
  useState('')
    useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])
 const downloadTemplate = async () => {
    try {
      const res = await axios.get('/admin/products/bulk-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-products-template.csv'
      a.click()
      toast.success('Template downloaded')
    } catch {
      toast.error('Template download failed')
    }
  }
  const runFakeProgress = (
  type:'validate'|'import'
) => {
  let value = 0

  setProgress(0)

  const texts =
    type === 'validate'
    ? [
        'Uploading files...',
        'Reading CSV...',
        'Checking rows...',
        'Preparing report...'
      ]
    : [
        'Uploading images...',
        'Importing products...',
        'Saving data...',
        'Finalizing report...'
      ]

  let step = 0

  setProgressText(texts[0])

  const timer = setInterval(() => {
    value += Math.floor(
      Math.random() * 12
    ) + 4

    if (value > 92)
      value = 92

    setProgress(value)

    if (
      step < texts.length - 1 &&
      value > (step + 1) * 22
    ) {
      step++
      setProgressText(
        texts[step]
      )
    }

  }, 500)

  return timer
}
 const pollJob = (id:number, type:'validate'|'import') => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get('/admin/jobs?page=1&limit=100')
        const rows = res?.data?.data || []
        const job = rows.find((x:any) => x.id === id)
        if (!job) return

        const currentProgress = Number(job.progress || 0)
        setProgress(currentProgress)

        if (type === 'validate') {
          if (currentProgress < 20) setProgressText('Uploading files...')
          else if (currentProgress < 50) setProgressText('Reading CSV...')
          else if (currentProgress < 90) setProgressText('Validating rows...')
          else setProgressText('Preparing report...')
        } else {
          if (currentProgress < 20) setProgressText('Starting import...')
          else if (currentProgress < 50) setProgressText('Uploading images...')
          else if (currentProgress < 90) setProgressText('Saving products...')
          else setProgressText('Finalizing import...')
        }

        if (job.status === 'completed') {
          clearInterval(pollRef.current)
          pollRef.current = null

          setProgress(100)
          setProgressText(type === 'validate' ? 'Validation completed' : 'Import completed')

          if (type === 'validate') {
            setResult({
              summary: {
                totalRows: job.result?.totalRows || 0,
                validRows: job.result?.validRows || 0,
                failedRows: job.result?.failedRows || 0,
              },
              errors: job.result?.errors || []
            })
          } else {
            setFinalReport({
              summary: {
                imported: job.result?.imported || 0,
                failed: job.result?.failed?.length || 0,
                total: job.result?.total || 0,
              },
              failed: job.result?.failed || []
            })
          }

          toast.success(type === 'validate' ? 'Validation completed' : 'Import completed')

          setTimeout(() => {
            setProgress(0)
            setProgressText('')
          }, 2500)
        }

        if (job.status === 'failed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          toast.error(job.error_text || 'Job failed')
          setProgress(0)
          setProgressText('')
        }

      } catch (err) {
        console.error(err)
      }
    }, 2000)
  }

 const submit = async () => {
    if (!csvFile) return toast.error('Please upload CSV file')

    try {
      setLoading(true)
      setResult(null)
      setFinalReport(null)
      setValidationJobId(null)
      setProgress(5)
      setProgressText('Uploading files...')

      const form = new FormData()
      form.append('file', csvFile)
      if (zipFile) form.append('imagesZip', zipFile)

      const res = await axios.post('/admin/products/bulk-upload', form)
      const jobId = res?.data?.data?.jobId
      setValidationJobId(jobId)
      toast.success(res?.data?.message || 'Validation started')
      pollJob(jobId, 'validate')
    } catch (err:any) {
      setProgress(0)
      setProgressText('')
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }
 const downloadCategoryList = async () => {
    try {
      const res = await axios.get('/admin/products/category-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'categories-master.csv'
      a.click()
      toast.success('Categories downloaded')
    } catch {
      toast.error('Download failed')
    }
  }

  const confirmImport = async () => {
    if (!validationJobId) return toast.error('Please validate first')

    try {
      setImporting(true)
      setProgress(5)
      setProgressText('Starting import...')

      const res = await axios.post('/admin/products/bulk-import', {
        validationJobId
      })

      const jobId = res?.data?.data?.jobId
      toast.success(res?.data?.message || 'Import started')
      pollJob(jobId, 'import')
    } catch (err:any) {
      setProgress(0)
      setProgressText('')
      toast.error(err?.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }
const downloadFailedCsv = (
  rows:any[] = []
) => {
  if (!rows.length) {
    return toast.error(
      'No failed rows found'
    )
  }

  const headers =
    ['row','sku','error']

  const csvRows = rows.map(
    (item:any) => [
      item.row,
      item.sku,
      item.error ||
      item.errors?.join(' | ') ||
      ''
    ]
  )

  const csv =
    [
      headers.join(','),
      ...csvRows.map(
        (r:any) =>
          r.map((x:any)=>
            `"${String(x).replace(/"/g,'""')}"`
          ).join(',')
      )
    ].join('\n')

  const blob =
    new Blob(
      [csv],
      { type:'text/csv;charset=utf-8;' }
    )

  const url =
    window.URL.createObjectURL(blob)

  const a =
    document.createElement('a')

  a.href = url
  a.download =
    'failed-rows.csv'

  a.click()

  window.URL.revokeObjectURL(url)
}
  function GuideCard({
  title,
  desc,
}: any) {
  return (
    <div className="guide-card">
      <div className="guide-card-icon-wrap">
        <span className="guide-card-num">{title.split('.')[0]}</span>
      </div>
      <div>
        <h3 className="guide-card-title">
          {title.split('. ')[1]}
        </h3>
        <p className="guide-card-desc">
          {desc}
        </p>
      </div>
      <style>{`
        .guide-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px 18px;
          background: #ffffff;
          transition: box-shadow 0.2s, border-color 0.2s, transform 0.18s;
          position: relative;
          overflow: hidden;
        }
        .guide-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #059669, #10b981);
          border-radius: 16px 16px 0 0;
        }
        .guide-card:hover {
          box-shadow: 0 8px 30px rgba(16,185,129,0.10);
          border-color: #6ee7b7;
          transform: translateY(-2px);
        }
        .guide-card-icon-wrap {
          min-width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #ecfdf5 60%, #d1fae5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 800;
          color: #059669;
          flex-shrink: 0;
        }
        .guide-card-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 3px;
        }
        .guide-card-desc {
          font-size: 12.5px;
          color: #6b7280;
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}
function StatCard({
  title,
  value,
}: any) {
  const isImported = title === 'Imported' || title === 'Valid Rows'
  const isFailed = title === 'Failed' || title === 'Failed Rows'
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <h3 className={`stat-value ${isImported ? 'stat-green' : isFailed && value > 0 ? 'stat-red' : ''}`}>
        {value}
      </h3>
      <style>{`
        .stat-card {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 18px;
          padding: 22px 24px 18px;
          transition: box-shadow 0.2s, transform 0.18s;
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #e5e7eb, #f3f4f6);
          border-radius: 0 0 18px 18px;
        }
        .stat-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.07);
          transform: translateY(-2px);
        }
        .stat-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: #111827;
          line-height: 1.1;
        }
        .stat-green { color: #059669; }
        .stat-red { color: #dc2626; }
      `}</style>
    </div>
  )
}

  return (
    <div className="bulk-page">
      <style>{`
        .bulk-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 48px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        /* ── Header ── */
        .bulk-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }
        @media(min-width:768px){
          .bulk-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .bulk-title {
          font-size: clamp(1.4rem,3vw,1.9rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }
        .bulk-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
        }
        .header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 10px;
          border: 1.5px solid #d1d5db;
          background: #fff;
          color: #374151;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          white-space: nowrap;
        }
        .btn-outline:hover {
          border-color: #059669;
          color: #059669;
          background: #f0fdf4;
          box-shadow: 0 2px 8px rgba(5,150,105,0.10);
        }

        /* ── Progress Bar ── */
        .progress-wrap {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 18px;
          padding: 20px 22px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(5,150,105,0.06);
        }
        .progress-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .progress-text {
          font-size: 13.5px;
          font-weight: 600;
          color: #059669;
        }
        .progress-pct {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }
        .progress-track {
          height: 8px;
          background: #f1f5f9;
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #059669, #34d399);
          border-radius: 100px;
          transition: width 0.5s cubic-bezier(.4,0,.2,1);
          position: relative;
        }
        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 20px; height: 100%;
          background: rgba(255,255,255,0.35);
          border-radius: 100px;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer {
          0% { opacity: 0; transform: translateX(-10px); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(10px); }
        }
        .progress-note {
          font-size: 11.5px;
          color: #9ca3af;
        }

        /* ── Guide Section ── */
        .guide-section {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 22px;
          padding: 28px 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .guide-section-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px;
        }
        .guide-section-sub {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 22px;
        }
        .guide-steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 26px;
        }
        @media(min-width:640px){
          .guide-steps { grid-template-columns: repeat(3,1fr); }
        }

        /* ── Example Tables ── */
        .example-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }
        @media(min-width:1024px){
          .example-grid { grid-template-columns: 1fr 1fr; }
        }
        .example-box {
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
        }
        .example-header {
          padding: 11px 16px;
          background: linear-gradient(90deg,#f8fafc,#f1f5f9);
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          letter-spacing: 0.01em;
        }
        .example-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .example-table th {
          padding: 9px 12px;
          background: #f8fafc;
          color: #6b7280;
          font-weight: 700;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }
        .example-table td {
          padding: 9px 12px;
          color: #374151;
          border-bottom: 1px solid #f9fafb;
          white-space: nowrap;
        }
        .example-table tr:last-child td { border-bottom: none; }
        .example-table tr:hover td { background: #f8fafc; }
        .zip-preview {
          padding: 18px 20px;
          font-family: 'JetBrains Mono','Fira Mono',monospace;
          font-size: 12.5px;
          color: #374151;
          line-height: 1.8;
        }
        .zip-root { color: #059669; font-weight: 700; }
        .zip-file { color: #374151; margin-left: 24px; display: block; }
        .zip-file::before { content: '├─ '; color: #9ca3af; }

        /* ── Notes Box ── */
        .notes-box {
          background: linear-gradient(135deg,#fffbeb,#fef3c7);
          border: 1.5px solid #fcd34d;
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 13px;
          color: #92400e;
          line-height: 1.7;
        }
        .notes-box span { display: block; }
        .notes-box span::before { content: '• '; color: #f59e0b; font-weight: 700; }

        /* ── Upload Cards ── */
        .upload-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }
        @media(min-width:768px){
          .upload-grid { grid-template-columns: 1fr 1fr; }
        }

        /* ── Upload Rules Box ── */
        .rules-box {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 18px;
          padding: 22px 24px;
          margin-bottom: 22px;
        }
        .rules-title {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 14px;
        }
        .rules-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media(min-width:640px){
          .rules-list { grid-template-columns: 1fr 1fr; }
        }
        .rules-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13.5px;
          color: #4b5563;
          line-height: 1.5;
        }
        .rules-list li::before {
          content: '✓';
          color: #059669;
          font-weight: 700;
          font-size: 13px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        /* ── Result / Stats ── */
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }
        @media(min-width:640px){
          .stat-grid { grid-template-columns: repeat(3,1fr); }
        }
        .result-table-wrap {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .result-table-header {
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          background: linear-gradient(90deg,#f8fafc,#fff);
        }
        .result-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .result-table th {
          padding: 11px 16px;
          background: #f8fafc;
          text-align: left;
          font-weight: 700;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }
        .result-table td {
          padding: 11px 16px;
          border-bottom: 1px solid #f9fafb;
          color: #374151;
        }
        .result-table tr:last-child td { border-bottom: none; }
        .result-table tr:hover td { background: #fafafa; }
        .error-cell { color: #dc2626; font-size: 12.5px; }

        /* ── Import Confirm Box ── */
        .import-confirm-box {
          background: linear-gradient(135deg,#f0fdf4,#ecfdf5);
          border: 1.5px solid #6ee7b7;
          border-radius: 16px;
          padding: 20px 22px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media(min-width:640px){
          .import-confirm-box { flex-direction: row; align-items: center; justify-content: space-between; }
        }
        .import-confirm-text {
          font-size: 13.5px;
          color: #065f46;
          font-weight: 500;
        }

        /* ── Buttons ── */
        .btn-validate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 32px;
          border-radius: 12px;
          background: linear-gradient(135deg,#059669,#10b981);
          color: #fff;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 16px rgba(5,150,105,0.22);
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
          width: 100%;
          letter-spacing: 0.01em;
        }
        @media(min-width:768px){
          .btn-validate { width: auto; }
        }
        .btn-validate:hover:not(:disabled) {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(5,150,105,0.30);
        }
        .btn-validate:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-import {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg,#2563eb,#3b82f6);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 14px rgba(37,99,235,0.20);
          transition: opacity 0.18s, transform 0.18s;
          white-space: nowrap;
        }
        .btn-import:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .btn-import:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-download-failed {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 20px;
          border-radius: 10px;
          border: 1.5px solid #fca5a5;
          background: #fff;
          color: #dc2626;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .btn-download-failed:hover {
          background: #fef2f2;
        }

        /* ── Divider ── */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg,transparent,#e5e7eb,transparent);
          margin: 8px 0 24px;
        }
      `}</style>

      {/* ── Header ── */}
      <div className="bulk-header">
        <div>
          <h1 className="bulk-title">Bulk Product Upload</h1>
          <p className="bulk-subtitle">Import hundreds of products in one go with category-based GST auto fill</p>
        </div>
        <div className="header-actions">
          <button onClick={downloadTemplate} className="btn-outline">
            <Download size={16} />
            Download Template
          </button>
          <button onClick={downloadCategoryList} className="btn-outline">
            <Download size={16} />
            Categories CSV
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {progress > 0 && (
        <div className="progress-wrap">
          <div className="progress-top">
            <span className="progress-text">{progressText}</span>
            <span className="progress-pct">{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-note">Please do not close this page while processing.</p>
        </div>
      )}

      {/* ── Guide Section ── */}
      <div className="guide-section">
        <h2 className="guide-section-title">How Bulk Upload Works</h2>
        <p className="guide-section-sub">Follow the examples below for smooth import.</p>

        <div className="guide-steps">
          <GuideCard title="1. Prepare CSV" desc="Download template and fill product details. GST / HSN optional." />
          <GuideCard title="2. Prepare ZIP" desc="Rename images using SKU format." />
          <GuideCard title="3. Upload & Import" desc="Upload files and start bulk process." />
        </div>

        <div className="example-grid">
          {/* CSV Example */}
          <div className="example-box">
            <div className="example-header">📄 CSV Example</div>
            <div style={{overflowX:'auto'}}>
              <table className="example-table">
                <thead>
                  <tr>
                    <th>name</th>
                    <th>sku</th>
                    <th>price</th>
                    <th>inventory</th>
                    <th>category_id</th>
                    <th>gst%</th>
                    <th>hsn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>iPhone 15</td>
                    <td>APL001</td>
                    <td>79999</td>
                    <td>10</td>
                    <td>1</td>
                    <td>18</td>
                    <td>8517</td>
                  </tr>
                  <tr>
                    <td>Nike Shoes</td>
                    <td>NK101</td>
                    <td>2999</td>
                    <td>25</td>
                    <td>2</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ZIP Example */}
          <div className="example-box">
            <div className="example-header">🗜️ ZIP Images Example</div>
            <div className="zip-preview">
              <span className="zip-root">images.zip</span>
              <span className="zip-file">APL001-1.jpg</span>
              <span className="zip-file">APL001-2.jpg</span>
              <span className="zip-file">NK101-1.jpg</span>
              <span className="zip-file">NK101-2.jpg</span>
            </div>
          </div>
        </div>

        <div className="notes-box">
          <span>CSV file is required.</span>
          <span>ZIP file is optional.</span>
          <span>Best image naming: SKU-1.jpg, SKU-2.jpg</span>
          <span>Invalid rows will be skipped with detailed errors.</span>
          <span>If GST / HSN is blank, system uses category defaults.</span>
          <span>Download Categories CSV for category_id reference.</span>
        </div>
      </div>

      {/* ── Upload Cards ── */}
      <div className="upload-grid">
        <UploadCard
          title="Upload CSV File"
          icon={<FileSpreadsheet size={20} />}
          file={csvFile}
          accept=".csv"
          onChange={(f: File) => {
            setCsvFile(f)
            setResult(null)
            setFinalReport(null)
            setValidationJobId(null)
          }}
          hint="Required • Use downloaded template"
        />
        <UploadCard
          title="Upload Images ZIP"
          icon={<FileArchive size={20} />}
          file={zipFile}
          accept=".zip"
          onChange={(f: File) => {
            setZipFile(f)
            setResult(null)
            setFinalReport(null)
            setValidationJobId(null)
          }}
          hint="Optional • Images named SKU-1.jpg"
        />
      </div>

      {/* ── Upload Rules ── */}
      <div className="rules-box">
        <div className="rules-title">
          <ShieldCheck size={18} color="#059669" />
          Upload Rules
        </div>
        <ul className="rules-list">
          <li>CSV file is required.</li>
          <li>ZIP file is optional for images.</li>
          <li>Recommended image naming: SKU-1.jpg, SKU-2.jpg</li>
          <li>Invalid rows will be skipped with detailed errors.</li>
          <li>GST / HSN columns are optional in CSV.</li>
          <li>Blank tax fields auto-fill from selected category_id.</li>
          <li>Existing product flow remains unchanged.</li>
        </ul>
      </div>

      {/* ── Validation Result ── */}
      {result && (
        <div style={{marginBottom:'24px'}}>
          <div className="section-divider" />
          <div className="stat-grid">
            <StatCard title="Total Rows" value={result?.summary?.totalRows || 0} />
            <StatCard title="Valid Rows" value={result?.summary?.validRows || 0} />
            <StatCard title="Failed Rows" value={result?.summary?.failedRows || 0} />
          </div>

          {result?.errors?.length > 0 && (
            <div className="result-table-wrap">
              <div className="result-table-header">Validation Errors</div>
              <div style={{overflowX:'auto'}}>
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>SKU</th>
                      <th>Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((item:any, i:number) => (
                      <tr key={i}>
                        <td>{item.row}</td>
                        <td>{item.sku}</td>
                        <td className="error-cell">{item.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result?.errors?.length > 0 && (
            <button className="btn-download-failed" onClick={() => downloadFailedCsv(result.errors)}>
              <Download size={15} />
              Download Failed Rows CSV
            </button>
          )}
        </div>
      )}

      {/* ── Import Confirm ── */}
      {result && validationJobId && result?.summary?.validRows > 0 && (
        <div className="import-confirm-box">
          <p className="import-confirm-text">
            ✅ Files validated successfully. <strong>{result.summary.validRows} valid rows</strong> are ready to import.
          </p>
          <button onClick={confirmImport} disabled={importing} className="btn-import">
            {importing && <Loader2 size={17} className="animate-spin" />}
            Import Valid Rows
          </button>
        </div>
      )}

      {/* ── Final Report ── */}
      {finalReport && (
        <div style={{marginBottom:'24px'}}>
          <div className="section-divider" />
          <div className="stat-grid">
            <StatCard title="Imported" value={finalReport?.summary?.imported || 0} />
            <StatCard title="Failed" value={finalReport?.summary?.failed || 0} />
            <StatCard title="Total" value={finalReport?.summary?.total || 0} />
          </div>

          {finalReport?.failed?.length > 0 && (
            <div className="result-table-wrap">
              <div className="result-table-header">Failed Rows</div>
              <div style={{overflowX:'auto'}}>
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>SKU</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalReport.failed.map((item:any, i:number) => (
                      <tr key={i}>
                        <td>{item.row}</td>
                        <td>{item.sku}</td>
                        <td className="error-cell">{item.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {finalReport?.failed?.length > 0 && (
            <button className="btn-download-failed" onClick={() => downloadFailedCsv(finalReport.failed)}>
              <Download size={15} />
              Download Failed Rows CSV
            </button>
          )}
        </div>
      )}

      {/* ── Submit ── */}
      <button onClick={submit} disabled={loading} className="btn-validate">
        {loading && <Loader2 size={18} className="animate-spin" />}
        <UploadCloud size={18} />
        Validate Files
      </button>
    </div>
  )
}

function UploadCard({
  title,
  icon,
  file,
  accept,
  onChange,
  hint,
}: any) {
  const [dragging, setDragging] =
    useState(false)

  const handleDrop = (
    e:any
  ) => {
    e.preventDefault()
    setDragging(false)

    const dropped =
      e.dataTransfer.files?.[0]

    if (dropped) {
      onChange(dropped)
    }
  }

  return (
    <label className="upload-card-label">
      <style>{`
        .upload-card-label { display: block; cursor: pointer; }
        .upload-card-title {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .upload-drop-zone {
          border: 2px dashed #d1d5db;
          border-radius: 18px;
          padding: 36px 24px;
          text-align: center;
          background: #fafafa;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .upload-drop-zone.dragging {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 4px rgba(5,150,105,0.08);
        }
        .upload-drop-zone.has-file {
          border-color: #6ee7b7;
          background: #f0fdf4;
        }
        .upload-drop-zone:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }
        .upload-file-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg,#ecfdf5,#d1fae5);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: #059669;
        }
        .upload-main-text {
          font-size: 13.5px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }
        .upload-sub-text {
          font-size: 12px;
          color: #9ca3af;
        }
        .upload-file-name {
          font-size: 13px;
          font-weight: 600;
          color: #059669;
          word-break: break-all;
          margin-bottom: 4px;
        }
        .upload-file-badge {
          display: inline-block;
          padding: 2px 10px;
          background: #dcfce7;
          color: #166534;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
        }
        .upload-hint {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 10px;
        }
      `}</style>

      <div className="upload-card-title">
        {icon}
        {title}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`upload-drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      >
        {file ? (
          <div>
            <div className="upload-file-icon">
              <UploadCloud size={22} />
            </div>
            <div className="upload-file-name">{file.name}</div>
            <span className="upload-file-badge">✓ Ready</span>
          </div>
        ) : (
          <div>
            <div className="upload-file-icon">
              <UploadCloud size={22} />
            </div>
            <div className="upload-main-text">Drag &amp; Drop file here</div>
            <div className="upload-sub-text">or click to browse</div>
          </div>
        )}
      </div>

      <p className="upload-hint">{hint}</p>

      <input
        hidden
        type="file"
        accept={accept}
        onChange={(e) =>
          e.target.files?.[0] &&
          onChange(e.target.files[0])
        }
      />
    </label>
  )
}