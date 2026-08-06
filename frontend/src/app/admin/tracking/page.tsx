'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  Truck, Search, RefreshCw, ExternalLink, Plus, MapPin,
  Clock, AlertCircle, CheckCircle2, Package,
} from 'lucide-react'
import AppModal from '@/components/modal/AppModal'

const COURIERS = [
  'Delhivery', 'BlueDart', 'DTDC', 'Shadowfax', 'Ecom Express',
  'FedEx', 'XpressBees', 'Shiprocket', 'Ekart', 'India Post',
  'Gati', 'Professional', 'SmartR',
]

const EVENT_PRESETS = [
  { code: 'MANIFESTED',          label: 'Manifested / Label Created' },
  { code: 'PICKED_UP',           label: 'Picked Up by Courier' },
  { code: 'IN_TRANSIT',          label: 'In Transit' },
  { code: 'OUT_FOR_DELIVERY',    label: 'Out for Delivery' },
  { code: 'DELIVERY_ATTEMPTED',  label: 'Delivery Attempted' },
  { code: 'DELIVERED',           label: 'Delivered' },
  { code: 'RTO',                 label: 'RTO Initiated' },
  { code: 'RTO_IN_TRANSIT',      label: 'RTO In Transit' },
  { code: 'RTO_DELIVERED',       label: 'RTO Delivered' },
  { code: 'MANUAL',              label: 'Custom Update' },
]

