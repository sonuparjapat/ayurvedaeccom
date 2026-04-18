export default function downloadFailedCsv(
  rows:any[] = [],
  fileName='failed_rows.csv'
) {
  if (!rows.length) return

  const headers =
    Object.keys(rows[0])

  const csv = [
    headers.join(',')
  ]

  rows.forEach((row) => {
    const values =
      headers.map((key) => {
        const val =
          row[key] ?? ''

        return `"${String(val)
          .replace(/"/g,'""')}"`
      })

    csv.push(
      values.join(',')
    )
  })

  const blob =
    new Blob(
      [csv.join('\n')],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download =
    fileName

  link.click()

  URL.revokeObjectURL(url)
}