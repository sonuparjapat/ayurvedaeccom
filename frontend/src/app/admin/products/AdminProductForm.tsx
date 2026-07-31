'use client'

import { useEffect, useState, useRef } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Loader2, GripVertical } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/* ─── Sortable image item ─────────────────────────────────────────────────── */
function SortableImageItem({ id, file, index, disabled, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const url = typeof file === 'string' ? file : URL.createObjectURL(file)
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: 'relative' }}
      className="group border rounded-lg overflow-hidden"
    >
      {!disabled && (
        <div
          {...attributes} {...listeners}
          style={{ position: 'absolute', top: 4, left: 4, zIndex: 10, cursor: 'grab', background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '2px 4px', display: 'flex', alignItems: 'center' }}
          title="Drag to reorder"
        >
          <GripVertical size={14} color="#fff" />
        </div>
      )}
      {index === 0 && (
        <span style={{ position: 'absolute', bottom: 4, left: 4, zIndex: 10, background: '#059669', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>MAIN</span>
      )}
      <img src={url} alt="" className="h-24 w-full object-cover" />
      {!disabled && (
        <button type="button" onClick={onRemove}
          style={{ position: 'absolute', top: 4, right: 4, background: '#dc2626', color: '#fff', width: 20, height: 20, borderRadius: '50%', fontSize: 10, border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="group-hover:opacity-100!"
        >✕</button>
      )}
    </div>
  )
}

function SortableImageGrid({ images, disabled, onReorder, onRemove }: any) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = images.map((_: any, i: number) => String(i))
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const from = ids.indexOf(String(active.id))
      const to = ids.indexOf(String(over.id))
      onReorder(arrayMove(images, from, to))
    }
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {images.map((file: any, i: number) => (
            <SortableImageItem key={i} id={String(i)} file={file} index={i} disabled={disabled} onRemove={() => onRemove(i)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default function AdminProductForm({
  onSuccess,
  initialData,
  mode = 'create',
}: any) {

  const isView = mode === 'view'
  const isEdit = mode === 'edit'

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const previewUrls = useRef<string[]>([])

  const [brands, setBrands] = useState<any[]>([])

  const [form, setForm] = useState<any>({
    name: '',
    slug: '',
    shortdescription: '',
    longdescription: '',
    price: '',
    compareprice: '',
    cost_price: '',
    inventory: '',
    sku: '',
    barcode: '',
    category_name: '',
    category_id: '',
    gst_percent: 0,
    brand: '',
    brand_id: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    images: [],
    hsn_code: '',
    cess_percent: 0,
    tags: '',
    is_featured: false,
    is_bestseller: false,
    weight_grams: '',
    low_stock_threshold: 10,
    specifications: '[]',
    product_type: 'simple',
    unit: '',
    tax_included: false,
    shipping_class: 'standard',
    allow_backorder: false,
    highlights: '',
    ingredients: '',
    benefits: '',
    usage_instructions: '',
    storage_instructions: '',
    warnings: '',
    video_url: '',
    fssai_number: '',
    coa_url: '',
    focus_keyword: '',
    min_order_qty: 1,
    max_order_qty: 100,
    is_returnable: true,
    return_window_days: 7,
    replacement_available: false,
    sort_order: 0,
    faqs: '[]',
    safety_tags: '',
  })


  /* ================= LOAD CATEGORIES ================= */

  useEffect(() => {

    const loadCategories = async () => {

      try {

        const res = await axios.get('/categories')

        setCategories(res?.data?.data?.rows || [])

      } catch (err) {

        console.error('Category Load Error:', err)

        toast.error('Failed to load categories')

      }

    }

    loadCategories()
    axios.get('/admin/brands', { params: { limit: 200 } })
      .then(r => setBrands(r.data?.data || []))
      .catch(() => {})
  }, [])


  /* ================= PREFILL ================= */

  useEffect(() => {

    if (initialData) {

      const st = initialData.safety_tags
      const safetyTagsStr = Array.isArray(st) ? st.join(', ') : (st || '')

      setForm({
        ...initialData,
        images: initialData.images || [],
        safety_tags: safetyTagsStr,
      })

    }

  }, [initialData])


  /* ================= CLEANUP ================= */

  useEffect(() => {

    return () => {

      previewUrls.current.forEach(url =>
        URL.revokeObjectURL(url)
      )

    }

  }, [])


  /* ================= HELPERS ================= */

  const makeSlug = (text: string) => {

    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  }


  /* ================= VALIDATE ================= */

  const validate = () => {

    if (!form.name?.trim())
      return 'Name required'

    if (!form.price || Number(form.price) <= 0)
      return 'Valid price required'

    if (form.compareprice &&
      Number(form.compareprice) < Number(form.price)
    )
      return 'Compare price must be higher than price'

    if (
      form.inventory === '' ||
      Number(form.inventory) < 0
    )
      return 'Valid stock required'

    if (!form.category_id)
      return 'Category required'
if (Number(form.gst_percent) < 0 || Number(form.gst_percent) > 100)
  return 'Valid GST required'

if (Number(form.cess_percent) < 0 || Number(form.cess_percent) > 100)
  return 'Valid CESS required'
    if (!form.images.length)
      return 'Image required'

    return null
  }


  /* ================= SUBMIT ================= */

  const submit = async () => {

    if (loading) return

    const err = validate()

    if (err) return toast.error(err)


    try {

      setLoading(true)

      const data = new FormData()


      Object.entries(form).forEach(([k, v]) => {

        if (v === null || v === undefined) return


        if (k === 'images') {

          v.forEach((f: any) => {

            if (typeof f === 'string') {

              data.append('oldImages', f)

            } else {

              data.append('images', f)

            }

          })

        } else if (typeof v === 'object' && v !== null) {

          data.append(k, JSON.stringify(v))

        } else {

          data.append(k, String(v))

        }

      })


      const url = isEdit
        ? `/admin/products/${form.id}`
        : '/admin/products'


      const method = isEdit ? 'put' : 'post'


      await axios({
        method,
        url,
        data,
        withCredentials: true,
      })


      toast.success(
        isEdit ? 'Updated' : 'Created'
      )

      onSuccess?.()


    } catch (err: any) {

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Save failed'

      toast.error(msg)

      console.error('Save Error:', err)


    } finally {

      setLoading(false)

    }

  }


  /* ================= UI ================= */

  return (

    <div className="space-y-6">


      {/* HEADER */}

      <h2 className="text-xl font-bold">

        {mode === 'view'
          ? 'View Product'
          : mode === 'edit'
            ? 'Edit Product'
            : 'Add Product'}

      </h2>


      {/* BASIC INFO */}

      <Section title="Basic Info">

        <Grid>

          <Input
            label="Name"
            value={form.name}
            readOnly={isView}
            placeholder="e.g. Organic Triphala Powder"
            onChange={(v: string) => {

              setForm({
                ...form,
                name: v,
                slug: makeSlug(v),
              })

            }}
          />


          <Input
            label="Slug"
            value={form.slug}
            readOnly
          />


          {/* CATEGORY DROPDOWN */}

          <div className="space-y-1">

            <label className="text-sm font-medium">
              Category
            </label>

            <select
              value={form.category_id || ''}
              disabled={isView}
            onChange={e => {
  const selected = categories?.find(
    (item:any) => item?.id == e.target.value
  )

  setForm({
    ...form,
    category_id: e.target.value,
    category_name: selected?.name || '',
    gst_percent: selected?.gst_percent || 0,
    hsn_code: selected?.hsn_code || '',
    // tax_name: selected?.tax_name || '',
    cess_percent: selected?.cess_percent || 0,
  })
}}
              className="
                w-full border rounded px-3 py-2
                focus:ring-2 focus:ring-emerald-500
                bg-white
              "
            >

              <option value="">
                Select Category
              </option>

              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {'— '.repeat(cat.level || 0)}{cat.name}
                </option>
              ))}

            </select>

          </div>
       <div className="space-y-1">
  <label className="text-sm font-medium">
    GST Percent (%)
  </label>

  <Input
    value={form.gst_percent}
    onChange={(v:string)=>
      setForm({...form,gst_percent:v})
    }
    readOnly={isView}
    type="number"
  />
</div>

<Input
  label="HSN Code"
  value={form.hsn_code}
  readOnly={isView}
  placeholder="e.g. 30039011 (auto-filled from category)"
  onChange={(v:string)=>
    setForm({...form,hsn_code:v})
  }
/>
<Input
  label="CESS %"
  type="number"
  value={form.cess_percent}
  readOnly={isView}
  onChange={(v:string)=>
    setForm({...form,cess_percent:v})
  }
/>
{/* <Input
  label="Tax Name"
  value={form.tax_name}
  readOnly={isView}
  onChange={(v:string)=>
    setForm({...form,tax_name:v})
  }
/> */}
          {/* BRAND DROPDOWN */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Brand</label>
            <select
              value={form.brand_id || ''}
              disabled={isView}
              onChange={e => {
                const selected = brands.find((b: any) => b.id == e.target.value)
                setForm({ ...form, brand_id: e.target.value, brand: selected?.name || form.brand })
              }}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Select Brand (optional)</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <Select label="Status" value={form.status} readOnly={isView}
            onChange={(v: string) => setForm({ ...form, status: v })} />

          {/* TAGS */}
          <Input
            label="Tags (comma separated)"
            value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')}
            readOnly={isView}
            placeholder="e.g. bestseller, new arrival, organic, immunity"
            onChange={(v: string) => setForm({ ...form, tags: v })}
          />

          {/* FEATURED / BESTSELLER */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Badges</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={!!form.is_featured} disabled={isView}
                  onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={!!form.is_bestseller} disabled={isView}
                  onChange={e => setForm({ ...form, is_bestseller: e.target.checked })} />
                <span className="text-sm">Bestseller</span>
              </label>
            </div>
          </div>

          {/* PRODUCT TYPE */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Type</label>
            <select
              value={form.product_type || 'simple'}
              disabled={isView}
              onChange={e => setForm({ ...form, product_type: e.target.value })}
              className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>

          {/* UNIT */}
          <Input
            label="Unit (pack size shown next to price)"
            value={form.unit}
            readOnly={isView}
            placeholder="e.g. 50g, 100ml, 500g, 1kg, 60 tablets"
            onChange={(v: string) => setForm({ ...form, unit: v })}
          />

        </Grid>

      </Section>


      {/* PRICING */}

      <Section title="Pricing">

        <Grid>

          <Input
            label="Selling Price (₹)"
            type="number"
            value={form.price}
            readOnly={isView}
            placeholder="e.g. 499"
            onChange={(v: string) =>
              setForm({ ...form, price: v })
            }
          />


          <Input
            label="Compare Price / MRP (₹) — shows as strikethrough"
            type="number"
            value={form.compareprice}
            readOnly={isView}
            placeholder="e.g. 699 (must be higher than selling price)"
            onChange={(v: string) =>
              setForm({ ...form, compareprice: v })
            }
          />

          <Input
            label="Cost Price (₹) — private, for profit reports only"
            type="number"
            value={form.cost_price}
            readOnly={isView}
            placeholder="e.g. 250 (never shown to customers)"
            onChange={(v: string) =>
              setForm({ ...form, cost_price: v })
            }
          />

          {/* TAX INCLUDED */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Tax</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={!!form.tax_included} disabled={isView}
                  onChange={e => setForm({ ...form, tax_included: e.target.checked })} />
                <span className="text-sm">Tax Included in Price</span>
              </label>
            </div>
          </div>

        </Grid>

      </Section>


      {/* INVENTORY */}

      <Section title="Inventory">

        <Grid>

          <Input
            label="Current Stock Quantity"
            type="number"
            value={form.inventory}
            readOnly={isView}
            placeholder="e.g. 100"
            onChange={(v: string) =>
              setForm({ ...form, inventory: v })
            }
          />


          <Input
            label="SKU (Stock Keeping Unit)"
            value={form.sku}
            readOnly={isView}
            placeholder="e.g. TRP-500G-ORG"
            onChange={(v: string) =>
              setForm({ ...form, sku: v })
            }
          />

          <Input
            label="Barcode (EAN/UPC)"
            value={form.barcode}
            readOnly={isView}
            placeholder="e.g. 8901234567890"
            onChange={(v: string) => setForm({ ...form, barcode: v })}
          />

          <Input
            label="Weight (grams) — for shipping calculation"
            type="number"
            value={form.weight_grams}
            readOnly={isView}
            placeholder="e.g. 500"
            onChange={(v: string) => setForm({ ...form, weight_grams: v })}
          />

          <Input
            label="Low Stock Alert Threshold — notify when stock drops below"
            type="number"
            value={form.low_stock_threshold}
            readOnly={isView}
            placeholder="e.g. 10"
            onChange={(v: string) => setForm({ ...form, low_stock_threshold: v })}
          />

          {/* ALLOW BACKORDER */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Backorder</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={!!form.allow_backorder} disabled={isView}
                  onChange={e => setForm({ ...form, allow_backorder: e.target.checked })} />
                <span className="text-sm">Allow Backorder</span>
              </label>
            </div>
          </div>

          <Input
            label="Min Order Qty — minimum per order"
            type="number"
            value={form.min_order_qty}
            readOnly={isView}
            placeholder="e.g. 1 (default) or 2 for bulk-only products"
            onChange={(v: string) => setForm({ ...form, min_order_qty: v })}
          />

          <Input
            label="Max Order Qty — prevent hoarding"
            type="number"
            value={form.max_order_qty}
            readOnly={isView}
            placeholder="e.g. 100 (default) or 10 for limited items"
            onChange={(v: string) => setForm({ ...form, max_order_qty: v })}
          />

          {/* RETURN POLICY */}
          <div className="space-y-3 col-span-full">
            <label className="text-sm font-semibold text-gray-700">Return &amp; Replacement Policy</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.is_returnable !== false} disabled={isView}
                  onChange={e => setForm({ ...form, is_returnable: e.target.checked })} />
                <span className="text-sm font-medium">Returnable</span>
              </label>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Return Window (days)</label>
                <input
                  type="number" min={1} max={90}
                  value={form.return_window_days ?? 7}
                  disabled={isView || !form.is_returnable}
                  onChange={e => setForm({ ...form, return_window_days: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={!!form.replacement_available} disabled={isView || !form.is_returnable}
                  onChange={e => setForm({ ...form, replacement_available: e.target.checked })} />
                <span className="text-sm font-medium">Replacement Available</span>
              </label>
            </div>
            {!form.is_returnable && (
              <p className="text-xs text-red-600 font-medium">This product is marked non-returnable. Customers will not be able to request a return.</p>
            )}
            {form.is_returnable && (
              <p className="text-xs text-gray-500">
                Customers can return within <strong>{form.return_window_days ?? 7} days</strong> of delivery.
                {form.replacement_available ? ' Replacement option will be offered.' : ' Refund only.'}
              </p>
            )}
          </div>

        </Grid>

      </Section>


      {/* DESCRIPTION */}

      <Section title="Description">

        <TextArea
          label="Short Description (shown in product cards & search)"
          value={form.shortdescription}
          readOnly={isView}
          placeholder="e.g. Pure organic Triphala powder for digestive health. Made from Amla, Haritaki & Bibhitaki. Lab-tested, no preservatives."
          onChange={(v: string) =>
            setForm({ ...form, shortdescription: v })
          }
        />


        <TextArea
          label="Long Description (full product page details)"
          rows={5}
          value={form.longdescription}
          readOnly={isView}
          placeholder="e.g. Triphala is a traditional Ayurvedic formulation made from three fruits — Amla (Indian Gooseberry), Haritaki (Chebulic Myrobalan) and Bibhitaki (Belleric Myrobalan). Our Triphala powder is sourced from certified organic farms in Kerala..."
          onChange={(v: string) =>
            setForm({ ...form, longdescription: v })
          }
        />

      </Section>


      {/* AYURVEDIC DETAILS */}

      <Section title="Ayurvedic Details">

        <TextArea
          label="Product Highlights (key selling points)"
          rows={3}
          value={form.highlights}
          readOnly={isView}
          placeholder={"e.g.\n• 100% Certified Organic\n• Lab-tested for purity\n• No artificial preservatives\n• Sourced from Indian farms\n• GMP certified manufacturing"}
          onChange={(v: string) => setForm({ ...form, highlights: v })}
        />

        <TextArea
          label="Ingredients (complete list — mandatory for Ayurvedic products)"
          rows={3}
          value={form.ingredients}
          readOnly={isView}
          placeholder={"e.g. Amla (Emblica officinalis) fruit powder, Haritaki (Terminalia chebula) fruit powder, Bibhitaki (Terminalia bellirica) fruit powder. No added colors, flavors, or preservatives."}
          onChange={(v: string) => setForm({ ...form, ingredients: v })}
        />

        <TextArea
          label="Health Benefits (what the product does)"
          rows={3}
          value={form.benefits}
          readOnly={isView}
          placeholder={"e.g.\n• Supports healthy digestion and regular bowel movement\n• Rich in Vitamin C and antioxidants\n• Helps in natural detoxification\n• Supports immune system\n• Promotes healthy skin and hair"}
          onChange={(v: string) => setForm({ ...form, benefits: v })}
        />

        <TextArea
          label="Usage / Dosage Instructions (how to consume)"
          rows={3}
          value={form.usage_instructions}
          readOnly={isView}
          placeholder={"e.g. Take 1-2 teaspoons (3-6g) with warm water or honey before bedtime. For best results, use regularly for at least 3 months. Consult an Ayurvedic practitioner for personalized dosage."}
          onChange={(v: string) => setForm({ ...form, usage_instructions: v })}
        />

        <TextArea
          label="Storage Instructions (how to store)"
          rows={2}
          value={form.storage_instructions}
          readOnly={isView}
          placeholder="e.g. Store in a cool, dry place away from direct sunlight. Keep the lid tightly closed after use. Best consumed within 12 months of opening."
          onChange={(v: string) => setForm({ ...form, storage_instructions: v })}
        />

        <TextArea
          label="Warnings & Precautions (safety information)"
          rows={2}
          value={form.warnings}
          readOnly={isView}
          placeholder="e.g. Not recommended for pregnant or lactating women. Consult your physician before use if on medication. Keep out of reach of children. Discontinue if any adverse reaction occurs."
          onChange={(v: string) => setForm({ ...form, warnings: v })}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Safety Tags <span className="text-gray-400 font-normal">(comma-separated — shown as badges on product page)</span>
          </label>
          <input
            type="text"
            value={form.safety_tags}
            readOnly={isView}
            placeholder="e.g. Vegan, Gluten Free, Pregnancy Safe, Diabetic Friendly, No Added Sugar"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={e => setForm({ ...form, safety_tags: e.target.value })}
          />
          {form.safety_tags && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.safety_tags.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">{tag}</span>
              ))}
            </div>
          )}
        </div>

      </Section>


      {/* IMAGES */}

      <Section title="Images">

        {!isView && (

          <input
            type="file"
            multiple
            accept="image/*"
            className="border p-2 rounded w-full"
            onChange={e => {

              const files = Array.from(
                e.target.files || []
              )


              const urls = files.map(f =>
                URL.createObjectURL(f)
              )

              previewUrls.current.push(...urls)


              setForm({
                ...form,
                images: [...form.images, ...files],
              })

            }}
          />

        )}


        {form.images.length > 0 && (
          <SortableImageGrid
            images={form.images}
            disabled={!!isView}
            onReorder={(next: any[]) => setForm({ ...form, images: next })}
            onRemove={(i: number) => setForm({ ...form, images: form.images.filter((_: any, idx: number) => idx !== i) })}
          />

        )}

      </Section>


      {/* MEDIA */}

      <Section title="Media (Video)">
        <p className="text-xs text-gray-500 mb-2">Add a product demo or explainer video. Videos increase conversion by 20-30%.</p>
        <Grid>
          <Input
            label="Video URL (YouTube or direct link)"
            value={form.video_url}
            readOnly={isView}
            placeholder="e.g. https://www.youtube.com/watch?v=abc123"
            onChange={(v: string) => setForm({ ...form, video_url: v })}
          />
        </Grid>
      </Section>


      {/* SHIPPING */}

      <Section title="Shipping">
        <p className="text-xs text-gray-500 mb-2">Controls how shipping charges are calculated for this product.</p>
        <Grid>
          <div className="space-y-1">
            <label className="text-sm font-medium">Shipping Class</label>
            <select
              value={form.shipping_class || 'standard'}
              disabled={isView}
              onChange={e => setForm({ ...form, shipping_class: e.target.value })}
              className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="standard">Standard — normal shipping charges</option>
              <option value="free">Free — no shipping fee for this product</option>
              <option value="heavy">Heavy — higher shipping fee (bulky items)</option>
              <option value="fragile">Fragile — special handling fee (glass bottles etc.)</option>
            </select>
          </div>
        </Grid>
      </Section>


      {/* COMPLIANCE */}

      <Section title="Compliance & Certifications">
        <p className="text-xs text-gray-500 mb-2">Legal compliance fields. FSSAI is mandatory for food/supplement products in India.</p>
        <Grid>
          <Input
            label="FSSAI License Number"
            value={form.fssai_number}
            readOnly={isView}
            placeholder="e.g. 10020011000123"
            onChange={(v: string) => setForm({ ...form, fssai_number: v })}
          />
          <Input
            label="Certificate of Analysis (Lab Report URL)"
            value={form.coa_url}
            readOnly={isView}
            placeholder="e.g. https://s3.amazonaws.com/reports/triphala-coa.pdf"
            onChange={(v: string) => setForm({ ...form, coa_url: v })}
          />
        </Grid>
      </Section>


      {/* SPECIFICATIONS */}
      <Section title="Specifications (optional)">
        <p className="text-xs text-gray-500 mb-2">{'Add product specifications as a JSON array. Example: [{"key":"Shelf Life","value":"24 months"}, {"key":"Country of Origin","value":"India"}, {"key":"Manufacturer","value":"Oroganix Pvt Ltd"}, {"key":"Certification","value":"FSSAI, GMP, Organic"}]'}</p>
        <TextArea
          label="Specifications JSON"
          rows={3}
          value={typeof form.specifications === 'string' ? form.specifications : JSON.stringify(form.specifications || [], null, 2)}
          readOnly={isView}
          placeholder={'[{"key":"Shelf Life","value":"24 months"}, {"key":"Country of Origin","value":"India"}]'}
          onChange={(v: string) => setForm({ ...form, specifications: v })}
        />
      </Section>

      {/* FAQs */}
      <Section title="FAQs (Frequently Asked Questions)">
        <p className="text-xs text-gray-500 mb-2">{'Pre-written FAQs shown on the product page. JSON array: [{"question":"Is this organic?","answer":"Yes, 100% certified organic."}, ...]'}</p>
        <TextArea
          label="FAQs JSON"
          rows={4}
          value={typeof form.faqs === 'string' ? form.faqs : JSON.stringify(form.faqs || [], null, 2)}
          readOnly={isView}
          placeholder={'[{"question":"Is this product organic?","answer":"Yes, it is 100% certified organic and lab-tested."},{"question":"What is the shelf life?","answer":"24 months from manufacturing date."},{"question":"Can pregnant women use this?","answer":"Please consult your doctor before use."}]'}
          onChange={(v: string) => setForm({ ...form, faqs: v })}
        />
      </Section>

      {/* SEO */}
      <Section title="SEO (Search Engine Optimization)">
        <p className="text-xs text-gray-500 mb-2">These fields improve your product's visibility on Google. Keep Meta Title under 60 characters and Meta Description under 160 characters.</p>
        <Grid>
          <Input label="Meta Title (browser tab + Google title)" value={form.meta_title} readOnly={isView}
            placeholder="e.g. Organic Triphala Powder 500g | Oroganix"
            onChange={(v: string) => setForm({ ...form, meta_title: v })} />
          <Input label="Meta Description (Google search snippet)" value={form.meta_description} readOnly={isView}
            placeholder="e.g. Buy pure organic Triphala powder for digestion. Lab-tested, no preservatives. Free shipping above ₹499."
            onChange={(v: string) => setForm({ ...form, meta_description: v })} />
          <Input label="Focus Keyword (primary SEO keyword)" value={form.focus_keyword} readOnly={isView}
            placeholder="e.g. organic triphala powder"
            onChange={(v: string) => setForm({ ...form, focus_keyword: v })} />
          <Input label="Sort Order (display position: 0 = first)" type="number" value={form.sort_order} readOnly={isView}
            placeholder="e.g. 0"
            onChange={(v: string) => setForm({ ...form, sort_order: v })} />
        </Grid>
      </Section>

      {/* SUBMIT */}

      {!isView && (

        <div className="pt-4 border-t">

          <button
            onClick={submit}
            disabled={loading}
            className="
              w-full py-3 rounded-lg
              bg-emerald-600 text-white
              font-semibold
              hover:bg-emerald-700
              disabled:opacity-60
              flex justify-center gap-2
            "
          >

            {loading && (
              <Loader2 size={16} className="animate-spin" />
            )}

            {isEdit
              ? 'Update Product'
              : 'Create Product'}

          </button>

        </div>

      )}

    </div>
  )
}


/* ================= HELPERS ================= */


function Section({ title, children }: any) {

  return (

    <div className="bg-gray-50 border rounded-xl p-4 space-y-4">

      <h3 className="font-semibold">
        {title}
      </h3>

      {children}

    </div>
  )
}


function Grid({ children }: any) {

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {children}
    </div>
  )
}


function Input({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
}: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">

        {label}

      </label>


      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className={`
          w-full border rounded px-3 py-2
          focus:ring-2 focus:ring-emerald-500
          ${readOnly
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white'
          }
        `}
      />

    </div>
  )
}
function Select({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
}: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">

        {label}

      </label>
      <select value={value} disabled={readOnly} onChange={e => onChange?.(e.target.value)} className={`
          w-full border rounded px-3 py-2
          focus:ring-2 focus:ring-emerald-500
          ${readOnly
          ? 'bg-gray-100 cursor-not-allowed'
          : 'bg-white'
        }
        `}>
            <option value="">Select</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
      </select>
      

    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  readOnly = false,
}: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">
        {label}
      </label>


      <textarea
        rows={rows}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={`
          w-full border rounded px-3 py-2
          focus:ring-2 focus:ring-emerald-500
          ${readOnly
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white'
          }
        `}
      />

    </div>
  )
}