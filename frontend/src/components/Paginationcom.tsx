"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/* ================= COMPONENT ================= */

const Pagination: React.FC<any> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: number[] = [];

    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">

      {/* ================= PREV ================= */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium
          transition
          ${
            currentPage === 1
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-100"
          }
        `}
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      {/* ================= PAGE NUMBERS ================= */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            min-w-[40px] h-[40px] rounded-lg text-sm font-semibold border
            transition
            ${
              page === currentPage
                ? "bg-black text-white border-black"
                : "hover:bg-gray-100"
            }
          `}
        >
          {page}
        </button>
      ))}

      {/* ================= NEXT ================= */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium
          transition
          ${
            currentPage === totalPages
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-100"
          }
        `}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
