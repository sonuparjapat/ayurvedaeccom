'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import AppModal from '@/components/modal/AppModal'
import DynamicTable from '@/components/table/table'

import { Loader2, Plus, Search } from 'lucide-react'


/* ================= TYPES ================= */

interface Category {
  id: number
  name: string
  gst_percent: number
  hsn_code?: string

  cess_percent?: number
  color_class?: string
  image_url?: string
  description?: string
}

interface ApiResponse {
  rows: Category[]
  total: number
  page: number
  limit: number
}


/* ================= COMPONENT ================= */

export default function AdminCategories() {

  /* ================= STATES ================= */

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const limit = 10
  const [total, setTotal] = useState(0)

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState<Category | null>(null)

  const [name, setName] = useState('')
  const [gstpercent, setGstPercent] = useState<any>(0)
const [hsnCode, setHsnCode] = useState('')
const [taxName, setTaxName] = useState('')
const [cessPercent, setCessPercent] = useState<any>(0)
  const [color, setColor] = useState('')
  const [desc, setDesc] = useState('')

  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const [saving, setSaving] = useState(false)


  /* ================= LOAD ================= */

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


  /* ================= MODAL ================= */

  const openCreate = () => {

    setEditData(null)
setHsnCode('')
setTaxName('')
setCessPercent(0)
    setName('')
    setGstPercent(0)

    setColor('')
    setDesc('')

    setImage(null)
    setPreview(null)
    setRemoveImage(false)

    setOpenModal(true)

  }


  const openEdit = (row: Category) => {

    setEditData(row)

    setName(row.name)
    setGstPercent(row.gst_percent || 0)
setHsnCode(row.hsn_code || '')

setCessPercent(row.cess_percent || 0)
    setColor(row.color_class || '')
    setDesc(row.description || '')

    setPreview(row.image_url || null)

    setImage(null)
    setRemoveImage(false)

    setOpenModal(true)

  }


  const closeModal = () => {

    if (saving) return

    setOpenModal(false)
    setEditData(null)

    setName('')
    setGstPercent(0)
setHsnCode('')
setTaxName('')
setCessPercent(0)
    setColor('')
    setDesc('')

    setImage(null)
    setPreview(null)
    setRemoveImage(false)

  }


  /* ================= VALIDATION ================= */

  const validate = () => {

    if (!name.trim()) return 'Category name required'

    if (name.trim().length < 2) return 'Minimum 2 characters'

    if (name.trim().length > 50) return 'Maximum 50 characters'

    if (Number(gstpercent) < 0 || Number(gstpercent) > 100) {
      return 'GST must be between 0–100'
    }
    if (Number(cessPercent) < 0 || Number(cessPercent) > 100) {
  return 'CESS must be between 0–100'
}

    return null

  }


  /* ================= IMAGE ================= */

  const handleImage = (e: any) => {

    const file = e.target.files[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Only images allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB allowed')
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setRemoveImage(false)

  }


  /* ================= SAVE ================= */

  const saveCategory = async () => {

    const err = validate()
    if (err) return toast.error(err)

    try {

      setSaving(true)

      const form = new FormData()

      form.append('name', name.trim())
      form.append('gst_percent', String(gstpercent))
      form.append('color_class', color)
      form.append('description', desc)
form.append('hsn_code', hsnCode)

form.append('cess_percent', String(cessPercent))
      if (image) {
        form.append('image', image)
      }

      if (removeImage) {
        form.append('remove_image', 'true')
      }

      if (editData) {

        await axios.put(
          `/categories/${editData.id}`,
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        toast.success('Category updated')

      } else {

        await axios.post(
          '/categories',
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        toast.success('Category created')

      }

      closeModal()
      loadCategories()

    } catch (err: any) {

      toast.error(
        err?.response?.data?.message || 'Save failed'
      )

    } finally {

      setSaving(false)

    }

  }


  /* ================= DELETE ================= */

  const deleteCategory = async (id: number) => {

    if (!confirm('Delete this category?')) return

    try {

      await axios.delete(`/categories/${id}`)

      toast.success('Category deleted')

      loadCategories()

    } catch (err: any) {

      toast.error(
        err?.response?.data?.message || 'Delete failed'
      )

    }

  }


  /* ================= TABLE ================= */

  const totalPages = Math.ceil(total / limit)

const columns = [
  { key: 'id', label: 'ID', align: 'center' },
  { key: 'name', label: 'Category Name' },
  { key: 'hsn_code', label: 'HSN', align: 'center' },
  { key: 'gst_percent', label: 'GST %', align: 'center' },
  { key: 'cess_percent', label: 'CESS %', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'center' },
]


  const rows = categories.map(cat => ({

    ...cat,

    actions: (
      <div className="flex justify-center gap-3 flex-wrap">

        <button
          onClick={() => openEdit(cat)}
          className="px-3 py-1 text-xs font-semibold uppercase
          text-amber-400 border border-amber-400/40 rounded-md
          hover:bg-amber-400/10 transition"
        >
          Edit
        </button>

        <button
          onClick={() => deleteCategory(cat.id)}
          className="px-3 py-1 text-xs font-semibold uppercase
          text-rose-400 border border-rose-400/40 rounded-md
          hover:bg-rose-400/10 transition"
        >
          Delete
        </button>

      </div>
    )

  }))


  /* ================= RENDER ================= */

  return (

    <div className="min-h-screen">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">


        {/* HEADER */}
        <div className="flex flex-col md:flex-row
        md:items-center md:justify-between gap-4">

          <h1 className="text-3xl font-bold">
            Category Management
          </h1>


          <div className="flex flex-wrap items-center gap-3">


            {/* SEARCH */}
            <div className="relative w-full sm:w-auto">

              <Search
                size={14}
                className="absolute left-3 top-1/2
                -translate-y-1/2"
              />

              <input
                value={search}
                onChange={e => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                placeholder="Search category..."
                className="pl-8 pr-4 py-2.5 w-full sm:w-56
                border border-slate-700 rounded-lg text-sm
                focus:outline-none focus:border-emerald-500"
              />

            </div>


            {/* ADD */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2
              px-5 py-2.5 rounded-lg
              bg-emerald-500 text-black
              font-semibold text-sm
              hover:bg-emerald-400 transition"
            >
              <Plus size={14} />
              Add Category
            </button>

          </div>

        </div>


        {/* TABLE */}
        <div className="bg-[#141821] border
        border-slate-700 rounded-xl overflow-x-auto">

          {loading ? (

            <div className="flex justify-center items-center h-40">

              <Loader2
                size={28}
                className="animate-spin text-emerald-400"
              />

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

          <div className="flex flex-wrap justify-center
          items-center gap-4">

            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg border
              border-slate-700 text-slate-400
              hover:border-emerald-500 hover:text-emerald-400
              disabled:opacity-30"
            >
              ← Prev
            </button>

            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg border
              border-slate-700 text-slate-400
              hover:border-emerald-500 hover:text-emerald-400
              disabled:opacity-30"
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
                className="px-4 py-2 rounded-lg border
                border-slate-600 text-slate-400"
              >
                Cancel
              </button>

              <button
                onClick={saveCategory}
                disabled={saving}
                className="px-5 py-2 rounded-lg
                bg-emerald-500 text-black
                font-semibold flex items-center gap-2
                disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                )}

                {editData ? 'Update' : 'Create'}

              </button>

            </div>

          }
        >


          {/* MODAL BODY */}
          <div className="space-y-4">


            {/* NAME */}
            <div>
              <label className="text-xs uppercase
              text-slate-400 font-semibold">
                Category Name
              </label>

              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={50}
                className="input"
              />
            </div>


            {/* GST */}
            <div>
              <label className="text-xs uppercase
              text-slate-400 font-semibold">
                GST %
              </label>

              <input
                type="number"
                min={0}
                max={100}
                value={gstpercent}
                onChange={e => setGstPercent(e.target.value)}
                className="input"
              />
            </div>
            <div>
  <label className="text-xs uppercase text-slate-400 font-semibold">
    Default HSN Code
  </label>

  <input
    value={hsnCode}
    onChange={e => setHsnCode(e.target.value)}
    maxLength={30}
    className="input"
  />
</div>

{/* <div>
  <label className="text-xs uppercase text-slate-400 font-semibold">
    Tax Name
  </label>

  <input
    value={taxName}
    onChange={e => setTaxName(e.target.value)}
    maxLength={120}
    className="input"
  />
</div> */}

<div>
  <label className="text-xs uppercase text-slate-400 font-semibold">
    Default CESS %
  </label>

  <input
    type="number"
    min={0}
    max={100}
    value={cessPercent}
    onChange={e => setCessPercent(e.target.value)}
    className="input"
  />
</div>


            {/* COLOR */}
            <div>
              <label className="text-xs uppercase
              text-slate-400 font-semibold">
                Color Class
              </label>

              <input
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="bg-red-500 text-white"
                className="input"
              />
            </div>


            {/* DESC */}
            <div>
              <label className="text-xs uppercase
              text-slate-400 font-semibold">
                Description
              </label>

              <textarea
                rows={3}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="input resize-none"
              />
            </div>


            {/* IMAGE */}
            <div>
              <label className="text-xs uppercase
              text-slate-400 font-semibold">
                Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="input file:bg-emerald-500
                file:text-black"
              />
            </div>


            {/* PREVIEW */}
            {preview && (

              <div className="relative w-28">

                <img
                  src={preview}
                  className="w-28 h-28 object-cover
                  rounded-lg border"
                />

                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    setImage(null)
                    setRemoveImage(true)
                  }}
                  className="absolute -top-2 -right-2
                  bg-rose-500 text-white
                  rounded-full w-6 h-6"
                >
                  ×
                </button>

              </div>

            )}

          </div>

        </AppModal>

      </div>

    </div>

  )

}