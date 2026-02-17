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

  const [form, setForm] = useState<any>({
    name: '',
    slug: '',

    shortdescription: '',
    longdescription: '',

    price: '',
    compareprice: '',

    inventory: '',
    sku: '',

    category_name: '',
    category_id:"",
    brand: '',

    status: 'draft',

    meta_title: '',
    meta_description: '',

    images: [],
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
              onChange={e =>
                setForm({
                  ...form,
                  category_id: e.target.value,
                  category_name:categories?.find((item:any)=>item?.id==e.target.value)?.name
                })
              }
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

                <option
                  key={cat.id}
                  value={cat.id}
                >
                  {cat.name}
                </option>

              ))}

            </select>

          </div>


          <Input
            label="Brand"
            value={form.brand}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, brand: v })
            }
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
            label="Compare Price"
            type="number"
            value={form.compareprice}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, compareprice: v })
            }
          />

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
          ${
            readOnly
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-white'
          }
        `}
      />

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
          ${
            readOnly
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-white'
          }
        `}
      />

    </div>
  )
}