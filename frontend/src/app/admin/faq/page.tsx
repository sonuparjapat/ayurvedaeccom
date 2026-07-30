'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, HelpCircle, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  sort_order: number
  is_active: boolean
}

const EMPTY: Omit<FAQ, 'id'> = {
  question: '', answer: '', category: 'General', sort_order: 0, is_active: true,
}

const CATEGORIES = ['General', 'Products & Quality', 'Orders & Shipping', 'Payment', 'Returns & Refunds', 'Account', 'Other']

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState<FAQ | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/faq/admin')
      setFaqs(res.data.faqs || [])
    } catch { toast.error('Failed to load FAQs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditData(null)
    setForm({ ...EMPTY })
    setOpenModal(true)
  }

  const openEdit = (faq: FAQ) => {
    setEditData(faq)
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, sort_order: faq.sort_order, is_active: faq.is_active })
    setOpenModal(true)
  }

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) { toast.error('Question and answer are required'); return }
    setSaving(true)
    try {
      if (editData) {
        await axios.put(`/faq/admin/${editData.id}`, form)
        toast.success('FAQ updated')
      } else {
        await axios.post('/faq/admin', form)
        toast.success('FAQ created')
      }
      setOpenModal(false)
      load()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await axios.delete(`/faq/admin/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const toggleActive = async (faq: FAQ) => {
    try {
      await axios.put(`/faq/admin/${faq.id}`, { is_active: !faq.is_active })
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f))
    } catch { toast.error('Failed to update') }
  }

  // Group by category for display
  const grouped: Record<string, FAQ[]> = {}
  for (const f of faqs) {
    const cat = f.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(f)
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <HelpCircle size={20} className="text-green-600" /> FAQ Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{faqs.length} questions · shown on /faq page</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No FAQs yet. Click "Add FAQ" to create the first one.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{cat}</h2>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {items.map(faq => (
                <div key={faq.id} className={`${!faq.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {expanded === faq.id ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                        <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400 mr-1">#{faq.sort_order}</span>
                      <button onClick={() => toggleActive(faq)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={faq.is_active ? 'Deactivate' : 'Activate'}>
                        {faq.is_active
                          ? <ToggleRight size={16} className="text-green-600" />
                          : <ToggleLeft size={16} className="text-gray-400" />}
                      </button>
                      <button onClick={() => openEdit(faq)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Pencil size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => remove(faq.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  {expanded === faq.id && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 ml-5 whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b">
              <h2 className="font-bold text-gray-800">{editData ? 'Edit FAQ' : 'Add New FAQ'}</h2>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Question *</label>
                <input
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="e.g. What is your return policy?"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Answer *</label>
                <textarea
                  value={form.answer}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  placeholder="Detailed answer..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    min={0}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className="text-sm text-gray-700">Active (visible on site)</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setOpenModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving…' : editData ? 'Update FAQ' : 'Create FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
