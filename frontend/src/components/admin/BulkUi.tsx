'use client'

import {
  UploadCloud,
  Loader2
} from 'lucide-react'

export function BulkPageHeader({
  title,
  subtitle,
  icon,
}: any) {
  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        {icon}
        {title}
      </h1>

      <p className="text-sm text-gray-500 mt-1">
        {subtitle}
      </p>
    </div>
  )
}

export function BulkUploadBox({
  file,
  setFile,
}: any) {
  return (
    <label className="block">

      <div className="border-2 border-dashed rounded-2xl p-10 text-center bg-white cursor-pointer hover:bg-gray-50 transition">

        <UploadCloud
          size={30}
          className="mx-auto text-gray-400"
        />

        <p className="mt-2 font-medium">
          {file
            ? file.name
            : 'Click to upload CSV'}
        </p>

        <p className="text-xs text-gray-400">
          Only .csv file supported
        </p>

      </div>

      <input
        hidden
        type="file"
        accept=".csv"
        onChange={(e)=>
          e.target.files?.[0] &&
          setFile(
            e.target.files[0]
          )
        }
      />

    </label>
  )
}

export function BulkExampleCard({
  title,
  lines,
}: any) {
  return (
    <div className="bg-white border rounded-2xl p-5">
      <p className="font-semibold mb-3">
        {title}
      </p>

      <pre className="text-xs whitespace-pre-wrap text-gray-700">
{lines}
      </pre>
    </div>
  )
}

export function BulkSubmitButton({
  loading,
  text,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
    >
      {loading && (
        <Loader2
          size={18}
          className="animate-spin"
        />
      )}

      {text}
    </button>
  )
}

export function BulkSummaryStats({
  report,
}: any) {
  if (!report) return null

  return (
    <div className="grid md:grid-cols-3 gap-4">

      <div className="bg-white border rounded-2xl p-5">
        <p className="text-sm text-gray-500">
          Updated
        </p>

        <h3 className="text-2xl font-bold">
          {report?.summary?.updated || 0}
        </h3>
      </div>

      <div className="bg-white border rounded-2xl p-5">
        <p className="text-sm text-gray-500">
          Failed
        </p>

        <h3 className="text-2xl font-bold">
          {report?.summary?.failed || 0}
        </h3>
      </div>

      <div className="bg-white border rounded-2xl p-5">
        <p className="text-sm text-gray-500">
          Total
        </p>

        <h3 className="text-2xl font-bold">
          {report?.summary?.total || 0}
        </h3>
      </div>

    </div>
  )
}