function fmtDate(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ code }: { code: string }) {
  const map: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-700',
    OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-700',
    DELIVERY_ATTEMPTED: 'bg-amber-100 text-amber-700',
    RTO: 'bg-red-100 text-red-700',
    RTO_DELIVERED: 'bg-red-100 text-red-700',
    IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    MANIFESTED: 'bg-gray-100 text-gray-600',
  }
  const cls = map[code] || 'bg-gray-100 text-gray-600'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{code.replace(/_/g, ' ')}</span>
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Shipment detail modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [shipment, setShipment] = useState<any>(null)
  const [eventsLoading, setEventsLoading] = useState(false)

  // Add event modal
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ status_code: 'IN_TRANSIT', status_label: '', description: '', location: '', event_time: '' })
  const [addingEvent, setAddingEvent] = useState(false)

  // Update shipment modal
  const [updateOpen, setUpdateOpen] = useState(false)
  const [shipmentForm, setShipmentForm] = useState({ courier_name: '', tracking_number: '', expected_delivery_date: '' })
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/admin/tracking/in-transit?page=${page}&limit=20&search=${search}`)
      setOrders(res.data.data || [])
      setMeta(res.data.meta || {})
    } catch {
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, search])

  const openDetail = async (order: any) => {
    setSelectedOrder(order)
    setDetailOpen(true)
    setEventsLoading(true)
    try {
      const res = await axios.get(`/admin/orders/${order.id}/shipment-events`)
      setEvents(res.data.events || [])
      setShipment(res.data.shipment || null)
    } catch {
      toast.error('Failed to load tracking events')
    } finally {
      setEventsLoading(false)
    }
  }

  const openUpdate = (order: any) => {
    setSelectedOrder(order)
    setShipmentForm({
      courier_name: order.courier_name || '',
      tracking_number: order.tracking_number || '',
      expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '',
    })
    setUpdateOpen(true)
  }

  const handleUpdate = async () => {
    if (!shipmentForm.courier_name || !shipmentForm.tracking_number) {
      return toast.error('Courier and tracking number required')
    }
    setUpdating(true)
    try {
      await axios.put(`/admin/orders/${selectedOrder.id}/shipment`, shipmentForm)
      toast.success('Shipment updated')
      setUpdateOpen(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.status_label) return toast.error('Status label required')
    setAddingEvent(true)
    try {
      await axios.post(`/admin/orders/${selectedOrder.id}/shipment-events`, newEvent)
      toast.success('Event added')
      setAddEventOpen(false)
      setNewEvent({ status_code: 'IN_TRANSIT', status_label: '', description: '', location: '', event_time: '' })
      // Refresh events
      const res = await axios.get(`/admin/orders/${selectedOrder.id}/shipment-events`)
      setEvents(res.data.events || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add event')
    } finally {
      setAddingEvent(false)
    }
  }

  const handlePresetChange = (code: string) => {
    const preset = EVENT_PRESETS.find(p => p.code === code)
    setNewEvent(prev => ({ ...prev, status_code: code, status_label: preset?.label || '' }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck size={24} className="text-emerald-600" /> Shipment Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">All in-transit orders with tracking info. Add events manually or receive them via courier webhook.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Webhook info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <strong className="text-blue-800">Courier Webhook URL:</strong>
        <code className="ml-2 bg-white border border-blue-200 rounded px-2 py-0.5 text-blue-900 font-mono text-xs">
          {process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/courier/webhook/shiprocket
        </code>
        <span className="text-blue-600 ml-2">— Configure this in your Shiprocket / Delhivery dashboard to receive auto-updates.</span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by order ID, AWB, or customer…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <span className="text-sm text-gray-500">{meta.total || 0} shipments in transit</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No in-transit shipments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Courier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">AWB</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Latest Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">EDD</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Attempts</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">#{o.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{o.customer_name}</div>
                      <div className="text-xs text-gray-400">{o.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{o.courier_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{o.tracking_number || '—'}</td>
                    <td className="px-4 py-3">
                      {o.latest_status ? <StatusBadge code={o.latest_status} /> : <span className="text-gray-400 text-xs">No events</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {o.delivery_attempts > 0 ? (
                        <span className="text-amber-600 font-semibold">{o.delivery_attempts}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {o.tracking_url && (
                          <a href={o.tracking_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800" title="Track on courier site">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button onClick={() => openDetail(o)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline">
                          Events
                        </button>
                        <button onClick={() => openUpdate(o)} className="text-emerald-600 hover:text-emerald-800 text-xs font-medium underline">
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-white">← Prev</button>
            <span className="text-gray-500">Page {page} of {meta.pages}</span>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-white">Next →</button>
          </div>
        )}
      </div>

      {/* Shipment Events Modal */}
      <AppModal open={detailOpen} onClose={() => setDetailOpen(false)}
        title={`Tracking Events — Order #${selectedOrder?.id}`} size="lg">
        <div className="space-y-4">
          {shipment && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Courier</p>
                <p className="font-semibold">{shipment.courier_name || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">AWB Number</p>
                <p className="font-mono font-semibold">{shipment.tracking_number || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Expected Delivery</p>
                <p className="font-semibold">
                  {shipment.expected_delivery_date
                    ? new Date(shipment.expected_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              {shipment.tracking_url && (
                <div className="col-span-full">
                  <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                    <ExternalLink size={13} /> Track on {shipment.courier_name} website
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Timeline</h3>
            <button onClick={() => { setAddEventOpen(true) }}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
              <Plus size={14} /> Add Event
            </button>
          </div>

          {eventsLoading ? (
            <div className="py-6 text-center text-gray-400">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="py-6 text-center text-gray-400">
              No tracking events yet. Add the first event manually.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-3">
                {[...events].reverse().map((ev, i) => (
                  <div key={ev.id} className="relative flex gap-4 pl-10">
                    <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow
                      ${i === 0 ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{ev.status_label}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{ev.source}</span>
                      </div>
                      {ev.description && <p className="text-sm text-gray-600 mt-0.5">{ev.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {ev.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {fmtDate(ev.event_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppModal>

      {/* Add Event Modal */}
      <AppModal open={addEventOpen} onClose={() => setAddEventOpen(false)}
        title={`Add Tracking Event — Order #${selectedOrder?.id}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Manually add a tracking event. This is useful while testing before courier API is connected.
            When Shiprocket webhook is configured, events arrive automatically.
          </p>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Event Preset</label>
            <select value={newEvent.status_code} onChange={e => handlePresetChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              {EVENT_PRESETS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Status Label *</label>
            <input value={newEvent.status_label} onChange={e => setNewEvent(p => ({ ...p, status_label: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Reached Mumbai HUB" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <input value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Additional details" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Location</label>
              <input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Pune HUB" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Event Time (optional)</label>
              <input type="datetime-local" value={newEvent.event_time}
                onChange={e => setNewEvent(p => ({ ...p, event_time: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAddEventOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddEvent} disabled={addingEvent}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {addingEvent ? 'Adding…' : 'Add Event'}
            </button>
          </div>
        </div>
      </AppModal>

      {/* Update Shipment Modal */}
      <AppModal open={updateOpen} onClose={() => setUpdateOpen(false)}
        title={`Update Shipment — Order #${selectedOrder?.id}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Courier Partner *</label>
            <select value={shipmentForm.courier_name}
              onChange={e => setShipmentForm(p => ({ ...p, courier_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Select courier…</option>
              {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">AWB / Tracking Number *</label>
            <input value={shipmentForm.tracking_number}
              onChange={e => setShipmentForm(p => ({ ...p, tracking_number: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter AWB number" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Expected Delivery Date</label>
            <input type="date" value={shipmentForm.expected_delivery_date}
              onChange={e => setShipmentForm(p => ({ ...p, expected_delivery_date: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <p className="text-xs text-gray-400">Tracking URL will be auto-generated based on the courier selected.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setUpdateOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleUpdate} disabled={updating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {updating ? 'Updating…' : 'Update Shipment'}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
