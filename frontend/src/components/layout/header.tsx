'use client'
 
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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
  Leaf,
  ChevronDown,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import axios from '@/lib/axios'
import useDebounce from '../debounce'
 
export function Header() {
  const router = useRouter()
  const { loginuserdata, logout, categoriesdata } = useAuth()
 
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const searchRef = useRef(null)
 
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
 
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
 
  useEffect(() => {
    searchProducts(debouncedSearch)
  }, [debouncedSearch])
 
  const handleLogout = () => logout('users')
 
  const topBarVariants = {
    initial: { y: -40, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  }
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
 
        .header-root {
          --brand-forest: #1a3a2a;
          --brand-moss: #2d5a3d;
          --brand-sage: #4a7c5e;
          --brand-mint: #e8f5ee;
          --brand-cream: #faf8f3;
          --brand-gold: #c9a84c;
          --brand-gold-light: #f0e4bc;
          --brand-bark: #6b4c2a;
          font-family: 'DM Sans', sans-serif;
        }
 
        .top-bar {
          background: var(--brand-forest);
          color: rgba(255,255,255,0.85);
          font-size: 11.5px;
          letter-spacing: 0.04em;
          padding: 8px 0;
          font-family: 'DM Sans', sans-serif;
        }
 
        .top-bar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
 
        .top-bar-contact {
          display: flex;
          gap: 20px;
          align-items: center;
        }
 
        .top-bar-contact a {
          display: flex;
          align-items: center;
          gap: 5px;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          transition: color 0.2s;
        }
 
        .top-bar-contact a:hover {
          color: var(--brand-gold);
        }
 
        .top-bar-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
 
        .top-badge {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.85);
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 10.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }
 
        .top-badge.gold {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.35);
          color: var(--brand-gold);
        }
 
        /* Main Header */
        .main-header {
          background: var(--brand-cream);
          border-bottom: 1px solid rgba(26,58,42,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: box-shadow 0.3s, background 0.3s;
        }
 
        .main-header.scrolled {
          background: rgba(250,248,243,0.97);
          box-shadow: 0 4px 24px rgba(26,58,42,0.08);
          backdrop-filter: blur(12px);
        }
 
        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
 
        .header-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 16px;
        }
 
        /* Logo */
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
 
        .logo-icon {
          width: 44px;
          height: 44px;
          background: var(--brand-forest);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
 
        .logo-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--brand-moss) 0%, var(--brand-forest) 100%);
        }
 
        .logo-icon svg {
          position: relative;
          z-index: 1;
          color: var(--brand-gold);
        }
 
        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
 
        .logo-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--brand-forest);
          letter-spacing: 0.01em;
        }
 
        .logo-sub {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--brand-sage);
          margin-top: 1px;
        }
 
        /* Desktop Search */
        .search-desktop {
          flex: 1;
          max-width: 480px;
          margin: 0 24px;
          position: relative;
        }
 
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
 
        .search-input {
          width: 100%;
          height: 42px;
          border-radius: 100px;
          border: 1.5px solid rgba(26,58,42,0.15);
          background: white;
          padding: 0 44px 0 44px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: var(--brand-forest);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
 
        .search-input::placeholder {
          color: rgba(26,58,42,0.4);
        }
 
        .search-input:focus {
          border-color: var(--brand-sage);
          box-shadow: 0 0 0 3px rgba(74,124,94,0.12);
        }
 
        .search-icon-left {
          position: absolute;
          left: 14px;
          color: rgba(26,58,42,0.4);
          pointer-events: none;
          width: 16px;
          height: 16px;
        }
 
        .search-btn-inside {
          position: absolute;
          right: 6px;
          height: 30px;
          padding: 0 14px;
          background: var(--brand-forest);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s;
        }
 
        .search-btn-inside:hover {
          background: var(--brand-moss);
        }
 
        /* Search Results Dropdown */
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(26,58,42,0.1);
          box-shadow: 0 20px 60px rgba(26,58,42,0.12), 0 4px 16px rgba(0,0,0,0.06);
          overflow: hidden;
          z-index: 200;
        }
 
        .search-result-item {
          display: flex;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s;
          align-items: center;
        }
 
        .search-result-item:hover {
          background: var(--brand-mint);
        }
 
        .search-result-img {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          object-fit: cover;
          background: var(--brand-mint);
          flex-shrink: 0;
        }
 
        .search-result-info {
          flex: 1;
          min-width: 0;
        }
 
        .search-result-name {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--brand-forest);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
 
        .search-result-cat {
          font-size: 11px;
          color: var(--brand-sage);
          margin-top: 1px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
 
        .search-result-price {
          font-size: 14px;
          font-weight: 600;
          color: var(--brand-moss);
          font-family: 'Cormorant Garamond', serif;
          white-space: nowrap;
        }
 
        .search-result-compare {
          font-size: 11px;
          color: rgba(26,58,42,0.35);
          text-decoration: line-through;
          margin-left: 4px;
        }
 
        /* Action Buttons */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
 
        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-forest);
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          position: relative;
        }
 
        .action-btn:hover {
          background: var(--brand-mint);
          color: var(--brand-moss);
        }
 
        .action-btn.active {
          background: var(--brand-mint);
          color: var(--brand-sage);
        }
 
        .cart-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1.5px solid var(--brand-forest);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: var(--brand-forest);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
        }
 
        .cart-btn:hover {
          background: var(--brand-forest);
          color: white;
        }
 
        .divider-v {
          width: 1px;
          height: 24px;
          background: rgba(26,58,42,0.12);
          margin: 0 4px;
        }
 
        /* Nav */
        .header-nav {
          border-top: 1px solid rgba(26,58,42,0.07);
        }
 
        .nav-inner {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
 
        .nav-inner::-webkit-scrollbar {
          display: none;
        }
 
        .nav-link {
          position: relative;
          padding: 13px 16px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(26,58,42,0.65);
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
 
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 16px;
          right: 16px;
          height: 2px;
          background: var(--brand-sage);
          border-radius: 2px 2px 0 0;
          transform: scaleX(0);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
        }
 
        .nav-link:hover {
          color: var(--brand-forest);
        }
 
        .nav-link:hover::after {
          transform: scaleX(1);
        }
 
        .nav-link.special {
          color: var(--brand-gold);
          font-weight: 500;
        }
 
        .nav-link.special:hover {
          color: var(--brand-bark);
        }
 
        .nav-link.special::after {
          background: var(--brand-gold);
        }
 
        .nav-new-badge {
          display: inline-flex;
          align-items: center;
          margin-left: 5px;
          background: var(--brand-gold-light);
          color: var(--brand-bark);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 1px 5px;
          border-radius: 4px;
          vertical-align: middle;
          position: relative;
          top: -1px;
        }
 
        /* Mobile Menu */
        .mobile-menu {
          background: var(--brand-cream);
          border-top: 1px solid rgba(26,58,42,0.1);
        }
 
        .mobile-menu-inner {
          padding: 16px 24px 24px;
          max-width: 1280px;
          margin: 0 auto;
        }
 
        .mobile-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1.5px solid rgba(26,58,42,0.15);
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
        }
 
        .mobile-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--brand-forest);
          background: transparent;
        }
 
        .mobile-search-input::placeholder {
          color: rgba(26,58,42,0.4);
        }
 
        .mobile-nav-section {
          margin-bottom: 16px;
        }
 
        .mobile-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(26,58,42,0.4);
          margin-bottom: 8px;
          padding: 0 4px;
        }
 
        .mobile-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 12px;
          border-radius: 10px;
          color: var(--brand-forest);
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 400;
          transition: background 0.15s;
        }
 
        .mobile-nav-link:hover {
          background: var(--brand-mint);
        }
 
        .mobile-nav-link.special {
          color: var(--brand-bark);
          font-weight: 500;
        }
 
        .mobile-divider {
          height: 1px;
          background: rgba(26,58,42,0.08);
          margin: 12px 0;
        }
 
        .mobile-footer-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
 
        .mobile-action-pill {
          flex: 1;
          height: 44px;
          border-radius: 10px;
          border: 1.5px solid rgba(26,58,42,0.2);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--brand-forest);
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s;
        }
 
        .mobile-action-pill:hover {
          background: var(--brand-mint);
        }
 
        .mobile-action-pill.primary {
          background: var(--brand-forest);
          border-color: var(--brand-forest);
          color: white;
        }
 
        .mobile-action-pill.primary:hover {
          background: var(--brand-moss);
        }
 
        /* Full Screen Search Overlay */
        .search-overlay-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 150;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 72px;
          padding-left: 16px;
          padding-right: 16px;
        }
 
        .search-overlay-box {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.15);
        }
 
        .search-overlay-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1.5px solid rgba(26,58,42,0.1);
          padding-bottom: 14px;
          margin-bottom: 14px;
        }
 
        .search-overlay-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          color: var(--brand-forest);
        }
 
        .search-overlay-input::placeholder {
          color: rgba(26,58,42,0.35);
        }
 
        .search-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(26,58,42,0.06);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-forest);
          flex-shrink: 0;
        }
 
        @media (max-width: 768px) {
          .search-desktop { display: none; }
          .logo-title { font-size: 19px; }
          .header-main-row { height: 64px; }
          .top-bar-contact { display: none; }
          .nav-desktop { display: none; }
        }
 
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .nav-desktop { display: block; }
        }
      `}</style>
 
      <div className="header-root">
 
        {/* ── Top Bar ── */}
        <motion.div
          className="top-bar"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="top-bar-inner">
            <div className="top-bar-contact">
              <a href="tel:+919876543210">
                <Phone size={13} />
                <span>+91 98765 43210</span>
              </a>
              <a href="mailto:info@ayurvedesifoods.com">
                <Mail size={13} />
                <span>info@ayurvedesifoods.com</span>
              </a>
            </div>
            <div className="top-bar-badges">
              <span className="top-badge">
                <Leaf size={10} />
                100% Natural
              </span>
              <span className="top-badge gold">
                <Sparkles size={10} />
                Free Shipping ₹500+
              </span>
              <span className="top-badge">Lab Tested</span>
            </div>
          </div>
        </motion.div>
 
        {/* ── Main Header ── */}
        <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
          <div className="header-inner">
 
            {/* Main Row */}
            <div className="header-main-row">
 
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Link href="/" className="logo-wrap">
                  <div className="logo-icon">
                    <Leaf size={22} />
                  </div>
                  <div className="logo-text">
                    <span className="logo-title">AyurVeda</span>
                    <span className="logo-sub">Desi Foods</span>
                  </div>
                </Link>
              </motion.div>
 
              {/* Desktop Search */}
              <motion.div
                className="search-desktop"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                ref={searchRef}
              >
                <div className="search-input-wrap">
                  <Search className="search-icon-left" />
                  <input
                    className="search-input"
                    placeholder="Search organic products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
                        setSearchQuery('')
                        setShowResults(false)
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      className="search-btn-inside"
                      onClick={() => {
                        if (searchQuery.trim()) {
                          router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
                          setSearchQuery('')
                          setShowResults(false)
                        }
                      }}
                    >
                      Search
                    </button>
                  )}
                </div>
 
                {/* Dropdown results */}
                <AnimatePresence>
                  {showResults && (
                    <motion.div
                      className="search-dropdown"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                    >
                      {searchLoading ? (
                        <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(26,58,42,0.45)' }}>
                          Searching...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(26,58,42,0.45)' }}>
                          No products found for "{searchQuery}"
                        </div>
                      ) : (
                        searchResults.map((item: any) => (
                          <div
                            key={item.id}
                            className="search-result-item"
                            onClick={() => {
                              router.push(`/product/${item.id}`)
                              setSearchQuery('')
                              setSearchResults([])
                              setShowResults(false)
                            }}
                          >
                            <img
                              src={item?.images?.[0] || '/placeholder.png'}
                              className="search-result-img"
                              alt={item.name}
                            />
                            <div className="search-result-info">
                              <div className="search-result-name">{item.name}</div>
                              <div className="search-result-cat">{item.category_name}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                              <span className="search-result-price">₹{item.price}</span>
                              {item.compareprice && (
                                <span className="search-result-compare">₹{item.compareprice}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
 
              {/* Actions */}
              <motion.div
                className="header-actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                {/* Search — mobile only */}
                <button
                  className="action-btn mobile-only"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search"
                >
                  <Search size={19} />
                </button>
 
                {/* Wishlist */}
                <Link href="/wishlist" className="action-btn" aria-label="Wishlist">
                  <Heart size={19} />
                </Link>
 
                <div className="divider-v" />
 
                {/* Account */}
                {loginuserdata?.id ? (
                  <>
                    <Link href="/account" className="action-btn" aria-label="Account">
                      <User size={19} />
                    </Link>
                    <button className="action-btn" onClick={handleLogout} aria-label="Logout">
                      <LogOut size={19} />
                    </button>
                  </>
                ) : (
                  <Link href="/auth" className="action-btn" aria-label="Login">
                    <User size={19} />
                  </Link>
                )}
 
                {/* Cart */}
                <CartSheet />
 
                {/* Hamburger */}
                <button
                  className="action-btn mobile-only"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Menu"
                >
                  <AnimatePresence mode="wait">
                    {isMenuOpen ? (
                      <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <X size={20} />
                      </motion.div>
                    ) : (
                      <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Menu size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </div>
 
            {/* Desktop Nav */}
            <nav className="header-nav nav-desktop">
              <div className="nav-inner">
                {categoriesdata?.rows?.map((cat: any, i: number) => (
                  <Link
                    key={cat?.id}
                    href={`/category/${cat?.id}`}
                    className="nav-link"
                  >
                    {cat?.name}
                  </Link>
                ))}
                <Link href="/blog" className="nav-link">
                  Blog
                  <span className="nav-new-badge">New</span>
                </Link>
                <Link href="/about" className="nav-link">About Us</Link>
                <Link href="/offers" className="nav-link special">
                  ✦ Offers
                </Link>
              </div>
            </nav>
 
          </div>
 
          {/* ── Mobile Menu ── */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mobile-menu-inner">
 
                  {/* Mobile Search */}
                  <div className="mobile-search-wrap">
                    <Search size={16} style={{ color: 'rgba(26,58,42,0.4)', flexShrink: 0 }} />
                    <input
                      className="mobile-search-input"
                      placeholder="Search organic products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
                          setIsMenuOpen(false)
                          setSearchQuery('')
                        }
                      }}
                    />
                  </div>
 
                  {/* Categories */}
                  <div className="mobile-nav-section">
                    <div className="mobile-section-label">Shop by Category</div>
                    {categoriesdata?.rows?.map((cat: any) => (
                      <Link
                        key={cat?.name}
                        href={`/category/${cat?.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="mobile-nav-link"
                      >
                        <span>{cat?.name}</span>
                        <ChevronDown size={14} style={{ transform: 'rotate(-90deg)', opacity: 0.4 }} />
                      </Link>
                    ))}
                  </div>
 
                  <div className="mobile-divider" />
 
                  {/* Pages */}
                  <div className="mobile-nav-section">
                    <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                      <span>Blog</span>
                      <span className="nav-new-badge" style={{ marginLeft: 0 }}>New</span>
                    </Link>
                    <Link href="/about" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                      <span>About Us</span>
                    </Link>
                    <Link href="/offers" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link special">
                      <span>✦ Offers & Deals</span>
                    </Link>
                  </div>
 
                  <div className="mobile-divider" />
 
                  {/* Footer actions */}
                  <div className="mobile-footer-actions">
                    {loginuserdata?.id ? (
                      <>
                        <Link href="/account" onClick={() => setIsMenuOpen(false)} className="mobile-action-pill">
                          <User size={15} />
                          My Account
                        </Link>
                        <button onClick={() => { handleLogout(); setIsMenuOpen(false) }} className="mobile-action-pill">
                          <LogOut size={15} />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)} className="mobile-action-pill primary">
                          <User size={15} />
                          Login / Register
                        </Link>
                        <Link href="/wishlist" onClick={() => setIsMenuOpen(false)} className="mobile-action-pill">
                          <Heart size={15} />
                          Wishlist
                        </Link>
                      </>
                    )}
                  </div>
 
                </div>
              </motion.div>
            )}
          </AnimatePresence>
 
        </header>
 
        {/* ── Mobile Search Overlay ── */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              className="search-overlay-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSearchOpen(false)}
            >
              <motion.div
                className="search-overlay-box"
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="search-overlay-input-row">
                  <Search size={20} style={{ color: 'rgba(26,58,42,0.4)', flexShrink: 0 }} />
                  <input
                    autoFocus
                    className="search-overlay-input"
                    placeholder="Search products..."
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
                  <button className="search-close-btn" onClick={() => setIsSearchOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
 
                {searchLoading && (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'rgba(26,58,42,0.45)' }}>
                    Searching...
                  </div>
                )}
 
                {showResults && !searchLoading && (
                  <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(26,58,42,0.45)' }}>
                        No products found for "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((item: any) => (
                        <div
                          key={item.id}
                          className="search-result-item"
                          onClick={() => {
                            router.push(`/product/${item.id}`)
                            setIsSearchOpen(false)
                            setSearchQuery('')
                            setSearchResults([])
                            setShowResults(false)
                          }}
                        >
                          <img
                            src={item?.images?.[0] || '/placeholder.png'}
                            className="search-result-img"
                            alt={item.name}
                          />
                          <div className="search-result-info">
                            <div className="search-result-name">{item.name}</div>
                            <div className="search-result-cat">{item.category_name}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span className="search-result-price">₹{item.price}</span>
                            {item.compareprice && (
                              <span className="search-result-compare">₹{item.compareprice}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
 
      </div>
    </>
  )
}