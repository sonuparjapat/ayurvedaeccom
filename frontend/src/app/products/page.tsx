'use client'

import { Suspense } from "react"

import ProductsPageContent from "./ProductPagecontent"

export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPageContent />
    </Suspense>
  )
}