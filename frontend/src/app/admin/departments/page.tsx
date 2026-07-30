'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit2, Shield, Users, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Permission {
  id: number
  key: string
  label: string
  group_name: string
  description: string
  assigned?: boolean
}

interface Department {
  id: number
  name: string
  description: string
  is_active: boolean
  permission_count: number
  user_count: number
  created_at: string
}

interface AdminUser {
  id: number
  name: string
  email: string
  department_id: number | null
  department_name?: string
}

export default function DepartmentsPage() {
  const { loginuserdata, loading } = useAuth()
  const router = useRouter()

  const [departments, setDepartments] = useState<Department[]>([])
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({})
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  // Create dept modal
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Selected dept for permission editing
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [deptPerms, setDeptPerms] = useState<Record<string, Permission[]>>({})
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set())
  const [savingPerms, setSavingPerms] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Assign user modal
  const [assigningUser, setAssigningUser] = useState<AdminUser | null>(null)
  const [assignDeptId, setAssignDeptId] = useState<string>('')
  const [assigningSaving, setAssigningSaving] = useState(false)

  useEffect(() => {
    if (loading) return
    if (Number(loginuserdata?.role) !== 1) {
      router.replace('/admin/dashboard')
      return
    }
    loadAll()
  }, [loading, loginuserdata])

  const loadAll = async () => {
    setPageLoading(true)
    try {
      const [deptRes, permRes, userRes] = await Promise.all([
        axios.get('/admin/departments'),
        axios.get('/admin/permissions/all'),
        axios.get('/admin/users?role=2'),
      ])
      setDepartments(deptRes.data.departments || [])
      setAllPermissions(permRes.data.grouped || {})
      setAdminUsers((userRes.data.users || userRes.data.data || []).filter((u: AdminUser) => u))
    } catch {
      toast.error('Failed to load data')
    } finally {
      setPageLoading(false)
    }
  }

  const createDept = async () => {
    if (!createName.trim()) return toast.error('Department name is required')
    setCreating(true)
    try {
      await axios.post('/admin/departments', { name: createName.trim(), description: createDesc.trim() })
      toast.success('Department created')
      setShowCreate(false)
      setCreateName('')
      setCreateDesc('')
      loadAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create department')
    } finally {
      setCreating(false)
    }
  }

  const deleteDept = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"? Users in this department will be unassigned.`)) return
    try {
      await axios.delete(`/admin/departments/${dept.id}`)
      toast.success('Department deleted')
      if (selectedDept?.id === dept.id) setSelectedDept(null)
      loadAll()
    } catch {
      toast.error('Failed to delete department')
    }
  }

  const openPerms = useCallback(async (dept: Department) => {
    setSelectedDept(dept)
    try {
      const res = await axios.get(`/admin/departments/${dept.id}/permissions`)
      setDeptPerms(res.data.grouped || {})
      setCheckedKeys(new Set(res.data.assignedKeys || []))
      const allGroups = Object.keys(res.data.grouped || {})
      setExpandedGroups(new Set(allGroups))
    } catch {
      toast.error('Failed to load permissions')
    }
  }, [])

  const toggleKey = (key: string) => {
    setCheckedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const toggleGroup = (group: string) => {
    const groupKeys = (deptPerms[group] || []).map(p => p.key)
    const allChecked = groupKeys.every(k => checkedKeys.has(k))
    setCheckedKeys(prev => {
      const next = new Set(prev)
      groupKeys.forEach(k => allChecked ? next.delete(k) : next.add(k))
      return next
    })
  }

  const savePerms = async () => {
    if (!selectedDept) return
    setSavingPerms(true)
    try {
      await axios.put(`/admin/departments/${selectedDept.id}/permissions`, { permissions: [...checkedKeys] })
      toast.success('Permissions saved')
      loadAll()
    } catch {
      toast.error('Failed to save permissions')
    } finally {
      setSavingPerms(false)
    }
  }

  const saveAssign = async () => {
    if (!assigningUser) return
    setAssigningSaving(true)
    try {
      await axios.put(`/admin/user/${assigningUser.id}/department`, {
        department_id: assignDeptId ? Number(assignDeptId) : null,
      })
      toast.success('User department updated')
      setAssigningUser(null)
      loadAll()
    } catch {
      toast.error('Failed to update user')
    } finally {
      setAssigningSaving(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments &amp; Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin departments and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          <Plus size={16} /> New Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div
            key={dept.id}
            className={`bg-white rounded-xl border p-4 flex flex-col gap-3 shadow-sm cursor-pointer transition-all ${
              selectedDept?.id === dept.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-emerald-300'
            }`}
            onClick={() => openPerms(dept)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-emerald-600 shrink-0" />
                <span className="font-semibold text-gray-900">{dept.name}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={e => { e.stopPropagation(); openPerms(dept) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  title="Edit permissions"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteDept(dept) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete department"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {dept.description && (
              <p className="text-xs text-gray-500">{dept.description}</p>
            )}

            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield size={12} /> {dept.permission_count} permissions
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {dept.user_count} admins
              </span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${dept.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {dept.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p>No departments yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Permission Editor */}
      {selectedDept && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="font-semibold text-gray-900">Permissions — {selectedDept.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{checkedKeys.size} permissions selected</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedDept(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border rounded-lg">
                Cancel
              </button>
              <button
                onClick={savePerms}
                disabled={savingPerms}
                className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                {savingPerms ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(deptPerms).map(([group, perms]) => {
              const isExpanded = expandedGroups.has(group)
              const groupKeys = perms.map(p => p.key)
              const checkedCount = groupKeys.filter(k => checkedKeys.has(k)).length
              const allChecked = checkedCount === groupKeys.length

              return (
                <div key={group} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                    onClick={() => setExpandedGroups(prev => {
                      const next = new Set(prev)
                      if (next.has(group)) next.delete(group); else next.add(group)
                      return next
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleGroup(group)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="font-semibold text-sm text-gray-800 capitalize">{group.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{checkedCount}/{groupKeys.length}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-gray-50">
                      {perms.map(perm => (
                        <label
                          key={perm.key}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-emerald-50/40 transition"
                        >
                          <input
                            type="checkbox"
                            checked={checkedKeys.has(perm.key)}
                            onChange={() => toggleKey(perm.key)}
                            className="w-4 h-4 mt-0.5 accent-emerald-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{perm.label}</p>
                            {perm.description && (
                              <p className="text-xs text-gray-400">{perm.description}</p>
                            )}
                            <code className="text-[10px] text-gray-300 font-mono">{perm.key}</code>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Admin Users</h2>
          <p className="text-xs text-gray-500 mt-0.5">Assign admins to departments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {adminUsers.map(user => {
                const dept = departments.find(d => d.id === user.department_id)
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      {dept
                        ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">{dept.name}</span>
                        : <span className="text-gray-400 text-xs">Unassigned</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setAssigningUser(user); setAssignDeptId(user.department_id ? String(user.department_id) : '') }}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        Assign Department
                      </button>
                    </td>
                  </tr>
                )
              })}
              {adminUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No admin users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Department Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Create Department</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createName.trim() && createDept()}
                  placeholder="e.g. Orders Team"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="Optional description…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={createDept}
                disabled={creating || !createName.trim()}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Department Modal */}
      {assigningUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-1">Assign Department</h3>
            <p className="text-sm text-gray-500 mb-4">{assigningUser.name} ({assigningUser.email})</p>
            <select
              value={assignDeptId}
              onChange={e => setAssignDeptId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 mb-4"
            >
              <option value="">— No Department —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssigningUser(null)} className="px-4 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={saveAssign}
                disabled={assigningSaving}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                {assigningSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
