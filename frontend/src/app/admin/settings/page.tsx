'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

import { Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react'

import { notify } from '@/app/utils/notify'

import DynamicTable from '@/components/table/table'
import AppModal from '@/components/modal/AppModal'


/* =====================================================
   TYPES
===================================================== */

type Mode = 'create' | 'edit' | 'view'


/* =====================================================
   MAIN
===================================================== */

export default function AdminSettingsPage() {

  /* ================= STATE ================= */

  const [list, setList] = useState<any[]>([])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('create')
  const [current, setCurrent] = useState<any>(null)

  const [loading, setLoading] = useState(false)


  /* ================= LOAD ================= */

  const load = async () => {

    try {

      const res = await axios.get('/admin/settings')

      setList(res.data.data)

    } catch {

      notify.error('Load failed')

    }
  }


  useEffect(() => {
    load()
  }, [])


  /* ================= ACTIONS ================= */

  const openModal = (m: Mode, row: any = null) => {

    setMode(m)
    setCurrent(row)
    setOpen(true)
  }


  const remove = async (id: number) => {

    if (!confirm('Delete setting?')) return

    try {

      await axios.delete(`/admin/settings/${id}`)

      notify.success('Deleted')

      load()

    } catch {

      notify.error('Delete failed')

    }
  }


  /* ================= TABLE CONFIG ================= */

  const columns = [

    { key: 'key', label: 'Key', align: 'left' },

    { key: 'value', label: 'Value', align: 'center' },

    { key: 'type', label: 'Type', align: 'center' },

    { key: 'status', label: 'Status', align: 'center' },

    { key: 'action', label: 'Action', align: 'center' }

  ]


  /* ================= ROWS ================= */

  const rows = list?.map((item: any) => {

    return {

      ...item,

      status: item.is_active ? 'Active' : 'Inactive',

      action: (

        <div className="flex gap-3 justify-center">

          <button
            onClick={() => openModal('view', item)}
            className="text-blue-600"
          >
            <Eye size={16} />
          </button>


          <button
            onClick={() => openModal('edit', item)}
            className="text-emerald-600"
          >
            <Edit size={16} />
          </button>


          <button
            onClick={() => remove(item.id)}
            className="text-red-600"
          >
            <Trash2 size={16} />
          </button>

        </div>

      )

    }

  })


  /* ================= FORM ================= */

  const [form, setForm] = useState<any>({
    key: '',
    value: '',
    type: 'number',
    description: '',
    is_active: true
  })


  useEffect(() => {

    if (current) {
      setForm(current)
    } else {
      reset()
    }

  }, [current])


  const reset = () => {

    setForm({
      key: '',
      value: '',
      type: 'number',
      description: '',
      is_active: true
    })

  }


  /* ================= VALIDATE ================= */

  const validate = () => {

    if (!form.key) return 'Key required'
    if (!form.value) return 'Value required'

    if (
      form.type === 'number' &&
      isNaN(Number(form.value))
    ) {
      return 'Must be number'
    }

    return null
  }


  /* ================= SAVE ================= */

  const submit = async () => {

    const err = validate()

    if (err) return notify.error(err)


    try {

      setLoading(true)

      if (mode === 'edit') {

        await axios.put(
          `/admin/settings/${form.id}`,
          form
        )

      } else {

        await axios.post(
          '/admin/settings',
          form
        )

      }

      notify.success('Saved')

      load()
      closeModal()

    } catch {

      notify.error('Save failed')

    } finally {

      setLoading(false)

    }
  }


  const closeModal = () => {

    setOpen(false)
    setCurrent(null)

  }


  /* ================= MODAL FOOTER ================= */

  const footer = mode !== 'view' && (

    <div className="flex justify-end gap-3">

      <button
        onClick={closeModal}
        className="border px-4 py-2 rounded"
      >
        Cancel
      </button>


      <button
        onClick={submit}
        disabled={loading}
        className="
          bg-emerald-600 text-white
          px-5 py-2 rounded
          flex gap-2
        "
      >

        {loading && (
          <Loader2 size={16} className="animate-spin" />
        )}

        {mode === 'edit' ? 'Update' : 'Create'}

      </button>

    </div>

  )


  /* ================= UI ================= */

  return (

<div className="space-y-6 max-w-6xl mx-auto w-full">


      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h2 className="text-xl font-bold">
          App Settings
        </h2>


        <button
          onClick={() => openModal('create')}
          className="
            bg-emerald-600 text-white
            px-4 py-2 rounded-lg
            flex gap-2
          "
        >
          <Plus size={18} />
          Add
        </button>

      </div>


      {/* TABLE */}
<div className="w-full overflow-x-auto">
  <DynamicTable
    columns={columns}
    rows={rows}
  />
</div>


      {/* MODAL */}

      <AppModal
        open={open}
        onClose={closeModal}
        title={
          mode === 'view'
            ? 'View Setting'
            : mode === 'edit'
              ? 'Edit Setting'
              : 'Add Setting'
        }
        description="Manage platform charges & configs"
        footer={footer}
      >


        {/* FORM */}

        <div className="space-y-4">


          <Field
            label="Key"
            value={form.key}
            disabled={mode !== 'create'}
            onChange={v =>
              setForm({ ...form, key: v })
            }
          />


          <Field
            label="Value"
            value={form.value}
            disabled={mode === 'view'}
            onChange={v =>
              setForm({ ...form, value: v })
            }
          />


          <SelectField
            label="Type"
            value={form.type}
            disabled={mode === 'view'}
            onChange={v =>
              setForm({ ...form, type: v })
            }
          />


          <Field
            label="Description"
            value={form.description}
            disabled={mode === 'view'}
            onChange={v =>
              setForm({ ...form, description: v })
            }
          />


          <ToggleField
            label="Active"
            value={form.is_active}
            disabled={mode === 'view'}
            onChange={v =>
              setForm({ ...form, is_active: v })
            }
          />

        </div>

      </AppModal>

    </div>
  )
}


/* =====================================================
   SMALL FIELDS
===================================================== */

function Field({ label, value, onChange, disabled }: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="
          w-full border rounded px-3 py-2
          focus:ring-2 focus:ring-emerald-500
          disabled:bg-gray-100
        "
      />

    </div>
  )
}


function SelectField({ label, value, onChange, disabled }: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="
          w-full border rounded px-3 py-2
          disabled:bg-gray-100
        "
      >

        <option value="number">Number</option>
        <option value="string">String</option>
        <option value="boolean">Boolean</option>
        <option value="json">JSON</option>

      </select>

    </div>
  )
}


function ToggleField({ label, value, onChange, disabled }: any) {

  return (

    <div className="flex items-center gap-3">

      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />

      <span className="text-sm">{label}</span>

    </div>
  )
}
