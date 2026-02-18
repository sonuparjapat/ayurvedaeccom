'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import AppModal from '@/components/modal/AppModal'
import DynamicTable from '@/components/table/table'

import { Loader2, Plus, Search } from 'lucide-react'

interface Category {
  id: number
  name: string
}

interface ApiResponse {
  rows: Category[]
  total: number
  page: number
  limit: number
}

export default function AdminCategories() {

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const [total, setTotal] = useState(0)

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [gstpercent,setGstPercent]=useState<any>(0)
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    try {
      setLoading(true)

      const res = await axios.get('/categories', {
        params: { page, limit, search }
      })

      const data: ApiResponse = res.data.data
      setCategories(data.rows)
      setTotal(data.total)

    } catch (err) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [page, search])

  const openCreate = () => {
    setEditData(null)
    setName('')
    setOpenModal(true)
  }

  const openEdit = (row: Category) => {
    setEditData(row)
    setName(row.name)
    setOpenModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setOpenModal(false)
    setEditData(null)
    setName('')
  }

  const validate = () => {
    if (!name.trim()) return 'Category name required'
    if (name.trim().length < 2) return 'Minimum 2 characters'
    if (name.trim().length > 50) return 'Maximum 50 characters'
    return null
  }

  const saveCategory = async () => {
    const err = validate()
    if (err) return toast.error(err)

    try {
      setSaving(true)

      if (editData) {
        await axios.put(`/categories/${editData.id}`, { name: name.trim(),gst_percent:gstpercent })
        toast.success('Category updated')
      } else {
        await axios.post('/categories', { name: name.trim(),gst_percent:gstpercent  })
        toast.success('Category created')
      }

      closeModal()
      loadCategories()

    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category?')) return
    try {
      await axios.delete(`/categories/${id}`)
      toast.success('Category deleted')
      loadCategories()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(total / limit)

  const columns = [
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'name', label: 'Category Name' },
    { key: 'actions', label: 'Actions', align: 'center' },
  ]

  const rows = categories.map(cat => ({
    ...cat,
    actions: (
      <div className="flex justify-center gap-3">
        <button
          onClick={() => openEdit(cat)}
          className="px-3 py-1 text-xs font-semibold uppercase tracking-wide
          text-amber-400 border border-amber-400/40 rounded-md
          hover:bg-amber-400/10 transition-colors duration-150"
        >
          Edit
        </button>

        <button
          onClick={() => deleteCategory(cat.id)}
          className="px-3 py-1 text-xs font-semibold uppercase tracking-wide
          text-rose-400 border border-rose-400/40 rounded-md
          hover:bg-rose-400/10 transition-colors duration-150"
        >
          Delete
        </button>
      </div>
    )
  }))

  return (
    <div className="min-h-screen ">

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div>
           
            <h1 className="text-3xl font-bold mt-1">
              Category Management
            </h1>
          </div>

          <div className="flex items-center gap-3">

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => { setPage(1); setSearch(e.target.value) }}
                placeholder="Search category..."
                className="pl-8 pr-4 py-2.5  border border-slate-700
                rounded-lg text-sm placeholder:text-slate-500
                focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
              bg-emerald-500 text-black font-semibold text-sm
              hover:bg-emerald-400 transition-colors"
            >
              <Plus size={14} />
              Add Category
            </button>

          </div>
        </div>

        {/* TABLE */}
        <div className="bg-[#141821] border border-slate-700 rounded-xl overflow-hidden">

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
            </div>
          ) : (
            <DynamicTable
              columns={columns}
              rows={rows}
              emptyMessage="No categories found"
            />
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">

            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400
              hover:border-emerald-500 hover:text-emerald-400 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400
              hover:border-emerald-500 hover:text-emerald-400 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>

          </div>
        )}

        {/* MODAL */}
        <AppModal
          open={openModal}
          onClose={closeModal}
          title={editData ? 'Edit Category' : 'Add Category'}
          description="Create and manage categories"
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400
                hover:border-slate-500 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={saveCategory}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-emerald-500 text-black
                font-semibold hover:bg-emerald-400 transition-colors
                flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editData ? 'Update' : 'Create'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Category Name
              </label>

              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Eg: Electronics"
                maxLength={50}
                className="w-full mt-2 rounded-lg px-4 py-3 text-sm
                bg-[#141821] border border-slate-700
                text-slate-200 placeholder:text-slate-500
                focus:outline-none focus:border-emerald-500 transition-colors"
              />

              <p className="text-xs text-slate-500 mt-2">
                2–50 characters
              </p>

            </div>
   <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
               Gst Percent
              </label>

              <input
                value={gstpercent}
                onChange={e => setGstPercent(e.target.value)}
                placeholder="18"
                min={0}
                type="number"
               
                className="w-full mt-2 rounded-lg px-4 py-3 text-sm
                bg-[#141821] border border-slate-700
                text-slate-200 placeholder:text-slate-500
                focus:outline-none focus:border-emerald-500 transition-colors"
              />

             

            </div>
          </div>
        </AppModal>

      </div>

    </div>
  )
}
