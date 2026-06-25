'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { MessageSquare, Check, X, Trash2, Send, HelpCircle, Clock, Package, MessageCircle } from 'lucide-react'

export default function AdminQAPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [answerMap, setAnswerMap] = useState<Record<number, string>>({})
  const limit = 20

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/qa/admin/questions', { params: { status, page, limit } })
      setQuestions(r.data.questions || [])
      setTotal(r.data.total || 0)
    } catch { notify.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status, page])

  const updateStatus = async (id: number, s: string) => {
    await axios.put(`/qa/admin/questions/${id}`, { status: s })
    notify.success(`Question ${s}`)
    load()
  }

  const deleteQ = async (id: number) => {
    if (!confirm('Delete?')) return
    await axios.delete(`/qa/admin/questions/${id}`)
    notify.success('Deleted')
    load()
  }

  const answerQ = async (qId: number) => {
    const ans = answerMap[qId]
    if (!ans?.trim()) return notify.error('Write an answer first')
    await axios.post(`/qa/question/${qId}/answer`, { answer: ans })
    notify.success('Answer posted!')
    setAnswerMap(m => ({ ...m, [qId]: '' }))
    load()
  }

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  }

  const tabConfig: Record<string, { active: string; icon: React.ReactNode }> = {
    pending: { active: 'bg-amber-500 text-white shadow-sm', icon: <Clock size={14} /> },
    approved: { active: 'bg-green-600 text-white shadow-sm', icon: <Check size={14} /> },
    rejected: { active: 'bg-red-500 text-white shadow-sm', icon: <X size={14} /> },
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Q&A Moderation</h1>
              <p className="text-blue-100 text-sm mt-0.5">Review and answer customer questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-white text-sm font-semibold">{total} questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{status === 'pending' ? total : '-'}</p>
              <p className="text-xs text-gray-500 font-medium">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Check className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{status === 'approved' ? total : '-'}</p>
              <p className="text-xs text-gray-500 font-medium">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <MessageCircle className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500 font-medium">Current View Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                status === s
                  ? tabConfig[s].active
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tabConfig[s].icon}
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => {
            const sConfig = statusConfig[q.status] || statusConfig.pending
            return (
              <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* User & Product Info */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                          <HelpCircle className="text-blue-600" size={16} />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{q.user_name || 'Anonymous'}</span>
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Package size={10} />
                          {q.product_name}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${sConfig.bg} ${sConfig.text} px-2 py-0.5 rounded-full text-xs font-semibold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sConfig.dot}`} />
                          {q.status}
                        </span>
                      </div>

                      {/* Question */}
                      <div className="bg-gray-50 rounded-lg p-3 mt-2">
                        <p className="text-sm text-gray-800 font-medium leading-relaxed">&ldquo;{q.question}&rdquo;</p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(q.created_at).toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={11} />
                          {q.answer_count} {q.answer_count === 1 ? 'answer' : 'answers'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {q.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(q.id, 'approved')}
                          title="Approve"
                          className="w-9 h-9 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {q.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(q.id, 'rejected')}
                          title="Reject"
                          className="w-9 h-9 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteQ(q.id)}
                        title="Delete"
                        className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin Reply Input */}
                {q.status === 'approved' && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <input
                        className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Write official answer as admin..."
                        value={answerMap[q.id] || ''}
                        onChange={e => setAnswerMap(m => ({...m, [q.id]: e.target.value}))}
                      />
                      <button
                        onClick={() => answerQ(q.id)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Send size={14} /> Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Empty State */}
          {!questions.length && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 flex flex-col items-center text-gray-400">
              <MessageSquare size={40} className="mb-3 text-gray-300" />
              <p className="text-base font-medium text-gray-500">No questions found</p>
              <p className="text-sm mt-1">No {status} questions at the moment</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500 font-medium">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
