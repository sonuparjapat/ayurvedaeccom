"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import toast from "react-hot-toast"
import AdminUserForm from "./AdminUserForm"
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Loader2,
  User,
} from "lucide-react"




/* ================= TYPES ================= */

interface IUser {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 1 | 2 | 3
  is_verified: boolean
  department_id?: number | null
  department_name?: string | null
  created_at: string
}


/* ================= MAIN ================= */

export default function AdminUsers() {

  /* ================= STATE ================= */

  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [total, setTotal] = useState(0)
  const limit = 8


  const [showForm, setShowForm] = useState(false)

  const [currentItem, setCurrentItem] = useState<IUser | null>(null)

  const [formMode, setFormMode] =
    useState<"create" | "edit" | "view">("create")

  const [deleteItem, setDeleteItem] =
    useState<IUser | null>(null)


  /* ================= LOAD ================= */

  const loadUsers = async () => {

    try {

      setLoading(true)

      const res = await axios.get(
        `/admin/users?page=${page}&limit=${limit}&search=${search}`
      )

      setUsers(res.data.users || [])
      setTotal(res.data.pagination?.total || 0)

    } catch {

      toast.error("Load failed")

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    const t = setTimeout(() => {
      loadUsers()
    }, 400)

    return () => clearTimeout(t)

  }, [page, search])


  /* ================= DELETE ================= */

  const handleDelete = async () => {

    if (!deleteItem) return

    try {

      await axios.delete(`/admin/user/${deleteItem.id}`)

      toast.success("Deleted")

      setDeleteItem(null)

      loadUsers()

    } catch {

      toast.error("Delete failed")

    }

  }


  const totalPages = Math.ceil(total / limit)


  /* ================= UI ================= */

  return (

    <div className="space-y-6">


      {/* HEADER */}

      <div className="flex flex-wrap justify-between items-center gap-3">

        <div>

          <h1 className="text-2xl font-bold">
            Users
          </h1>

          <p className="text-sm text-gray-500">
            Manage platform users
          </p>

        </div>


        <button
          onClick={() => {
            setCurrentItem(null)
            setFormMode("create")
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >

          <Plus size={18} />
          Add User

        </button>

      </div>


      {/* SEARCH */}

      <div className="relative w-full md:w-72">

        <Search
          size={16}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search users..."
          className="
            w-full border rounded-lg
            pl-9 pr-3 py-2
          "
        />

      </div>


      {/* TABLE */}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">


        {loading ? (

          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-center w-[60px]">
                    #
                  </th>

                  <th className="p-3 text-left">
                    Name
                  </th>

                  <th className="p-3 text-left">
                    Email
                  </th>

                  <th className="p-3 text-center w-[100px]">
                    Role
                  </th>

                  <th className="p-3 text-left w-35">
                    Department
                  </th>

                  <th className="p-3 text-center w-[100px]">
                    Status
                  </th>

                  <th className="p-3 text-center w-[140px]">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {users.length === 0 && (

                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>

                )}


                {users.map((u, index) => (

                  <tr
                    key={u.id}
                    className="border-b hover:bg-gray-50"
                  >

                    {/* INDEX */}

                    <td className="p-3 text-center text-gray-500">

                      {(page - 1) * limit + index + 1}

                    </td>


                    {/* NAME */}

                    <td className="p-3">

                      <div className="font-medium">
                       {u.name}
                      </div>

                      <div className="text-xs text-gray-500">
                        {u.phone || "—"}
                      </div>

                    </td>


                    {/* EMAIL */}

                    <td className="p-3">
                      {u.email}
                    </td>


                    {/* ROLE */}

                    <td className="p-3 text-center">

                      <span
                        className={`
                          px-2 py-0.5 rounded-full text-xs
                          ${
                            u.role === 1
                              ? "bg-purple-100 text-purple-700"
                              : u.role === 2
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-700"
                          }
                        `}
                      >

                        {u.role === 1 && "SuperAdmin"}
                        {u.role === 2 && "Admin"}
                        {u.role === 3 && "User"}

                      </span>

                    </td>


                    {/* DEPARTMENT */}

                    <td className="p-3">
                      {u.role === 2 ? (
                        u.department_name
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">{u.department_name}</span>
                          : <span className="text-xs text-amber-600">Unassigned</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>


                    {/* STATUS */}

                    <td className="p-3 text-center">

                      <span
                        className={`
                          px-2 py-0.5 rounded-full text-xs
                          ${
                            u.is_verified
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }
                        `}
                      >

                        {u.is_verified
                          ? "Active"
                          : "Pending"}

                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td className="p-3">

                      <div className="flex justify-center gap-2">


                        <ActionBtn
                          title="View"
                          onClick={() => {
                            setCurrentItem(u)
                            setFormMode("view")
                            setShowForm(true)
                          }}
                        >
                          <Eye size={15} />
                        </ActionBtn>


                        <ActionBtn
                          title="Edit"
                          onClick={() => {
                            setCurrentItem(u)
                            setFormMode("edit")
                            setShowForm(true)
                          }}
                        >
                          <Pencil size={15} />
                        </ActionBtn>


                        <ActionBtn
                          danger
                          title="Delete"
                          onClick={() => setDeleteItem(u)}
                        >
                          <Trash2 size={15} />
                        </ActionBtn>


                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* PAGINATION */}

      {totalPages > 1 && (

        <div className="flex justify-center gap-1">

          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>


          {Array.from({ length: totalPages }).map((_, i) => (

            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`
                px-3 py-1 rounded border text-sm
                ${
                  page === i + 1
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100"
                }
              `}
            >
              {i + 1}
            </button>

          ))}


          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>

        </div>

      )}


      {/* FORM MODAL */}

      {showForm && (

        <Modal onClose={() => setShowForm(false)}>

          <AdminUserForm
            mode={formMode}
            initialData={currentItem}
            onSuccess={() => {
              setShowForm(false)
              loadUsers()
            }}
          />

        </Modal>

      )}


      {/* DELETE MODAL */}

      {deleteItem && (

        <Modal onClose={() => setDeleteItem(null)}>

          <div className="text-center space-y-4">

            <Trash2
              size={40}
              className="mx-auto text-red-600"
            />

            <h3 className="text-lg font-bold">
              Delete User?
            </h3>

            <p className="text-sm text-gray-600">
              This action cannot be undone
            </p>


            <div className="flex justify-center gap-3 pt-2">

              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>


              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>

            </div>

          </div>

        </Modal>

      )}

    </div>
  )
}


/* ================= COMPONENTS ================= */


function Modal({ children, onClose }: any) {

  return (

    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        flex items-center justify-center
        p-4
      "
    >

      <div
        className="
          bg-white w-full max-w-3xl
          rounded-xl shadow-xl
          flex flex-col
          max-h-[90vh]
        "
      >

        <div className="flex justify-between items-center px-6 py-3 border-b">

          <h2 className="font-semibold">
            User
          </h2>

          <button onClick={onClose}>
            <X size={18} />
          </button>

        </div>


        <div className="flex-1 overflow-y-auto px-6 py-4">

          {children}

        </div>

      </div>

    </div>
  )
}


function ActionBtn({
  children,
  onClick,
  danger = false,
  title,
}: any) {

  return (

    <button
      title={title}
      onClick={onClick}
      className={`
        p-2 rounded-lg border
        hover:bg-gray-100
        transition
        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-gray-700"
        }
      `}
    >
      {children}
    </button>

  )
}
