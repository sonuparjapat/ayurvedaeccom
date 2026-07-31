"use client"

import { useEffect, useState, FormEvent } from "react"
import axios from "@/lib/axios"
import toast from "react-hot-toast"
import { useAuth } from "@/context/auth-context"
import { Shield, User } from "lucide-react"

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

// Derived UI state (not sent to backend directly)
type AccountType = 'admin' | 'customer'

interface Department {
  id: number
  name: string
  is_active: boolean
  description?: string
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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  // accountType drives the top-level toggle
  const [accountType, setAccountType] = useState<AccountType>('customer')
  // adminPosition: 'superadmin' | '<department_id>' — only relevant when accountType==='admin'
  const [adminPosition, setAdminPosition] = useState<string>('')

  const isView = mode === "view"
  const isEdit = mode === "edit"
  const isCreate = mode === "create"

  /* Load departments */
  useEffect(() => {
    axios.get("/admin/departments")
      .then(r => setDepartments((r.data.departments || []).filter((d: Department) => d.is_active)))
      .catch(() => {})
  }, [])

  /* Populate form on edit/view */
  useEffect(() => {
    if (initialData && (isEdit || isView)) {
      const roleStr = String(initialData.role) as any
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        password: "",
        role: roleStr,
        is_verified: Boolean(initialData.is_verified),
        department_id: initialData.department_id ? String(initialData.department_id) : "",
      })
      if (Number(initialData.role) === 3) {
        setAccountType('customer')
        setAdminPosition('')
      } else {
        setAccountType('admin')
        if (Number(initialData.role) === 1) {
          setAdminPosition('superadmin')
        } else {
          setAdminPosition(initialData.department_id ? String(initialData.department_id) : '')
        }
      }
    }
  }, [initialData, isEdit, isView])

  // Sync form.role + form.department_id from derived UI state
  useEffect(() => {
    if (accountType === 'customer') {
      setForm(prev => ({ ...prev, role: '3', department_id: '' }))
    } else {
      if (adminPosition === 'superadmin') {
        setForm(prev => ({ ...prev, role: '1', department_id: '' }))
      } else if (adminPosition) {
        setForm(prev => ({ ...prev, role: '2', department_id: adminPosition }))
      } else {
        setForm(prev => ({ ...prev, role: '2', department_id: '' }))
      }
    }
  }, [accountType, adminPosition])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name required"
    if (!form.email.trim()) e.email = "Email required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email"
    if (isCreate) {
      if (!form.password) e.password = "Password required"
      else if (form.password.length < 6) e.password = "Minimum 6 characters"
    }
    if (accountType === 'admin' && !adminPosition) {
      e.adminPosition = "Please select a position"
    }
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

      </div>

      {/* ── Account Type Toggle ── */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">Account Type</label>
        <div className="grid grid-cols-2 gap-3">
          {/* Admin Account */}
          <button
            type="button"
            disabled={isView}
            onClick={() => { if (!isView) { setAccountType('admin'); setAdminPosition('') } }}
            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              accountType === 'admin'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isView ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
          >
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${accountType === 'admin' ? 'bg-indigo-500' : 'bg-gray-100'}`}>
              <Shield size={16} className={accountType === 'admin' ? 'text-white' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${accountType === 'admin' ? 'text-indigo-700' : 'text-gray-700'}`}>Admin Account</p>
              <p className="text-xs text-gray-500 mt-0.5">Has access to admin panel</p>
            </div>
            {accountType === 'admin' && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* Customer Account */}
          <button
            type="button"
            disabled={isView}
            onClick={() => { if (!isView) { setAccountType('customer'); setAdminPosition('') } }}
            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              accountType === 'customer'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isView ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
          >
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${accountType === 'customer' ? 'bg-emerald-500' : 'bg-gray-100'}`}>
              <User size={16} className={accountType === 'customer' ? 'text-white' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${accountType === 'customer' ? 'text-emerald-700' : 'text-gray-700'}`}>Customer Account</p>
              <p className="text-xs text-gray-500 mt-0.5">Regular user / shopper</p>
            </div>
            {accountType === 'customer' && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── Admin Position (only when Admin type selected) ── */}
      {accountType === 'admin' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Position / Role <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500">
            Select what this admin can do. Super Admin has full access; department-based admins have permissions defined by their department.
          </p>

          <div className="grid grid-cols-1 gap-2 mt-2">
            {/* Super Admin option — only superadmins can assign this */}
            {callerRole === 1 && (
              <button
                type="button"
                disabled={isView}
                onClick={() => !isView && setAdminPosition('superadmin')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  adminPosition === 'superadmin'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${isView ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="text-lg">👑</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${adminPosition === 'superadmin' ? 'text-purple-700' : 'text-gray-700'}`}>
                    Super Admin
                  </p>
                  <p className="text-xs text-gray-400">Full access to everything — all permissions bypassed</p>
                </div>
                {adminPosition === 'superadmin' && (
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            )}

            {/* Department-based positions */}
            {departments.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No departments configured yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create departments in <span className="font-medium">Departments & Roles</span> to define staff positions.
                </p>
              </div>
            ) : (
              departments.map(dept => (
                <button
                  key={dept.id}
                  type="button"
                  disabled={isView}
                  onClick={() => !isView && setAdminPosition(String(dept.id))}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    adminPosition === String(dept.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${isView ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="text-lg">🏢</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${adminPosition === String(dept.id) ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {dept.name}
                    </p>
                    {dept.description && (
                      <p className="text-xs text-gray-400">{dept.description}</p>
                    )}
                  </div>
                  {adminPosition === String(dept.id) && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {errors.adminPosition && (
            <p className="text-xs text-red-600 mt-1">{errors.adminPosition}</p>
          )}
        </div>
      )}

      {/* ── Customer: show locked role info ── */}
      {accountType === 'customer' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-lg">🛒</span>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Customer Role</p>
            <p className="text-xs text-gray-500">Standard user — can browse, order, review. No admin access.</p>
          </div>
          <div className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Locked</div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox" name="is_verified"
          checked={form.is_verified} onChange={handleChange}
          disabled={isView}
          className="w-4 h-4"
        />
        <label className="text-sm font-medium">Verified Account</label>
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
