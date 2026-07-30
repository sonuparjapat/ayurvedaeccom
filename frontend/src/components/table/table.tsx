export default function DynamicTable({
  columns,
  rows,
  emptyMessage = 'No data found'
}: any) {

  return (

    <div className="bg-white border rounded-xl" style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
      borderColor: 'rgba(99, 102, 241, 0.15)',
      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.08), 0 20px 60px -10px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* THIS WRAPPER HANDLES SCROLL */}
      <div className="w-full overflow-x-auto" style={{ borderRadius: 'inherit' }}>

        <table className="w-full " style={{ borderCollapse: 'separate', borderSpacing: 0 }}>

          {/* HEADER */}
          <thead className="bg-gray-100" style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          }}>

            <tr>

              {columns.map((col: any, idx: number) => (

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
                  style={{
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '14px 18px',
                    position: 'relative',
                    textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    borderTopLeftRadius: idx === 0 ? '10px' : 0,
                    borderTopRightRadius: idx === columns.length - 1 ? '10px' : 0,
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>{col.label}</span>
                  {/* Glossy sheen overlay per header cell */}
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '50%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0))',
                    borderTopLeftRadius: idx === 0 ? '10px' : 0,
                    borderTopRightRadius: idx === columns.length - 1 ? '10px' : 0,
                    pointerEvents: 'none',
                  }} />
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
                  style={{
                    borderTop: '1px solid rgba(99, 102, 241, 0.07)',
                    background: i % 2 === 0
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'rgba(248, 250, 255, 0.7)',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLTableRowElement;
                    el.style.background = 'linear-gradient(90deg, rgba(238,240,255,0.95) 0%, rgba(245,243,255,0.95) 100%)';
                    el.style.boxShadow = 'inset 3px 0 0 #6366f1, 0 2px 12px rgba(99,102,241,0.08)';
                    el.style.transform = 'translateX(1px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLTableRowElement;
                    el.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(248,250,255,0.7)';
                    el.style.boxShadow = 'none';
                    el.style.transform = 'translateX(0)';
                  }}
                >

                  {columns.map((col: any, ci: number) => (

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
                      style={{
                        padding: '13px 18px',
                        color: ci === 0 ? '#3730a3' : '#374151',
                        fontWeight: ci === 0 ? 600 : 400,
                        fontSize: '0.875rem',
                        letterSpacing: ci === 0 ? '-0.01em' : 'normal',
                        borderBottom: i === (rows?.length - 1) ? 'none' : undefined,
                      }}
                    >
                      {row[col.key] ?? '-'}
                    </td>

                  ))}

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '60px 24px',
                    background: 'radial-gradient(ellipse at 50% 40%, rgba(238,240,255,0.55) 0%, transparent 70%)',
                    textAlign: 'center',
                  }}>
                    {/* Dashed circle illustration */}
                    <div style={{
                      width: 96, height: 96, borderRadius: '50%', marginBottom: 20,
                      border: '2.5px dashed #c7d2fe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(238,240,255,0.7), rgba(245,243,255,0.7))',
                      boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
                    }}>
                      <span style={{ fontSize: '2.5rem', opacity: 0.7 }}>🗂️</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', margin: '0 0 6px' }}>
                      {emptyMessage}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: 0, maxWidth: 280 }}>
                      Nothing matches your current filters. Try adjusting your search or filters.
                    </p>
                  </div>
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  )
}