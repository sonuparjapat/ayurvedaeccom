'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { UploadCloud, Loader2, Info, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import axios from '@/lib/axios'

/* ─────────────────────────────────────────────
   SHARED STYLES (injected once per component)
───────────────────────────────────────────── */
const BASE_STYLE = `
  .bui-info-panel{background:#fff;border:1.5px solid #e5e7eb;border-radius:20px;overflow:hidden;margin-bottom:8px;}
  .bui-info-header{display:flex;align-items:center;gap:10px;padding:16px 20px 14px;background:linear-gradient(90deg,#f0fdf4,#f8fafc);border-bottom:1px solid #e5e7eb;}
  .bui-info-icon{width:34px;height:34px;border-radius:10px;background:#dcfce7;display:flex;align-items:center;justify-content:center;color:#059669;flex-shrink:0;}
  .bui-info-title{font-size:14.5px;font-weight:800;color:#0f172a;margin:0 0 2px;}
  .bui-info-subtitle{font-size:12px;color:#64748b;margin:0;}
  .bui-info-body{padding:20px;}
  .bui-fields-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:18px;}
  @media(min-width:640px){.bui-fields-grid{grid-template-columns:1fr 1fr;}}
  @media(min-width:1024px){.bui-fields-grid{grid-template-columns:1fr 1fr 1fr;}}
  .bui-field-card{border:1px solid #f1f5f9;border-radius:12px;padding:13px 15px;background:#fafafa;position:relative;overflow:hidden;}
  .bui-field-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#059669,#10b981);border-radius:3px 0 0 3px;}
  .bui-field-name{font-size:12px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;}
  .bui-field-purpose{font-size:12px;color:#4b5563;line-height:1.5;margin-bottom:6px;}
  .bui-field-example{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#059669;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:3px 8px;}
  .bui-field-example::before{content:'eg: ';color:#6ee7b7;}
  .bui-field-required{position:absolute;top:10px;right:10px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;}
  .bui-field-req{background:#fef2f2;color:#dc2626;}
  .bui-field-opt{background:#f0fdf4;color:#059669;}
  .bui-csv-box{border:1.5px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:16px;}
  .bui-csv-header{padding:10px 16px;background:linear-gradient(90deg,#f8fafc,#f1f5f9);font-size:12.5px;font-weight:700;color:#374151;border-bottom:1px solid #e5e7eb;}
  .bui-csv-pre{margin:0;padding:14px 16px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:12px;line-height:1.8;color:#374151;background:#fafafa;overflow-x:auto;}
  .bui-notes{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fcd34d;border-radius:12px;padding:14px 18px;}
  .bui-notes-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#92400e;margin-bottom:10px;}
  .bui-notes-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:5px;}
  .bui-notes-list li{font-size:12.5px;color:#92400e;display:flex;align-items:flex-start;gap:7px;line-height:1.5;}
  .bui-notes-list li::before{content:'•';color:#f59e0b;font-weight:700;flex-shrink:0;margin-top:1px;}
`

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export interface FieldDef {
  name: string
  purpose: string
  example: string
  required?: boolean
}

export interface InfoPanelProps {
  title: string
  subtitle: string
  purpose: string
  fields: FieldDef[]
  csvExample: string
  notes: string[]
}

