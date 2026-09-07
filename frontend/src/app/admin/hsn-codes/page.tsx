'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { PageInfoBanner, LabelWithInfo } from '@/components/admin/FieldInfo'
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  Download, UploadCloud, CheckCircle2, AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import AdminPagination from '@/components/admin/AdminPagination'

/* ── Types ── */
interface HsnCode { id: number; hsn_code: string; description: string; created_at: string }

const EMPTY_FORM = { hsn_code: '', description: '' }

/* ════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function HsnCodesPage() {
  /* list state */
  const [rows, setRows]         = useState<HsnCode[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const limit = 20

  /* modal state */
  const [modal, setModal]       = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<HsnCode | null>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  /* bulk state */
  const [csvFile, setCsvFile]     = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress]   = useState(0)   // 0-100
  const [importResult, setImportResult] = useState<any>(null)
  const [showErrors, setShowErrors]     = useState(false)
  const [showProcessed, setShowProcessed] = useState(false)
  const fileRef      = useRef<HTMLInputElement>(null)
  const progressRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── load ── */
  const load = useCallback(async (p = page, q = search) => {
    setLoading(true)
    try {
      const res = await axios.get(`/admin/hsn-codes?page=${p}&limit=${limit}&search=${encodeURIComponent(q)}`)
      setRows(res.data.data || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch {
      toast.error('Failed to load HSN codes')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { load(page, search) }, [page])

  /* ── open modals ── */
  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('create') }
  const openEdit   = (r: HsnCode) => { setForm({ hsn_code: r.hsn_code, description: r.description }); setSelected(r); setModal('edit') }
  const openDelete = (r: HsnCode) => { setSelected(r); setModal('delete') }

  /* ── save (create / edit) ── */
  const handleSave = async () => {
    if (!form.hsn_code.trim()) return toast.error('HSN code is required')
    if (!form.description.trim()) return toast.error('Description is required')
    if (!/^\d{2,8}$/.test(form.hsn_code.trim())) return toast.error('HSN code must be 2–8 digits (numbers only, e.g. 3003)')
    setSaving(true)
    try {
      if (modal === 'create') {
        await axios.post('/admin/hsn-codes', form)
        toast.success('HSN code added successfully')
      } else if (modal === 'edit' && selected) {
        await axios.put(`/admin/hsn-codes/${selected.id}`, form)
        toast.success('HSN code updated')
      }
      setModal(null)
      load(page, search)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ── delete ── */
  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await axios.delete(`/admin/hsn-codes/${selected.id}`)
      toast.success(`HSN code ${selected.hsn_code} deleted`)
      setModal(null)
      load(page, search)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  /* ── bulk import ── */
  const handleBulkImport = async () => {
    if (!csvFile) return toast.error('Please select a CSV file first')
    setImporting(true)
    setImportResult(null)
    setProgress(0)

    // After upload completes (upload progress hits 100%), creep toward 95% while server processes
    const startCreep = () => {
      if (progressRef.current) clearInterval(progressRef.current)
      progressRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 95) { clearInterval(progressRef.current!); return p }
          // Slow down as it approaches 95
          const step = p < 70 ? 3 : p < 85 ? 1.5 : 0.5
          return Math.min(95, p + step)
        })
      }, 150)
    }

    try {
      const fd = new FormData()
      fd.append('file', csvFile)
      const res = await axios.post('/admin/hsn-codes/bulk', fd, {
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 70) : 0
          setProgress(pct)
          if (pct >= 70) startCreep()
        },
      })

      // Done — snap to 100%
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(100)

      setImportResult(res.data)
      setShowErrors(res.data.errors?.length > 0)
      setShowProcessed(true)
      toast.success(res.data.message)
      setCsvFile(null)
      if (fileRef.current) fileRef.current.value = ''
      load(1, search)
    } catch (err: any) {
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(0)
      toast.error(err?.response?.data?.message || 'Import failed — check your file')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const res = await axios.get('/admin/hsn-codes/template', { responseType: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([res.data]))
      a.download = 'hsn-codes-template.csv'
      a.click()
    } catch {
      toast.error('Download failed')
    }
  }

  /* ════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold">HSN Code Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage the Harmonised System of Nomenclature codes used for GST compliance</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-semibold"
        >
          <Plus size={16} /> Add HSN Code
        </button>
      </div>

      {/* INFO BANNER */}
      <PageInfoBanner
        title="What are HSN codes?"
        description="HSN (Harmonised System of Nomenclature) codes are 2–8 digit numeric codes assigned to every product under the GST system. They appear on invoices, tax reports, and GST filings. Using the correct HSN code ensures accurate tax calculation and compliance."
        tips={[
          'HSN codes are mandatory on B2B invoices above ₹5 lakh and all B2C invoices above ₹50,000.',
          'Use 4-digit codes for small businesses (turnover < ₹1.5 Cr), 6-digit for medium, 8-digit for large.',
          'You can bulk-import codes from a CSV file — use the Bulk Import section below.',
          'Once added here, HSN codes are referenced in Products and Categories. Changing a code here does NOT auto-update products — update products separately.',
          'Always verify HSN codes with the official GST Council portal or a CA before use.',
        ]}
      />

      {/* BULK IMPORT CARD */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="font-bold text-gray-800 text-base">Bulk Import via CSV</h2>
          <p className="text-xs text-gray-500 mt-0.5">Upload a CSV with columns <strong>"Hsn code"</strong> and <strong>"Description"</strong>. Existing codes will be updated, new ones added.</p>
        </div>
        <div className="p-5 space-y-4">

          {/* Column spec */}
          <div className="flex gap-3 flex-wrap">
            {[
              { col: 'Hsn code', desc: 'The HSN number (2–8 digits)', example: '30039011', req: true },
              { col: 'Description', desc: 'What this HSN code covers', example: 'Ayurvedic preparations', req: true },
            ].map(c => (
              <div key={c.col} className="flex-1 min-w-[200px] bg-gray-50 rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{c.col}</code>
                  {c.req && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                </div>
                <p className="text-xs text-gray-600">{c.desc}</p>
                <p className="text-xs text-gray-400 mt-1">e.g. <em>{c.example}</em></p>
              </div>
            ))}
          </div>

          {/* Upload zone */}
          <label className="block cursor-pointer">
            <div className={`border-2 dashed rounded-xl p-6 text-center transition-colors ${csvFile ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50'}`}>
              <UploadCloud size={28} className={`mx-auto mb-2 ${csvFile ? 'text-emerald-600' : 'text-gray-400'}`} />
              {csvFile ? (
                <p className="text-sm font-semibold text-emerald-700">{csvFile.name} <span className="font-normal text-emerald-500">— ready</span></p>
              ) : (
                <p className="text-sm text-gray-500">Drag & drop or click to select CSV file</p>
              )}
            </div>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept=".csv"
              onChange={e => { setCsvFile(e.target.files?.[0] || null); setImportResult(null); setProgress(0) }}
            />
          </label>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleBulkImport}
              disabled={!csvFile || importing}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold"
            >
              {importing ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              {importing ? 'Importing…' : 'Import CSV'}
            </button>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Download size={15} /> Download Template
            </button>
          </div>

          {/* Progress bar */}
          {importing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {progress < 70
                    ? 'Uploading file…'
                    : progress < 95
                    ? 'Processing rows…'
                    : progress < 100
                    ? 'Almost done…'
                    : 'Complete!'}
                </span>
                <span className="font-mono font-semibold text-emerald-700">{progress}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress bar at 100% — brief "done" flash before result appears */}
          {!importing && progress === 100 && !importResult && (
            <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
              <div className="h-full w-full rounded-full bg-emerald-500" />
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className={`rounded-xl border p-4 ${importResult.summary?.skipped > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.summary?.skipped > 0
                    ? <AlertTriangle size={16} className="text-amber-600" />
                    : <CheckCircle2 size={16} className="text-emerald-600" />}
                  <span className="text-sm font-semibold text-gray-800">{importResult.message}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <span className="text-emerald-700 font-semibold">+ {importResult.summary?.inserted ?? 0} added</span>
                  <span className="text-blue-700 font-semibold">↻ {importResult.summary?.updated ?? 0} updated</span>
                  <span>{importResult.summary?.total ?? 0} total rows in CSV</span>
                  {importResult.summary?.skipped > 0 && (
                    <span className="text-amber-600 font-semibold">⚠ {importResult.summary.skipped} skipped</span>
                  )}
                </div>
              </div>

              {/* Imported rows table */}
              {importResult.processed?.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowProcessed(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <span>✓ {importResult.processed.length} rows imported successfully</span>
                    <span className="text-xs text-emerald-600">{showProcessed ? 'Hide ▲' : 'Show ▼'}</span>
                  </button>
                  {showProcessed && (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">HSN Code</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importResult.processed.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-1.5">
                                <code className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{r.hsn_code}</code>
                              </td>
                              <td className="px-3 py-1.5 text-gray-700">{r.description}</td>
                              <td className="px-3 py-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.action === 'inserted' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {r.action === 'inserted' ? 'Added' : 'Updated'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Skipped / error rows */}
              {importResult.errors?.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowErrors(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-sm font-semibold text-red-800 hover:bg-red-100 transition-colors"
                  >
                    <span>⚠ {importResult.errors.length} row{importResult.errors.length !== 1 ? 's' : ''} skipped — click to review</span>
                    <span className="text-xs text-red-600">{showErrors ? 'Hide ▲' : 'Show ▼'}</span>
                  </button>
                  {showErrors && (
                    <div className="max-h-64 overflow-y-auto divide-y divide-red-100">
                      {importResult.errors.map((e: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start px-4 py-2 text-xs">
                          <span className="shrink-0 text-gray-400 font-mono w-12">Row {e.row ?? '—'}</span>
                          {e.hsn_code && (
                            <code className="shrink-0 text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-bold">{e.hsn_code}</code>
                          )}
                          <span className="text-red-700">{e.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WHERE USED */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">📌 Where HSN codes are used</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Products → HSN Code field', href: '/admin/products' },
            { label: 'Categories → HSN Code field', href: '/admin/categories' },
            { label: 'GST Reports', href: '/admin/gst' },
          ].map(l => (
            <a
              key={l.label}
              href={l.href}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              <ExternalLink size={11} /> {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* SEARCH + TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search HSN code or description…"
              className="pl-8 pr-3 py-2 border rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <p className="text-xs text-gray-500">{total} code{total !== 1 ? 's' : ''} total</p>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {search ? `No results for "${search}"` : 'No HSN codes yet — add one or import a CSV above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-10">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-36">HSN Code</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <code className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{r.hsn_code}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-700 leading-snug">{r.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => openDelete(r)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <AdminPagination
          page={page}
          pages={pages}
          total={total}
          limit={limit}
          onChange={setPage}
        />
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {/* CREATE / EDIT MODAL */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">{modal === 'create' ? 'Add HSN Code' : 'Edit HSN Code'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <LabelWithInfo
                    label="HSN Code"
                    required
                    what="A 2–8 digit number that identifies the product category under the Harmonised System used for GST."
                    why="Required on GST invoices. Using the wrong code can cause penalties or invoice rejection."
                    example="30039011"
                    note="Must be exactly 2, 4, 6 or 8 digits — no letters or spaces."
                  />
                </label>
                <input
                  value={form.hsn_code}
                  onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                  placeholder="e.g. 30039011"
                  maxLength={8}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">{form.hsn_code.length}/8 digits</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <LabelWithInfo
                    label="Description"
                    required
                    what="A plain-English description of the goods covered by this HSN code."
                    why="Helps you and your team quickly identify the correct code for each product. Appears in audit logs."
                    example="Ayurvedic medicinal preparations containing plant extracts"
                  />
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Ayurvedic medicinal preparations with plant extracts"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modal === 'create' ? 'Add Code' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center px-6 py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800">Delete HSN Code?</h3>
            <p className="text-sm text-gray-600">
              You are about to delete <code className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{selected.hsn_code}</code>.
            </p>
            <p className="text-xs text-gray-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ This will only remove the code from this list. Products and categories that already reference this HSN code will keep their value — you must update them separately.
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
