'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'


export default function AdminProductForm({
  onSuccess,
  initialData,
  mode = 'create', // create | edit | view
}: any) {

  const isView = mode === 'view'
  const isEdit = mode === 'edit'


  const [loading, setLoading] = useState(false)

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
    brand: '',

    status: 'draft',

    meta_title: '',
    meta_description: '',

    images: [] as any[],
  })


  /* ================= PREFILL ================= */

  useEffect(() => {

    if (initialData) {

      setForm({
        ...initialData,
        images: initialData.images || [],
      })

    }

  }, [initialData])


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

    if (!form.name) return 'Name required'
    if (!form.price) return 'Price required'
    if (!form.inventory) return 'Stock required'
    if (!form.category_name) return 'Category required'
    if (!form.images.length) return 'Image required'

    return null
  }


  /* ================= SUBMIT ================= */

  const submit = async () => {

    const err = validate()

    if (err) return toast.error(err)


    try {

      setLoading(true)

      const data = new FormData()

      Object.keys(form).forEach(k => {

        if (k === 'images') {

          form.images.forEach((f: any) => {

            if (typeof f === 'string') {
              data.append('oldImages', f)
            } else {
              data.append('images', f)
            }

          })

        } else {

          data.append(k, form[k])

        }

      })


      if (isEdit) {

        await axios.put(
          `/admin/products/${form.id}`,
          data,
          { withCredentials: true }
        )

      } else {

        await axios.post(
          '/admin/products',
          data,
          { withCredentials: true }
        )

      }


      toast.success(
        isEdit ? 'Updated' : 'Created'
      )

      onSuccess?.()

    } catch {

      toast.error('Save failed')

    } finally {

      setLoading(false)

    }

  }

console.log(isView,"isview")
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


          <Input
            label="Category"
            value={form.category_name}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, category_name: v })
            }
          />


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


      {/* STATUS */}

      <Section title="Status">

        <select
          value={form.status}
          disabled={isView}
          onChange={e =>
            setForm({
              ...form,
              status: e.target.value,
            })
          }
          className="border rounded px-3 py-2"
        >

          <option value="draft">
            Draft
          </option>

          <option value="published">
            Published
          </option>

        </select>

      </Section>


      {/* SEO */}

      <Section title="SEO">

        <Grid>

          <Input
            label="Meta Title"
            value={form.meta_title}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, meta_title: v })
            }
          />


          <Input
            label="Meta Description"
            value={form.meta_description}
            readOnly={isView}
            onChange={(v: string) =>
              setForm({ ...form, meta_description: v })
            }
          />

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
