'use client'

import { useEffect, useRef, useState } from 'react'
import axios from '@/lib/axios'
import { io, Socket } from 'socket.io-client'

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
  Truck,
  History,
  CheckCircle2,
  Clock,
  ListChecks,
} from 'lucide-react'

import toast from 'react-hot-toast'

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
  const [filterRefund, setFilterRefund] = useState<string>('')  // '' | 'failed' | 'pending'

  const [page, setPage] = useState(1)
  const limit = 10

  const [editStatus, setEditStatus] = useState('')
  const [mode, setMode] = useState<any>('view')
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [otpValue, setOtpValue] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)

  const [trackingQuery, setTrackingQuery] = useState('')
  const [trackingResults, setTrackingResults] = useState<any[]>([])
  const [trackingSearching, setTrackingSearching] = useState(false)

  // Shipment events for tracking mode
  const [shipmentEvents, setShipmentEvents] = useState<any[]>([])
  const [shipmentInfo, setShipmentInfo] = useState<any>(null)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [savingShipment, setSavingShipment] = useState(false)

  const COURIERS = ['Delhivery', 'BlueDart', 'DTDC', 'Shadowfax', 'Ecom Express', 'FedEx', 'XpressBees', 'Shiprocket', 'Ekart', 'India Post', 'Gati', 'Professional', 'SmartR']

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [refunding, setRefunding] = useState(false)

  const {statusList} = useAuth()
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set())
  const socketRef = useRef<Socket | null>(null)

  /* ================= REAL-TIME ================= */
  useEffect(() => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')
    const socket = io(apiBase, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.emit('join_admin')
    socket.on('new_order', (data: { order_id: number }) => {
      load()
      setNewOrderIds(prev => new Set([...prev, data.order_id]))
      setTimeout(() => setNewOrderIds(prev => { const n = new Set(prev); n.delete(data.order_id); return n }), 5000)
    })
    socket.on('order_status_changed', (data: { order_id: number; new_status: number }) => {
      setList(prev => prev.map(o => o.id === data.order_id ? { ...o, status: data.new_status } : o))
    })
    return () => { socket.disconnect() }
  }, [])

  /* ================= LOAD ================= */

  const load = async () => {

    setLoading(true)

    try {

      const res = await axios.get('/admin/orders', {
        params: {
          page,
          limit,
          search: searchTerm,
          status: filterStatus,
          refund_status: filterRefund || undefined
        }
      })

      setList(res.data.data)
      setMeta(res.data.meta)


    } catch (err: any) {

      toast.error(
        err?.response?.data?.message ||
        'Failed to load orders'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {
    load()
    setSelectedIds(new Set())
  }, [page, searchTerm, filterStatus, filterRefund])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(list.map((o: any) => o.id)))
    }
  }

  const bulkUpdateStatus = async () => {
    if (selectedIds.size === 0 || !bulkStatus) return
    try {
      setBulkUpdating(true)
      const res = await axios.put('/admin/orders/bulk-status', {
        orderIds: Array.from(selectedIds),
        status: Number(bulkStatus),
      })
      toast.success(res.data.message || 'Bulk update done')
      setSelectedIds(new Set())
      setBulkStatus('')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk update failed')
    } finally {
      setBulkUpdating(false)
    }
  }

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
        { status: Number(editStatus) }
      )

      toast.success('Status updated')

      setOpen(false)
      setCurrent(null)

      load()


    } catch (err: any) {

      toast.error(
        err?.response?.data?.message ||
        'Update failed'
      )

    } finally {

      setStatusUpdating(false)

    }
  }


  /* ================= BADGES ================= */

  const getStatusBadge = (item2: any) => {

const styles = {

  // PENDING
  0: 'bg-yellow-100 text-yellow-800 border-yellow-200',

  // CONFIRMED
  1: 'bg-blue-100 text-blue-800 border-blue-200',

  // PROCESSING
  2: 'bg-indigo-100 text-indigo-800 border-indigo-200',

  // SHIPPED
  3: 'bg-purple-100 text-purple-800 border-purple-200',

  // OUT FOR DELIVERY
  4: 'bg-orange-100 text-orange-800 border-orange-200',

  // DELIVERED
  5: 'bg-green-100 text-green-800 border-green-200',

  // CANCELLED
  6: 'bg-red-100 text-red-800 border-red-200',

  // RETURN REQUESTED
  7: 'bg-pink-100 text-pink-800 border-pink-200',

  // RETURNED
  8: 'bg-gray-100 text-gray-800 border-gray-200',

  // REFUNDED
  9: 'bg-teal-100 text-teal-800 border-teal-200'

};

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
  const searchTracking = async () => {
    if (!trackingQuery.trim()) return
    setTrackingSearching(true)
    setTrackingResults([])
    try {
      const res = await axios.get('/admin/tracking/search', { params: { q: trackingQuery.trim() } })
      setTrackingResults(res.data?.orders || [])
      if (!res.data?.orders?.length) toast.error('No orders found for that tracking number')
    } catch {
      toast.error('Search failed')
    } finally {
      setTrackingSearching(false)
    }
  }

  const saveTracking = async () => {

  if (!current?.courier_name || !current?.tracking_number) {
    return toast.error('Courier name & tracking number required')
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

    toast.success('Tracking saved')

    setOpen(false)
    setCurrent(null)

    load()

  } catch (err: any) {

    toast.error(
      err?.response?.data?.message ||
      'Tracking save failed'
    )

  } finally {

    setLoading(false)

  }
}
const openModal = async (m: string, order: any) => {
  setMode(m)
  setCurrent(order)
  setOpen(true)
  setOrderItems([])
  setShipmentEvents([])
  setShipmentInfo(null)

  if (m === 'view' || m === 'edit') {
    try {
      const res = await axios.get(`/admin/orders/${order.id}`)
      setOrderItems(res.data?.items || [])
    } catch {}
  }

  if (m === 'timeline') {
    setTimeline([])
    setTimelineLoading(true)
    try {
      const res = await axios.get(`/admin/orders/${order.id}/timeline`)
      setTimeline(res.data?.timeline || [])
    } catch {
      setTimeline([])
    } finally {
      setTimelineLoading(false)
    }
  }

  if (m === 'tracking') {
    setEventsLoading(true)
    try {
      const res = await axios.get(`/admin/orders/${order.id}/shipment-events`)
      setShipmentEvents(res.data?.events || [])
      setShipmentInfo(res.data?.shipment || null)
    } catch {}
    finally { setEventsLoading(false) }
  }
}

const saveShipment = async () => {
  if (!current?.courier_name || !current?.tracking_number) {
    return toast.error('Courier name & tracking number required')
  }
  setSavingShipment(true)
  try {
    await axios.put(`/admin/orders/${current.id}/shipment`, {
      courier_name: current.courier_name,
      tracking_number: current.tracking_number,
      expected_delivery_date: current.expected_delivery_date || undefined,
    })
    toast.success('Shipment updated')
    // Refresh events
    const res = await axios.get(`/admin/orders/${current.id}/shipment-events`)
    setShipmentEvents(res.data?.events || [])
    setShipmentInfo(res.data?.shipment || null)
    load()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Update failed')
  } finally { setSavingShipment(false) }
}

  const getPaymentBadge = (status: string) => {

    const styles: any = {
      paid:     'bg-emerald-100 text-emerald-800 border-emerald-200',
      pending:  'bg-amber-100 text-amber-800 border-amber-200',
      unpaid:   'bg-orange-100 text-orange-800 border-orange-200',
      failed:   'bg-rose-100 text-rose-800 border-rose-200',
      refunded: 'bg-purple-100 text-purple-800 border-purple-200',
    }

    const labels: any = {
      paid:     'Paid',
      pending:  'Pay on Delivery',
      unpaid:   'Unpaid',
      failed:   'Failed',
      refunded: 'Refunded',
    }

    return (

      <span
        className={`
          px-3 py-1 rounded-full
          text-xs font-semibold border
          ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}
        `}
      >

        {labels[status] || status?.toUpperCase()}

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
const generateOTP = async () => {
  if (!current) return
  setOtpLoading(true)
  try {
    const r = await axios.post(`/admin/orders/${current.id}/delivery-otp`)
    setGeneratedOtp(r.data.otp)
    toast.success(`OTP generated: ${r.data.otp}`)
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to generate OTP')
  } finally { setOtpLoading(false) }
}

const verifyOTP = async () => {
  if (!current || !otpValue) return
  setOtpLoading(true)
  try {
    await axios.post(`/admin/orders/${current.id}/verify-otp`, { otp: otpValue })
    toast.success('OTP verified — order marked as delivered')
    setOtpValue('')
    setGeneratedOtp(null)
    closeModal()
    load()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Invalid OTP')
  } finally { setOtpLoading(false) }
}

const processRefund = async () => {
  if (!current) return
  if (!confirm(`Initiate Razorpay refund of ₹${Number(current.total_amount).toLocaleString('en-IN')} for order #${current.id}?`)) return
  setRefunding(true)
  try {
    const res = await axios.post(`/admin/orders/${current.id}/refund`)
    const { refund_id, refund_status } = res.data
    toast.success(refund_status === 'processed' ? 'Refund processed successfully' : 'Refund initiated — will reach customer in 5–7 days')
    load()
    setCurrent((prev: any) => prev ? {
      ...prev,
      refund_id,
      refund_status: refund_status || 'pending',
      refund_amount: prev.total_amount,
      payment_status: 'refunded'
    } : prev)
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Refund failed')
  } finally { setRefunding(false) }
}

const generateInvoice = async () => {

  if (!current) return

  try {

    setLoading(true)

    await axios.post(
      `/admin/invoices/generate/${current.id}`
    )

    toast.success('Invoice generated')

    closeModal()
    load()

  } catch (err: any) {

    toast.error(
      err?.response?.data?.message ||
      'Invoice generation failed'
    )

  } finally {

    setLoading(false)

  }

}

  /* ================= COLUMNS ================= */

  const columns = [

    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={list.length > 0 && selectedIds.size === list.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          title="Select all"
        />
      ),
      align: 'center',
    },

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

    _rowStyle: newOrderIds.has(o.id) ? { background: 'linear-gradient(90deg, #d1fae5, #ecfdf5)', animation: 'pulse 1.2s ease-in-out 2' } : undefined,

    select: (
      <input
        type="checkbox"
        checked={selectedIds.has(o.id)}
        onChange={() => toggleSelect(o.id)}
        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
        onClick={e => e.stopPropagation()}
      />
    ),

    id: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="font-mono text-sm font-semibold text-gray-900">#{o.id}</span>
        {newOrderIds.has(o.id) && (
          <span style={{ fontSize: 10, fontWeight: 700, background: '#10b981', color: '#fff', borderRadius: 99, padding: '1px 6px', lineHeight: '16px' }}>NEW</span>
        )}
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


    {/* TRACKING (Processing or Shipped) */}
    {[2, 3].includes(Number(o.status)) && (
      <button
        onClick={() => openModal('tracking', o)}
        className="text-purple-600"
        title={o.tracking_number ? `Tracking: ${o.tracking_number}` : 'Add Tracking'}
      >
        <Truck size={18} />
      </button>
    )}
    <button
      onClick={() => openModal('timeline', o)}
      className="text-indigo-600"
      title="Order Timeline"
    >
      <History size={18} />
    </button>

    {(
        ([1,2,3,4,5].includes(Number(o?.status))&& o?.payment_method == "online") ||
        (o.status == 5 && o.payment_method == "cod")
      ) && (
        <button
          onClick={() => openModal('invoice', o)}
          className="text-green-600"
          title="Generate Invoice"
        >
          <Download size={18} />
        </button>
      )}
    {Number(o.status) === 4 && o.payment_method === 'cod' && (
      <button onClick={() => { openModal('otp', o); setGeneratedOtp(null); setOtpValue('') }}
        className="text-orange-600" title="COD Delivery OTP">
        <CheckCircle2 size={18} />
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

    <div className="bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">

      <div className="space-y-6">


        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-lg p-5 md:p-8 border border-gray-100">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h1 className="text-2xl md:text-4xl font-bold bg-linear-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Orders Management
              </h1>

              <p className="text-gray-600 mt-2">
                Manage and track all customer orders
              </p>

            </div>


            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50"
            >

              <RefreshCw
                className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`}
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


        {/* REFUND QUICK FILTERS */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund filter:</span>
          {[
            { label: 'All Orders', value: '' },
            { label: 'Refund Pending', value: 'pending', color: 'amber' },
            { label: 'Refund Failed', value: 'failed', color: 'red' },
            { label: 'Refunded', value: 'processed', color: 'purple' },
          ].map(chip => (
            <button
              key={chip.value}
              onClick={() => { setFilterRefund(chip.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterRefund === chip.value
                  ? chip.value === 'failed'
                    ? 'bg-red-600 text-white border-red-600'
                    : chip.value === 'pending'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : chip.value === 'processed'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* TRACKING LOOKUP */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-600" /> Tracking Number Lookup
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter tracking number to find order..."
              value={trackingQuery}
              onChange={e => setTrackingQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchTracking()}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
            />
            <button
              onClick={searchTracking}
              disabled={trackingSearching}
              className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />{trackingSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {trackingResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {trackingResults.map(o => (
                <div key={o.id} className="border border-purple-100 rounded-xl p-4 bg-purple-50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">#{o.order_number || o.id} — {o.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.email} · {o.phone}</p>
                      <p className="text-xs text-purple-700 mt-1 font-medium">Courier: {o.courier_name} · Tracking: {o.tracking_number}</p>
                      {o.shipped_at && <p className="text-xs text-gray-400 mt-0.5">Shipped: {new Date(o.shipped_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-purple-200 text-purple-700">{o.status_label}</span>
                      <p className="text-sm font-bold text-gray-800 mt-1">₹{Number(o.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BULK ACTION TOOLBAR */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-md">
            <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
              <ListChecks className="w-5 h-5" />
              {selectedIds.size} order{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="border-2 border-blue-300 rounded-xl px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none"
            >
              <option value="">— Set status —</option>
              {statusList?.map((item: any) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
            <button
              onClick={bulkUpdateStatus}
              disabled={!bulkStatus || bulkUpdating}
              className="px-5 py-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
            >
              {bulkUpdating ? 'Updating…' : 'Apply to Selected'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear selection
            </button>
          </div>
        )}

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

 {current && (() => {

  const breakup = current?.shipping_address?.price_breakup || {}

  const subtotal = breakup?.subtotal || current?.total_amount || 0
  const gst = breakup?.gst || 0
  const delivery = breakup?.delivery || 0
  const platform = breakup?.platform_fee || 0
  const total = breakup?.grand_total || current?.total_amount || 0

   return (
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

          {/* Refund status + manual trigger */}
          {current.refund_status ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                current.refund_status === 'processed'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : current.refund_status === 'pending'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : current.refund_status === 'failed'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                REFUND: {current.refund_status === 'pending' ? 'INITIATED (3–5 days)' : current.refund_status.toUpperCase()}
                {Number(current.refund_amount) > 0 && ` — ₹${Number(current.refund_amount).toLocaleString('en-IN')}`}
              </span>
              {current.refund_id && (
                <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded">ID: {current.refund_id}</span>
              )}
              {current.refund_status === 'failed' && current.payment_method !== 'cod' && (
                <button onClick={processRefund} disabled={refunding}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                  {refunding ? 'Processing…' : 'Retry Refund'}
                </button>
              )}
            </div>
          ) : (
            /* No refund yet — show "Process Refund" for cancelled paid online orders */
            current.status === 6 && current.payment_method !== 'cod' &&
            ['paid', 'refunded'].includes(current.payment_status) && (
              <button onClick={processRefund} disabled={refunding}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {refunding ? 'Processing…' : '↩ Process Refund'}
              </button>
            )
          )}

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
{/* ================= ADDRESS ================= */}

<div className="bg-gray-50 rounded-xl p-6 space-y-3">

  <h3 className="text-lg font-bold text-gray-900">
    Delivery Address
  </h3>

  <div className="text-gray-700 text-sm leading-6">

    <p className="font-semibold">
      {current?.shipping_address?.name}
    </p>

    <p>{current?.shipping_address?.phone}</p>

    <p>{current?.shipping_address?.address}</p>

  </div>

</div>

      {/* ── Cancellation / Return Reason ── */}
      {(current.cancel_reason || current.return_reason) && (
        <div className={`rounded-xl p-5 border ${current.cancel_reason ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <h3 className={`font-bold mb-2 text-sm uppercase tracking-wide ${current.cancel_reason ? 'text-red-700' : 'text-orange-700'}`}>
            {current.cancel_reason ? '❌ Cancellation Reason' : '↩ Return Reason'}
          </h3>
          <p className="text-gray-800 text-sm leading-relaxed">
            {current.cancel_reason || current.return_reason}
          </p>
        </div>
      )}

      {/* ================= ORDER ITEMS ================= */}
      {orderItems.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Items Ordered
          </h3>
          <div className="space-y-3">
            {orderItems.map((item: any, i: number) => {
              const img = Array.isArray(item.images) ? item.images[0] : null
              return (
                <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                  {img ? (
                    <img src={img} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-lg">🌿</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    {item.variant_label && <p className="text-xs text-emerald-600 font-medium">{item.variant_label}</p>}
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS ================= */}

      <div className="bg-gray-50 rounded-xl p-6">

        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

          <Package className="w-5 h-5 text-blue-600" />
          Price Breakdown

        </h3>


        <div className="space-y-3">

          <div className="flex justify-between items-center py-3 border-b border-gray-200">

            <span className="text-gray-600">Subtotal</span>

            <span className="font-semibold text-gray-900">
            ₹{Number(subtotal).toLocaleString('en-IN')}
            </span>

          </div>


          <div className="flex justify-between items-center py-3 border-b border-gray-200">

            <span className="text-gray-600">Tax</span>

            <span className="font-semibold text-gray-900">
     ₹{Number(gst).toLocaleString('en-IN')}
            </span>

          </div>
<div className="flex justify-between items-center py-3 border-b border-gray-200">
  <span className="text-gray-600">Delivery</span>
  <span className="font-semibold text-gray-900">
    ₹{Number(delivery).toLocaleString('en-IN')}
  </span>
</div>

<div className="flex justify-between items-center py-3 border-b border-gray-200">
  <span className="text-gray-600">Platform Fee</span>
  <span className="font-semibold text-gray-900">
    ₹{Number(platform).toLocaleString('en-IN')}
  </span>
</div>

          <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-4 mt-4">

            <span className="font-bold text-gray-900 text-lg">
              Total Amount
            </span>


            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">

            ₹{Number(total).toLocaleString('en-IN')}

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
 (([1,2,3,4,5]?.includes(Number(current.status))&&current?.payment_method=="online")||(current.status ==5&&current?.payment_method=="cod"))  && (

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


      {/* ================= COD DELIVERY OTP ================= */}
      {mode === 'otp' && current && Number(current.status) === 4 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-orange-800 text-lg">COD Delivery OTP</h3>
          <p className="text-sm text-orange-700">Generate a 6-digit OTP for the delivery agent. The customer must provide this to confirm receipt.</p>

          {generatedOtp && (
            <div className="bg-white border-2 border-orange-400 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Generated OTP</p>
              <p className="text-4xl font-black tracking-[0.3em] text-orange-600">{generatedOtp}</p>
              <p className="text-xs text-gray-400 mt-1">Share this with the delivery agent</p>
            </div>
          )}

          <button onClick={generateOTP} disabled={otpLoading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50">
            {otpLoading ? 'Generating…' : generatedOtp ? 'Regenerate OTP' : 'Generate OTP'}
          </button>

          <div className="pt-2 border-t border-orange-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Verify OTP (entered by customer):</p>
            <div className="flex gap-2">
              <input type="text" maxLength={6} placeholder="Enter 6-digit OTP"
                value={otpValue} onChange={e => setOtpValue(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-center tracking-widest font-mono text-lg focus:ring-2 focus:ring-orange-400 outline-none" />
              <button onClick={verifyOTP} disabled={otpLoading || otpValue.length !== 6}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50">
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TRACKING ================= */}

      {mode === 'tracking' && current && (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" /> Shipment Details
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Courier Partner *</label>
              <select
                value={current.courier_name || ''}
                onChange={e => setCurrent({ ...current, courier_name: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Select courier…</option>
                {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">AWB / Tracking Number *</label>
              <input
                placeholder="Enter AWB number"
                value={current.tracking_number || ''}
                onChange={e => setCurrent({ ...current, tracking_number: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={current.expected_delivery_date ? String(current.expected_delivery_date).split('T')[0] : ''}
                onChange={e => setCurrent({ ...current, expected_delivery_date: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {shipmentInfo?.tracking_url && (
            <a href={shipmentInfo.tracking_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              Track on {shipmentInfo.courier_name} website →
            </a>
          )}

          <button
            onClick={saveShipment}
            disabled={savingShipment}
            className="w-full py-3 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            {savingShipment ? 'Saving…' : 'Save Shipment Details'}
          </button>

          {/* Tracking Events Timeline */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Tracking Events</h4>
            {eventsLoading ? (
              <div className="text-center py-4 text-gray-400 text-sm">Loading events…</div>
            ) : shipmentEvents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No events yet. Save shipment details first, then add events from the Tracking page.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-3">
                  {[...shipmentEvents].reverse().map((ev: any) => (
                    <div key={ev.id} className="relative flex gap-3 pl-8">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ev.status_label}</p>
                        {ev.description && <p className="text-xs text-gray-500">{ev.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {ev.location && `📍 ${ev.location} · `}
                          {new Date(ev.event_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {' · '}<span className="capitalize">{ev.source}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ================= TIMELINE ================= */}

      {mode === 'timeline' && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Order Status History
          </h3>

          {timelineLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : timeline.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No status history recorded yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-5">
                {timeline.map((entry: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 z-10">
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.old_label && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{entry.old_label}</span>
                        )}
                        {entry.old_label && <span className="text-gray-400 text-xs">→</span>}
                        <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {entry.new_label || `Status ${entry.new_status}`}
                        </span>
                      </div>
                      {entry.note && <p className="text-xs text-gray-500 mt-1.5">{entry.note}</p>}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(entry.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                        {entry.changed_by_name && ` · by ${entry.changed_by_name}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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


    </div>)}

  )()}

</AppModal>

      </div>

    </div>

  )
}
