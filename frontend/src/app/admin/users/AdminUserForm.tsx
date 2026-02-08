"use client"

import { useEffect, useState, FormEvent } from "react"
import axios from "@/lib/axios"
import toast from "react-hot-toast"


/* ================= TYPES ================= */

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
  role: "1" | "2" | "3"
  is_verified: boolean
}


/* ================= COMPONENT ================= */

export default function AdminUserForm({
  mode,
  initialData,
  onSuccess,
}: Props) {

  /* ================= STATE ================= */

  const [form, setForm] = useState<FormData>({
  name: "",
  email: "",
  phone: "",
  role: "3",
  is_verified: false,
})
console.log(form,"for")

  const [loading, setLoading] = useState(false)

  const [errors, setErrors] =
    useState<Partial<FormData>>({})


  const isView = mode === "view"
  const isEdit = mode === "edit"


  /* ================= LOAD DATA ================= */

useEffect(() => {

  if (initialData && (isEdit || isView)) {

    setForm({
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      role: String(initialData.role) as any,
      is_verified: Boolean(initialData.is_verified),
    })
  }

}, [initialData, isEdit, isView])


  /* ================= CHANGE ================= */

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {

    const { name, value, type, checked } = e.target

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    /* Clear error */

    setErrors(prev => ({
      ...prev,
      [name]: undefined,
    }))
  }


  /* ================= VALIDATION ================= */

 function validate() {

  const e: Partial<FormData> = {}

  if (!form.name.trim()) {
    e.name = "Name required"
  }

  if (!form.email.trim()) {
    e.email = "Email required"
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    e.email = "Invalid email"
  }

  if (!["1", "2", "3"].includes(form.role)) {
    e.role = "Invalid role"
  }

  setErrors(e)

  return Object.keys(e).length === 0
}


  /* ================= SUBMIT ================= */

  async function handleSubmit(e: FormEvent) {

    e.preventDefault()

    if (!validate()) return

    try {

      setLoading(true)

      if (mode === "create") {

        await axios.post("/admin/create", form)

        toast.success("User created")

      } else if (mode === "edit") {

        await axios.put(
          `/admin/user/${initialData.id}`,
          form
        )

        toast.success("Updated")

      }

      onSuccess()

    } catch (err: any) {

      toast.error(
        err?.response?.data?.message ||
          "Save failed"
      )

    } finally {

      setLoading(false)

    }

  }


  /* ================= UI ================= */

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >


      {/* GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


       <Input
  label="Full Name"
  name="name"
  value={form.name}
  error={errors.name}
  disabled={isView}
  onChange={handleChange}
/>


        {/* EMAIL */}

        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          error={errors.email}
          disabled={isView || isEdit}
          onChange={handleChange}
        />


        {/* PHONE */}

        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          error={errors.phone}
          disabled={isView}
          onChange={handleChange}
        />


        {/* ROLE */}

        <Select
          label="Role"
          name="role"
          value={form.role}
          error={errors.role}
          disabled={isView}
          onChange={handleChange}
        />


        {/* VERIFIED */}

        <div className="flex items-center gap-3 pt-7">

          <input
            type="checkbox"
            name="is_verified"
            checked={form.is_verified}
            disabled={isView}
            onChange={handleChange}
            className="w-4 h-4"
          />

          <label className="text-sm font-medium">
            Verified Account
          </label>

        </div>

      </div>


      {/* ACTIONS */}

      {!isView && (

        <div className="flex justify-end gap-3 pt-4">


          <button
            type="button"
            onClick={onSuccess}
            className="
              px-4 py-2 border rounded-lg
              hover:bg-gray-100
            "
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={loading}
            className="
              px-5 py-2 bg-indigo-600
              text-white rounded-lg
              hover:bg-indigo-700
              disabled:opacity-50
              flex items-center gap-2
            "
          >

            {loading && (
              <span className="animate-spin">
                ⏳
              </span>
            )}

            {mode === "create"
              ? "Create User"
              : "Update User"}

          </button>

        </div>

      )}

    </form>
  )
}


/* ================= SMALL COMPONENTS ================= */


function Input({
  label,
  error,
  ...props
}: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        {...props}
        className={`
          w-full border rounded-lg
          px-3 py-2 text-sm
          focus:ring-2 focus:ring-indigo-500
          ${
            error
              ? "border-red-500"
              : "border-gray-300"
          }
        `}
      />

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

    </div>
  )
}


function Select({
  label,
  error,
  ...props
}: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">
        {label}
      </label>

      <select
        {...props}
        className={`
          w-full border rounded-lg
          px-3 py-2 text-sm
          focus:ring-2 focus:ring-indigo-500
          ${
            error
              ? "border-red-500"
              : "border-gray-300"
          }
        `}
      >

        <option value="1">Super Admin</option>
        <option value="2">Admin</option>
        <option value="3">User</option>

      </select>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

    </div>
  )
}