'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import { Star, Check, X, Trash2, Filter } from 'lucide-react'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/admin/reviews', { params: { status, page, limit } })
      setReviews(r.data.reviews || [])
      setTotal(r.data.total || 0)
    } catch { notify.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status, page])

  const updateStatus = async (id: number, newStatus: string) => {
    await axios.put(`/admin/reviews/${id}`, { status: newStatus })
    notify.success(`Review ${newStatus}`)
    load()
  }

  const deleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return
    await axios.delete(`/admin/reviews/${id}`)
    notify.success('Deleted')
    load()
  }

  const stars = (n: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={13} className={i < n ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
  ))

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="text-amber-400 fill-amber-400" size={22} /> Reviews Moderation</h1>
        <p className="text-gray-500 text-sm mt-1">Approve, reject or delete customer reviews</p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        {['all','approved','pending','rejected'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${status === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">{total} reviews</span>
      </div>

      {/* REVIEWS */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{r.user_name || 'Anonymous'}</span>
                    <div className="flex">{stars(r.rating)}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mb-1">{r.product_name}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                  {Array.isArray(r.images) && r.images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {r.images.map((img: string, i: number) => (
                        <img key={i} src={img} className="w-14 h-14 rounded-lg object-cover border" alt="review" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status !== 'approved' && (
                    <button onClick={() => updateStatus(r.id, 'approved')} title="Approve"
                      className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center">
                      <Check size={15} />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => updateStatus(r.id, 'rejected')} title="Reject"
                      className="w-8 h-8 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full flex items-center justify-center">
                      <X size={15} />
                    </button>
                  )}
                  <button onClick={() => deleteReview(r.id)} title="Delete"
                    className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!reviews.length && <div className="text-center py-20 text-gray-400">No reviews found</div>}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-sm">Page {page} of {Math.ceil(total/limit)}</span>
          <button disabled={page >= Math.ceil(total/limit)} onClick={() => setPage(p => p+1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
