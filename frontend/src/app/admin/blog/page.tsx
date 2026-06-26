'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  BookOpen, Plus, Pencil, Trash2, Search, Eye, Clock, RefreshCw,
} from 'lucide-react'
import AppModal from '@/components/modal/AppModal'
import RichTextEditor from '@/components/editor/RichTextEditor'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  content: string
  cover_image?: string | null
  author_name: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  views_count: number
  meta_title?: string | null
  meta_description?: string | null
  published_at?: string | null
  created_at: string
  updated_at: string
}

const defaultForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author_name: 'Oroganix Team',
  category: 'General',
  tags: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
  meta_title: '',
  meta_description: '',
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ ...defaultForm })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/blog/admin', { params: { page, limit: 20, search } })
      const data: BlogPost[] = res.data.data || []
      setPosts(data)
      setTotal(res.data.total || 0)

      // compute stats from full list (or use total as approximation)
      const pub = data.filter(p => p.status === 'published').length
      const dra = data.filter(p => p.status === 'draft').length
      setStats({ total: res.data.total || 0, published: pub, draft: dra })
    } catch { notify.error('Failed to load posts') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...defaultForm })
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(false)
    setModalOpen(true)
  }

  const openEdit = (p: BlogPost) => {
    setEditing(p)
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content,
      author_name: p.author_name || 'Oroganix Team',
      category: p.category || 'General',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      status: p.status,
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
    })
    setCoverFile(null)
    setCoverPreview(p.cover_image || null)
    setRemoveCover(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return notify.error('Title is required')
    if (!form.content.trim()) return notify.error('Content is required')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('slug', form.slug.trim())
      fd.append('excerpt', form.excerpt)
      fd.append('content', form.content)
      fd.append('author_name', form.author_name)
      fd.append('category', form.category)
      fd.append('tags', form.tags)
      fd.append('status', form.status)
      fd.append('meta_title', form.meta_title)
      fd.append('meta_description', form.meta_description)
      if (coverFile) fd.append('cover_image', coverFile)
      if (removeCover) fd.append('remove_cover', 'true')

      if (editing) {
        await axios.put(`/blog/admin/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Post updated')
      } else {
        await axios.post('/blog/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        notify.success('Post created')
      }
      setModalOpen(false)
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete post "${title}"?`)) return
    try {
      await axios.delete(`/blog/admin/${id}`)
      notify.success('Post deleted')
      load()
    } catch (e: any) { notify.error(e?.response?.data?.message || 'Delete failed') }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      published: 'bg-green-50 text-green-700',
      draft: 'bg-yellow-50 text-yellow-700',
      archived: 'bg-gray-100 text-gray-600',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    )
  }

  const formatDate = (d?: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Blog Management</h1>
              <p className="text-white/70 text-sm">{stats.total} posts total</p>
            </div>
          </div>
          <button onClick={openCreate} className="bg-white text-teal-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-teal-50 transition flex items-center gap-2">
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Posts', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Published', value: stats.published, color: 'bg-green-50 text-green-700' },
          { label: 'Drafts', value: stats.draft, color: 'bg-yellow-50 text-yellow-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold uppercase">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            placeholder="Search posts..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <button onClick={load} className="p-2 text-gray-500 hover:text-teal-600"><RefreshCw size={16} /></button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {['Title', 'Category', 'Status', 'Views', 'Published', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
                  No posts found
                </td></tr>
              ) : posts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.cover_image ? (
                        <img src={p.cover_image} alt="" className="w-10 h-10 object-cover rounded-lg border flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen size={16} className="text-teal-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[250px]">{p.title}</p>
                        <p className="text-xs text-gray-400 font-mono truncate max-w-[250px]">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="flex items-center gap-1"><Eye size={13} /> {p.views_count}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <span className="flex items-center gap-1"><Clock size={13} /> {formatDate(p.published_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id, p.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AppModal open={modalOpen} onClose={() => { if (!saving) setModalOpen(false) }} title={editing ? 'Edit Post' : 'Create Post'} width="max-w-5xl">
        <div className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title *</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none"
              value={form.title}
              onChange={e => {
                const title = e.target.value
                setForm(f => ({ ...f, title, slug: editing ? f.slug : slugify(title) }))
              }}
              placeholder="Post title" />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Slug</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none font-mono text-xs"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated-from-title" />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Excerpt</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none resize-none" rows={2}
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Short summary for listing cards" />
          </div>

          {/* Content — Rich Text Editor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Content *</label>
            <RichTextEditor
              value={form.content}
              onChange={(html: string) => setForm(f => ({ ...f, content: html }))}
              placeholder="Start writing your blog post... Use the toolbar to format text, add headings, images, lists, and more."
              minHeight={350}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cover Image</label>
            {(coverPreview && !removeCover) ? (
              <div className="flex items-center gap-3">
                <img src={coverPreview} alt="Cover" className="w-24 h-16 object-cover rounded-lg border" />
                <button onClick={() => { setRemoveCover(true); setCoverPreview(null); setCoverFile(null) }}
                  className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ) : (
              <input type="file" accept="image/*" className="text-sm"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); setRemoveCover(false) }
                }} />
            )}
            <p className="text-xs text-gray-400 mt-1">Recommended: 1200x600px, JPG or PNG. Shows as hero image on the blog post.</p>
          </div>

          {/* Category & Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="General" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Author Name</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none"
                value={form.author_name}
                onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                placeholder="Oroganix Team" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tags (comma-separated)</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="ayurveda, health, wellness" />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* SEO */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">SEO Settings</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Title</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none"
                  value={form.meta_title}
                  onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  placeholder="SEO title (optional)" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Description</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 focus:outline-none resize-none" rows={2}
                  value={form.meta_description}
                  onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  placeholder="SEO description (optional)" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition">
              {saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
