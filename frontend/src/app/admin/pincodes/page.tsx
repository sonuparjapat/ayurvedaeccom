'use client'

import { useEffect, useRef, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Edit2, Search, MapPin, Package,
  CheckCircle2, XCircle, UploadCloud, Download,
  FileSpreadsheet, AlertTriangle, ChevronRight, X,
} from 'lucide-react'

interface Pincode {
  id: number
  pincode: string
  city: string
  state: string
  delivery_days: number
  is_active: boolean
  created_at: string
}

interface ParsedRow {
  pincode: string
  city: string
  state: string
  delivery_days: string
  is_active: string
  _valid: boolean
  _errors: string[]
  _rowNum: number
}

interface BulkResult {
  inserted: number
  updated: number
  errors: { row: number; pincode: string; reason: string }[]
}

const EMPTY: Omit<Pincode, 'id' | 'created_at'> = {
  pincode: '', city: '', state: '', delivery_days: 3, is_active: true,
}

const CSV_TEMPLATE = `pincode,city,state,delivery_days,is_active
400001,Mumbai,Maharashtra,3,true
560001,Bengaluru,Karnataka,4,true
110001,New Delhi,Delhi,2,true
700001,Kolkata,West Bengal,5,true
600001,Chennai,Tamil Nadu,4,false`

function parseAndValidateCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const idxOf = (col: string) => headers.indexOf(col)
  const iPin = idxOf('pincode')
  const iCity = idxOf('city')
  const iState = idxOf('state')
  const iDays = idxOf('delivery_days')
  const iActive = idxOf('is_active')

  return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const pincode   = iPin >= 0    ? (cols[iPin]    || '') : ''
    const city      = iCity >= 0   ? (cols[iCity]   || '') : ''
    const state     = iState >= 0  ? (cols[iState]  || '') : ''
    const daysRaw   = iDays >= 0   ? (cols[iDays]   || '3') : '3'
    const activeRaw = iActive >= 0 ? (cols[iActive] || 'true') : 'true'

    const errors: string[] = []
    if (!/^\d{6}$/.test(pincode)) errors.push('Pincode must be exactly 6 digits')
    if (!city.trim()) errors.push('City is required')
    const days = parseInt(daysRaw)
    if (isNaN(days) || days < 1 || days > 30) errors.push(`delivery_days must be 1–30 (got "${daysRaw}")`)
    const al = activeRaw.toLowerCase()
    if (!['true','false','1','0','yes','no',''].includes(al)) errors.push(`is_active must be true/false/yes/no (got "${activeRaw}")`)

    return {
      pincode, city, state,
      delivery_days: daysRaw,
      is_active: activeRaw,
      _valid: errors.length === 0,
      _errors: errors,
      _rowNum: idx + 2,
    }
  })
}

