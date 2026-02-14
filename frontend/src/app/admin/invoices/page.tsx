'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

import {
  Eye,
  Download,
  Search,
  RefreshCw,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Mail,
  User,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import { notify } from '@/app/utils/notify'

import DynamicTable from '@/components/table/table'
import AppModal from '@/components/modal/AppModal'


export default function AdminInvoicesPage() {


  /* STATE */

  const [list, setList] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})

  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const limit = 10

  const [search, setSearch] = useState('')

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<any>(null)


  /* LOAD */

  const load = async () => {

    try {

      setLoading(true)

      const res = await axios.get('/admin/invoices', {
        params: {
          page,
          limit,
          search
        }
      })

      setList(res.data.data)
      setMeta(res.data.meta)


    } catch {

      notify.error('Failed to load invoices')

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {
    load()
  }, [page, search])


  const closeModal = () => {

    setOpen(false)
    setCurrent(null)

  }


  /* STATS */
  const stats = [
    {
      label: 'Total Invoices',
      value: meta.total || 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Total Revenue',
      value: `₹${list.reduce((sum, i) => sum + Number(i.total || 0), 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'This Month',
      value: list.filter(i => {
        const invoiceDate = new Date(i.invoice_date)
        const now = new Date()
        return invoiceDate.getMonth() === now.getMonth() && 
               invoiceDate.getFullYear() === now.getFullYear()
      }).length,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      label: 'Avg. Value',
      value: list.length > 0 
        ? `₹${Math.round(list.reduce((sum, i) => sum + Number(i.total || 0), 0) / list.length).toLocaleString('en-IN')}`
        : '₹0',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ]


  /* COLUMNS */

  const columns = [

    { key: 'invoice_no', label: 'Invoice', align: 'center' },

    { key: 'order_id', label: 'Order', align: 'center' },

    { key: 'user_name', label: 'Customer', align: 'left' },

    { key: 'total', label: 'Amount', align: 'right' },

    { key: 'invoice_date', label: 'Date', align: 'center' },

    { key: 'action', label: 'Action', align: 'center' }

  ]


  /* ROWS */

  const rows = list.map((i: any) => ({

    ...i,

    invoice_no: (
      <div className="flex items-center justify-center gap-2">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="font-mono font-bold text-gray-900">{i.invoice_no}</span>
      </div>
    ),

    order_id: (
      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full font-semibold text-sm">
        #{i.order_id}
      </span>
    ),

    user_name: (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
          {i.user_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{i.user_name}</div>
          <div className="text-xs text-gray-500">{i.user_email}</div>
        </div>
      </div>
    ),

    total: (
      <span className="font-bold text-lg text-gray-900">
        ₹{Number(i.total).toLocaleString('en-IN')}
      </span>
    ),

    invoice_date: (
      <div className="flex items-center justify-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">
          {new Date(i.invoice_date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>
    ),


    action: (

      <div className="flex gap-2 justify-center">

        <button
          onClick={() => {
            setCurrent(i)
            setOpen(true)
          }}
          className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          title="View Details"
        >
          <Eye size={16} />
        </button>


        <a
           href={`${process.env.NEXT_PUBLIC_API_URL}/api/admin/invoices/${i?.id}/pdf`}
          target="_blank"
          className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          title="Download PDF"
        >
          <Download size={16} />
        </a>

      </div>

    )

  }))


  /* UI */

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">


      {/* HEADER */}

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Invoice Management
            </h1>
            <p className="text-gray-600 mt-2">Track and manage all generated invoices</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>


      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* SEARCH */}

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            value={search}
            onChange={e => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Search by invoice number, order ID, or customer name..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
          />
        </div>
      </div>


      {/* TABLE */}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No invoices found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
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

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">Page</span>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-md">
                {page}
              </div>
              <span className="text-gray-600 font-medium">of {meta.pages}</span>
            </div>

            <button
              disabled={page === meta.pages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              Next
              <ChevronRight size={18} />
            </button>

          </div>
        </div>

      )}


      {/* MODAL */}

      <AppModal
        open={open}
        onClose={closeModal}
        title="Invoice Details"
      >

        {current && (

          <div className="space-y-6">

            {/* INVOICE HEADER */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium mb-1">Invoice Number</p>
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    <p className="text-2xl font-bold tracking-tight">{current.invoice_no}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 font-medium mb-1">Invoice Date</p>
                  <p className="text-lg font-semibold flex items-center gap-2 justify-end">
                    <Calendar className="w-5 h-5" />
                    {new Date(current.invoice_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-white/20">
                <Package className="w-5 h-5" />
                <span className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-xl text-sm font-bold">
                  ORDER #{current.order_id}
                </span>
              </div>
            </div>

            {/* CUSTOMER INFO */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Customer Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {current.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{current.user_name}</p>
                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{current.user_email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INVOICE SUMMARY */}
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Invoice Summary</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900 text-lg">
                    ₹{Number(current.total).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Tax & Fees</span>
                  <span className="font-bold text-gray-900 text-lg">₹0.00</span>
                </div>
                <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white mt-4 shadow-lg">
                  <span className="font-bold text-lg">Total Amount</span>
                  <span className="font-bold text-2xl">
                    ₹{Number(current.total).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-bold shadow-md hover:shadow-lg"
              >
                Close
              </button>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/admin/invoices/${current.id}/pdf`}
                target="_blank"
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </a>
            </div>

          </div>

        )}

      </AppModal>

    </div>
    </div>

  )

}