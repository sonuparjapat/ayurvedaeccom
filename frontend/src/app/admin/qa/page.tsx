'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { MessageSquare, Check, X, Trash2, Send } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="text-blue-500" size={22} /> Q&A Moderation
        </h1>
        <p className="text-gray-500 text-sm mt-1">Review and answer customer questions</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 flex-wrap">
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">{total} questions</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900">{q.user_name || 'Anonymous'}</span>
                    <span className="text-xs text-blue-600 font-medium">re: {q.product_name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.status === 'approved' ? 'bg-green-100 text-green-700' : q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{q.status}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">"{q.question}"</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(q.created_at).toLocaleString('en-IN')} · {q.answer_count} answers</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {q.status !== 'approved' && (
                    <button onClick={() => updateStatus(q.id, 'approved')} title="Approve"
                      className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center">
                      <Check size={14} />
                    </button>
                  )}
                  {q.status !== 'rejected' && (
                    <button onClick={() => updateStatus(q.id, 'rejected')} title="Reject"
                      className="w-8 h-8 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full flex items-center justify-center">
                      <X size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteQ(q.id)} title="Delete"
                    className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {q.status === 'approved' && (
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <input className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Write official answer as admin..."
                    value={answerMap[q.id] || ''}
                    onChange={e => setAnswerMap(m => ({...m, [q.id]: e.target.value}))}
                  />
                  <button onClick={() => answerQ(q.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1">
                    <Send size={13} /> Reply
                  </button>
                </div>
              )}
            </div>
          ))}
          {!questions.length && <div className="text-center py-20 text-gray-400 bg-white rounded-2xl">No questions found</div>}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Prev</button>
          <span className="px-4 py-2 text-sm">Page {page} of {Math.ceil(total/limit)}</span>
          <button disabled={page >= Math.ceil(total/limit)} onClick={() => setPage(p => p+1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
