'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, X, Loader2, AlertCircle, CheckCircle2, Trash2, UploadCloud } from 'lucide-react'

interface BulkCsvPreviewProps {
  open: boolean
  onClose: () => void
  csvFile: File | null
  onConfirm: (editedFile: File) => void
  confirmLabel?: string
}

export default function BulkCsvPreview({
  open,
  onClose,
  csvFile,
  onConfirm,
  confirmLabel,
}: BulkCsvPreviewProps) {
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

  const label = confirmLabel ?? `Submit These ${rows.length} Rows`

  return (
    <div className="bcpv-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="bcpv-box">
        <style>{`
          .bcpv-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(3px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:bcpvFade 0.18s ease;}
          @keyframes bcpvFade{from{opacity:0}to{opacity:1}}
          .bcpv-box{background:#fff;border-radius:22px;width:100%;max-width:980px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.18);animation:bcpvUp 0.22s cubic-bezier(.4,0,.2,1);overflow:hidden;}
          @keyframes bcpvUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
          .bcpv-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 18px;border-bottom:1px solid #f1f5f9;flex-shrink:0;}
          .bcpv-head-left{display:flex;align-items:center;gap:12px;}
          .bcpv-head-icon{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);display:flex;align-items:center;justify-content:center;color:#059669;}
          .bcpv-title{font-size:16px;font-weight:800;color:#0f172a;margin:0 0 2px;}
          .bcpv-meta{font-size:12px;color:#64748b;margin:0;}
          .bcpv-close{width:34px;height:34px;border-radius:10px;border:1.5px solid #e5e7eb;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;transition:background 0.15s,color 0.15s;flex-shrink:0;}
          .bcpv-close:hover{background:#fef2f2;color:#dc2626;border-color:#fca5a5;}
          .bcpv-toolbar{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#f8fafc;border-bottom:1px solid #f1f5f9;gap:10px;flex-wrap:wrap;flex-shrink:0;}
          .bcpv-toolbar-left{display:flex;align-items:center;gap:8px;}
          .bcpv-badge{padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;}
          .bcpv-b-rows{background:#e0f2fe;color:#0369a1;}
          .bcpv-b-cols{background:#f3e8ff;color:#7c3aed;}
          .bcpv-add-row{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:1.5px dashed #d1d5db;background:#fff;color:#374151;font-size:12.5px;font-weight:600;cursor:pointer;transition:border-color 0.15s,background 0.15s;}
          .bcpv-add-row:hover{border-color:#059669;color:#059669;background:#f0fdf4;}
          .bcpv-body{flex:1;overflow:auto;padding:0;}
          .bcpv-tbl{width:100%;border-collapse:collapse;font-size:13px;}
          .bcpv-tbl thead{position:sticky;top:0;z-index:10;}
          .bcpv-tbl thead tr{background:#f1f5f9;}
          .bcpv-tbl th{padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;border-bottom:2px solid #e2e8f0;border-right:1px solid #e2e8f0;}
          .bcpv-tbl th:last-child{border-right:none;}
          .bcpv-th-num{width:50px;text-align:center;color:#94a3b8;}
          .bcpv-th-act{width:52px;text-align:center;}
          .bcpv-tbl tbody tr{transition:background 0.12s;}
          .bcpv-tbl tbody tr:nth-child(even){background:#fafbfc;}
          .bcpv-tbl tbody tr:hover{background:#f0fdf4;}
          .bcpv-tbl tbody tr:hover .bcpv-del{opacity:1;}
          .bcpv-tbl td{padding:0;border-bottom:1px solid #f1f5f9;border-right:1px solid #f1f5f9;vertical-align:middle;}
          .bcpv-tbl td:last-child{border-right:none;}
          .bcpv-td-num{text-align:center;font-size:11px;color:#94a3b8;font-weight:600;padding:0 8px;width:50px;background:#f8fafc;}
          .bcpv-cell-view{padding:9px 12px;min-height:38px;cursor:text;display:flex;align-items:center;color:#1e293b;font-size:13px;}
          .bcpv-cell-view:hover{background:rgba(5,150,105,0.04);}
          .bcpv-cell-empty{color:#cbd5e1;font-style:italic;font-size:12px;}
          .bcpv-cell-input{width:100%;padding:8px 12px;border:none;outline:none;background:#fff;font-size:13px;color:#0f172a;box-shadow:inset 0 0 0 2px #059669;border-radius:0;min-width:120px;}
          .bcpv-td-act{text-align:center;width:52px;padding:0 6px;}
          .bcpv-del{opacity:0;width:28px;height:28px;border-radius:8px;border:1.5px solid #fca5a5;background:#fff;color:#dc2626;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 0.15s,background 0.15s;}
          .bcpv-del:hover{background:#fef2f2;}
          .bcpv-foot{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-top:1px solid #f1f5f9;flex-shrink:0;background:#fff;gap:12px;flex-wrap:wrap;}
          .bcpv-foot-left{display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;}
          .bcpv-foot-actions{display:flex;align-items:center;gap:10px;}
          .bcpv-btn-cancel{padding:10px 22px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#374151;font-size:13.5px;font-weight:600;cursor:pointer;transition:background 0.15s;}
          .bcpv-btn-cancel:hover{background:#f8fafc;}
          .bcpv-btn-confirm{display:inline-flex;align-items:center;gap:8px;padding:10px 26px;border-radius:10px;border:none;background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(5,150,105,0.22);transition:opacity 0.15s,transform 0.15s;}
          .bcpv-btn-confirm:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);}
          .bcpv-btn-confirm:disabled{opacity:0.5;cursor:not-allowed;}
          .bcpv-parsing{display:flex;align-items:center;justify-content:center;height:200px;gap:12px;color:#64748b;font-size:14px;}
          .bcpv-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#94a3b8;font-size:13px;gap:8px;}
          @keyframes bcpvSpin{to{transform:rotate(360deg)}}
        `}</style>

        <div className="bcpv-head">
          <div className="bcpv-head-left">
            <div className="bcpv-head-icon"><Eye size={20} /></div>
            <div>
              <p className="bcpv-title">Preview &amp; Edit CSV</p>
              <p className="bcpv-meta">{csvFile?.name} — review and edit before submitting</p>
            </div>
          </div>
          <button className="bcpv-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="bcpv-toolbar">
          <div className="bcpv-toolbar-left">
            <span className="bcpv-badge bcpv-b-rows">{rows.length} rows</span>
            <span className="bcpv-badge bcpv-b-cols">{headers.length} columns</span>
          </div>
          <button className="bcpv-add-row" onClick={addRow}>+ Add Row</button>
        </div>

        <div className="bcpv-body">
          {parsing ? (
            <div className="bcpv-parsing">
              <Loader2 size={20} style={{ animation: 'bcpvSpin 1s linear infinite' }} />
              Parsing CSV...
            </div>
          ) : rows.length === 0 ? (
            <div className="bcpv-empty">
              <AlertCircle size={28} />
              No data rows found in this CSV.
            </div>
          ) : (
            <table className="bcpv-tbl">
              <thead>
                <tr>
                  <th className="bcpv-th-num">#</th>
                  {headers.map((h, i) => <th key={i}>{h || `col_${i + 1}`}</th>)}
                  <th className="bcpv-th-act">Del</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="bcpv-td-num">{ri + 1}</td>
                    {headers.map((_, ci) => (
                      <td key={ci}>
                        {editCell?.r === ri && editCell?.c === ci ? (
                          <input
                            ref={inputRef}
                            className="bcpv-cell-input"
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
                          <div className="bcpv-cell-view" onClick={() => startEdit(ri, ci)}>
                            {row[ci] ? <span>{row[ci]}</span> : <span className="bcpv-cell-empty">empty</span>}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="bcpv-td-act">
                      <button className="bcpv-del" onClick={() => deleteRow(ri)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bcpv-foot">
          <div className="bcpv-foot-left">
            <CheckCircle2 size={16} color="#059669" />
            <span>{rows.length} rows ready &bull; Click any cell to edit &bull; Tab to move</span>
          </div>
          <div className="bcpv-foot-actions">
            <button className="bcpv-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="bcpv-btn-confirm" onClick={handleConfirm} disabled={rows.length === 0}>
              <UploadCloud size={16} />
              {label}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