export default function AdminPincodesPage() {
  const [rows, setRows] = useState<Pincode[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  /* modal state */
  const [showModal, setShowModal]     = useState(false)
  const [modalTab, setModalTab]       = useState<'single' | 'bulk'>('single')
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState({ ...EMPTY })
  const set = (k: string, v: any)     => setForm(f => ({ ...f, [k]: v }))

  /* bulk upload state */
  const fileInputRef                  = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver]       = useState(false)
  const [bulkFile, setBulkFile]       = useState<File | null>(null)
  const [bulkParsed, setBulkParsed]   = useState<ParsedRow[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult]   = useState<BulkResult | null>(null)

  const load = async (pg = page) => {
    setLoading(true)
    try {
      const r = await axios.get('/admin/pincodes', { params: { page: pg, limit, search } })
      setRows(r.data?.pincodes || [])
      setTotal(r.data?.total || 0)
    } catch {
      toast.error('Failed to load pincodes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [search])
  useEffect(() => { load(page) }, [page])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY })
    setModalTab('single')
    resetBulk()
    setShowModal(true)
  }

  const openBulk = () => {
    setEditingId(null)
    setForm({ ...EMPTY })
    setModalTab('bulk')
    resetBulk()
    setShowModal(true)
  }

  const openEdit = (r: Pincode) => {
    setEditingId(r.id)
    setForm({ pincode: r.pincode, city: r.city, state: r.state, delivery_days: r.delivery_days, is_active: r.is_active })
    setModalTab('single')
    resetBulk()
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetBulk()
  }

  const resetBulk = () => {
    setBulkFile(null)
    setBulkParsed([])
    setBulkResult(null)
    setDragOver(false)
  }

  const save = async () => {
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) { toast.error('Enter a valid 6-digit pincode'); return }
    if (!form.city.trim()) { toast.error('City is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, pincode: form.pincode.trim(), city: form.city.trim(), state: form.state.trim(), delivery_days: Number(form.delivery_days) }
      if (editingId) {
        await axios.put(`/admin/pincodes/${editingId}`, payload)
        toast.success('Pincode updated')
      } else {
        await axios.post('/admin/pincodes', payload)
        toast.success('Pincode added')
      }
      setShowModal(false)
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deletePincode = async (id: number, pincode: string) => {
    if (!confirm(`Delete pincode ${pincode}?`)) return
    try {
      await axios.delete(`/admin/pincodes/${id}`)
      toast.success('Pincode deleted')
      load(1)
    } catch {
      toast.error('Failed to delete')
    }
  }

  /* ─── CSV handling ─── */
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pincode_bulk_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a CSV file'); return }
    setBulkFile(file)
    setBulkResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setBulkParsed(parseAndValidateCsv(text))
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const bulkUpload = async () => {
    const validRows = bulkParsed.filter(r => r._valid)
    if (!validRows.length) { toast.error('No valid rows to upload'); return }
    setBulkUploading(true)
    try {
      const payload = validRows.map(r => ({
        pincode: r.pincode,
        city: r.city,
        state: r.state,
        delivery_days: parseInt(r.delivery_days) || 3,
        is_active: !['false','0','no'].includes(r.is_active.toLowerCase()),
      }))
      const res = await axios.post('/admin/pincodes/bulk', { rows: payload })
      setBulkResult(res.data)
      toast.success(`Done! ${res.data.inserted} inserted, ${res.data.updated} updated`)
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Bulk upload failed')
    } finally {
      setBulkUploading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const activeCount = rows.filter(r => r.is_active).length
  const validCount = bulkParsed.filter(r => r._valid).length
  const invalidCount = bulkParsed.filter(r => !r._valid).length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="bg-linear-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Serviceable Pincodes</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Manage delivery coverage — unlisted pincodes get a generic 6-day estimate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openBulk}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl text-sm font-semibold transition"
            >
              <UploadCloud size={15} /> Bulk Upload
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition shadow-sm"
            >
              <Plus size={16} /> Add Pincode
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Package className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500 font-medium">Total Pincodes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500 font-medium">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rows.length - activeCount}</p>
              <p className="text-xs text-gray-500 font-medium">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search pincode, city, state..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm transition"
          />
        </div>
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{total} pincodes total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin size={40} className="mb-3 text-gray-300" />
            <p className="text-base font-medium">No pincodes found</p>
            <p className="text-sm mt-1">Try a different search or add a new pincode</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  {['Pincode', 'City', 'State', 'Delivery Days', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900 font-mono">{r.pincode}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{r.city}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{r.state}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {r.delivery_days} {r.delivery_days === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-gray-500 hover:text-amber-600 flex items-center justify-center transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deletePincode(r.id, r.pincode)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors" title="Delete">
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(pg => (
            <button key={pg} onClick={() => setPage(pg)} className={`w-9 h-9 rounded-lg text-sm font-medium transition ${pg === page ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{pg}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Next</button>
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col ${modalTab === 'bulk' ? 'max-w-3xl max-h-[90vh]' : 'max-w-lg'}`}>

            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingId ? 'Edit Pincode' : modalTab === 'bulk' ? 'Bulk Upload Pincodes' : 'Add New Pincode'}
                </h2>
                <p className="text-emerald-100 text-sm mt-0.5">
                  {editingId ? 'Update pincode details' : modalTab === 'bulk' ? 'Upload multiple pincodes at once via CSV' : 'Add a new serviceable pincode'}
                </p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Tabs — only show when not editing */}
            {!editingId && (
              <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                <button
                  onClick={() => setModalTab('single')}
                  className={`flex-1 py-3 text-sm font-semibold transition ${modalTab === 'single' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => { setModalTab('bulk'); resetBulk() }}
                  className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${modalTab === 'bulk' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <UploadCloud size={14} /> Bulk Upload
                </button>
              </div>
            )}

            {/* ─── SINGLE TAB ─── */}
            {modalTab === 'single' && (
              <>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pincode * (6 digits)</label>
                    <input
                      value={form.pincode}
                      onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="400001"
                      maxLength={6}
                      disabled={!!editingId}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City *</label>
                      <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">State</label>
                      <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Days</label>
                    <input type="number" value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} min={1} max={30} placeholder="3" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                    <label className="inline-flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700 font-medium">Active</span>
                    </label>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3 shrink-0">
                  <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? 'Saving...' : editingId ? 'Update Pincode' : 'Add Pincode'}
                  </button>
                  <button onClick={closeModal} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition">Cancel</button>
                </div>
              </>
            )}

            {/* ─── BULK TAB ─── */}
            {modalTab === 'bulk' && (
              <div className="overflow-y-auto flex-1">
                <div className="p-6 space-y-5">

                  {/* Step 1 — Template */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-blue-700 font-bold text-sm">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">Download the CSV Template</p>
                        <p className="text-xs text-blue-700 mt-1">Fill in all the required columns. Do not change or remove column headers.</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            { col: 'pincode', req: true, desc: 'Exactly 6 digits (e.g. 400001)' },
                            { col: 'city', req: true, desc: 'City name (e.g. Mumbai)' },
                            { col: 'state', req: false, desc: 'State name (e.g. Maharashtra)' },
                            { col: 'delivery_days', req: false, desc: 'Number 1–30 — defaults to 3' },
                            { col: 'is_active', req: false, desc: 'true / false / yes / no — defaults to true' },
                          ].map(c => (
                            <div key={c.col} className="flex items-start gap-1.5 bg-white rounded-lg px-2.5 py-2 border border-blue-100">
                              <code className="text-blue-800 font-mono font-semibold">{c.col}</code>
                              {c.req && <span className="text-red-500 font-bold">*</span>}
                              <ChevronRight size={10} className="text-gray-400 mt-0.5 shrink-0" />
                              <span className="text-gray-600">{c.desc}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={downloadTemplate} className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition">
                          <Download size={13} /> Download Template CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 — Upload */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-bold text-sm">2</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">Upload Your Filled CSV</p>
                    </div>

                    {!bulkFile ? (
                      <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}
                      >
                        <UploadCloud size={32} className={`mx-auto mb-2 ${dragOver ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <p className="text-sm font-semibold text-gray-700">Drag & drop your CSV here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse — CSV files only</p>
                        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3 bg-gray-50">
                        <FileSpreadsheet size={20} className="text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{bulkFile.name}</p>
                          <p className="text-xs text-gray-500">{bulkParsed.length} rows parsed</p>
                        </div>
                        <button onClick={resetBulk} className="w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition">
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Step 3 — Validation Preview */}
                  {bulkParsed.length > 0 && !bulkResult && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-amber-700 font-bold text-sm">3</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Review Before Uploading</p>
                        <div className="ml-auto flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-200">
                            <CheckCircle2 size={11} /> {validCount} valid
                          </span>
                          {invalidCount > 0 && (
                            <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-semibold border border-red-200">
                              <AlertTriangle size={11} /> {invalidCount} invalid
                            </span>
                          )}
                        </div>
                      </div>

                      {invalidCount > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={13} /> Invalid rows will be skipped — fix the CSV and re-upload to include them
                          </p>
                          <div className="space-y-1">
                            {bulkParsed.filter(r => !r._valid).map(r => (
                              <div key={r._rowNum} className="text-xs text-amber-900 bg-amber-100 rounded-lg px-3 py-1.5 flex items-start gap-2">
                                <span className="font-mono font-bold text-amber-700 shrink-0">Row {r._rowNum}</span>
                                <span className="text-amber-700 shrink-0">{r.pincode || '—'}</span>
                                <span className="text-amber-800">{r._errors.join(' · ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto max-h-56">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">Row</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">Pincode</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">State</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">Active</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {bulkParsed.map(r => (
                                <tr key={r._rowNum} className={r._valid ? 'bg-white hover:bg-green-50/40' : 'bg-red-50/60'}>
                                  <td className="px-3 py-2 font-mono text-gray-400">{r._rowNum}</td>
                                  <td className="px-3 py-2 font-mono font-semibold text-gray-800">{r.pincode || <span className="text-red-400 italic">empty</span>}</td>
                                  <td className="px-3 py-2 text-gray-700">{r.city || <span className="text-red-400 italic">empty</span>}</td>
                                  <td className="px-3 py-2 text-gray-500">{r.state || '—'}</td>
                                  <td className="px-3 py-2 text-gray-700">{r.delivery_days || '3'}</td>
                                  <td className="px-3 py-2 text-gray-700">{r.is_active || 'true'}</td>
                                  <td className="px-3 py-2">
                                    {r._valid ? (
                                      <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                                        <CheckCircle2 size={12} /> Valid
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                        <AlertTriangle size={12} /> Error
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={bulkUpload}
                          disabled={bulkUploading || validCount === 0}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {bulkUploading ? (
                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Uploading...</>
                          ) : (
                            <><UploadCloud size={15} /> Upload {validCount} Valid Row{validCount !== 1 ? 's' : ''}</>
                          )}
                        </button>
                        <button onClick={resetBulk} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition">Reset</button>
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Results */}
                  {bulkResult && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" /> Upload Complete
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-green-700">{bulkResult.inserted}</p>
                          <p className="text-xs text-green-600 font-medium mt-0.5">Newly Added</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-blue-700">{bulkResult.updated}</p>
                          <p className="text-xs text-blue-600 font-medium mt-0.5">Updated</p>
                        </div>
                      </div>
                      {bulkResult.errors.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                            <AlertTriangle size={12} /> {bulkResult.errors.length} row{bulkResult.errors.length !== 1 ? 's' : ''} rejected by server
                          </p>
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {bulkResult.errors.map((e, i) => (
                              <div key={i} className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex gap-2">
                                <span className="font-mono font-bold text-red-600 shrink-0">Row {e.row}</span>
                                <span className="text-red-600 shrink-0">{e.pincode}</span>
                                <span className="text-red-700">{e.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button onClick={() => { resetBulk(); closeModal() }} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">Done</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
