'use client'

import { useState, useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import {
  UploadCloud,
  FileSpreadsheet,
  FileArchive,
  Download,
  Loader2,
  ShieldCheck,
  X,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// ─── CSV Preview Modal ───────────────────────────────────────────────────────

function CsvPreviewModal({
  open,
  onClose,
  csvFile,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  csvFile: File | null
  onConfirm: (editedFile: File) => void
}) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [editCell, setEditCell] = useState<{ r: number; c: number } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !csvFile) return
    setParsing(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) { setParsing(false); return }
      const parseRow = (line: string): string[] => {
        const result: string[] = []
        let cur = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
            else inQuotes = !inQuotes
          } else if (ch === ',' && !inQuotes) {
            result.push(cur); cur = ''
          } else { cur += ch }
        }
        result.push(cur)
        return result
      }
      setHeaders(parseRow(lines[0]))
      setRows(lines.slice(1).map(parseRow))
      setParsing(false)
    }
    reader.readAsText(csvFile)
  }, [open, csvFile])

  useEffect(() => {
    if (editCell) setTimeout(() => inputRef.current?.focus(), 50)
  }, [editCell])

  const startEdit = (r: number, c: number) => {
    setEditCell({ r, c })
    setEditVal(rows[r][c] ?? '')
  }

  const commitEdit = () => {
    if (!editCell) return
    const updated = rows.map((row, ri) =>
      ri === editCell.r ? row.map((val, ci) => (ci === editCell.c ? editVal : val)) : row
    )
    setRows(updated)
    setEditCell(null)
  }

  const deleteRow = (ri: number) => setRows(rows.filter((_, i) => i !== ri))

  const addRow = () => setRows([...rows, headers.map(() => '')])

  const buildCsvText = () => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n')
  }

  const handleConfirm = () => {
    const text = buildCsvText()
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    const edited = new File([blob], csvFile?.name ?? 'edited.csv', { type: 'text/csv' })
    onConfirm(edited)
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-box">
        <style>{`
          .modal-overlay {
            position:fixed;inset:0;background:rgba(15,23,42,0.55);
            backdrop-filter:blur(3px);z-index:1000;
            display:flex;align-items:center;justify-content:center;
            padding:16px;animation:mFadeIn 0.18s ease;
          }
          @keyframes mFadeIn{from{opacity:0}to{opacity:1}}
          .modal-box {
            background:#fff;border-radius:22px;width:100%;max-width:980px;
            max-height:90vh;display:flex;flex-direction:column;
            box-shadow:0 24px 80px rgba(0,0,0,0.18);
            animation:mSlideUp 0.22s cubic-bezier(.4,0,.2,1);overflow:hidden;
          }
          @keyframes mSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
          .m-head{
            display:flex;align-items:center;justify-content:space-between;
            padding:20px 24px 18px;border-bottom:1px solid #f1f5f9;flex-shrink:0;
          }
          .m-head-left{display:flex;align-items:center;gap:12px;}
          .m-head-icon{
            width:40px;height:40px;border-radius:12px;
            background:linear-gradient(135deg,#ecfdf5,#d1fae5);
            display:flex;align-items:center;justify-content:center;color:#059669;
          }
          .m-title{font-size:16px;font-weight:800;color:#0f172a;margin:0 0 2px;}
          .m-meta{font-size:12px;color:#64748b;}
          .m-close{
            width:34px;height:34px;border-radius:10px;border:1.5px solid #e5e7eb;
            background:#fff;display:flex;align-items:center;justify-content:center;
            cursor:pointer;color:#6b7280;transition:background 0.15s,color 0.15s;flex-shrink:0;
          }
          .m-close:hover{background:#fef2f2;color:#dc2626;border-color:#fca5a5;}
          .m-toolbar{
            display:flex;align-items:center;justify-content:space-between;
            padding:12px 24px;background:#f8fafc;border-bottom:1px solid #f1f5f9;
            gap:10px;flex-wrap:wrap;flex-shrink:0;
          }
          .m-toolbar-left{display:flex;align-items:center;gap:8px;}
          .t-badge{padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;}
          .b-rows{background:#e0f2fe;color:#0369a1;}
          .b-cols{background:#f3e8ff;color:#7c3aed;}
          .btn-add-row{
            display:inline-flex;align-items:center;gap:6px;padding:7px 14px;
            border-radius:8px;border:1.5px dashed #d1d5db;background:#fff;
            color:#374151;font-size:12.5px;font-weight:600;cursor:pointer;
            transition:border-color 0.15s,background 0.15s;
          }
          .btn-add-row:hover{border-color:#059669;color:#059669;background:#f0fdf4;}
          .m-body{flex:1;overflow:auto;padding:0;}
          .csv-tbl{width:100%;border-collapse:collapse;font-size:13px;}
          .csv-tbl thead{position:sticky;top:0;z-index:10;}
          .csv-tbl thead tr{background:#f1f5f9;}
          .csv-tbl th{
            padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;
            color:#475569;text-transform:uppercase;letter-spacing:0.06em;
            white-space:nowrap;border-bottom:2px solid #e2e8f0;border-right:1px solid #e2e8f0;
          }
          .csv-tbl th:last-child{border-right:none;}
          .th-num{width:50px;text-align:center;color:#94a3b8;}
          .th-act{width:52px;text-align:center;}
          .csv-tbl tbody tr{transition:background 0.12s;}
          .csv-tbl tbody tr:nth-child(even){background:#fafbfc;}
          .csv-tbl tbody tr:hover{background:#f0fdf4;}
          .csv-tbl tbody tr:hover .del-btn{opacity:1;}
          .csv-tbl td{
            padding:0;border-bottom:1px solid #f1f5f9;
            border-right:1px solid #f1f5f9;vertical-align:middle;
          }
          .csv-tbl td:last-child{border-right:none;}
          .td-num{
            text-align:center;font-size:11px;color:#94a3b8;font-weight:600;
            padding:0 8px;width:50px;background:#f8fafc;
          }
          .cell-view{
            padding:9px 12px;min-height:38px;cursor:text;
            display:flex;align-items:center;gap:6px;
            color:#1e293b;font-size:13px;
          }
          .cell-view:hover{background:rgba(5,150,105,0.04);}
          .cell-empty{color:#cbd5e1;font-style:italic;font-size:12px;}
          .cell-input{
            width:100%;padding:8px 12px;border:none;outline:none;background:#fff;
            font-size:13px;color:#0f172a;box-shadow:inset 0 0 0 2px #059669;
            border-radius:0;min-width:120px;
          }
          .td-act{text-align:center;width:52px;padding:0 6px;}
          .del-btn{
            opacity:0;width:28px;height:28px;border-radius:8px;
            border:1.5px solid #fca5a5;background:#fff;color:#dc2626;
            display:inline-flex;align-items:center;justify-content:center;
            cursor:pointer;transition:opacity 0.15s,background 0.15s;
          }
          .del-btn:hover{background:#fef2f2;}
          .m-foot{
            display:flex;align-items:center;justify-content:space-between;
            padding:16px 24px;border-top:1px solid #f1f5f9;flex-shrink:0;
            background:#fff;gap:12px;flex-wrap:wrap;
          }
          .m-foot-left{display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;}
          .m-foot-actions{display:flex;align-items:center;gap:10px;}
          .btn-cancel-m{
            padding:10px 22px;border-radius:10px;border:1.5px solid #e2e8f0;
            background:#fff;color:#374151;font-size:13.5px;font-weight:600;
            cursor:pointer;transition:background 0.15s;
          }
          .btn-cancel-m:hover{background:#f8fafc;}
          .btn-confirm-m{
            display:inline-flex;align-items:center;gap:8px;
            padding:10px 26px;border-radius:10px;border:none;
            background:linear-gradient(135deg,#059669,#10b981);color:#fff;
            font-size:13.5px;font-weight:700;cursor:pointer;
            box-shadow:0 4px 14px rgba(5,150,105,0.22);
            transition:opacity 0.15s,transform 0.15s;
          }
          .btn-confirm-m:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);}
          .btn-confirm-m:disabled{opacity:0.5;cursor:not-allowed;}
          .parsing-state{
            display:flex;align-items:center;justify-content:center;
            height:200px;gap:12px;color:#64748b;font-size:14px;
          }
          .empty-state{
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            height:200px;color:#94a3b8;font-size:13px;gap:8px;
          }
        `}</style>

        <div className="m-head">
          <div className="m-head-left">
            <div className="m-head-icon"><Eye size={20} /></div>
            <div>
              <p className="m-title">Preview &amp; Edit CSV</p>
              <p className="m-meta">{csvFile?.name} — review and edit before validating</p>
            </div>
          </div>
          <button className="m-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="m-toolbar">
          <div className="m-toolbar-left">
            <span className="t-badge b-rows">{rows.length} rows</span>
            <span className="t-badge b-cols">{headers.length} columns</span>
          </div>
          <button className="btn-add-row" onClick={addRow}>+ Add Row</button>
        </div>

        <div className="m-body">
          {parsing ? (
            <div className="parsing-state">
              <Loader2 size={20} style={{animation:'spin 1s linear infinite'}} />
              Parsing CSV...
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={28} />
              No data rows found in this CSV.
            </div>
          ) : (
            <table className="csv-tbl">
              <thead>
                <tr>
                  <th className="th-num">#</th>
                  {headers.map((h, i) => <th key={i}>{h || `col_${i + 1}`}</th>)}
                  <th className="th-act">Del</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="td-num">{ri + 1}</td>
                    {headers.map((_, ci) => (
                      <td key={ci}>
                        {editCell?.r === ri && editCell?.c === ci ? (
                          <input
                            ref={inputRef}
                            className="cell-input"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit()
                              if (e.key === 'Escape') setEditCell(null)
                              if (e.key === 'Tab') {
                                e.preventDefault(); commitEdit()
                                const nextC = ci + 1 < headers.length ? ci + 1 : 0
                                const nextR = ci + 1 < headers.length ? ri : ri + 1
                                if (nextR < rows.length) startEdit(nextR, nextC)
                              }
                            }}
                          />
                        ) : (
                          <div className="cell-view" onClick={() => startEdit(ri, ci)}>
                            {row[ci] ? <span>{row[ci]}</span> : <span className="cell-empty">empty</span>}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="td-act">
                      <button className="del-btn" onClick={() => deleteRow(ri)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="m-foot">
          <div className="m-foot-left">
            <CheckCircle2 size={16} color="#059669" />
            <span>{rows.length} rows ready &bull; Click any cell to edit &bull; Tab to move</span>
          </div>
          <div className="m-foot-actions">
            <button className="btn-cancel-m" onClick={onClose}>Cancel</button>
            <button className="btn-confirm-m" onClick={handleConfirm} disabled={rows.length === 0}>
              <UploadCloud size={16} />
              Validate These {rows.length} Rows
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [finalReport, setFinalReport] = useState<any>(null)
  const [validationJobId, setValidationJobId] = useState<number | null>(null)
  const pollRef = useRef<any>(null)
  const [importJobId, setImportJobId] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  // ── NEW ──
  const [showCsvModal, setShowCsvModal] = useState(false)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const downloadTemplate = async () => {
    try {
      const res = await axios.get('/admin/products/bulk-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'bulk-products-template.csv'; a.click()
      toast.success('Template downloaded')
    } catch { toast.error('Template download failed') }
  }

  const runFakeProgress = (type: 'validate' | 'import') => {
    let value = 0; setProgress(0)
    const texts = type === 'validate'
      ? ['Uploading files...', 'Reading CSV...', 'Checking rows...', 'Preparing report...']
      : ['Uploading images...', 'Importing products...', 'Saving data...', 'Finalizing report...']
    let step = 0; setProgressText(texts[0])
    const timer = setInterval(() => {
      value += Math.floor(Math.random() * 12) + 4
      if (value > 92) value = 92
      setProgress(value)
      if (step < texts.length - 1 && value > (step + 1) * 22) { step++; setProgressText(texts[step]) }
    }, 500)
    return timer
  }

  const pollJob = (id: number, type: 'validate' | 'import') => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get('/admin/jobs?page=1&limit=100')
        const rows = res?.data?.data || []
        const job = rows.find((x: any) => x.id === id)
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
          clearInterval(pollRef.current); pollRef.current = null
          setProgress(100)
          setProgressText(type === 'validate' ? 'Validation completed' : 'Import completed')
          if (type === 'validate') {
            setResult({
              summary: { totalRows: job.result?.totalRows || 0, validRows: job.result?.validRows || 0, failedRows: job.result?.failedRows || 0 },
              errors: job.result?.errors || [],
            })
          } else {
            setFinalReport({
              summary: { imported: job.result?.imported || 0, failed: job.result?.failed?.length || 0, total: job.result?.total || 0 },
              failed: job.result?.failed || [],
            })
          }
          toast.success(type === 'validate' ? 'Validation completed' : 'Import completed')
          setTimeout(() => { setProgress(0); setProgressText('') }, 2500)
        }
        if (job.status === 'failed') {
          clearInterval(pollRef.current); pollRef.current = null
          toast.error(job.error_text || 'Job failed'); setProgress(0); setProgressText('')
        }
      } catch (err) { console.error(err) }
    }, 2000)
  }

  // accepts optional edited file from modal
  const submit = async (fileOverride?: File) => {
    const file = fileOverride ?? csvFile
    if (!file) return toast.error('Please upload CSV file')
    try {
      setLoading(true); setResult(null); setFinalReport(null); setValidationJobId(null)
      setProgress(5); setProgressText('Uploading files...')
      const form = new FormData()
      form.append('file', file)
      if (zipFile) form.append('imagesZip', zipFile)
      const res = await axios.post('/admin/products/bulk-upload', form)
      const jobId = res?.data?.data?.jobId
      setValidationJobId(jobId)
      toast.success(res?.data?.message || 'Validation started')
      pollJob(jobId, 'validate')
    } catch (err: any) {
      setProgress(0); setProgressText('')
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  const downloadCategoryList = async () => {
    try {
      const res = await axios.get('/admin/products/category-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'categories-master.csv'; a.click()
      toast.success('Categories downloaded')
    } catch { toast.error('Download failed') }
  }

  const confirmImport = async () => {
    if (!validationJobId) return toast.error('Please validate first')
    try {
      setImporting(true); setProgress(5); setProgressText('Starting import...')
      const res = await axios.post('/admin/products/bulk-import', { validationJobId })
      const jobId = res?.data?.data?.jobId
      toast.success(res?.data?.message || 'Import started')
      pollJob(jobId, 'import')
    } catch (err: any) {
      setProgress(0); setProgressText('')
      toast.error(err?.response?.data?.message || 'Import failed')
    } finally { setImporting(false) }
  }

  const downloadFailedCsv = (rows: any[] = []) => {
    if (!rows.length) return toast.error('No failed rows found')
    const headers = ['row', 'sku', 'error']
    const csvRows = rows.map((item: any) => [item.row, item.sku, item.error || item.errors?.join(' | ') || ''])
    const csv = [headers.join(','), ...csvRows.map((r: any) => r.map((x: any) => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'failed-rows.csv'; a.click()
    window.URL.revokeObjectURL(url)
  }

  function GuideCard({ title, desc }: any) {
    return (
      <div className="guide-card">
        <div className="guide-card-icon-wrap"><span className="guide-card-num">{title.split('.')[0]}</span></div>
        <div>
          <h3 className="guide-card-title">{title.split('. ')[1]}</h3>
          <p className="guide-card-desc">{desc}</p>
        </div>
        <style>{`
          .guide-card{display:flex;align-items:flex-start;gap:14px;border:1.5px solid #e5e7eb;border-radius:16px;padding:20px 18px;background:#ffffff;transition:box-shadow 0.2s,border-color 0.2s,transform 0.18s;position:relative;overflow:hidden;}
          .guide-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#059669,#10b981);border-radius:16px 16px 0 0;}
          .guide-card:hover{box-shadow:0 8px 30px rgba(16,185,129,0.10);border-color:#6ee7b7;transform:translateY(-2px);}
          .guide-card-icon-wrap{min-width:38px;height:38px;background:linear-gradient(135deg,#ecfdf5 60%,#d1fae5);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:#059669;flex-shrink:0;}
          .guide-card-title{font-size:14px;font-weight:700;color:#111827;margin-bottom:3px;}
          .guide-card-desc{font-size:12.5px;color:#6b7280;line-height:1.5;}
        `}</style>
      </div>
    )
  }

  function StatCard({ title, value }: any) {
    const isImported = title === 'Imported' || title === 'Valid Rows'
    const isFailed = title === 'Failed' || title === 'Failed Rows'
    return (
      <div className="stat-card">
        <p className="stat-label">{title}</p>
        <h3 className={`stat-value ${isImported ? 'stat-green' : isFailed && value > 0 ? 'stat-red' : ''}`}>{value}</h3>
        <style>{`
          .stat-card{background:#fff;border:1.5px solid #e5e7eb;border-radius:18px;padding:22px 24px 18px;transition:box-shadow 0.2s,transform 0.18s;position:relative;overflow:hidden;}
          .stat-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#e5e7eb,#f3f4f6);border-radius:0 0 18px 18px;}
          .stat-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.07);transform:translateY(-2px);}
          .stat-label{font-size:12.5px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;}
          .stat-value{font-size:2.2rem;font-weight:800;color:#111827;line-height:1.1;}
          .stat-green{color:#059669;} .stat-red{color:#dc2626;}
        `}</style>
      </div>
    )
  }

  return (
    <>
      <CsvPreviewModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        csvFile={csvFile}
        onConfirm={(editedFile) => {
          setCsvFile(editedFile)
          setShowCsvModal(false)
          submit(editedFile)
        }}
      />

      <div className="bulk-page">
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          .bulk-page{max-width:1100px;margin:0 auto;padding:24px 16px 48px;font-family:'Inter','Segoe UI',sans-serif;}
          .bulk-header{display:flex;flex-direction:column;gap:16px;margin-bottom:28px;}
          @media(min-width:768px){.bulk-header{flex-direction:row;align-items:center;justify-content:space-between;}}
          .bulk-title{font-size:clamp(1.4rem,3vw,1.9rem);font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:0 0 4px;}
          .bulk-subtitle{font-size:13.5px;color:#64748b;margin:0;}
          .header-actions{display:flex;flex-wrap:wrap;gap:10px;}
          .btn-outline{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:10px;border:1.5px solid #d1d5db;background:#fff;color:#374151;font-size:13.5px;font-weight:600;cursor:pointer;transition:border-color 0.18s,background 0.18s,box-shadow 0.18s;white-space:nowrap;}
          .btn-outline:hover{border-color:#059669;color:#059669;background:#f0fdf4;box-shadow:0 2px 8px rgba(5,150,105,0.10);}
          .progress-wrap{background:#fff;border:1.5px solid #e5e7eb;border-radius:18px;padding:20px 22px;margin-bottom:24px;box-shadow:0 2px 12px rgba(5,150,105,0.06);}
          .progress-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
          .progress-text{font-size:13.5px;font-weight:600;color:#059669;}
          .progress-pct{font-size:13px;font-weight:700;color:#374151;}
          .progress-track{height:8px;background:#f1f5f9;border-radius:100px;overflow:hidden;margin-bottom:10px;}
          .progress-fill{height:100%;background:linear-gradient(90deg,#059669,#34d399);border-radius:100px;transition:width 0.5s cubic-bezier(.4,0,.2,1);position:relative;}
          .progress-fill::after{content:'';position:absolute;top:0;right:0;width:20px;height:100%;background:rgba(255,255,255,0.35);border-radius:100px;animation:shimmer 1.2s infinite;}
          @keyframes shimmer{0%{opacity:0;transform:translateX(-10px)}50%{opacity:1}100%{opacity:0;transform:translateX(10px)}}
          .progress-note{font-size:11.5px;color:#9ca3af;}
          .guide-section{background:#fff;border:1.5px solid #e5e7eb;border-radius:22px;padding:28px 24px;margin-bottom:24px;box-shadow:0 1px 6px rgba(0,0,0,0.04);}
          .guide-section-title{font-size:1.1rem;font-weight:800;color:#0f172a;margin:0 0 4px;}
          .guide-section-sub{font-size:13px;color:#64748b;margin:0 0 22px;}
          .guide-steps{display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:26px;}
          @media(min-width:640px){.guide-steps{grid-template-columns:repeat(3,1fr);}}
          .example-grid{display:grid;grid-template-columns:1fr;gap:18px;margin-bottom:22px;}
          @media(min-width:1024px){.example-grid{grid-template-columns:1fr 1fr;}}
          .example-box{border:1.5px solid #e5e7eb;border-radius:16px;overflow:hidden;}
          .example-header{padding:11px 16px;background:linear-gradient(90deg,#f8fafc,#f1f5f9);font-size:13px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb;letter-spacing:0.01em;}
          .example-table{width:100%;border-collapse:collapse;font-size:12px;}
          .example-table th{padding:9px 12px;background:#f8fafc;color:#6b7280;font-weight:700;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
          .example-table td{padding:9px 12px;color:#374151;border-bottom:1px solid #f9fafb;white-space:nowrap;}
          .example-table tr:last-child td{border-bottom:none;}
          .example-table tr:hover td{background:#f8fafc;}
          .zip-preview{padding:18px 20px;font-family:'JetBrains Mono','Fira Mono',monospace;font-size:12.5px;color:#374151;line-height:1.8;}
          .zip-root{color:#059669;font-weight:700;}
          .zip-file{color:#374151;margin-left:24px;display:block;}
          .zip-file::before{content:'├─ ';color:#9ca3af;}
          .notes-box{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fcd34d;border-radius:14px;padding:16px 20px;font-size:13px;color:#92400e;line-height:1.7;}
          .notes-box span{display:block;}
          .notes-box span::before{content:'• ';color:#f59e0b;font-weight:700;}
          .upload-grid{display:grid;grid-template-columns:1fr;gap:18px;margin-bottom:22px;}
          @media(min-width:768px){.upload-grid{grid-template-columns:1fr 1fr;}}
          .rules-box{background:#fff;border:1.5px solid #e5e7eb;border-radius:18px;padding:22px 24px;margin-bottom:22px;}
          .rules-title{display:flex;align-items:center;gap:9px;font-size:14.5px;font-weight:700;color:#0f172a;margin-bottom:14px;}
          .rules-list{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr;gap:8px;}
          @media(min-width:640px){.rules-list{grid-template-columns:1fr 1fr;}}
          .rules-list li{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;color:#4b5563;line-height:1.5;}
          .rules-list li::before{content:'✓';color:#059669;font-weight:700;font-size:13px;margin-top:1px;flex-shrink:0;}
          .stat-grid{display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:20px;}
          @media(min-width:640px){.stat-grid{grid-template-columns:repeat(3,1fr);}}
          .result-table-wrap{background:#fff;border:1.5px solid #e5e7eb;border-radius:18px;overflow:hidden;margin-bottom:16px;}
          .result-table-header{padding:14px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#0f172a;background:linear-gradient(90deg,#f8fafc,#fff);}
          .result-table{width:100%;border-collapse:collapse;font-size:13px;}
          .result-table th{padding:11px 16px;background:#f8fafc;text-align:left;font-weight:700;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f1f5f9;}
          .result-table td{padding:11px 16px;border-bottom:1px solid #f9fafb;color:#374151;}
          .result-table tr:last-child td{border-bottom:none;}
          .result-table tr:hover td{background:#fafafa;}
          .error-cell{color:#dc2626;font-size:12.5px;}
          .import-confirm-box{background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1.5px solid #6ee7b7;border-radius:16px;padding:20px 22px;margin-bottom:20px;display:flex;flex-direction:column;gap:14px;}
          @media(min-width:640px){.import-confirm-box{flex-direction:row;align-items:center;justify-content:space-between;}}
          .import-confirm-text{font-size:13.5px;color:#065f46;font-weight:500;}
          .btn-validate{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 32px;border-radius:12px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-size:14.5px;font-weight:700;cursor:pointer;border:none;box-shadow:0 4px 16px rgba(5,150,105,0.22);transition:opacity 0.18s,transform 0.18s,box-shadow 0.18s;width:100%;letter-spacing:0.01em;}
          @media(min-width:768px){.btn-validate{width:auto;}}
          .btn-validate:hover:not(:disabled){opacity:0.93;transform:translateY(-1px);box-shadow:0 6px 22px rgba(5,150,105,0.30);}
          .btn-validate:disabled{opacity:0.55;cursor:not-allowed;}
          .btn-import{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-size:14px;font-weight:700;cursor:pointer;border:none;box-shadow:0 4px 14px rgba(37,99,235,0.20);transition:opacity 0.18s,transform 0.18s;white-space:nowrap;}
          .btn-import:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);}
          .btn-import:disabled{opacity:0.55;cursor:not-allowed;}
          .btn-download-failed{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:10px;border:1.5px solid #fca5a5;background:#fff;color:#dc2626;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.18s,border-color 0.18s;}
          .btn-download-failed:hover{background:#fef2f2;}
          .section-divider{height:1px;background:linear-gradient(90deg,transparent,#e5e7eb,transparent);margin:8px 0 24px;}
          /* CSV ready banner */
          .csv-ready-banner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#f0fdf4;border:1.5px solid #6ee7b7;border-radius:14px;padding:14px 18px;margin-bottom:18px;}
          .csv-ready-left{display:flex;align-items:center;gap:10px;font-size:13.5px;color:#065f46;font-weight:500;}
          .btn-preview-csv{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:1.5px solid #a7f3d0;background:#fff;color:#065f46;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.15s,border-color 0.15s,box-shadow 0.15s;white-space:nowrap;}
          .btn-preview-csv:hover{background:#dcfce7;border-color:#6ee7b7;box-shadow:0 2px 8px rgba(5,150,105,0.12);}
        `}</style>

        {/* Header */}
        <div className="bulk-header">
          <div>
            <h1 className="bulk-title">Bulk Product Upload</h1>
            <p className="bulk-subtitle">Import hundreds of products in one go with category-based GST auto fill</p>
          </div>
          <div className="header-actions">
            <button onClick={downloadTemplate} className="btn-outline"><Download size={16} />Download Template</button>
            <button onClick={downloadCategoryList} className="btn-outline"><Download size={16} />Categories CSV</button>
          </div>
        </div>

        {/* Progress */}
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

        {/* Guide */}
        <div className="guide-section">
          <h2 className="guide-section-title">How Bulk Upload Works</h2>
          <p className="guide-section-sub">Follow the examples below for smooth import.</p>
          <div className="guide-steps">
            <GuideCard title="1. Prepare CSV" desc="Download template and fill product details. GST / HSN optional." />
            <GuideCard title="2. Prepare ZIP" desc="Rename images using SKU format." />
            <GuideCard title="3. Upload & Import" desc="Upload files and start bulk process." />
          </div>
          <div className="example-grid">
            <div className="example-box">
              <div className="example-header">📄 CSV Example</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="example-table">
                  <thead><tr><th>name</th><th>sku</th><th>price</th><th>inventory</th><th>category_id</th><th>gst%</th><th>hsn</th></tr></thead>
                  <tbody>
                    <tr><td>iPhone 15</td><td>APL001</td><td>79999</td><td>10</td><td>1</td><td>18</td><td>8517</td></tr>
                    <tr><td>Nike Shoes</td><td>NK101</td><td>2999</td><td>25</td><td>2</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
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

        {/* Upload Cards */}
        <div className="upload-grid">
          <UploadCard
            title="Upload CSV File"
            icon={<FileSpreadsheet size={20} />}
            file={csvFile}
            accept=".csv"
            onChange={(f: File) => { setCsvFile(f); setResult(null); setFinalReport(null); setValidationJobId(null) }}
            hint="Required • Use downloaded template"
          />
          <UploadCard
            title="Upload Images ZIP"
            icon={<FileArchive size={20} />}
            file={zipFile}
            accept=".zip"
            onChange={(f: File) => { setZipFile(f); setResult(null); setFinalReport(null); setValidationJobId(null) }}
            hint="Optional • Images named SKU-1.jpg"
          />
        </div>

        {/* CSV Ready Banner — shows Preview & Edit button */}
        {csvFile && (
          <div className="csv-ready-banner">
            <div className="csv-ready-left">
              <FileSpreadsheet size={18} color="#059669" />
              <span><strong>{csvFile.name}</strong> selected — preview and edit rows before validating</span>
            </div>
            <button className="btn-preview-csv" onClick={() => setShowCsvModal(true)}>
              <Eye size={15} />
              Preview &amp; Edit CSV
            </button>
          </div>
        )}

        {/* Rules */}
        <div className="rules-box">
          <div className="rules-title"><ShieldCheck size={18} color="#059669" />Upload Rules</div>
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

        {/* Validation Result */}
        {result && (
          <div style={{ marginBottom: '24px' }}>
            <div className="section-divider" />
            <div className="stat-grid">
              <StatCard title="Total Rows" value={result?.summary?.totalRows || 0} />
              <StatCard title="Valid Rows" value={result?.summary?.validRows || 0} />
              <StatCard title="Failed Rows" value={result?.summary?.failedRows || 0} />
            </div>
            {result?.errors?.length > 0 && (
              <div className="result-table-wrap">
                <div className="result-table-header">Validation Errors</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="result-table">
                    <thead><tr><th>Row</th><th>SKU</th><th>Issues</th></tr></thead>
                    <tbody>
                      {result.errors.map((item: any, i: number) => (
                        <tr key={i}><td>{item.row}</td><td>{item.sku}</td><td className="error-cell">{item.errors.join(', ')}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {result?.errors?.length > 0 && (
              <button className="btn-download-failed" onClick={() => downloadFailedCsv(result.errors)}>
                <Download size={15} />Download Failed Rows CSV
              </button>
            )}
          </div>
        )}

        {/* Import Confirm */}
        {result && validationJobId && result?.summary?.validRows > 0 && (
          <div className="import-confirm-box">
            <p className="import-confirm-text">
              ✅ Files validated successfully. <strong>{result.summary.validRows} valid rows</strong> are ready to import.
            </p>
            <button onClick={confirmImport} disabled={importing} className="btn-import">
              {importing && <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />}
              Import Valid Rows
            </button>
          </div>
        )}

        {/* Final Report */}
        {finalReport && (
          <div style={{ marginBottom: '24px' }}>
            <div className="section-divider" />
            <div className="stat-grid">
              <StatCard title="Imported" value={finalReport?.summary?.imported || 0} />
              <StatCard title="Failed" value={finalReport?.summary?.failed || 0} />
              <StatCard title="Total" value={finalReport?.summary?.total || 0} />
            </div>
            {finalReport?.failed?.length > 0 && (
              <div className="result-table-wrap">
                <div className="result-table-header">Failed Rows</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="result-table">
                    <thead><tr><th>Row</th><th>SKU</th><th>Error</th></tr></thead>
                    <tbody>
                      {finalReport.failed.map((item: any, i: number) => (
                        <tr key={i}><td>{item.row}</td><td>{item.sku}</td><td className="error-cell">{item.error}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {finalReport?.failed?.length > 0 && (
              <button className="btn-download-failed" onClick={() => downloadFailedCsv(finalReport.failed)}>
                <Download size={15} />Download Failed Rows CSV
              </button>
            )}
          </div>
        )}

        {/* Submit */}
        <button onClick={() => submit()} disabled={loading} className="btn-validate">
          {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
          <UploadCloud size={18} />
          Validate Files
        </button>
      </div>
    </>
  )
}

// ─── Upload Card ─────────────────────────────────────────────────────────────

function UploadCard({ title, icon, file, accept, onChange, hint }: any) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: any) => {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onChange(dropped)
  }

  return (
    <label className="upload-card-label">
      <style>{`
        .upload-card-label{display:block;cursor:pointer;}
        .upload-card-title{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px;}
        .upload-drop-zone{border:2px dashed #d1d5db;border-radius:18px;padding:36px 24px;text-align:center;background:#fafafa;transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;}
        .upload-drop-zone.dragging{border-color:#059669;background:#f0fdf4;box-shadow:0 0 0 4px rgba(5,150,105,0.08);}
        .upload-drop-zone.has-file{border-color:#6ee7b7;background:#f0fdf4;}
        .upload-drop-zone:hover{border-color:#10b981;background:#f0fdf4;}
        .upload-file-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#059669;}
        .upload-main-text{font-size:13.5px;font-weight:600;color:#374151;margin-bottom:4px;}
        .upload-sub-text{font-size:12px;color:#9ca3af;}
        .upload-file-name{font-size:13px;font-weight:600;color:#059669;word-break:break-all;margin-bottom:4px;}
        .upload-file-badge{display:inline-block;padding:2px 10px;background:#dcfce7;color:#166534;border-radius:100px;font-size:11px;font-weight:600;}
        .upload-hint{font-size:12px;color:#9ca3af;margin-top:10px;}
      `}</style>
      <div className="upload-card-title">{icon}{title}</div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`upload-drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      >
        {file ? (
          <div>
            <div className="upload-file-icon"><UploadCloud size={22} /></div>
            <div className="upload-file-name">{file.name}</div>
            <span className="upload-file-badge">✓ Ready</span>
          </div>
        ) : (
          <div>
            <div className="upload-file-icon"><UploadCloud size={22} /></div>
            <div className="upload-main-text">Drag &amp; Drop file here</div>
            <div className="upload-sub-text">or click to browse</div>
          </div>
        )}
      </div>
      <p className="upload-hint">{hint}</p>
      <input hidden type="file" accept={accept} onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
    </label>
  )
}