/* ─────────────────────────────────────────────
   ADMIN INFO PANEL — main reusable component
───────────────────────────────────────────── */
export function AdminInfoPanel({ title, subtitle, purpose, fields, csvExample, notes }: InfoPanelProps) {
  return (
    <div className="bui-info-panel">
      <style>{BASE_STYLE}</style>

      {/* Header */}
      <div className="bui-info-header">
        <div className="bui-info-icon"><Info size={17} /></div>
        <div>
          <p className="bui-info-title">{title}</p>
          <p className="bui-info-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="bui-info-body">
        {/* Purpose */}
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, marginBottom: 18, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #6ee7b7' }}>
          {purpose}
        </p>

        {/* Field definitions */}
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Column Reference</p>
        <div className="bui-fields-grid">
          {fields.map(f => (
            <div key={f.name} className="bui-field-card">
              <span className={`bui-field-required ${f.required ? 'bui-field-req' : 'bui-field-opt'}`}>
                {f.required ? 'Required' : 'Optional'}
              </span>
              <p className="bui-field-name">{f.name}</p>
              <p className="bui-field-purpose">{f.purpose}</p>
              <span className="bui-field-example">{f.example}</span>
            </div>
          ))}
        </div>

        {/* CSV example */}
        <div className="bui-csv-box">
          <div className="bui-csv-header">📄 CSV Format Example</div>
          <pre className="bui-csv-pre">{csvExample}</pre>
        </div>

        {/* Notes */}
        {notes.length > 0 && (
          <div className="bui-notes">
            <div className="bui-notes-title">
              <AlertTriangle size={14} />
              Important Notes
            </div>
            <ul className="bui-notes-list">
              {notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   EXISTING COMPONENTS (kept + enhanced)
───────────────────────────────────────────── */
export function BulkPageHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, marginBottom: 4 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h1 style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{title}</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  )
}

export function BulkUploadBox({ file, setFile, label, hint }: { file: File | null; setFile: (f: File) => void; label?: string; hint?: string }) {
  return (
    <label style={{ display: 'block', cursor: 'pointer' }}>
      <style>{`
        .bui-upload-zone{border:2px dashed #d1d5db;border-radius:18px;padding:32px 24px;text-align:center;background:#fafafa;transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;}
        .bui-upload-zone:hover{border-color:#10b981;background:#f0fdf4;box-shadow:0 0 0 4px rgba(5,150,105,0.06);}
        .bui-upload-zone.has-file{border-color:#6ee7b7;background:#f0fdf4;}
      `}</style>
      {label && <p style={{ fontSize: 13.5, fontWeight: 700, color: '#374151', marginBottom: 8 }}>{label}</p>}
      <div className={`bui-upload-zone${file ? ' has-file' : ''}`}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#059669' }}>
          <UploadCloud size={22} />
        </div>
        {file ? (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#059669', marginBottom: 4, wordBreak: 'break-all' }}>{file.name}</p>
            <span style={{ display: 'inline-block', padding: '2px 10px', background: '#dcfce7', color: '#166534', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>✓ Ready to upload</span>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Drag &amp; drop or click to browse</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Only .csv files supported</p>
          </>
        )}
      </div>
      {hint && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{hint}</p>}
      <input hidden type="file" accept=".csv" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
    </label>
  )
}

export function BulkSubmitButton({ loading, text, onClick }: { loading: boolean; text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '13px 32px', borderRadius: 12, border: 'none',
        background: loading ? '#d1fae5' : 'linear-gradient(135deg,#059669,#10b981)',
        color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 16px rgba(5,150,105,0.22)',
        transition: 'opacity 0.18s,transform 0.18s', opacity: loading ? 0.7 : 1,
      }}
    >
      {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
      {text}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}

export function BulkSummaryStats({ report }: { report: any }) {
  if (!report) return null

  const stats = [
    { label: 'Updated', value: report?.summary?.updated ?? report?.summary?.imported ?? 0, color: '#059669' },
    { label: 'Failed', value: report?.summary?.failed ?? 0, color: '#dc2626' },
    { label: 'Total', value: report?.summary?.total ?? 0, color: '#374151' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, margin: '4px 0' }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${s.color}40,${s.color})` }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.label}</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: s.value > 0 ? s.color : '#374151', margin: 0, lineHeight: 1.1 }}>{s.value}</h3>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   BulkJobStatus — live-polls a queued job
   Show this after submit instead of a raw toast.
   Props:
     jobId   – returned from the queue API
     onDone  – called when job completes (with result data)
───────────────────────────────────────────── */
export function BulkJobStatus({ jobId, onDone }: { jobId: number; onDone?: (result: any) => void }) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [result, setResult] = useState<any>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const res = await axios.get(`/admin/jobs/${jobId}`)
        const job = res.data?.data
        if (!job) return
        setStatus(job.status)
        if (job.status === 'completed') {
          setResult(job.result)
          onDone?.(job.result)
          if (timerRef.current) clearInterval(timerRef.current)
        } else if (job.status === 'failed') {
          setErrorText(job.error_text || 'Job failed')
          if (timerRef.current) clearInterval(timerRef.current)
        }
      } catch { /* ignore poll errors */ }
    }

    poll()
    timerRef.current = setInterval(poll, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [jobId])

  const isRunning = status === 'pending' || status === 'processing'

  const BG = {
    pending: '#fff7ed',
    processing: '#f0fdf4',
    completed: '#f0fdf4',
    failed: '#fef2f2',
  }
  const BORDER = {
    pending: '#fed7aa',
    processing: '#6ee7b7',
    completed: '#6ee7b7',
    failed: '#fca5a5',
  }

  return (
    <div style={{ background: BG[status], border: `1.5px solid ${BORDER[status]}`, borderRadius: 16, padding: '18px 20px', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: result?.summary ? 14 : 0 }}>
        {isRunning && <Loader2 size={20} style={{ color: '#059669', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
        {status === 'completed' && <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0 }} />}
        {status === 'failed' && <XCircle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />}
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: status === 'failed' ? '#991b1b' : '#0f172a' }}>
            {status === 'pending' && 'Your file is in the queue — processing will start shortly…'}
            {status === 'processing' && 'Processing your CSV file — please wait…'}
            {status === 'completed' && 'Done! Your CSV has been processed successfully.'}
            {status === 'failed' && 'Processing failed — see details below.'}
          </p>
          {isRunning && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>
              This page updates automatically every 3 seconds. Job #{jobId}
            </p>
          )}
          {status === 'failed' && errorText && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#dc2626' }}>{errorText}</p>
          )}
        </div>
      </div>

      {/* Results summary */}
      {status === 'completed' && result?.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Updated', value: result.summary.updated ?? result.summary.imported ?? 0, color: '#059669' },
            { label: 'Failed rows', value: result.summary.failed ?? 0, color: result.summary.failed > 0 ? '#dc2626' : '#374151' },
            { label: 'Total rows', value: result.summary.total ?? 0, color: '#374151' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Failed rows download */}
      {status === 'completed' && result?.failed?.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fca5a5' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
            {result.failed.length} rows could not be processed — check below for the reason.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#dc2626' }}>
            Go to <strong>Logs → Bulk Jobs</strong> to download the failed rows CSV.
          </p>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/** @deprecated use AdminInfoPanel + BulkExampleCard is no longer needed */
export function BulkExampleCard({ title, lines }: { title: string; lines: string }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
      <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{title}</p>
      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: '#374151', margin: 0, background: '#f8fafc', padding: '12px 14px', borderRadius: 10 }}>{lines}</pre>
    </div>
  )
}
