'use client'

import { useCallback, useEffect, useState } from 'react'

export interface CompareItem {
  id: number
  name: string
  price: string
  image?: string
  category_name?: string
}

const KEY = 'compare_list'
const MAX = 4
const EV = 'compare-update'

function readList(): CompareItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch { return [] }
}

function writeList(list: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EV))
}

export function useCompare() {
  const [list, setList] = useState<CompareItem[]>([])

  useEffect(() => {
    setList(readList())
    const handler = () => setList(readList())
    window.addEventListener(EV, handler)
    return () => window.removeEventListener(EV, handler)
  }, [])

  const add = useCallback((item: CompareItem) => {
    const current = readList()
    if (current.find(c => c.id === item.id)) return
    if (current.length >= MAX) return
    writeList([...current, item])
  }, [])

  const remove = useCallback((id: number) => {
    writeList(readList().filter(c => c.id !== id))
  }, [])

  const toggle = useCallback((item: CompareItem) => {
    const current = readList()
    if (current.find(c => c.id === item.id)) writeList(current.filter(c => c.id !== item.id))
    else if (current.length < MAX) writeList([...current, item])
  }, [])

  const clear = useCallback(() => writeList([]), [])

  const has = (id: number) => list.some(c => c.id === id)

  return { list, add, remove, toggle, clear, has, count: list.length }
}
