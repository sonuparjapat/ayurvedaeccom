'use client'

import { useState, useEffect } from 'react'
import { X, ShieldCheck } from 'lucide-react'

export function AyushDisclaimer() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const v = sessionStorage.getItem('ayush_disclaimer_dismissed')
    if (!v) setDismissed(false)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('ayush_disclaimer_dismissed', '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="relative w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center z-50">
      <div className="max-w-5xl mx-auto flex items-start gap-2 text-xs text-amber-800 justify-center">
        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-amber-600" />
        <p className="leading-relaxed">
          <strong>Ayush Disclaimer:</strong> These products are Ayurvedic formulations. Results may vary.
          Not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified Ayurvedic
          practitioner before use if you are pregnant, nursing, or on medication. Keep out of reach of children.
          For external use products, do a patch test before use.
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss disclaimer"
          className="shrink-0 text-amber-600 hover:text-amber-900 ml-1 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
