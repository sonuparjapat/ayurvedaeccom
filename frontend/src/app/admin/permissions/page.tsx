'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit2, Shield, Search, X, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Permission {
  id: number
  key: string
  label: string
  group_name: string
  description: string | null
}

const EMPTY_FORM = { key: '', label: '', group_name: '', description: '' }

export default function PermissionsPage() {
  const { loginuserdata, loading } = useAuth()
  const router = useRouter()

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')

  // Create / edit modal
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loading) return
    if (Number(loginuserdata?.role) !== 1) {
      router.replace('/admin/dashboard')
      return
    }
    load()
  }, [loading, loginuserdata])

  const load = async () => {
    setPageLoading(true)
    try {
      const res = await axios.get('/admin/permissions/all')
      setPermissions(res.data.permissions || [])
    } catch {
      toast.error('Failed to load permissions')
    } finally {
      setPageLoading(false)
    }
  }

  const groups = useMemo(() => {
    const set = new Set(permissions.map(p => p.group_name))
    return ['all', ...Array.from(set).sort()]
  }, [permissions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return permissions.filter(p => {
      const matchGroup = groupFilter === 'all' || p.group_name === groupFilter
      const matchSearch = !q ||
        p.key.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.group_name.toLowerCase().includes(q)
      return matchGroup && matchSearch
    })
  }, [permissions, search, groupFilter])

  const grouped = useMemo(() => {
    const map: Record<string, Permission[]> = {}
    for (const p of filtered) {
      if (!map[p.group_name]) map[p.group_name] = []
      map[p.group_name].push(p)
    }
    return map
  }, [filtered])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (p: Permission) => {
    setEditing(p)
    setForm({ key: p.key, label: p.label, group_name: p.group_name, description: p.description || '' })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.key.trim() || !form.label.trim() || !form.group_name.trim()) {
      return toast.error('Key, Label, and Group are required')
    }
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`/admin/permissions/${editing.id}`, {
          label: form.label,
          group_name: form.group_name,
          description: form.description,
        })
        toast.success('Permission updated')
      } else {
        await axios.post('/admin/permissions', form)
        toast.success('Permission created')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save permission')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: Permission) => {
    if (!confirm(`Delete permission "${p.key}"?\nThis will fail if it is assigned to any department.`)) return
    try {
      await axios.delete(`/admin/permissions/${p.id}`)
      toast.success('Permission deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete permission')
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {permissions.length} permissions across {groups.length - 1} groups — these are assigned to departments
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          <Plus size={16} /> New Permission
        </button>
      </div>

      {/* Permission-to-sidebar key reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">How Permission Keys Work</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          Each sidebar menu item is bound to a permission <strong>key</strong> (dot notation, e.g. <code className="font-mono bg-blue-100 px-1 rounded">orders.view</code>).
          When a department admin logs in, only menu items whose permission key is assigned to their department are visible.
          Superadmins (role 1) always see everything.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by key, label, or group…"
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        >
          {groups.map(g => (
            <option key={g} value={g}>{g === 'all' ? 'All Groups' : g}</option>
          ))}
        </select>
      </div>

      {/* Permissions Table — grouped */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p>No permissions match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([group, perms]) => (
            <div key={group} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-emerald-600" />
                  <span className="font-semibold text-sm text-gray-800 capitalize">{group.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">{perms.length}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {perms.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition group">
                    {/* ID chip */}
                    <span className="shrink-0 w-10 text-center text-xs font-mono font-semibold bg-gray-100 text-gray-500 rounded-md py-0.5">
                      #{p.id}
                    </span>
                    {/* Key */}
                    <code className="shrink-0 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-52 truncate">
                      {p.key}
                    </code>
                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{p.label}</p>
                      {p.description && (
                        <p className="text-xs text-gray-400 truncate">{p.description}</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar binding reference */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sidebar Menu — Permission Bindings</h2>
          <p className="text-xs text-gray-500 mt-0.5">Every menu item and the permission key that controls its visibility</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Menu Item</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Permission Key</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SIDEBAR_BINDINGS.map(row => {
                const exists = permissions.some(p => p.key === row.perm)
                return (
                  <tr key={row.label} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.label}</td>
                    <td className="px-4 py-2.5">
                      {row.perm
                        ? <code className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{row.perm}</code>
                        : <span className="text-xs text-gray-400 italic">superadmin only</span>
                      }
                    </td>
                    <td className="px-4 py-2.5">
                      {!row.perm
                        ? <span className="text-xs text-gray-400">—</span>
                        : exists
                          ? <span className="flex items-center gap-1 text-xs text-emerald-600"><Check size={12} /> In DB</span>
                          : <span className="text-xs text-red-500 font-semibold">Missing in DB</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit Permission' : 'Create Permission'}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 font-normal ml-2">dot notation e.g. orders.view</span>
                </label>
                <input
                  type="text"
                  value={form.key}
                  onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  disabled={!!editing}
                  placeholder="module.action"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                  autoFocus={!editing}
                />
                {editing && <p className="text-xs text-amber-600 mt-1">Key cannot be changed after creation (other code depends on it).</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. View Orders"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus={!!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 font-normal ml-2">groups permissions in the department editor</span>
                </label>
                <input
                  type="text"
                  list="group-suggestions"
                  value={form.group_name}
                  onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}
                  placeholder="e.g. Orders"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <datalist id="group-suggestions">
                  {groups.filter(g => g !== 'all').map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional — shown as hint in department permissions editor"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SIDEBAR_BINDINGS: { label: string; perm: string | null }[] = [
  { label: 'Dashboard', perm: 'dashboard.view' },
  { label: 'Products', perm: 'products.view' },
  { label: 'Bulk Upload / Stock / Price / Status / Category / Images', perm: 'products.bulk' },
  { label: 'Logs', perm: 'products.view' },
  { label: 'Price Logs', perm: 'price_logs.view' },
  { label: 'Import History / Jobs', perm: 'products.bulk' },
  { label: 'Orders', perm: 'orders.view' },
  { label: 'Returns', perm: 'returns.view' },
  { label: 'Categories', perm: 'categories.manage' },
  { label: 'Brands', perm: 'brands.manage' },
  { label: 'Invoices', perm: 'invoices.view' },
  { label: 'Users', perm: 'users.view' },
  { label: 'Departments & Roles', perm: null },
  { label: 'Permissions', perm: null },
  { label: 'Settings', perm: 'settings.manage' },
  { label: 'Company', perm: 'settings.manage' },
  { label: 'Analytics', perm: 'analytics.view' },
  { label: 'Customer Segments', perm: 'analytics.view' },
  { label: 'Visitors', perm: 'analytics.view' },
  { label: 'Banners', perm: 'banners.manage' },
  { label: 'Coupons', perm: 'coupons.manage' },
  { label: 'Variants', perm: 'products.edit' },
  { label: 'Pincodes', perm: 'settings.manage' },
  { label: 'Stock Alerts', perm: 'products.view' },
  { label: 'Blog', perm: 'blog.manage' },
  { label: 'Flash Sales', perm: 'flash_sales.manage' },
  { label: 'Bundles', perm: 'products.create' },
  { label: 'Reviews', perm: 'reviews.manage' },
  { label: 'Push Notifications', perm: 'notifications.send' },
  { label: 'Newsletter', perm: 'notifications.send' },
  { label: 'Abandoned Carts', perm: 'orders.view' },
  { label: 'Subscriptions', perm: 'subscriptions.view' },
  { label: 'FAQ', perm: 'settings.manage' },
  { label: 'Wallet & Credits', perm: 'wallet.manage' },
  { label: 'Q&A Moderation', perm: 'reviews.manage' },
  { label: 'Export Data', perm: 'export.access' },
  { label: 'Support Tickets', perm: 'support.manage' },
  { label: 'About Page', perm: 'settings.manage' },
  { label: 'User Manual', perm: null },
  { label: 'Developer Docs', perm: null },
  { label: 'Testing Guide', perm: null },
]
