'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import AppModal from '@/components/modal/AppModal'
import { PageInfoBanner, LabelWithInfo } from '@/components/admin/FieldInfo'

import { ChevronDown, ChevronRight, Loader2, Plus, Search } from 'lucide-react'

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Category {
  id: number
  name: string
  gst_percent: number
  hsn_code?: string
  cess_percent?: number
  color_class?: string
  image_url?: string
  description?: string
  parent_id?: number | null
  slug?: string
  level?: number
  sort_order?: number
  is_featured?: boolean
  banner_url?: string
  product_count?: number
}

interface CategoryNode extends Category {
  children: CategoryNode[]
}

/* ─────────────────────────────────────────────
   TREE BUILDER
───────────────────────────────────────────── */
function buildTree(cats: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>()
  cats.forEach(c => map.set(c.id, { ...c, children: [] }))
  const roots: CategoryNode[] = []
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sort = (arr: CategoryNode[]) => {
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    arr.forEach(n => sort(n.children))
    return arr
  }
  return sort(roots)
}

function filterTree(nodes: CategoryNode[], q: string): CategoryNode[] {
  if (!q) return nodes
  const lower = q.toLowerCase()
  return nodes.flatMap(n => {
    const selfMatch = n.name.toLowerCase().includes(lower)
    const filteredChildren = filterTree(n.children, q)
    if (selfMatch) return [{ ...n, children: filteredChildren }]
    if (filteredChildren.length) return [{ ...n, children: filteredChildren }]
    return []
  })
}

