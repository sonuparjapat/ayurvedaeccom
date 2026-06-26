'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import DynamicTable from '@/components/table/table'
import Pagination from '@/components/Paginationcom'
import AppModal from '@/components/modal/AppModal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CompanyPage() {

  const initialForm = {
    company_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    privacy_policy: '',
    terms_conditions: '',
    shipping_policy: '',
    return_policy: '',
  }

  const [data, setData] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState(initialForm)

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/company?page=${page}&limit=10`)
      setData(res.data.data)
      setTotalPages(res.data.totalPages)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error fetching data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  /* ================= OPEN CREATE ================= */

  const openCreate = () => {
    setEditId(null)
    setForm(initialForm)
    setOpen(true)
  }

  /* ================= OPEN EDIT ================= */

  const openEdit = (row: any) => {
    setEditId(row.id)
    setForm({
      company_name: row.company_name || '',
      email: row.email || '',
      phone: row.phone || '',
      city: row.city || '',
      state: row.state || '',
      country: row.country || '',
      privacy_policy: row.privacy_policy || '',
      terms_conditions: row.terms_conditions || '',
      shipping_policy: row.shipping_policy || '',
      return_policy: row.return_policy || '',
    })
    setOpen(true)
  }

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {

    if (!form.company_name.trim()) {
      return toast.error("Company name is required")
    }

    try {
      setSubmitting(true)

      if (editId) {
        await axios.put(`/company/${editId}`, form)
        toast.success("Updated successfully")
      } else {
        await axios.post('/company', form)
        toast.success("Created successfully")
      }

      // Reset state after success
      setForm(initialForm)
      setEditId(null)
      setOpen(false)

      fetchData()

    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= DELETE ================= */

  const handleDelete = async (id: number) => {

    const confirmDelete = confirm("Are you sure you want to delete this company?")

    if (!confirmDelete) return

    try {
      await axios.delete(`/company/${id}`)
      toast.success("Deleted successfully")
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed")
    }
  }

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center'
    }
  ]

  /* ================= ROWS WITH ACTIONS ================= */

  const rows = data.map((item) => ({
    ...item,
    actions: (
      <div className="flex gap-2 justify-center">

        <button
          onClick={() => openEdit(item)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={() => handleDelete(item.id)}
          className="p-2 rounded-md hover:bg-red-100 text-red-600"
        >
          <Trash2 size={16} />
        </button>

      </div>
    )
  }))

  return (
    <div className="p-4 md:p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-semibold">Company Settings</h2>

        <button
          onClick={openCreate}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add Company
        </button>
      </div>

      {/* TABLE */}
      <DynamicTable
        columns={columns}
        rows={rows}
        emptyMessage={loading ? "Loading..." : "No company found"}
      />

      {/* PAGINATION */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* MODAL */}
      <AppModal
        open={open}
        onClose={() => {
          setOpen(false)
          setForm(initialForm)
          setEditId(null)
        }}
        title={editId ? "Edit Company" : "Add Company"}
        footer={
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 rounded-lg text-white ${
              submitting ? "bg-gray-400" : "bg-black"
            }`}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        }
      >
        <div className="grid gap-4">
          <p className="text-xs text-gray-500 mb-3">Company details appear on invoices, footer, and contact pages.</p>

          <input
            placeholder="e.g. Oroganix Pvt Ltd"
            className="border p-2 rounded-lg"
            value={form.company_name}
            onChange={(e) =>
              setForm({ ...form, company_name: e.target.value })
            }
          />

          <input
            placeholder="e.g. support@oroganix.com"
            className="border p-2 rounded-lg"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            placeholder="e.g. +91 98765 43210"
            className="border p-2 rounded-lg"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <input
            placeholder="e.g. Mumbai"
            className="border p-2 rounded-lg"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
          />

          <input
            placeholder="e.g. Maharashtra"
            className="border p-2 rounded-lg"
            value={form.state}
            onChange={(e) =>
              setForm({ ...form, state: e.target.value })
            }
          />

          <input
            placeholder="e.g. India"
            className="border p-2 rounded-lg"
            value={form.country}
            onChange={(e) =>
              setForm({ ...form, country: e.target.value })
            }
          />

          {/* Policy Fields */}
          <div className="border-t pt-4 mt-2">
            <p className="text-xs text-gray-500 mb-3 font-semibold">Policy Pages (supports HTML content)</p>

            <label className="text-sm font-medium text-gray-700 mb-1 block">Privacy Policy</label>
            <textarea
              placeholder="Enter privacy policy content (HTML supported)"
              className="border p-2 rounded-lg w-full min-h-30 text-sm"
              value={form.privacy_policy}
              onChange={(e) =>
                setForm({ ...form, privacy_policy: e.target.value })
              }
            />

            <label className="text-sm font-medium text-gray-700 mb-1 block mt-3">Terms & Conditions</label>
            <textarea
              placeholder="Enter terms & conditions content (HTML supported)"
              className="border p-2 rounded-lg w-full min-h-30 text-sm"
              value={form.terms_conditions}
              onChange={(e) =>
                setForm({ ...form, terms_conditions: e.target.value })
              }
            />

            <label className="text-sm font-medium text-gray-700 mb-1 block mt-3">Shipping Policy</label>
            <textarea
              placeholder="Enter shipping policy content (HTML supported)"
              className="border p-2 rounded-lg w-full min-h-30 text-sm"
              value={form.shipping_policy}
              onChange={(e) =>
                setForm({ ...form, shipping_policy: e.target.value })
              }
            />

            <label className="text-sm font-medium text-gray-700 mb-1 block mt-3">Return Policy</label>
            <textarea
              placeholder="Enter return policy content (HTML supported)"
              className="border p-2 rounded-lg w-full min-h-30 text-sm"
              value={form.return_policy}
              onChange={(e) =>
                setForm({ ...form, return_policy: e.target.value })
              }
            />
          </div>

        </div>
      </AppModal>

    </div>
  )
}