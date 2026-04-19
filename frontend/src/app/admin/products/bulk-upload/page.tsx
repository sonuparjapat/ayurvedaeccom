'use client'

import { useState,useEffect, useRef } from 'react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import {
  UploadCloud,
  FileSpreadsheet,
  FileArchive,
  Download,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

export default function BulkUploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
const [result, setResult] =
  useState<any>(null)

const [importing, setImporting] =
  useState(false)

const [finalReport, setFinalReport] =
  useState<any>(null)

const [validationJobId, setValidationJobId] =
  useState<number | null>(null)
 const pollRef = useRef<any>(null)
const [importJobId, setImportJobId] =
  useState<number | null>(null)
const [progress, setProgress] = useState(0)
const [progressText, setProgressText] =
  useState('')
    useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])
 const downloadTemplate = async () => {
    try {
      const res = await axios.get('/admin/products/bulk-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-products-template.csv'
      a.click()
      toast.success('Template downloaded')
    } catch {
      toast.error('Template download failed')
    }
  }
  const runFakeProgress = (
  type:'validate'|'import'
) => {
  let value = 0

  setProgress(0)

  const texts =
    type === 'validate'
    ? [
        'Uploading files...',
        'Reading CSV...',
        'Checking rows...',
        'Preparing report...'
      ]
    : [
        'Uploading images...',
        'Importing products...',
        'Saving data...',
        'Finalizing report...'
      ]

  let step = 0

  setProgressText(texts[0])

  const timer = setInterval(() => {
    value += Math.floor(
      Math.random() * 12
    ) + 4

    if (value > 92)
      value = 92

    setProgress(value)

    if (
      step < texts.length - 1 &&
      value > (step + 1) * 22
    ) {
      step++
      setProgressText(
        texts[step]
      )
    }

  }, 500)

  return timer
}
 const pollJob = (id:number, type:'validate'|'import') => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get('/admin/jobs?page=1&limit=100')
        const rows = res?.data?.data || []
        const job = rows.find((x:any) => x.id === id)
        if (!job) return

        const currentProgress = Number(job.progress || 0)
        setProgress(currentProgress)

        if (type === 'validate') {
          if (currentProgress < 20) setProgressText('Uploading files...')
          else if (currentProgress < 50) setProgressText('Reading CSV...')
          else if (currentProgress < 90) setProgressText('Validating rows...')
          else setProgressText('Preparing report...')
        } else {
          if (currentProgress < 20) setProgressText('Starting import...')
          else if (currentProgress < 50) setProgressText('Uploading images...')
          else if (currentProgress < 90) setProgressText('Saving products...')
          else setProgressText('Finalizing import...')
        }

        if (job.status === 'completed') {
          clearInterval(pollRef.current)
          pollRef.current = null

          setProgress(100)
          setProgressText(type === 'validate' ? 'Validation completed' : 'Import completed')

          if (type === 'validate') {
            setResult({
              summary: {
                totalRows: job.result?.totalRows || 0,
                validRows: job.result?.validRows || 0,
                failedRows: job.result?.failedRows || 0,
              },
              errors: job.result?.errors || []
            })
          } else {
            setFinalReport({
              summary: {
                imported: job.result?.imported || 0,
                failed: job.result?.failed?.length || 0,
                total: job.result?.total || 0,
              },
              failed: job.result?.failed || []
            })
          }

          toast.success(type === 'validate' ? 'Validation completed' : 'Import completed')

          setTimeout(() => {
            setProgress(0)
            setProgressText('')
          }, 2500)
        }

        if (job.status === 'failed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          toast.error(job.error_text || 'Job failed')
          setProgress(0)
          setProgressText('')
        }

      } catch (err) {
        console.error(err)
      }
    }, 2000)
  }

 const submit = async () => {
    if (!csvFile) return toast.error('Please upload CSV file')

    try {
      setLoading(true)
      setResult(null)
      setFinalReport(null)
      setValidationJobId(null)
      setProgress(5)
      setProgressText('Uploading files...')

      const form = new FormData()
      form.append('file', csvFile)
      if (zipFile) form.append('imagesZip', zipFile)

      const res = await axios.post('/admin/products/bulk-upload', form)
      const jobId = res?.data?.data?.jobId
      setValidationJobId(jobId)
      toast.success(res?.data?.message || 'Validation started')
      pollJob(jobId, 'validate')
    } catch (err:any) {
      setProgress(0)
      setProgressText('')
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }
 const downloadCategoryList = async () => {
    try {
      const res = await axios.get('/admin/products/category-template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'categories-master.csv'
      a.click()
      toast.success('Categories downloaded')
    } catch {
      toast.error('Download failed')
    }
  }

  const confirmImport = async () => {
    if (!validationJobId) return toast.error('Please validate first')

    try {
      setImporting(true)
      setProgress(5)
      setProgressText('Starting import...')

      const res = await axios.post('/admin/products/bulk-import', {
        validationJobId
n      })

      const jobId = res?.data?.data?.jobId
      toast.success(res?.data?.message || 'Import started')
      pollJob(jobId, 'import')
    } catch (err:any) {
      setProgress(0)
      setProgressText('')
      toast.error(err?.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }
const downloadFailedCsv = (
  rows:any[] = []
) => {
  if (!rows.length) {
    return toast.error(
      'No failed rows found'
    )
  }

  const headers =
    ['row','sku','error']

  const csvRows = rows.map(
    (item:any) => [
      item.row,
      item.sku,
      item.error ||
      item.errors?.join(' | ') ||
      ''
    ]
  )

  const csv =
    [
      headers.join(','),
      ...csvRows.map(
        (r:any) =>
          r.map((x:any)=>
            `"${String(x).replace(/"/g,'""')}"`
          ).join(',')
      )
    ].join('\n')

  const blob =
    new Blob(
      [csv],
      { type:'text/csv;charset=utf-8;' }
    )

  const url =
    window.URL.createObjectURL(blob)

  const a =
    document.createElement('a')

  a.href = url
  a.download =
    'failed-rows.csv'

  a.click()

  window.URL.revokeObjectURL(url)
}
  function GuideCard({
  title,
  desc,
}: any) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold text-sm">
        {title}
      </h3>

      <p className="text-xs text-gray-500 mt-1">
        {desc}
      </p>
    </div>
  )
}
function StatCard({
  title,
  value,
}: any) {
  return (
    <div className="bg-white border rounded-2xl p-5">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h3 className="text-2xl font-bold mt-1">
        {value}
      </h3>
    </div>
  )
}

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold">
            Bulk Product Upload
          </h1>

          <p className="text-sm text-gray-500">
            Import hundreds of products in one go
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          <Download size={18} />
          Download Template
        </button>
<button
  onClick={downloadCategoryList}
  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
>
  <Download size={18} />
  Categories CSV
</button>
      </div>
      {progress > 0 && (

<div className="bg-white border rounded-2xl p-4 space-y-3">

  <div className="flex justify-between text-sm">

    <span>
      {progressText}
    </span>

    <span>
      {progress}%
    </span>

  </div>

  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

    <div
      className="h-full bg-emerald-600 transition-all duration-500"
      style={{
        width: `${progress}%`
      }}
    />

  </div>

  <p className="text-xs text-gray-400">
    Please do not close this page while processing.
  </p>

</div>

)}
{/* ================= GUIDE SECTION ================= */}

<div className="bg-white border rounded-2xl p-6 space-y-6">

  <div>
    <h2 className="text-lg font-bold">
      How Bulk Upload Works
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      Follow the examples below for smooth import.
    </p>
  </div>

  {/* Steps */}
  <div className="grid md:grid-cols-3 gap-4">

    <GuideCard
      title="1. Prepare CSV"
      desc="Download template and fill product details."
    />

    <GuideCard
      title="2. Prepare ZIP"
      desc="Rename images using SKU format."
    />

    <GuideCard
      title="3. Upload & Import"
      desc="Upload files and start bulk process."
    />

  </div>

  {/* Examples */}
  <div className="grid lg:grid-cols-2 gap-6">

    {/* CSV Example */}
    <div className="border rounded-xl overflow-hidden">

      <div className="px-4 py-3 bg-gray-50 font-semibold text-sm">
        CSV Example
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">name</th>
              <th className="p-2 text-left">sku</th>
              <th className="p-2 text-left">price</th>
              <th className="p-2 text-left">inventory</th>
              <th className="p-2 text-left">category</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-2">iPhone 15</td>
              <td className="p-2">APL001</td>
              <td className="p-2">79999</td>
              <td className="p-2">10</td>
              <td className="p-2">Mobiles</td>
            </tr>

            <tr className="border-t">
              <td className="p-2">Nike Shoes</td>
              <td className="p-2">NK101</td>
              <td className="p-2">2999</td>
              <td className="p-2">25</td>
              <td className="p-2">Shoes</td>
            </tr>
          </tbody>

        </table>
      </div>

    </div>

    {/* ZIP Example */}
    <div className="border rounded-xl overflow-hidden">

      <div className="px-4 py-3 bg-gray-50 font-semibold text-sm">
        ZIP Images Example
      </div>

      <div className="p-4 text-sm text-gray-700 space-y-2 font-mono">

        <div>images.zip</div>
        <div className="ml-4">APL001-1.jpg</div>
        <div className="ml-4">APL001-2.jpg</div>
        <div className="ml-4">NK101-1.jpg</div>
        <div className="ml-4">NK101-2.jpg</div>

      </div>

    </div>

  </div>

  {/* Notes */}
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">

    <div>• CSV file is required.</div>
    <div>• ZIP file is optional.</div>
    <div>• Best image naming: SKU-1.jpg, SKU-2.jpg</div>
    <div>• Invalid rows will be skipped with detailed errors.</div>

  </div>

</div>
      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* CSV */}
        <UploadCard
          title="Upload CSV File"
          icon={<FileSpreadsheet size={20} />}
          file={csvFile}
          accept=".csv"
onChange={(f: File) => {
  setCsvFile(f)
  setResult(null)
  setFinalReport(null)
  setValidationJobId(null)
}}
          hint="Required • Use downloaded template"
        />
        

        {/* ZIP */}
        <UploadCard
          title="Upload Images ZIP"
          icon={<FileArchive size={20} />}
          file={zipFile}
          accept=".zip"
         onChange={(f: File) => {
  setZipFile(f)
  setResult(null)
  setFinalReport(null)
  setValidationJobId(null)
}}
          hint="Optional • Images named SKU-1.jpg"
        />

      </div>

      {/* Info Box */}
      <div className="bg-white border rounded-2xl p-5 space-y-3">

        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={18} />
          Upload Rules
        </div>

        <ul className="text-sm text-gray-600 space-y-2 list-disc ml-5">
          <li>CSV file is required.</li>
          <li>ZIP file is optional for images.</li>
          <li>Recommended image naming: SKU-1.jpg, SKU-2.jpg</li>
          <li>Invalid rows will be skipped with detailed errors.</li>
          <li>Existing product flow remains unchanged.</li>
        </ul>

      </div>
{/* ================= RESULT ================= */}

{result && (

<div className="space-y-6">

  {/* Summary */}
  <div className="grid md:grid-cols-3 gap-4">

    <StatCard
      title="Total Rows"
      value={result?.summary?.totalRows || 0}
    />

    <StatCard
      title="Valid Rows"
      value={result?.summary?.validRows || 0}
    />

    <StatCard
      title="Failed Rows"
      value={result?.summary?.failedRows || 0}
    />

  </div>

  {/* Errors */}
  {result?.errors?.length > 0 && (

    <div className="bg-white border rounded-2xl overflow-hidden">

      <div className="px-4 py-3 border-b font-semibold">
        Validation Errors
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Row</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Issues</th>
            </tr>
          </thead>

          <tbody>

            {result.errors.map(
              (item:any, i:number) => (

              <tr
                key={i}
                className="border-t"
              >
                <td className="p-3">
                  {item.row}
                </td>

                <td className="p-3">
                  {item.sku}
                </td>

                <td className="p-3 text-red-600">
                  {item.errors.join(', ')}
                </td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )}
  {result?.errors?.length > 0 && (

<button
  onClick={() =>
    downloadFailedCsv(
      result.errors
    )
  }
  className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-medium"
>
  Download Failed Rows CSV
</button>

)}

</div>

)}

{result &&
validationJobId &&
result?.summary?.validRows > 0&& (

<div className="pt-2">
  <div className="text-sm text-emerald-700 mb-3">
    Files already validated. Import will use same uploaded files.
  </div>
  <button
    onClick={confirmImport}
    disabled={importing}
    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
  >
    {importing && (
      <Loader2
        size={18}
        className="animate-spin"
      />
    )}

   Import Valid Rows
  </button>

</div>

)}

{finalReport && (

<div className="space-y-6 pt-4">

  <div className="grid md:grid-cols-3 gap-4">

    <StatCard
      title="Imported"
      value={
        finalReport?.summary?.imported || 0
      }
    />

    <StatCard
      title="Failed"
      value={
        finalReport?.summary?.failed || 0
      }
    />

    <StatCard
      title="Total"
      value={
        finalReport?.summary?.total || 0
      }
    />

  </div>

  {finalReport?.failed?.length > 0 && (

  <div className="bg-white border rounded-2xl overflow-hidden">

    <div className="px-4 py-3 border-b font-semibold">
      Failed Rows
    </div>

    <div className="overflow-x-auto">

      <table className="w-full text-sm">

        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">
              Row
            </th>

            <th className="p-3 text-left">
              SKU
            </th>

            <th className="p-3 text-left">
              Error
            </th>
          </tr>
        </thead>

        <tbody>

          {finalReport.failed.map(
            (item:any,i:number) => (

            <tr
              key={i}
              className="border-t"
            >
              <td className="p-3">
                {item.row}
              </td>

              <td className="p-3">
                {item.sku}
              </td>

              <td className="p-3 text-red-600">
                {item.error}
              </td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>

  )}
{finalReport?.failed?.length > 0 && (

<button
  onClick={() =>
    downloadFailedCsv(
      finalReport.failed
    )
  }
  className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-medium"
>
  Download Failed Rows CSV
</button>

)}
</div>

)}
      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && (
          <Loader2
            size={18}
            className="animate-spin"
          />
        )}

        <UploadCloud size={18} />
      Validate Files
      </button>

    </div>
  )
}

function UploadCard({
  title,
  icon,
  file,
  accept,
  onChange,
  hint,
}: any) {
  const [dragging, setDragging] =
    useState(false)

  const handleDrop = (
    e:any
  ) => {
    e.preventDefault()
    setDragging(false)

    const dropped =
      e.dataTransfer.files?.[0]

    if (dropped) {
      onChange(dropped)
    }
  }

  return (

    <label className="block">

      <div className="flex items-center gap-2 font-semibold mb-3">
        {icon}
        {title}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() =>
          setDragging(false)
        }
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer
          ${
            dragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 bg-white'
          }
        `}
      >

        <div className="space-y-2">

          <div className="text-sm font-medium">
            {file
              ? file.name
              : 'Drag & Drop file here'}
          </div>

          <div className="text-xs text-gray-500">
            or click to browse
          </div>

        </div>

      </div>

      <p className="text-xs text-gray-400 mt-3">
        {hint}
      </p>

      <input
        hidden
        type="file"
        accept={accept}
        onChange={(e) =>
          e.target.files?.[0] &&
          onChange(
            e.target.files[0]
          )
        }
      />

    </label>
  )
}