/* ─────────────────────────────────────────────
   TREE ROW COMPONENT
───────────────────────────────────────────── */
function TreeRow({
  node, depth, expanded, onToggle, onEdit, onDelete, allCats,
}: {
  node: CategoryNode
  depth: number
  expanded: Set<number>
  onToggle: (id: number) => void
  onEdit: (c: Category) => void
  onDelete: (id: number) => void
  allCats: Category[]
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isRoot = depth === 0

  return (
    <>
      <tr
        style={{
          background: isRoot ? '#1a2035' : depth === 1 ? '#161c2d' : '#12192a',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Expand / indent cell */}
        <td style={{ width: 40, padding: '0 0 0 8px', verticalAlign: 'middle' }}>
          {hasChildren ? (
            <button
              onClick={() => onToggle(node.id)}
              style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : null}
        </td>

        {/* Name cell */}
        <td style={{ padding: '10px 12px 10px 0', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: depth * 24 }}>
            {/* Connector */}
            {depth > 0 && (
              <span style={{ color: '#334155', fontSize: 14, fontFamily: 'monospace', flexShrink: 0 }}>
                {'│  '.repeat(depth - 1)}└─
              </span>
            )}

            {/* Category icon / image */}
            {node.image_url ? (
              <img src={node.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 6, background: node.color_class ? undefined : 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                {node.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <span style={{ fontSize: isRoot ? 13.5 : 13, fontWeight: isRoot ? 700 : 500, color: isRoot ? '#f1f5f9' : '#cbd5e1' }}>
                {node.name}
              </span>
              {node.is_featured && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: '#78350f', color: '#fbbf24', padding: '1px 6px', borderRadius: 100 }}>★ Featured</span>
              )}
              {hasChildren && (
                <span style={{ marginLeft: 6, fontSize: 10, color: '#475569' }}>{node.children.length} sub</span>
              )}
            </div>
          </div>
        </td>

        {/* Level badge */}
        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
            background: depth === 0 ? 'rgba(16,185,129,0.15)' : depth === 1 ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
            color: depth === 0 ? '#34d399' : depth === 1 ? '#60a5fa' : '#c084fc',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {depth === 0 ? 'Root' : depth === 1 ? 'Sub' : 'Nested'}
          </span>
        </td>

        {/* Parent */}
        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontSize: 12, color: '#64748b' }}>
          {node.parent_id ? (allCats.find(c => c.id === node.parent_id)?.name ?? `#${node.parent_id}`) : <span style={{ color: '#334155' }}>—</span>}
        </td>

        {/* HSN */}
        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
          {node.hsn_code || <span style={{ color: '#334155' }}>—</span>}
        </td>

        {/* GST */}
        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{node.gst_percent ?? 0}%</span>
        </td>

        {/* Actions */}
        <td style={{ padding: '10px 16px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
          <button onClick={() => onEdit(node)} style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '3px 10px', background: 'transparent', cursor: 'pointer', marginRight: 6 }}>
            Edit
          </button>
          <button onClick={() => onDelete(node.id)} style={{ fontSize: 11, fontWeight: 700, color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '3px 10px', background: 'transparent', cursor: 'pointer' }}>
            Delete
          </button>
        </td>
      </tr>

      {/* Children — only if expanded */}
      {hasChildren && isExpanded && node.children.map(child => (
        <TreeRow key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} allCats={allCats} />
      ))}
    </>
  )
}

/* ─────────────────────────────────────────────
   PARENT SELECTOR — grouped by root
───────────────────────────────────────────── */
function ParentSelect({ value, onChange, allCategories, excludeId }: {
  value: number | string
  onChange: (v: number | string) => void
  allCategories: Category[]
  excludeId?: number
}) {
  const roots = allCategories.filter(c => !c.parent_id && c.id !== excludeId)
  const children = (parentId: number) =>
    allCategories.filter(c => c.parent_id === parentId && c.id !== excludeId)

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
      className="input"
    >
      <option value="">— None (Top Level) —</option>
      {roots.map(root => (
        <optgroup key={root.id} label={`📁 ${root.name}`}>
          <option value={root.id}>{root.name} (top-level)</option>
          {children(root.id).map(child => {
            const grandchildren = children(child.id)
            return (
              <optgroup key={child.id} label={`  └─ ${child.name}`}>
                <option value={child.id}>{child.name}</option>
                {grandchildren.map(gc => (
                  <option key={gc.id} value={gc.id}>  └─ {gc.name}</option>
                ))}
              </optgroup>
            )
          })}
        </optgroup>
      ))}
    </select>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function AdminCategories() {

  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const [openModal, setOpenModal] = useState(false)
  const [editData, setEditData] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  // form fields
  const [name, setName] = useState('')
  const [gstpercent, setGstPercent] = useState<any>(0)
  const [hsnCode, setHsnCode] = useState('')
  const [cessPercent, setCessPercent] = useState<any>(0)
  const [color, setColor] = useState('')
  const [desc, setDesc] = useState('')
  const [parentId, setParentId] = useState<number | string>('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isFeatured, setIsFeatured] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  /* ── load ── */
  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/categories', { params: { limit: 500 } })
      const cats: Category[] = res.data?.data?.rows || []
      setAllCategories(cats)
      // auto-expand all root categories on first load
      setExpanded(new Set(cats.filter(c => !c.parent_id).map(c => c.id)))
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  /* ── tree ── */
  const tree = useMemo(() => buildTree(allCategories), [allCategories])
  const filtered = useMemo(() => filterTree(tree, search), [tree, search])

  const toggleNode = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(allCategories.map(c => c.id)))
  const collapseAll = () => setExpanded(new Set())

  /* ── modal helpers ── */
  const resetForm = () => {
    setEditData(null); setName(''); setGstPercent(0); setHsnCode(''); setCessPercent(0)
    setColor(''); setDesc(''); setParentId(''); setSlug(''); setSortOrder(0)
    setIsFeatured(false); setImage(null); setPreview(null); setRemoveImage(false)
  }

  const openCreate = () => { resetForm(); setOpenModal(true) }

  const openEdit = (row: Category) => {
    setEditData(row); setName(row.name); setGstPercent(row.gst_percent || 0)
    setHsnCode(row.hsn_code || ''); setCessPercent(row.cess_percent || 0)
    setColor(row.color_class || ''); setDesc(row.description || '')
    setParentId(row.parent_id || ''); setSlug(row.slug || '')
    setSortOrder(row.sort_order || 0); setIsFeatured(row.is_featured || false)
    setPreview(row.image_url || null); setImage(null); setRemoveImage(false)
    setOpenModal(true)
  }

  const closeModal = () => { if (saving) return; setOpenModal(false); resetForm() }

  /* ── validation ── */
  const validate = () => {
    if (!name.trim()) return 'Category name required'
    if (name.trim().length < 2) return 'Minimum 2 characters'
    if (name.trim().length > 50) return 'Maximum 50 characters'
    if (Number(gstpercent) < 0 || Number(gstpercent) > 100) return 'GST must be 0–100'
    if (Number(cessPercent) < 0 || Number(cessPercent) > 100) return 'CESS must be 0–100'
    return null
  }

  /* ── image ── */
  const handleImage = (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB allowed'); return }
    setImage(file); setPreview(URL.createObjectURL(file)); setRemoveImage(false)
  }

  /* ── save ── */
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
      form.append('parent_id', parentId ? String(parentId) : '')
      form.append('slug', slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      form.append('sort_order', String(sortOrder))
      form.append('is_featured', String(isFeatured))
      if (image) form.append('image', image)
      if (removeImage) form.append('remove_image', 'true')

      if (editData) {
        await axios.put(`/categories/${editData.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Category updated')
      } else {
        await axios.post('/categories', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Category created')
      }
      closeModal(); load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ── delete ── */
  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category? Sub-categories may be affected.')) return
    try {
      await axios.delete(`/categories/${id}`)
      toast.success('Category deleted')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    }
  }

  /* ── render ── */
  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 py-8 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Category Management</h1>
            <p className="text-slate-400 text-sm mt-1">
              {allCategories.filter(c => !c.parent_id).length} root categories &nbsp;·&nbsp;
              {allCategories.length} total
            </p>
          </div>

          <PageInfoBanner
            title="Category Management"
            description="Categories organise your Ayurvedic products into a browsable hierarchy. Each category can have a parent, a GST rate, an HSN code, and an image."
            tips={[
              "Root (top-level) categories have no parent. Sub-categories and nested categories live under them.",
              "Click ▶ to expand a category and see its children. Click ▼ to collapse.",
              "The GST % and HSN Code auto-fill on new products created in this category.",
              "Sort Order controls display position — 0 appears first.",
              "Featured categories appear on the homepage carousel.",
              "Deleting a category with children or products may fail — reassign them first.",
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); if (e.target.value) expandAll() }}
                placeholder="Search categories..."
                className="pl-8 pr-4 py-2.5 w-full sm:w-56 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-[#141821] text-slate-100"
              />
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition">
              <Plus size={14} /> Add Category
            </button>
          </div>
        </div>

        {/* TREE TABLE */}
        <div className="bg-[#141821] border border-slate-700 rounded-xl overflow-hidden">

          {/* Table controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#1a2035' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={expandAll} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                Expand All
              </button>
              <button onClick={collapseAll} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                Collapse All
              </button>
            </div>
            <span style={{ fontSize: 11, color: '#475569' }}>
              {search ? `${filtered.length} matching` : `${allCategories.filter(c => !c.parent_id).length} root categories`}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <p className="text-base font-medium">{search ? 'No categories match your search' : 'No categories yet'}</p>
              <p className="text-sm mt-1">{!search && 'Click "Add Category" to create your first one'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f1623', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ width: 40, padding: '8px 0 8px 8px' }} />
                    <th style={{ padding: '8px 12px 8px 0', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Level</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Parent</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HSN</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GST</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(node => (
                    <TreeRow
                      key={node.id}
                      node={node}
                      depth={0}
                      expanded={expanded}
                      onToggle={toggleNode}
                      onEdit={openEdit}
                      onDelete={deleteCategory}
                      allCats={allCategories}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL */}
        <AppModal
          open={openModal}
          onClose={closeModal}
          title={editData ? 'Edit Category' : 'Add Category'}
          description="Create and manage product categories"
          width="max-w-2xl"
          footer={
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} disabled={saving} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400">Cancel</button>
              <button onClick={saveCategory} disabled={saving} className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-semibold flex items-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editData ? 'Update' : 'Create'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">

            {/* PARENT CATEGORY — grouped selector */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Parent Category (optional)" what="The category this one belongs under. Leave empty for top-level." why="Creates a hierarchy so customers can browse by main category then sub-category." example="'Digestive Care' as parent of 'Churna'" />
              </label>
              <ParentSelect
                value={parentId}
                onChange={setParentId}
                allCategories={allCategories}
                excludeId={editData?.id}
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty for a top-level (root) category. Select a parent to nest this under it.
              </p>
            </div>

            {/* NAME */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Category Name" required what="The display name shown in menus and product filters." why="Customers browse by category name — make it clear and descriptive." example="Ayurvedic Supplements" />
              </label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); if (!editData) setSlug(e.target.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')) }}
                maxLength={50}
                placeholder="e.g. Ayurvedic Supplements, Herbal Oils"
                className="input"
              />
            </div>

            {/* SLUG */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Slug (URL-friendly)" what="The URL segment for this category." why="Used in browser URL like /category/herbal-oils — must be unique." example="herbal-oils" note="Auto-generated from name. Only change for a custom URL." />
              </label>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))} placeholder="auto-generated-from-name" className="input" />
            </div>

            {/* SORT ORDER + FEATURED */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs uppercase text-slate-400 font-semibold">
                  <LabelWithInfo label="Sort Order" what="Controls display order — lower number appears first." why="Use this to control which categories show first in menus and homepage." example="0 (first), 1, 2, 3..." />
                </label>
                <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value) || 0)} placeholder="0" className="input" />
              </div>
              <div className="flex items-end pb-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                  <span className="text-sm font-medium">
                    Featured <LabelWithInfo label="Featured" what="Marks this category for the homepage carousel." why="Featured categories get extra visibility on the homepage." example="Check for 'Immunity Boosters' during a campaign" />
                  </span>
                </label>
              </div>
            </div>

            {/* GST */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="GST %" what="Default GST % applied to products in this category." why="Auto-fills product tax to reduce manual errors." example="12 (most Ayurvedic products)" note="Can be overridden per product." />
              </label>
              <input type="number" min={0} max={100} value={gstpercent} onChange={e => setGstPercent(e.target.value)} placeholder="e.g. 12" className="input" />
            </div>

            {/* HSN */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Default HSN Code" what="HSN code for tax classification — appears on GST invoices." why="Required for GSTR-1 filings. Mandatory for turnover above ₹5 crore." example="30039011 (Ayurvedic patent medicines)" />
              </label>
              <input value={hsnCode} onChange={e => setHsnCode(e.target.value)} maxLength={30} placeholder="e.g. 30039011" className="input" />
              <a href="/admin/hsn-codes" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#059669', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Browse HSN codes
              </a>
            </div>

            {/* CESS */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Default CESS %" what="Additional cess on top of GST for certain goods." why="Most Ayurvedic products are 0% cess — check only for luxury/special items." example="0 (typical for Ayurvedic products)" />
              </label>
              <input type="number" min={0} max={100} value={cessPercent} onChange={e => setCessPercent(e.target.value)} placeholder="e.g. 0" className="input" />
            </div>

            {/* COLOR */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Color Class" what="A Tailwind CSS class for UI accents on this category's cards." why="Gives each category a distinctive color theme in the storefront." example="bg-emerald-500 or bg-amber-400" />
              </label>
              <input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. bg-emerald-500" className="input" />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Description" what="Short marketing description shown on the category page." why="Helps SEO and gives customers context about what's in this category." example="Traditional Ayurvedic supplements for immunity and daily wellness." />
              </label>
              <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Traditional Ayurvedic supplements for immunity, digestion, and wellness" className="input resize-none" />
            </div>

            {/* IMAGE */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold">
                <LabelWithInfo label="Image" what="Category banner or icon (max 10 MB, any image format)." why="Shown on category cards and the homepage." example="400x400 herbal leaf image for 'Herbal Oils'" />
              </label>
              <input type="file" accept="image/*" onChange={handleImage} className="input file:bg-emerald-500 file:text-black" />
            </div>

            {preview && (
              <div className="relative w-28">
                <img src={preview} className="w-28 h-28 object-cover rounded-lg border" />
                <button type="button" onClick={() => { setPreview(null); setImage(null); setRemoveImage(true) }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6">×</button>
              </div>
            )}

          </div>
        </AppModal>

      </div>
    </div>
  )
}
