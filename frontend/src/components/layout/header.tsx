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

export function Header() {
  const router = useRouter()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn')
    const userData = localStorage.getItem('user')

    setTimeout(() => {
      setIsLoggedIn(!!loginStatus)
      if (userData) setUser(JSON.parse(userData))
    }, 0)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setUser(null)
    router.push('/')
  }

  const categories = [
    { name: 'Dry Fruits', href: '/category/dry-fruits' },
    { name: 'Ayurvedic Herbs', href: '/category/herbs' },
    { name: 'Dehydrated Foods', href: '/category/dehydrated' },
    { name: 'Tofu Products', href: '/category/tofu' },
  ]

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
              {isLoggedIn ? (
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

              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="hover:text-emerald-600 font-medium"
                >
                  {cat.name}
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <Input
                    placeholder="Search..."
                    className="pl-9"
                  />
                </div>

                {/* Links */}
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 font-medium"
                  >
                    {cat.name}
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
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X />
                </Button>

              </div>

            </motion.div>

          </motion.div>

        )}
      </AnimatePresence>
    </>
  )
}