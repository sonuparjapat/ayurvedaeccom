export default function DynamicTable({
  columns,
  rows,
  emptyMessage = 'No data found'
}: any) {

  return (

    <div className="bg-white border rounded-xl">

      {/* THIS WRAPPER HANDLES SCROLL */}
      <div className="w-full overflow-x-auto">

        <table className="w-full ">

          {/* HEADER */}
          <thead className="bg-gray-100">

            <tr>

              {columns.map((col: any) => (

                <th
                  key={col.key}
                  className={`
                    p-3 font-medium whitespace-nowrap
                    ${col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'}
                  `}
                >
                  {col.label}
                </th>

              ))}

            </tr>

          </thead>


          {/* BODY */}
          <tbody>

            {rows?.length ? (

              rows.map((row: any, i: number) => (

                <tr
                  key={row.id || i}
                  className="border-t hover:bg-gray-50"
                >

                  {columns.map((col: any) => (

                    <td
                      key={col.key}
                      className={`
                        p-3 whitespace-nowrap
                        ${col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'}
                      `}
                    >
                      {row[col.key] ?? '-'}
                    </td>

                  ))}

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={columns.length}
                  className="p-6 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  )
}