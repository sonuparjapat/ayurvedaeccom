'use client'

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

interface AdminPaginationProps {
  page: number
  pages: number
  total: number
  limit: number
  onChange: (page: number) => void
}

/**
 * Builds the page-number window to display.
 * Always shows first + last; shows up to 5 pages around current; inserts null for gaps.
 * e.g. page=10 of 50 → [1, null, 8, 9, 10, 11, 12, null, 50]
 */
function buildWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 9) return Array.from({ length: pages }, (_, i) => i + 1)

  const WING = 2 // pages on each side of current
  const inner = new Set<number>()
  for (let i = Math.max(2, page - WING); i <= Math.min(pages - 1, page + WING); i++) inner.add(i)

  const nums: (number | null)[] = [1]

  if (!inner.has(2)) nums.push(null)            // left gap
  inner.forEach(n => nums.push(n))
  if (!inner.has(pages - 1)) nums.push(null)    // right gap

  nums.push(pages)
  return nums
}

export default function AdminPagination({ page, pages, total, limit, onChange }: AdminPaginationProps) {
  if (pages <= 1) return null

  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)
  const window = buildWindow(page, pages)

  const btn = (
    label: React.ReactNode,
    target: number,
    disabled: boolean,
    title?: string,
  ) => (
    <button
      key={title ?? String(target)}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center min-w-[34px] h-[34px] px-2 rounded-lg border text-sm font-medium transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
      `}
    >
      {label}
    </button>
  )

  return (
    <div className="px-4 py-3 border-t flex flex-wrap items-center justify-between gap-3">
      {/* Info */}
      <p className="text-xs text-gray-500 shrink-0">
        Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-semibold text-gray-700">{total}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* First */}
        {btn(<ChevronsLeft size={15} />, 1, page <= 1, 'First page')}
        {/* Prev */}
        {btn(<ChevronLeft  size={15} />, page - 1, page <= 1, 'Previous page')}

        {/* Page numbers / ellipsis */}
        {window.map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`
                min-w-[34px] h-[34px] px-2 rounded-lg border text-sm font-semibold transition-colors
                ${n === page
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'hover:bg-gray-100'}
              `}
            >
              {n}
            </button>
          )
        )}

        {/* Next */}
        {btn(<ChevronRight  size={15} />, page + 1, page >= pages, 'Next page')}
        {/* Last */}
        {btn(<ChevronsRight size={15} />, pages,    page >= pages, 'Last page')}
      </div>
    </div>
  )
}
