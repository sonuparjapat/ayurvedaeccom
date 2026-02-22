'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CartSheet } from '@/components/cart/cart-sheet'
import {
  Search,
  User,
  Menu,
  X,
  Heart,
  Phone,
  Mail,
  LogOut,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useRef } from 'react'
import axios from '@/lib/axios'
import useDebounce from '../debounce'
export function Header() {
  const router = useRouter()
const {loginuserdata,logout}=useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
const {categoriesdata} = useAuth()
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearch =useDebounce(searchQuery, 2000)

const [searchResults, setSearchResults] = useState([])
const [searchLoading, setSearchLoading] = useState(false)
const [showResults, setShowResults] = useState(false)
const searchProducts = async (query) => {
  if (!query.trim()) {
    setSearchResults([])
    setShowResults(false)
    return
  }

  try {
    setSearchLoading(true)

    const res = await axios.get(`/shop/public?search=${query}`)

   

    setSearchResults(res?.data?.products || [])
    setShowResults(true)

  } catch (err) {
    console.error('Search Error:', err)
  } finally {
    setSearchLoading(false)
  }
}
useEffect(()=>{
searchProducts(debouncedSearch)
},[debouncedSearch])
  const handleLogout = () => {
   logout("users")
  }




  return (
    <>
      {/* Top Bar */}
      <div className="bg-emerald-700 text-white text-xs sm:text-sm py-2">
        <div className="container mx-auto px-3 sm:px-4 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">

          {/* Contact */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1">
              <Phone size={14} />
              <span>+91 98765 43210</span>
            </div>

            <div className="flex items-center gap-1">
              <Mail size={14} />
              <span>info@ayurvedesifoods.com</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge className="bg-emerald-600 text-white text-xs">
              100% Natural
            </Badge>

            <Badge className="bg-emerald-600 text-white text-xs">
              Free Shipping ₹500+
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4">

          {/* Main Row */}
          <div className="flex items-center justify-between h-16 gap-2">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 min-w-fit">

              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">
                  A
                </span>
              </div>

              <div className="flex flex-col leading-tight">

                <h1 className="text-sm sm:text-lg md:text-xl font-bold">
                  AyurVeda
                </h1>

                <p className="text-[9px] sm:text-xs text-emerald-600">
                  Desi Foods
                </p>

              </div>

            </Link>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">

              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                <Input
  placeholder="Search products..."
  className="pl-9 text-sm"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }}
/>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-3">

              {/* Search Btn */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search size={20} />
              </Button>

              {/* Wishlist */}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/wishlist">
                  <Heart size={20} />
                </Link>
              </Button>

              {/* Account */}
              {loginuserdata?.id ? (
                <>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/account">
                      <User size={20} />
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                  >
                    <LogOut size={20} />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/auth">
                    <User size={20} />
                  </Link>
                </Button>
              )}

              <CartSheet />

              {/* Menu */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </Button>

            </div>
          </div>

          {/* Desktop Nav */}
       <nav className="hidden md:flex border-t">
  <div className="flex gap-6 py-3 text-sm">

    {categoriesdata?.rows?.map((cat:any) => (
      <Link
        key={cat?.id}
        href={`/category/${cat?.id}`} // ✅ FIX
        className="hover:text-emerald-600 font-medium"
      >
        {cat?.name}
      </Link>
    ))}

    <Link href="/blog">Blog</Link>
    <Link href="/about">About Us</Link>

  </div>
</nav>

        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (

            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="md:hidden bg-white border-t overflow-hidden"
            >

              <div className="px-4 py-4 space-y-4">

                {/* Search */}
                {/* <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                 <Input
  autoFocus
  placeholder="Search..."
  className="flex-1"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }}
/>
                </div> */}

                {/* Links */}
                {categoriesdata?.rows.map((cat) => (
                  <Link
                    key={cat?.name}
                  href={`/category/${cat?.id}`} 
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 font-medium"
                  >
                    {cat?.name}
                  </Link>
                ))}

                <Link href="/blog">Blog</Link>
                <Link href="/about">About Us</Link>

              </div>

            </motion.div>

          )}
        </AnimatePresence>

      </header>

      {/* Mobile Search */}
      <AnimatePresence>
        {isSearchOpen && (

          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex justify-center pt-24 px-3"
            onClick={() => setIsSearchOpen(false)}
          >

            <motion.div
              className="bg-white w-full max-w-lg rounded-lg p-4"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="flex gap-3 items-center">

                <Search size={22} />

            <Input
  autoFocus
  placeholder="Search..."
  className="flex-1"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  // onKeyDown={(e) => {
  //   if (e.key === 'Enter' && searchQuery.trim()) {
  //     router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
  //     setIsSearchOpen(false)
  //     setSearchQuery('')
  //   }
  // }}
/>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X />
                </Button>

              </div>
{searchLoading && (
  <div className="py-4 text-center text-sm text-gray-500">
    Searching...
  </div>
)}

{/* Results */}
{showResults && !searchLoading && (

  <div className="mt-3 max-h-[60vh] overflow-y-auto space-y-2">

    {searchResults.length == 0 && (
      <div className="py-4 text-center text-sm text-gray-500">
        No products found
      </div>
    )}

    {searchResults.map((item:any) => (

      <div
        key={item.id}
        onClick={() => {
          router.push(`/product/${item.id}`)

          setIsSearchOpen(false)
          setSearchQuery('')
          setSearchResults([])
          setShowResults(false)
        }}
        className="flex gap-3 p-2 border rounded-lg hover:bg-emerald-50 cursor-pointer transition"
      >

        <img
          src={item?.images?.[0] || '/placeholder.png'}
          className="w-14 h-14 rounded object-cover"
        />

        <div className="flex-1">

          <h4 className="text-sm font-medium line-clamp-1">
            {item.name}
          </h4>

          <p className="text-xs text-gray-500">
            {item.category_name}
          </p>

          <div className="flex gap-2 mt-1">

            <span className="text-emerald-600 font-semibold text-sm">
              ₹{item.price}
            </span>

            {item.compareprice && (
              <span className="text-xs line-through text-gray-400">
                ₹{item.compareprice}
              </span>
            )}

          </div>

        </div>

      </div>
    ))}

  </div>
)}
            </motion.div>

          </motion.div>

        )}
      </AnimatePresence>
    </>
  )
}