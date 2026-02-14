'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {

  open: boolean
  onClose: () => void

  title?: string
  description?: string

  footer?: ReactNode

  width?: string

  children: ReactNode
}

export default function AppModal({
  open,
  onClose,
  title,
  description,
  footer,
  width = 'max-w-xl',
  children,
  handleclose,
}: Props) {

  if (!open) return null


  return (

    <div
      className="
        fixed inset-0 z-50
        bg-black/50
        flex justify-center items-center
        p-3
      "
    >

      <div
        className={`
          bg-white rounded-xl
          w-full ${width}
          max-h-[90vh]
          flex flex-col
        `}
      >


        {/* HEADER */}

        <div className="p-4 border-b flex justify-between">

          <div>

            <h3 className="font-semibold text-lg">
              {title}
            </h3>

            {description && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}

          </div>


          <button
            onClick={onClose}
            className="hover:text-black text-gray-500"
          >
            <X size={20} />
          </button>

        </div>


        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-4">

          {children}

        </div>


        {/* FOOTER */}

        {footer && (

          <div className="p-4 border-t bg-gray-50">

            {footer}

          </div>

        )}

      </div>

    </div>
  )
}