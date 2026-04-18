'use client'

import { useState } from 'react'
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
  const [csvFile, setCsvFile] =
    useState<File | null>(null)

  const [zipFile, setZipFile] =
    useState<File | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [importing, setImporting] =
    useState(false)

  const [progress, setProgress] =
    useState(0)

  const [progressText, setProgressText] =
    useState('')

  const [result, setResult] =
    useState<any>(null)

  const [finalReport, setFinalReport] =
    useState<any>(null)

  const [validated, setValidated] =
    useState(false)

  const downloadTemplate =
    async () => {
      try {
        const res =
          await axios.get(
            '/admin/products/bulk-template',
            {
              responseType:'blob'
            }
          )

        const url =
          window.URL.createObjectURL(
            new Blob([res.data])
          )

        const a =
          document.createElement('a')

        a.href = url
        a.download =
          'bulk-products-template.csv'

        a.click()

        toast.success(
          'Template downloaded'
        )

      } catch {
        toast.error(
          'Template download failed'
        )
      }
    }

  const runFakeProgress = (
    type:'validate'|'import'
  ) => {

    let value = 0

    const labels =
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

    setProgress(5)
    setProgressText(
      labels[0]
    )

    const timer =
      setInterval(() => {

      value +=
        Math.floor(
          Math.random() * 8
        ) + 5

      if (value > 90)
        value = 90

      setProgress(value)

      if (
        step <
        labels.length - 1 &&
        value >
        (step + 1) * 22
      ) {
        step++
        setProgressText(
          labels[step]
        )
      }

    }, 500)

    return timer
  }

  const finishProgress = (
    text:string
  ) => {

    setProgress(100)
    setProgressText(text)

    setTimeout(() => {
      setProgress(0)
      setProgressText('')
    }, 1200)
  }

  const pollJob = (
    id:number,
    type:'validate'|'import'
  ) => {

    const timer =
      setInterval(
      async () => {

      try {

        const res =
          await axios.get(
            '/admin/jobs?page=1&limit=100'
          )

        const rows =
          res?.data?.data || []

        const job =
          rows.find(
            (x:any) =>
              x.id === id
          )

        if (!job) return

        if (
          job.status ===
          'completed'
        ) {

          clearInterval(timer)

          if (
            type ===
            'validate'
          ) {

            setResult({
              summary:{
                totalRows:
                  job.result?.totalRows || 0,
                validRows:
                  job.result?.validRows || 0,
                failedRows:
                  job.result?.failedRows || 0
              },
              errors:
                job.result?.errors || []
            })

            setValidated(
              (job.result?.failedRows || 0) === 0 &&
              (job.result?.validRows || 0) > 0
            )

          } else {

            setFinalReport({
              summary:{
                imported:
                  job.result?.imported || 0,
                failed:
                  job.result?.failed?.length || 0,
                total:
                  job.result?.total || 0
              },
              failed:
                job.result?.failed || []
            })

          }

          finishProgress(
            type === 'validate'
            ? 'Validation completed'
            : 'Import completed'
          )

          toast.success(
            type === 'validate'
            ? 'Validation completed'
            : 'Import completed'
          )
        }

        if (
          job.status ===
          'failed'
        ) {

          clearInterval(timer)

          setProgress(0)
          setProgressText('')

          toast.error(
            job.error_text ||
            'Job failed'
          )
        }

      } catch {}

    }, 3000)
  }

  const submit =
    async () => {

    if (!csvFile) {
      return toast.error(
        'Please upload CSV file'
      )
    }

    let timer:any = null

    try {

      setLoading(true)
      setResult(null)
      setValidated(false)

      const form =
        new FormData()

      form.append(
        'file',
        csvFile
      )

      if (zipFile) {
        form.append(
          'imagesZip',
          zipFile
        )
      }

      timer =
        runFakeProgress(
          'validate'
        )

      const res =
        await axios.post(
          '/admin/products/bulk-upload',
          form
        )

      clearInterval(timer)

      const jobId =
        res?.data?.data?.jobId

      toast.success(
        'Validation started'
      )

      pollJob(
        jobId,
        'validate'
      )

    } catch (err:any) {

      if (timer)
        clearInterval(timer)

      setProgress(0)
      setProgressText('')

      toast.error(
        err?.response?.data?.message ||
        'Upload failed'
      )

    } finally {

      setLoading(false)
    }
  }

  const confirmImport =
    async () => {

    if (!csvFile) {
      return toast.error(
        'CSV file missing'
      )
    }

    let timer:any = null

    try {

      setImporting(true)

      const form =
        new FormData()

      form.append(
        'file',
        csvFile
      )

      if (zipFile) {
        form.append(
          'imagesZip',
          zipFile
        )
      }

      timer =
        runFakeProgress(
          'import'
        )

      const res =
        await axios.post(
          '/admin/products/bulk-import',
          form
        )

      clearInterval(timer)

      const jobId =
        res?.data?.data?.jobId

      toast.success(
        'Import started'
      )

      pollJob(
        jobId,
        'import'
      )

    } catch (err:any) {

      if (timer)
        clearInterval(timer)

      setProgress(0)
      setProgressText('')

      toast.error(
        err?.response?.data?.message ||
        'Import failed'
      )

    } finally {

      setImporting(false)
    }
  }

  return (
    <div>
      Your full existing UI JSX stays SAME below this point.
    </div>
  )
}