'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

import {
  Eye,
  Package,
  User,
  Mail,
  DollarSign,
  CreditCard,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Truck
} from 'lucide-react'

import { notify } from '@/app/utils/notify'

import DynamicTable from '@/components/table/table'
import AppModal from '@/components/modal/AppModal'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'


export default function AdminOrdersPage() {


  /* ================= STATE ================= */

  const [list, setList] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<any>(null)

  const [loading, setLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [page, setPage] = useState(1)
  const limit = 10

  const [editStatus, setEditStatus] = useState('')
const [mode, setMode] = useState<any>('view')

const {statusList}=useAuth()
  /* ================= LOAD ================= */

  const load = async () => {

    setLoading(true)

    try {

      const res = await axios.get('/admin/orders', {
        params: {
          page,
          limit,
          search: searchTerm,
          status: filterStatus
        }
      })

      setList(res.data.data)
      setMeta(res.data.meta)


    } catch (err: any) {

      notify.error(
        err?.response?.data?.message ||
        'Failed to load orders'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {
    load()
  }, [page, searchTerm, filterStatus])


  /* ================= SYNC STATUS ================= */

  useEffect(() => {

    if (current) {
      setEditStatus(current.status)
    }

  }, [current])
 

const closeModal = () => {

  setOpen(false)

  setCurrent(null)

  setMode('view')

  setEditStatus('')

}
  /* ================= STATUS UPDATE ================= */

  const updateStatus = async () => {

    if (!current) return


    try {

      setStatusUpdating(true)

      await axios.put(
        `/admin/orders/${current.id}/status`,
        { status: editStatus }
      )

      notify.success('Status updated')

      setOpen(false)
      setCurrent(null)

      load()


    } catch (err: any) {

      notify.error(
        err?.response?.data?.message ||
        'Update failed'
      )

    } finally {

      setStatusUpdating(false)

    }
  }


  /* ================= BADGES ================= */

  const getStatusBadge = (item2: any) => {

    const styles: any = {

      0: 'bg-yellow-100 text-yellow-800 border-yellow-200',

      1: 'bg-blue-100 text-blue-800 border-blue-200',

      4: 'bg-green-100 text-green-800 border-green-200',

      5: 'bg-red-100 text-red-800 border-red-200',

      3: 'bg-purple-100 text-purple-800 border-purple-200'

    }

    return (

      <span
        className={`
          px-3 py-1 rounded-full
          text-xs font-semibold border
          ${styles[item2?.status]}
        `}
      >

        {statusList?.find((item:any)=>item?.code==item2?.status)?.label}

      </span>

    )
  }
  const saveTracking = async () => {

  if (!current?.courier_name || !current?.tracking_number) {
    return notify.error('Courier name & tracking number required')
  }

  try {

    setLoading(true)

    await axios.post(
      `/admin/orders/${current.id}/tracking`,
      {
        courier_name: current.courier_name,
        tracking_number: current.tracking_number
      }
    )

    notify.success('Tracking saved')

    setOpen(false)
    setCurrent(null)

    load()

  } catch (err: any) {

    notify.error(
      err?.response?.data?.message ||
      'Tracking save failed'
    )

  } finally {

    setLoading(false)

  }
}
const openModal = (m: Mode, order: any) => {

  setMode(m)        // view | edit | tracking
  setCurrent(order)
  setOpen(true)

}

  const getPaymentBadge = (status: string) => {

    const styles: any = {

      paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',

      pending: 'bg-amber-100 text-amber-800 border-amber-200',

      failed: 'bg-rose-100 text-rose-800 border-rose-200'

    }

    return (

      <span
        className={`
          px-3 py-1 rounded-full
          text-xs font-semibold border
          ${styles[status] || styles.pending}
        `}
      >

        {status?.toUpperCase()}

      </span>

    )
  }
   const getPaymentmethod = (status: string) => {

    const styles: any = {

      online: 'bg-emerald-100 text-emerald-800 border-emerald-200',

      cod: 'bg-amber-100 text-amber-800 border-amber-200',

  

    }

    return (

      <span
        className={`
          px-3 py-1 rounded-full
          text-xs font-semibold border
          ${styles[status] || styles.pending}
        `}
      >

        {status?.toUpperCase()}

      </span>

    )
  }
const generateInvoice = async () => {

  if (!current) return

  try {

    setLoading(true)

    await axios.post(
      `admin/invoices/generate/${current.id}`
    )

    notify.success('Invoice generated')

    closeModal()
    load()

  } catch (err: any) {

    notify.error(
      err?.response?.data?.message ||
      'Invoice generation failed'
    )

  } finally {

    setLoading(false)

  }

}

  /* ================= COLUMNS ================= */

  const columns = [

    { key: 'id', label: 'Order ID', align: 'center' },

    { key: 'user_name', label: 'Customer', align: 'left' },

    { key: 'total_amount', label: 'Amount', align: 'right' },

    { key: 'status', label: 'Status', align: 'center' },

    { key: 'payment_status', label: 'Payment', align: 'center' },
    { key: 'payment_method', label: 'Payment Method', align: 'center' },

    { key: 'created_at', label: 'Date', align: 'center' },

    { key: 'action', label: 'Action', align: 'center' }

  ]


  /* ================= ROWS ================= */

  const rows = list.map((o: any) => ({

    ...o,

    id: (

      <span className="font-mono text-sm font-semibold text-gray-900">
        #{o.id}
      </span>

    ),


    user_name: (

      <div className="flex items-center gap-3">

        <div
          className="
            w-8 h-8 rounded-full
            bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center
            text-white font-semibold text-sm
          "
        >

          {o.user_name?.charAt(0).toUpperCase()}

        </div>


        <div>

          <div className="font-medium text-gray-900">
            {o.user_name}
          </div>

          <div className="text-xs text-gray-500">
            {o.user_email}
          </div>

        </div>

      </div>

    ),


    total_amount: (

      <span className="font-semibold text-gray-900">
        ₹{Number(o.total_amount).toLocaleString('en-IN')}
      </span>

    ),


    status: getStatusBadge(o),


    payment_status: getPaymentBadge(o.payment_status),
    payment_method:getPaymentmethod(o?.payment_method),


    created_at: (

      <span className="text-sm text-gray-600">

        {new Date(o.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}

      </span>

    ),


  action: (
  <div className="flex gap-3 justify-center">

    {/* VIEW */}
    <button
      onClick={() => openModal('view', o)}
      className="text-blue-600"
    >
      <Eye size={18} />
    </button>


    {/* UPDATE */}
    <button
      onClick={() => openModal('edit', o)}
      className="text-emerald-600"
    >
      <Edit size={18} />
    </button>


    {/* TRACKING (ONLY IF SHIPPED) */}
    {o.status ==3 && (

      <button
        onClick={() => openModal('tracking', o)}
        className="text-purple-600"
      >
        <Truck size={18} />
      </button>

    )}
  {(
      ([1,2,3,4].includes(Number(o.status))&& o.payment_method == "online") ||
      (o.status == 4 && o.payment_method == "cod")
    )  && (

      <button
        onClick={() => openModal('invoice', o)}
        className="text-green-600"
        title="Generate Invoice"
      >
        <Download size={18} />
      </button>

    )}
  </div>
)

  }))


  /* ================= STATS ================= */

  const stats = [

    {
      label: 'Total Orders',
      value: meta.total || 0,
      icon: Package
    },

    {
      label: 'Total Revenue',
      value: `₹${Number(meta.revenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign
    },

    {
      label: 'Pending',
      value: meta.pending || 0,
      icon: RefreshCw
    },

    {
      label: 'Completed',
      value: meta.completed || 0,
      icon: CreditCard
    }

  ]


  /* ================= UI ================= */

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">

      <div className="max-w-7xl mx-auto p-6 space-y-6">


        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Orders Management
              </h1>

              <p className="text-gray-600 mt-2">
                Manage and track all customer orders
              </p>

            </div>


            <button
              onClick={load}
              disabled={loading}
              className="
                flex items-center gap-2
                px-6 py-3
                bg-gradient-to-r from-blue-600 to-purple-600
                hover:from-blue-700 hover:to-purple-700
                text-white rounded-xl
                transition-all duration-200
                shadow-md hover:shadow-lg
                font-medium
                disabled:opacity-50
              "
            >

              <RefreshCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />

              {loading ? 'Refreshing...' : 'Refresh'}

            </button>

          </div>

        </div>


        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {stats.map((stat, idx) => (

            <div
              key={idx}
              className="
                bg-white rounded-2xl shadow-lg
                p-6 border border-gray-100
                hover:shadow-xl transition-all
              "
            >

              <p className="text-sm font-medium text-gray-600 mb-2">
                {stat.label}
              </p>

              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
              </p>

            </div>

          ))}

        </div>


        {/* FILTERS */}

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">

          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex-1 relative">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

              <input
                type="text"
                placeholder="Search by customer name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1)
                  setSearchTerm(e.target.value)
                }}
                className="
                  w-full pl-12 pr-4 py-3
                  border-2 border-gray-200 rounded-xl
                  focus:border-blue-500 focus:ring-4
                  focus:ring-blue-100 outline-none
                "
              />

            </div>


            <div className="relative min-w-[200px]">

              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

              <select
                value={filterStatus}
                onChange={(e) => {
                  setPage(1)
                  setFilterStatus(e.target.value)
                }}
                className="
                  w-full pl-12 pr-4 py-3
                  border-2 border-gray-200 rounded-xl
                  appearance-none bg-white
                "
              >

                <option value="all">All Status</option>
         {statusList?.map((item:any)=><option value={item?.code}>{item?.label}</option>)}

 

              </select>

            </div>


            <button
              className="
                flex items-center gap-2
                px-6 py-3
                bg-gradient-to-r from-green-600 to-emerald-600
                hover:from-green-700 hover:to-emerald-700
                text-white rounded-xl
                transition-all duration-200
                shadow-md hover:shadow-lg
                font-medium
              "
            >

              <Download className="w-5 h-5" />
              Export

            </button>

          </div>

        </div>


        {/* TABLE */}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {loading ? (

            <div className="flex items-center justify-center py-20">

              <div
                className="
                  animate-spin rounded-full
                  h-12 w-12 border-4
                  border-blue-500 border-t-transparent
                "
              />

            </div>

          ) : (

            <DynamicTable
              columns={columns}
              rows={rows}
            />

          )}

        </div>


        {/* PAGINATION */}

        {meta.pages > 1 && (

          <div className="flex justify-center gap-4">

            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border rounded-lg"
            >
              Previous
            </button>


            <span className="px-4 py-2">
              Page {page} of {meta.pages}
            </span>


            <button
              disabled={page === meta.pages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border rounded-lg"
            >
              Next
            </button>

          </div>

        )}


        {/* MODAL */}


<AppModal open={open} onClose={() => closeModal()} title="Order Details">

  {current && (

    <div className="space-y-6">


      {/* ================= ORDER HEADER ================= */}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">

        <div className="flex items-center justify-between mb-4">

          <div>

            <p className="text-sm opacity-90">Order ID</p>

            <p className="text-2xl font-bold">#{current.id}</p>

          </div>


          <div className="text-right">

            <p className="text-sm opacity-90">Order Date</p>

            <p className="text-lg font-semibold">

              {new Date(current.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}

            </p>

          </div>

        </div>


        <div className="flex gap-3">

          <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
            {statusList?.find((item:any)=>item?.code==current?.status)?.label?.toUpperCase()}
            
         
          </span>

          <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
            {current.payment_status?.toUpperCase()}
          </span>

        </div>

      </div>


      {/* ================= CUSTOMER INFO ================= */}

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">

        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

          <User className="w-5 h-5 text-blue-600" />
          Customer Information

        </h3>


        <div className="space-y-3">

          <div className="flex items-start gap-3">

            <div
              className="
                w-10 h-10 rounded-full
                bg-gradient-to-br from-blue-500 to-purple-600
                flex items-center justify-center
                text-white font-bold
              "
            >

              {current.user_name?.charAt(0).toUpperCase()}

            </div>


            <div>

              <p className="font-semibold text-gray-900">
                {current.user_name}
              </p>


              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">

                <Mail className="w-4 h-4" />
                {current.user_email}

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ================= ORDER DETAILS ================= */}

      <div className="bg-gray-50 rounded-xl p-6">

        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

          <Package className="w-5 h-5 text-blue-600" />
          Order Details

        </h3>


        <div className="space-y-3">

          <div className="flex justify-between items-center py-3 border-b border-gray-200">

            <span className="text-gray-600">Subtotal</span>

            <span className="font-semibold text-gray-900">
              ₹{Number(current.total_amount).toLocaleString('en-IN')}
            </span>

          </div>


          <div className="flex justify-between items-center py-3 border-b border-gray-200">

            <span className="text-gray-600">Tax</span>

            <span className="font-semibold text-gray-900">
              ₹0.00
            </span>

          </div>


          <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-4 mt-4">

            <span className="font-bold text-gray-900 text-lg">
              Total Amount
            </span>


            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">

              ₹{Number(current.total_amount).toLocaleString('en-IN')}

            </span>

          </div>

        </div>

      </div>


      {/* ================= STATUS UPDATE ================= */}

    {mode=="edit"&&
     <div className="bg-gray-50 rounded-xl p-6 space-y-3">

        <h3 className="font-bold text-gray-900">
          Update Order Status
        </h3>


        <select
          value={editStatus}
          disabled={statusUpdating}
          onChange={(e) => setEditStatus(e.target.value)}
          className="
            w-full border rounded-lg
            px-4 py-2
            focus:ring-2 focus:ring-blue-500
          "
        >
          {statusList?.map((item:any)=><option value={item?.code}>{item?.label}</option>)}

       
        </select>


        <button
          disabled={
            statusUpdating ||
            editStatus == current.status
          }
          onClick={updateStatus}
          className="
            w-full py-3 rounded-xl
            bg-gradient-to-r from-blue-600 to-purple-600
            hover:from-blue-700 hover:to-purple-700
            text-white font-semibold
            disabled:opacity-50
          "
        >

          {statusUpdating ? 'Updating...' : 'Update Status'}

        </button>

      </div>}


      {/* ================= INVOICE ================= */}

      {/* ================= INVOICE ================= */}

{mode === 'invoice' &&
 (([1,2,3,4]?.includes(Number(current.status))&&current?.payment_method=="online")||(current.status ==4&&current?.payment_method=="offline"))  && (

  <button
    onClick={generateInvoice}
    disabled={loading}
    className="
      w-full py-3 rounded-xl
      bg-gradient-to-r from-emerald-600 to-green-600
      text-white font-semibold
      disabled:opacity-50
    "
  >
    {loading ? 'Generating...' : 'Generate Invoice'}
  </button>

)}


      {/* ================= TRACKING ================= */}

     {mode == 'tracking' && current && (

  <div className="space-y-4">

    <h3 className="text-lg font-bold">
      Add Tracking Details
    </h3>


    <input
      placeholder="Courier Name"
      value={current.courier_name || ''}
      onChange={(e)=>
        setCurrent({
          ...current,
          courier_name: e.target.value
        })
      }
      className="w-full border px-3 py-2 rounded"
    />


    <input
      placeholder="Tracking Number"
      value={current.tracking_number || ''}
      onChange={(e)=>
        setCurrent({
          ...current,
          tracking_number: e.target.value
        })
      }
      className="w-full border px-3 py-2 rounded"
    />


    <button
      onClick={saveTracking}
      disabled={loading}
       className="
    w-full py-3 rounded-xl
    bg-gradient-to-r from-purple-600 to-indigo-600
    text-white font-semibold
    disabled:opacity-50
  "
    >
     {loading ? 'Saving...' : 'Save Tracking'}
    </button>

  </div>
)}


      {/* ================= ACTIONS ================= */}

      <div className="flex gap-3 pt-4">

        <button
          onClick={() =>closeModal()}
          className="
            flex-1 px-6 py-3
            bg-gray-200 hover:bg-gray-300
            text-gray-700 rounded-xl
            transition-all duration-200
            font-semibold
          "
        >
          Close
        </button>

      </div>


    </div>

  )}

</AppModal>

      </div>

    </div>

  )
}
