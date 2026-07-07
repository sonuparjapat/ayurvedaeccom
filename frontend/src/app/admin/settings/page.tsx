'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

import { Plus, Eye, Edit, Trash2, Loader2, Truck, IndianRupee, Package } from 'lucide-react'

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


  /* ================= DELIVERY QUICK-EDIT ================= */

  const DELIVERY_KEYS = ['free_delivery_limit', 'delivery_charge', 'platform_fee'] as const
  type DeliveryKey = typeof DELIVERY_KEYS[number]

  const getVal = (key: DeliveryKey) => {
    const row = list.find((r: any) => r.key === key)
    return row ? String(row.value) : ''
  }

  const [deliveryEdits, setDeliveryEdits] = useState<Record<string, string>>({})
  const [deliverySaving, setDeliverySaving] = useState(false)

  const saveDeliverySetting = async (key: DeliveryKey) => {
    const val = deliveryEdits[key] ?? getVal(key)
    if (!val) return notify.error('Enter a value')
    if (isNaN(Number(val))) return notify.error('Must be a number')
    setDeliverySaving(true)
    try {
      const existing = list.find((r: any) => r.key === key)
      if (existing) {
        await axios.put(`/admin/settings/${existing.id}`, { ...existing, value: val })
      } else {
        await axios.post('/admin/settings', { key, value: val, type: 'number', description: '', is_active: true })
      }
      notify.success('Saved')
      load()
      setDeliveryEdits(prev => { const n = { ...prev }; delete n[key]; return n })
    } catch { notify.error('Save failed') }
    finally { setDeliverySaving(false) }
  }

  const DELIVERY_META: Record<DeliveryKey, { label: string; hint: string; icon: any }> = {
    free_delivery_limit: { label: 'Free Delivery Above (₹)', hint: 'Orders at or above this amount get free delivery', icon: Truck },
    delivery_charge: { label: 'Delivery Charge (₹)', hint: 'Charge added when order is below the free delivery limit', icon: IndianRupee },
    platform_fee: { label: 'Platform Fee (₹)', hint: 'Fixed fee added to every order', icon: Package },
  }

  /* ================= UI ================= */

  return (

<div className="space-y-6 max-w-6xl mx-auto w-full">

      {/* DELIVERY QUICK-EDIT CARD */}
      <div className="bg-white border border-emerald-100 rounded-xl p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Delivery & Charges</h3>
        <p className="text-xs text-gray-500 mb-4">Changes apply instantly to cart, checkout, and order processing.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DELIVERY_KEYS.map(key => {
            const { label, hint, icon: Icon } = DELIVERY_META[key]
            const current = getVal(key)
            const edited = deliveryEdits[key]
            const displayVal = edited ?? current
            const isDirty = edited !== undefined && edited !== current
            return (
              <div key={key} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </div>
                <input
                  type="number"
                  value={displayVal}
                  onChange={e => setDeliveryEdits(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <p className="text-xs text-gray-400 mb-3">{hint}</p>
                <button
                  onClick={() => saveDeliverySetting(key)}
                  disabled={deliverySaving || !isDirty}
                  className="w-full text-xs font-semibold py-1.5 rounded bg-emerald-600 text-white disabled:opacity-40"
                >
                  {deliverySaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h2 className="text-xl font-bold">
          All Settings
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
            placeholder="e.g. delivery_charge, platform_fee, free_delivery_limit"
            onChange={v =>
              setForm({ ...form, key: v })
            }
          />


          <Field
            label="Value"
            value={form.value}
            disabled={mode === 'view'}
            placeholder="e.g. 49 (the actual value for this setting)"
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
            placeholder="e.g. Flat delivery charge added to orders below free delivery limit"
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

function Field({ label, value, onChange, disabled, placeholder }: any) {

  return (

    <div className="space-y-1">

      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
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
