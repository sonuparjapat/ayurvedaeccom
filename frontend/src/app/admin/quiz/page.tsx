'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Brain, Plus, Trash2, Edit3, ChevronDown, ChevronUp, CheckCircle, XCircle, BarChart3, Users, Trophy, Clock, X, Check, RefreshCw } from 'lucide-react'

type Quiz = {
  id: number; title: string; description: string; type: string
  starts_at: string | null; expires_at: string | null
  max_attempts_per_user: number; max_attempts_per_day: number; pass_score: number
  reward_type: string; reward_value: number; reward_is_percent: boolean; reward_max_claims: number
  reward_claims_count: number; is_active: boolean
  questions_count: number; attempts_count: number; created_by_name: string
}
type Question = { id: number; quiz_id: number; question_text: string; sort_order: number; options: Option[] | null }
type Option = { id: number; option_text: string; is_correct: boolean; points: number; sort_order: number }

const REWARD_COLORS: Record<string, string> = { wallet: '#7c3aed', points: '#d97706', coupon: '#dc2626', none: '#6b7280' }
const REWARD_LABELS: Record<string, string> = { wallet: 'Wallet Credit', points: 'Loyalty Points', coupon: 'Coupon Code', none: 'No Reward' }

export default function AdminQuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [quizDetail, setQuizDetail] = useState<Record<number, { questions: Question[] }>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null)
  const [attemptsData, setAttemptsData] = useState<any>(null)
  const [attemptsQuizId, setAttemptsQuizId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', type: 'scored',
    starts_at: '', expires_at: '', max_attempts_per_user: 1, max_attempts_per_day: 0, pass_score: 0,
    reward_type: 'none', reward_value: 0, reward_max_claims: 0, is_active: true,
  })

  const load = async () => {
    setLoading(true)
    try { const r = await axios.get('/quiz/admin/list'); setQuizzes(r.data?.data || []) }
    catch { toast.error('Failed to load quizzes') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openDetail = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!quizDetail[id]) {
      try {
        const r = await axios.get(`/quiz/admin/${id}`)
        setQuizDetail(p => ({ ...p, [id]: { questions: r.data?.data?.questions || [] } }))
      } catch { toast.error('Failed to load quiz detail') }
    }
  }

  const createQuiz = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    try {
      await axios.post('/quiz/admin/create', form)
      toast.success('Quiz created!')
      setShowCreate(false)
      setForm({ title: '', description: '', type: 'scored', starts_at: '', expires_at: '', max_attempts_per_user: 1, max_attempts_per_day: 0, pass_score: 0, reward_type: 'none', reward_value: 0, reward_max_claims: 0, is_active: true })
      load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create quiz') }
  }

  const updateQuiz = async () => {
    if (!editQuiz) return
    try {
      await axios.put(`/quiz/admin/${editQuiz.id}`, editQuiz)
      toast.success('Quiz updated!'); setEditQuiz(null); load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update') }
  }

  const deleteQuiz = async (id: number) => {
    if (!confirm('Delete this quiz and all its questions?')) return
    try { await axios.delete(`/quiz/admin/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const addQuestion = async (quizId: number, text: string) => {
    if (!text.trim()) return
    try {
      await axios.post('/quiz/admin/questions', { quiz_id: quizId, question_text: text, sort_order: (quizDetail[quizId]?.questions?.length || 0) })
      const r = await axios.get(`/quiz/admin/${quizId}`)
      setQuizDetail(p => ({ ...p, [quizId]: { questions: r.data?.data?.questions || [] } }))
      toast.success('Question added')
    } catch { toast.error('Failed to add question') }
  }

  const deleteQuestion = async (quizId: number, qId: number) => {
    try {
      await axios.delete(`/quiz/admin/questions/${qId}`)
      setQuizDetail(p => ({ ...p, [quizId]: { questions: (p[quizId]?.questions || []).filter(q => q.id !== qId) } }))
      toast.success('Question deleted')
    } catch { toast.error('Failed to delete question') }
  }

  const addOption = async (quizId: number, questionId: number, text: string, isCorrect: boolean) => {
    if (!text.trim()) return
    try {
      await axios.post('/quiz/admin/options', { question_id: questionId, option_text: text, is_correct: isCorrect, points: isCorrect ? 1 : 0 })
      const r = await axios.get(`/quiz/admin/${quizId}`)
      setQuizDetail(p => ({ ...p, [quizId]: { questions: r.data?.data?.questions || [] } }))
      toast.success('Option added')
    } catch { toast.error('Failed to add option') }
  }

  const deleteOption = async (quizId: number, optId: number) => {
    try {
      await axios.delete(`/quiz/admin/options/${optId}`)
      const r = await axios.get(`/quiz/admin/${quizId}`)
      setQuizDetail(p => ({ ...p, [quizId]: { questions: r.data?.data?.questions || [] } }))
    } catch { toast.error('Failed to delete option') }
  }

  const loadAttempts = async (quizId: number) => {
    setAttemptsQuizId(quizId)
    try {
      const r = await axios.get(`/quiz/admin/${quizId}/attempts`)
      setAttemptsData(r.data)
    } catch { toast.error('Failed to load attempts') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain size={22} className="text-violet-600" /> Quiz Manager
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create knowledge quizzes with rewards for user engagement</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700">
          <Plus size={16} /> Create Quiz
        </button>
      </div>

      {/* Create / Edit Modal */}
      {(showCreate || editQuiz) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { setShowCreate(false); setEditQuiz(null) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editQuiz ? 'Edit Quiz' : 'New Quiz'}</h2>
            <div className="space-y-3">
              {[
                { label: 'Title *', key: 'title', type: 'text' },
                { label: 'Description', key: 'description', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{f.label}</label>
                  <input type={f.type} value={editQuiz ? (editQuiz as any)[f.key] : (form as any)[f.key]}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, [f.key]: e.target.value } : p) : setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Starts At</label>
                  <input type="datetime-local" value={(editQuiz ? editQuiz.starts_at : form.starts_at) || ''}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, starts_at: e.target.value } : p) : setForm(p => ({ ...p, starts_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Expires At</label>
                  <input type="datetime-local" value={(editQuiz ? editQuiz.expires_at : form.expires_at) || ''}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, expires_at: e.target.value } : p) : setForm(p => ({ ...p, expires_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Max Attempts / User</label>
                  <input type="number" min={0} value={editQuiz ? editQuiz.max_attempts_per_user : form.max_attempts_per_user}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, max_attempts_per_user: Number(e.target.value) } : p) : setForm(p => ({ ...p, max_attempts_per_user: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Daily Limit / User (0=∞)</label>
                  <input type="number" min={0} value={editQuiz ? (editQuiz.max_attempts_per_day ?? 0) : form.max_attempts_per_day}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, max_attempts_per_day: Number(e.target.value) } : p) : setForm(p => ({ ...p, max_attempts_per_day: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Pass Score (pts)</label>
                  <input type="number" min={0} value={editQuiz ? editQuiz.pass_score : form.pass_score}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, pass_score: Number(e.target.value) } : p) : setForm(p => ({ ...p, pass_score: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Reward Type</label>
                  <select value={editQuiz ? editQuiz.reward_type : form.reward_type}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, reward_type: e.target.value } : p) : setForm(p => ({ ...p, reward_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500">
                    {Object.entries(REWARD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Reward Value (₹/pts)</label>
                  <input type="number" min={0} value={editQuiz ? editQuiz.reward_value : form.reward_value}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, reward_value: Number(e.target.value) } : p) : setForm(p => ({ ...p, reward_value: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Max Claims (0=∞)</label>
                  <input type="number" min={0} value={editQuiz ? editQuiz.reward_max_claims : form.reward_max_claims}
                    onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, reward_max_claims: Number(e.target.value) } : p) : setForm(p => ({ ...p, reward_max_claims: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editQuiz ? editQuiz.is_active : form.is_active}
                  onChange={e => editQuiz ? setEditQuiz(p => p ? { ...p, is_active: e.target.checked } : p) : setForm(p => ({ ...p, is_active: e.target.checked }))} />
                <span className="text-sm text-gray-700 font-medium">Active (visible to users)</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={editQuiz ? updateQuiz : createQuiz}
                className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700">
                <Check size={15} /> {editQuiz ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowCreate(false); setEditQuiz(null) }}
                className="px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Attempts Modal */}
      {attemptsQuizId !== null && attemptsData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => { setAttemptsQuizId(null); setAttemptsData(null) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quiz Analytics</h2>
              <button onClick={() => { setAttemptsQuizId(null); setAttemptsData(null) }}><X size={18} /></button>
            </div>
            {attemptsData.stats && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Attempts', value: attemptsData.total, color: '#6366f1' },
                  { label: 'Passed', value: attemptsData.stats.passed_count, color: '#16a34a' },
                  { label: 'Avg Score', value: Math.round(attemptsData.stats.avg_score || 0), color: '#d97706' },
                  { label: 'Rewards Given', value: attemptsData.stats.rewarded_count, color: '#7c3aed' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>{['User', 'Score', 'Passed', 'Reward', 'Date'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(attemptsData.data || []).map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{a.user_name || a.user_email || 'Guest'}</td>
                      <td className="px-3 py-2 font-semibold">{a.score}/{a.total_possible}</td>
                      <td className="px-3 py-2">
                        {a.passed ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-500">✗</span>}
                      </td>
                      <td className="px-3 py-2">{a.reward_given ? <span className="text-violet-600 font-semibold">{a.reward_type} {a.reward_ref || ''}</span> : '—'}</td>
                      <td className="px-3 py-2 text-gray-400">{new Date(a.completed_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quiz list */}
      <div className="space-y-3">
        {loading ? <div className="text-center py-16 text-gray-400">Loading…</div> :
          quizzes.length === 0 ? <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No quizzes yet. Create one above.</div> :
          quizzes.map(quiz => {
            const isExpanded = expandedId === quiz.id
            const detail = quizDetail[quiz.id]
            return (
              <div key={quiz.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-start gap-4 p-5">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={20} style={{ color: '#7c3aed' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{quiz.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${quiz.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {quiz.reward_type !== 'none' && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: `${REWARD_COLORS[quiz.reward_type]}15`, color: REWARD_COLORS[quiz.reward_type], borderRadius: 20, padding: '1px 8px' }}>
                          {REWARD_LABELS[quiz.reward_type]}: ₹{quiz.reward_value}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{quiz.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} />{quiz.attempts_count} attempts</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Brain size={11} />{quiz.questions_count} questions</span>
                      {quiz.expires_at && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />Expires {new Date(quiz.expires_at).toLocaleDateString('en-IN')}</span>}
                      <span className="text-xs text-gray-400">Pass: {quiz.pass_score} pts · Max: {quiz.max_attempts_per_user} attempt(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => loadAttempts(quiz.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Analytics">
                      <BarChart3 size={15} />
                    </button>
                    <button onClick={() => setEditQuiz(quiz)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => deleteQuiz(quiz.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 size={15} />
                    </button>
                    <button onClick={() => openDetail(quiz.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded questions editor */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Questions</p>
                    {!detail ? <p className="text-xs text-gray-400">Loading…</p> : (
                      <div className="space-y-3">
                        {(detail.questions || []).map(q => (
                          <QuestionCard key={q.id} question={q} quizId={quiz.id}
                            onAddOption={addOption} onDeleteOption={deleteOption} onDeleteQuestion={deleteQuestion} />
                        ))}
                        <AddQuestionInput onAdd={(text) => addQuestion(quiz.id, text)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

function QuestionCard({ question, quizId, onAddOption, onDeleteOption, onDeleteQuestion }: any) {
  const [newOpt, setNewOpt] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const options: Option[] = Array.isArray(question.options) ? question.options.filter(Boolean) : []
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">{question.question_text}</p>
        <button onClick={() => onDeleteQuestion(quizId, question.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={13} /></button>
      </div>
      <div className="mt-2 space-y-1.5">
        {options.map((o: Option) => o?.id ? (
          <div key={o.id} className="flex items-center gap-2">
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: o.is_correct ? '#dcfce7' : '#f3f4f6', border: `1.5px solid ${o.is_correct ? '#16a34a' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {o.is_correct && <Check size={10} style={{ color: '#16a34a' }} />}
            </span>
            <span className="text-xs text-gray-700 flex-1">{o.option_text}</span>
            {o.is_correct && <span className="text-xs font-bold text-green-600">+{o.points}pt</span>}
            <button onClick={() => onDeleteOption(quizId, o.id)} className="text-red-400 hover:text-red-600"><X size={11} /></button>
          </div>
        ) : null)}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input value={newOpt} onChange={e => setNewOpt(e.target.value)} placeholder="Add option…"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400"
          onKeyDown={e => { if (e.key === 'Enter') { onAddOption(quizId, question.id, newOpt, isCorrect); setNewOpt('') } }} />
        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={isCorrect} onChange={e => setIsCorrect(e.target.checked)} className="w-3 h-3" />
          Correct
        </label>
        <button onClick={() => { onAddOption(quizId, question.id, newOpt, isCorrect); setNewOpt('') }}
          className="text-xs bg-violet-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-violet-700">Add</button>
      </div>
    </div>
  )
}

function AddQuestionInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <div className="flex items-center gap-2">
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a new question…"
        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400"
        onKeyDown={e => { if (e.key === 'Enter') { onAdd(text); setText('') } }} />
      <button onClick={() => { onAdd(text); setText('') }}
        className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 flex items-center gap-1">
        <Plus size={14} /> Add
      </button>
    </div>
  )
}
