"use client"

import { useEffect, useState, FormEvent } from "react"
import axios from "@/lib/axios"
import toast from "react-hot-toast"
import { useAuth } from "@/context/auth-context"

type Mode = "create" | "edit" | "view"

interface Props {
  mode: Mode
  initialData?: any
  onSuccess: () => void
}

interface FormData {
  name: string
  email: string
  phone: string
  password: string
  role: "1" | "2" | "3"
  is_verified: boolean
  department_id: string
}

interface Department {
  id: number
  name: string
  is_active: boolean
}

interface Role {
  id: number
  name: string
}

export default function AdminUserForm({ mode, initialData, onSuccess }: Props) {
  const { loginuserdata } = useAuth()
  const callerRole = Number(loginuserdata?.role)

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "3",
    is_verified: false,
    department_id: "",
  })

  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const isView = mode === "view"
  const isEdit = mode === "edit"
  const isCreate = mode === "create"

  /* Load departments + roles from API */
  useEffect(() => {
    axios.get("/admin/departments")
      .then(r => setDepartments((r.data.departments || []).filter((d: Department) => d.is_active)))
      .catch(() => {})
    axios.get("/admin/roles")
      .then(r => setRoles(r.data.roles || []))
      .catch(() => {})
  }, [])

  /* Populate form on edit/view */
  useEffect(() => {
    if (initialData && (isEdit || isView)) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        password: "",
        role: String(initialData.role) as any,
        is_verified: Boolean(initialData.is_verified),
        department_id: initialData.department_id ? String(initialData.department_id) : "",
      })
    }
  }, [initialData, isEdit, isView])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  function validate() {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) e.name = "Name required"
    if (!form.email.trim()) e.email = "Email required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email"
    if (isCreate) {
      if (!form.password) e.password = "Password required"
      else if (form.password.length < 6) e.password = "Minimum 6 characters"
    }
    if (!["1", "2", "3"].includes(form.role)) e.role = "Invalid role"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    try {
      setLoading(true)
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: Number(form.role),
        is_verified: form.is_verified,
        department_id: form.role === "2" && form.department_id ? Number(form.department_id) : null,
      }
      if (isCreate) payload.password = form.password

      if (isCreate) {
        await axios.post("/admin/create", payload)
        toast.success("User created")
      } else if (isEdit) {
        await axios.put(`/admin/user/${initialData.id}`, payload)
        toast.success("Updated")
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Field label="Full Name" error={errors.name}>
          <input
            name="name" value={form.name} onChange={handleChange}
            disabled={isView} placeholder="e.g. Rajesh Kumar"
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            name="email" type="email" value={form.email} onChange={handleChange}
            disabled={isView || isEdit} placeholder="e.g. rajesh@example.com"
            className={inputCls(!!errors.email)}
          />
        </Field>

        <Field label="Phone" error={errors.phone}>
          <input
            name="phone" value={form.phone} onChange={handleChange}
            disabled={isView} placeholder="e.g. +91 98765 43210"
            className={inputCls(!!errors.phone)}
          />
        </Field>

        {/* Password — create mode only */}
        {isCreate && (
          <Field label="Password" error={errors.password}>
            <input
              name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Minimum 6 characters"
              className={inputCls(!!errors.password)}
            />
          </Field>
        )}

        <Field label="Role" error={errors.role}>
          <select
            name="role" value={form.role} onChange={handleChange}
            disabled={isView}
            className={inputCls(!!errors.role)}
          >
            {roles.length > 0
              ? roles
                  .filter(r => callerRole === 1 || r.id !== 1) // only superadmin can assign role 1
                  .map(r => (
                    <option key={r.id} value={String(r.id)}>{r.name}</option>
                  ))
              : (
                // Fallback while roles are loading
                <>
                  {callerRole === 1 && <option value="1">Super Admin</option>}
                  <option value="2">Admin / Staff</option>
                  <option value="3">Customer</option>
                </>
              )
            }
          </select>
        </Field>

        {/* Department — only relevant for role 2 */}
        {form.role === "2" && (
          <Field label="Department" error={errors.department_id}>
            <select
              name="department_id" value={form.department_id} onChange={handleChange}
              disabled={isView}
              className={inputCls(!!errors.department_id)}
            >
              <option value="">— No department assigned —</option>
              {departments.map(d => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
            {form.department_id === "" && !isView && (
              <p className="text-xs text-amber-600 mt-1">
                Without a department this admin will have no permissions.
              </p>
            )}
          </Field>
        )}

        <div className="flex items-center gap-3 pt-7">
          <input
            type="checkbox" name="is_verified"
            checked={form.is_verified} onChange={handleChange}
            disabled={isView}
            className="w-4 h-4"
          />
          <label className="text-sm font-medium">Verified Account</label>
        </div>
      </div>

      {!isView && (
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button" onClick={onSuccess}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="animate-spin">⏳</span>}
            {isCreate ? "Create User" : "Update User"}
          </button>
        </div>
      )}
    </form>
  )
}

function inputCls(error: boolean) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 ${error ? "border-red-500" : "border-gray-300"}`
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
