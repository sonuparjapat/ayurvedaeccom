'use client'

import { useEffect, useState, useRef } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

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
    sort_order: 0,
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

      setForm({
        ...initialData,
        images: initialData.images || [],
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
            label="Unit"
            value={form.unit}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, unit: v })}
          />

        </Grid>

      </Section>


      {/* PRICING */}

      <Section title="Pricing">

        <Grid>

          <Input
            label="Price"
            type="number"
            value={form.price}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, price: v })
            }
          />


          <Input
            label="Compare Price (MRP)"
            type="number"
            value={form.compareprice}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, compareprice: v })
            }
          />

          <Input
            label="Cost Price (your cost)"
            type="number"
            value={form.cost_price}
            readOnly={isView}
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
            label="Stock"
            type="number"
            value={form.inventory}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, inventory: v })
            }
          />


          <Input
            label="SKU"
            value={form.sku}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, sku: v })
            }
          />

          <Input
            label="Barcode"
            value={form.barcode}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, barcode: v })}
          />

          <Input
            label="Weight (grams)"
            type="number"
            value={form.weight_grams}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, weight_grams: v })}
          />

          <Input
            label="Low Stock Alert Threshold"
            type="number"
            value={form.low_stock_threshold}
            readOnly={isView}
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
            label="Min Order Qty"
            type="number"
            value={form.min_order_qty}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, min_order_qty: v })}
          />

          <Input
            label="Max Order Qty"
            type="number"
            value={form.max_order_qty}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, max_order_qty: v })}
          />

          {/* IS RETURNABLE */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Returns</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.is_returnable !== false} disabled={isView}
                  onChange={e => setForm({ ...form, is_returnable: e.target.checked })} />
                <span className="text-sm">Is Returnable</span>
              </label>
            </div>
          </div>

        </Grid>

      </Section>


      {/* DESCRIPTION */}

      <Section title="Description">

        <TextArea
          label="Short Description"
          value={form.shortdescription}
          readOnly={isView}
          onChange={(v: string) =>
            setForm({ ...form, shortdescription: v })
          }
        />


        <TextArea
          label="Long Description"
          rows={5}
          value={form.longdescription}
          readOnly={isView}
          onChange={(v: string) =>
            setForm({ ...form, longdescription: v })
          }
        />

      </Section>


      {/* AYURVEDIC DETAILS */}

      <Section title="Ayurvedic Details">

        <TextArea
          label="Product Highlights"
          rows={3}
          value={form.highlights}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, highlights: v })}
        />

        <TextArea
          label="Ingredients"
          rows={3}
          value={form.ingredients}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, ingredients: v })}
        />

        <TextArea
          label="Health Benefits"
          rows={3}
          value={form.benefits}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, benefits: v })}
        />

        <TextArea
          label="Usage / Dosage Instructions"
          rows={3}
          value={form.usage_instructions}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, usage_instructions: v })}
        />

        <TextArea
          label="Storage Instructions"
          rows={2}
          value={form.storage_instructions}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, storage_instructions: v })}
        />

        <TextArea
          label="Warnings & Precautions"
          rows={2}
          value={form.warnings}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, warnings: v })}
        />

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

          <div className="grid grid-cols-4 gap-3 mt-3">

            {form.images.map((file: any, i: number) => {

              const url =
                typeof file === 'string'
                  ? file
                  : URL.createObjectURL(file)

              return (

                <div
                  key={i}
                  className="relative group border rounded-lg overflow-hidden"
                >

                  <img
                    src={url}
                    className="h-24 w-full object-cover"
                  />


                  {!isView && (

                    <button
                      type="button"
                      onClick={() => {

                        const arr =
                          form.images.filter(
                            (_: any, index: number) =>
                              index !== i
                          )

                        setForm({
                          ...form,
                          images: arr,
                        })

                      }}
                      className="
                        absolute top-1 right-1
                        bg-red-600 text-white
                        w-6 h-6 rounded-full text-xs
                        opacity-0 group-hover:opacity-100
                      "
                    >
                      ✕

                    </button>

                  )}

                </div>

              )

            })}

          </div>

        )}

      </Section>


      {/* MEDIA */}

      <Section title="Media">
        <Grid>
          <Input
            label="Video URL"
            value={form.video_url}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, video_url: v })}
          />
        </Grid>
      </Section>


      {/* SHIPPING */}

      <Section title="Shipping">
        <Grid>
          <div className="space-y-1">
            <label className="text-sm font-medium">Shipping Class</label>
            <select
              value={form.shipping_class || 'standard'}
              disabled={isView}
              onChange={e => setForm({ ...form, shipping_class: e.target.value })}
              className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="standard">Standard</option>
              <option value="free">Free</option>
              <option value="heavy">Heavy</option>
              <option value="fragile">Fragile</option>
            </select>
          </div>
        </Grid>
      </Section>


      {/* COMPLIANCE */}

      <Section title="Compliance">
        <Grid>
          <Input
            label="FSSAI Number"
            value={form.fssai_number}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, fssai_number: v })}
          />
          <Input
            label="COA / Lab Report URL"
            value={form.coa_url}
            readOnly={isView}
            onChange={(v: string) => setForm({ ...form, coa_url: v })}
          />
        </Grid>
      </Section>


      {/* SPECIFICATIONS */}
      <Section title="Specifications (optional)">
        <p className="text-xs text-gray-500 mb-2">{'Add product specifications as JSON array: [{"key":"Ingredient","value":"Amla"}, ...]'}</p>
        <TextArea
          label="Specifications JSON"
          rows={3}
          value={typeof form.specifications === 'string' ? form.specifications : JSON.stringify(form.specifications || [], null, 2)}
          readOnly={isView}
          onChange={(v: string) => setForm({ ...form, specifications: v })}
        />
      </Section>

      {/* SEO */}
      <Section title="SEO (optional)">
        <Grid>
          <Input label="Meta Title" value={form.meta_title} readOnly={isView}
            onChange={(v: string) => setForm({ ...form, meta_title: v })} />
          <Input label="Meta Description" value={form.meta_description} readOnly={isView}
            onChange={(v: string) => setForm({ ...form, meta_description: v })} />
          <Input label="Focus Keyword" value={form.focus_keyword} readOnly={isView}
            onChange={(v: string) => setForm({ ...form, focus_keyword: v })} />
          <Input label="Sort Order" type="number" value={form.sort_order} readOnly={isView}
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