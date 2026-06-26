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
  MessageSquare,
  Bell,
  Wallet,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import axios from '@/lib/axios'
import useDebounce from '../debounce'
 
export function Header() {
   const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || ''
  const router = useRouter()
const {
  loginuserdata,
  logout,
  categoriesdata,
  setOpenauth,
  setAuthMode,
  companydata
} = useAuth()
 
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [notifCount, setNotifCount] = useState(0)



  const searchRef = useRef(null)
 
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!loginuserdata?.id) return
    axios.get('/push/notifications')
      .then(r => setNotifCount((r.data.notifications || []).length))
      .catch(() => {})
  }, [loginuserdata?.id])

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 769) {
        setIsMenuOpen(false)
        setIsSearchOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
 
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    try {
      setSearchLoading(true)
      const res = await axios.get(`/shop/search/suggestions?q=${encodeURIComponent(query)}`)
      const { products = [], categories = [] } = res?.data || {}
      // merge: categories first (tagged), then products
      const merged = [
        ...categories.map((c: any) => ({ ...c, _type: 'category' })),
        ...products.map((p: any) => ({ ...p, _type: 'product' })),
      ]
      setSearchResults(merged)
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
 
        /* ── Top Bar ── */
        .top-bar {
          background: var(--brand-forest);
          color: rgba(255,255,255,0.85);
          font-size: 11.5px;
          letter-spacing: 0.04em;
          padding: 7px 0;
          font-family: 'DM Sans', sans-serif;
        }
 
        .top-bar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 0;
        }
 
        .top-bar-contact {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-shrink: 0;
        }
 
        .top-bar-contact a {
          display: flex;
          align-items: center;
          gap: 5px;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
        }
 
        .top-bar-contact a:hover { color: var(--brand-gold); }
 
        .top-bar-badges {
          display: flex;
          gap: 5px;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
        }
 
        .top-badge {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.85);
          border-radius: 20px;
          padding: 2px 8px;
          font-size: 10.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
 
        .top-badge.gold {
          background: rgba(201,168,76,0.15);
          border-color: rgba(201,168,76,0.35);
          color: var(--brand-gold);
        }
 
        /* ── Main Header ── */
     .main-header {
  background: #f7f4eb;
          border-bottom: 1px solid rgba(26,58,42,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: box-shadow 0.3s, background 0.3s;
        }
 
      .main-header.scrolled {
  background: rgba(247,244,235,0.96);
          box-shadow: 0 4px 24px rgba(26,58,42,0.08);
          backdrop-filter: blur(12px);
        }
 
        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }
 
        .header-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: 12px;
        }
 
    /* ── Logo ── */
.logo-wrap {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 0;
  padding: 2px 0;
}

.logo-image {
  height: 60px;
  width: 60px;
  object-fit: cover;
  object-position: center;
  display: block;
  mix-blend-mode: multiply;
  transform: scale(2.8);
  transform-origin: center;
  transition: filter 0.25s ease;
}

.logo-wrap:hover .logo-image {
  filter: drop-shadow(0 6px 14px rgba(26,58,42,0.12));
}
        /* ── Desktop Search ── */
        .search-desktop {
          flex: 1;
          max-width: 460px;
          margin: 0 16px;
          position: relative;
        }
 
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
 
        .search-input {
          width: 100%;
          height: 40px;
          border-radius: 100px;
          border: 1.5px solid rgba(26,58,42,0.15);
          background: white;
          padding: 0 42px 0 40px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: var(--brand-forest);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
 
        .search-input::placeholder { color: rgba(26,58,42,0.4); }
 
        .search-input:focus {
          border-color: var(--brand-sage);
          box-shadow: 0 0 0 3px rgba(74,124,94,0.12);
        }
 
        .search-icon-left {
          position: absolute;
          left: 13px;
          color: rgba(26,58,42,0.4);
          pointer-events: none;
          width: 15px;
          height: 15px;
        }
 
        .search-btn-inside {
          position: absolute;
          right: 5px;
          height: 30px;
          padding: 0 13px;
          background: var(--brand-forest);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s;
        }
 
        .search-btn-inside:hover { background: var(--brand-moss); }
 
        /* ── Search Results Dropdown ── */
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
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s;
          align-items: center;
        }
 
        .search-result-item:hover { background: var(--brand-mint); }
 
        .search-result-img {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          background: var(--brand-mint);
          flex-shrink: 0;
        }
 
        .search-result-info {
          flex: 1;
          min-width: 0;
        }
 
        .search-result-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--brand-forest);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
 
        .search-result-cat {
          font-size: 10.5px;
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
 
        /* ── Action Buttons ── */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
 
        .action-btn {
          width: 38px;
          height: 38px;
          border-radius: 9px;
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
          flex-shrink: 0;
        }
 
        .action-btn:hover {
          background: var(--brand-mint);
          color: var(--brand-moss);
        }
 
        .divider-v {
          width: 1px;
          height: 20px;
          background: rgba(26,58,42,0.12);
          margin: 0 2px;
          flex-shrink: 0;
        }
 
        /* ── Desktop Nav ── */
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
 
        .nav-inner::-webkit-scrollbar { display: none; }
 
        .nav-link {
          position: relative;
          padding: 12px 14px;
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
          left: 14px;
          right: 14px;
          height: 2px;
          background: var(--brand-sage);
          border-radius: 2px 2px 0 0;
          transform: scaleX(0);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
        }
 
        .nav-link:hover { color: var(--brand-forest); }
        .nav-link:hover::after { transform: scaleX(1); }
 
        .nav-link.special { color: var(--brand-gold); font-weight: 500; }
        .nav-link.special:hover { color: var(--brand-bark); }
        .nav-link.special::after { background: var(--brand-gold); }
 
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
 
        /* ── Mobile Menu ── */
        .mobile-menu {
          background: var(--brand-cream);
          border-top: 1px solid rgba(26,58,42,0.1);
        }
 
        .mobile-menu-inner {
          padding: 14px 16px 20px;
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
          margin-bottom: 16px;
        }
 
        .mobile-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--brand-forest);
          background: transparent;
          min-width: 0;
        }
 
        .mobile-search-input::placeholder { color: rgba(26,58,42,0.4); }
 
        .mobile-nav-section { margin-bottom: 12px; }
 
        .mobile-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(26,58,42,0.4);
          margin-bottom: 6px;
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
          font-size: 14px;
          font-weight: 400;
          transition: background 0.15s;
        }
 
        .mobile-nav-link:hover { background: var(--brand-mint); }
        .mobile-nav-link.special { color: var(--brand-bark); font-weight: 500; }
 
        .mobile-divider {
          height: 1px;
          background: rgba(26,58,42,0.08);
          margin: 10px 0;
        }
 
        .mobile-footer-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
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
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--brand-forest);
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
          min-width: 0;
          overflow: hidden;
        }
 
        .mobile-action-pill:hover { background: var(--brand-mint); }
 
        .mobile-action-pill.primary {
          background: var(--brand-forest);
          border-color: var(--brand-forest);
          color: white;
        }
 
        .mobile-action-pill.primary:hover { background: var(--brand-moss); }
 
        /* ── Mobile Search Overlay ── */
        .search-overlay-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          z-index: 150;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 64px 12px 0;
        }
 
        .search-overlay-box {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.15);
          max-height: calc(100vh - 80px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
 
        .search-overlay-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1.5px solid rgba(26,58,42,0.1);
          padding-bottom: 12px;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
 
        .search-overlay-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          color: var(--brand-forest);
          min-width: 0;
          background: transparent;
        }
 
        .search-overlay-input::placeholder { color: rgba(26,58,42,0.35); }
 
        .search-close-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(26,58,42,0.06);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-forest);
        }

        .search-overlay-results {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
 
        /* ── Breakpoints ── */

        /* Large desktop */
        @media (min-width: 1024px) {
          .header-inner { padding: 0 32px; }
          .top-bar-inner { padding: 0 32px; }
          .header-main-row { height: 72px; }
          .logo-title { font-size: 22px; }
        }

        /* Tablet */
        @media (max-width: 1023px) and (min-width: 769px) {
          .search-desktop { max-width: 340px; margin: 0 12px; }
          .logo-image {
  height: 52px;
  width: 52px;
  transform: scale(2.8);
  // transform-origin: center;
    transform-origin: left center;
  margin-left: 20px;
}
        }

        /* Mobile hide/show rules */
        @media (max-width: 768px) {
          .search-desktop { display: none !important; }
          .nav-desktop { display: none !important; }
          .desktop-only { display: none !important; }
          .top-bar-contact { display: none !important; }
          /* Show all badges on mobile but limit to 2 */
          .top-badge:nth-child(n+3) { display: none; }
          .header-main-row { height: 58px; gap: 6px; }
          .logo-icon { width: 36px; height: 36px; min-width: 36px; border-radius: 9px; }
          .logo-title { font-size: 18px; }
          .logo-sub { font-size: 9px; letter-spacing: 0.12em; }
          .action-btn { width: 36px; height: 36px; }
          .divider-v { display: none; }
          .top-bar { padding: 6px 0; }
          .top-badge { font-size: 10px; padding: 2px 7px; }
.logo-image {
  height: 52px;
  width: 52px;
  transform: scale(2.8);
  // transform-origin: center;
    transform-origin: left center;
  margin-left: 40px;
}
        }

        /* Very small phones */
        @media (max-width: 360px) {
          .logo-sub { display: none; }
          .logo-title { font-size: 16px; }
          .logo-icon { width: 32px; height: 32px; min-width: 32px; }
          .header-main-row { gap: 4px; }
          .action-btn { width: 32px; height: 32px; }
          .top-badge:nth-child(n+2) { display: none; }
          .mobile-action-pill { font-size: 12px; padding: 0 8px; }
.logo-image {
  height: 40px;
  width: 40px;
  transform: scale(2.8);
  

}
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
              <a href={`tel:+${companydata[0]?.phone||""}`}>
                <Phone size={13} />
                <span>{companydata[0]?.phone||"0000000000"}</span>
              </a>
              <a href={`mailto:${companydata[0]?.email||""}`}>
                <Mail size={13} />
                <span>{companydata[0]?.email||"-----"}</span>
              </a>
            </div>
            <div className="top-bar-badges">
              <span className="top-badge gold">
                <Sparkles size={10} />
                Free Shipping ₹500+
              </span>
              <span className="top-badge">
                <Leaf size={10} />
                100% Natural
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
                style={{ flexShrink: 0 }}
              >
             <Link href="/" className="logo-wrap">
  <img
    src={logoUrl}
    alt="Oroganix"
    className="logo-image"
  />
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
                            key={`${item._type}-${item.id}`}
                            className="search-result-item"
                            onClick={() => {
                              router.push(item._type === 'category' ? `/category/${item.slug || item.id}` : `/product/${item.slug || item.id}`)
                              setSearchQuery('')
                              setSearchResults([])
                              setShowResults(false)
                            }}
                          >
                            {item._type === 'category' ? (
                              <div className="search-result-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5ee', fontSize: 18 }}>🌿</div>
                            ) : (
                              <img src={item?.images?.[0] || '/placeholder.png'} className="search-result-img" alt={item.name} />
                            )}
                            <div className="search-result-info">
                              <div className="search-result-name">{item.name}</div>
                              <div className="search-result-cat">{item._type === 'category' ? 'Browse category' : item.category_name}</div>
                            </div>
                            {item._type === 'product' && (
                              <div style={{ display: 'flex', alignItems: 'baseline', flexShrink: 0 }}>
                                <span className="search-result-price">₹{item.price}</span>
                                {item.compareprice && <span className="search-result-compare">₹{item.compareprice}</span>}
                              </div>
                            )}
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
                  <Search size={18} />
                </button>
 
                {/* Wishlist — desktop only */}
                <Link href="/wishlist" className="action-btn desktop-only" aria-label="Wishlist">
                  <Heart size={18} />
                </Link>

                {/* Notifications — desktop, logged in */}
                {loginuserdata?.id && (
                  <Link href="/notifications" className="action-btn desktop-only" aria-label="Notifications" style={{ position: 'relative' }}>
                    <Bell size={18} />
                    {notifCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: '0 3px' }}>
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Wallet — desktop, logged in */}
                {loginuserdata?.id && (
                  <Link href="/wallet" className="action-btn desktop-only" aria-label="Wallet">
                    <Wallet size={18} />
                  </Link>
                )}

                <div className="divider-v desktop-only" />
 
                {/* Account */}
                {loginuserdata?.id ? (
                  <>
                    <Link href="/account" className="action-btn" aria-label="Account">
                      <User size={18} />
                    </Link>
                    <button className="action-btn desktop-only" onClick={handleLogout} aria-label="Logout">
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                <button
  className="action-btn"
  aria-label="Login"
  onClick={() => {
    setAuthMode('login')
    setOpenauth(true)
  }}
>
  <User size={18} />
</button>
                )}
 
                {/* Cart */}
                <CartSheet />
 
                {/* Hamburger — mobile only */}
                <button
                  className="action-btn mobile-only"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Menu"
                >
                  <AnimatePresence mode="wait">
                    {isMenuOpen ? (
                      <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <X size={19} />
                      </motion.div>
                    ) : (
                      <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Menu size={19} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </div>
 
            {/* Desktop Nav */}
            <nav className="header-nav nav-desktop">
              <div className="nav-inner">
                {categoriesdata?.rows
                  ?.filter((cat: any) => !cat.parent_id && cat.is_active !== false)
                  ?.slice(0, 8)
                  ?.map((cat: any) => (
                  <Link
                    key={cat?.id}
                    href={`/category/${cat?.slug || cat?.id}`}
                    className="nav-link"
                  >
                    {cat?.name}
                  </Link>
                ))}
                <Link href="/products" className="nav-link">All Products</Link>
                <Link href="/blog" className="nav-link">
                  Blog
                  <span className="nav-new-badge">New</span>
                </Link>
                <Link href="/about" className="nav-link">About Us</Link>
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
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mobile-menu-inner">
 
                  {/* Mobile Search */}
                  <div className="mobile-search-wrap">
                    <Search size={15} style={{ color: 'rgba(26,58,42,0.4)', flexShrink: 0 }} />
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
                    {categoriesdata?.rows
                      ?.filter((cat: any) => !cat.parent_id && cat.is_active !== false)
                      ?.map((cat: any) => (
                      <Link
                        key={cat?.id}
                        href={`/category/${cat?.slug || cat?.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="mobile-nav-link"
                      >
                        <span>{cat?.name}</span>
                        <ChevronDown size={14} style={{ transform: 'rotate(-90deg)', opacity: 0.4, flexShrink: 0 }} />
                      </Link>
                    ))}
                    <Link href="/products" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                      <span>All Products</span>
                    </Link>
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
                    <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                      <span>Contact Us</span>
                    </Link>
                  </div>

                  <div className="mobile-divider" />

                  {/* Wishlist row — mobile only */}
                  <div className="mobile-nav-section">
                    <Link href="/wishlist" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                      <span>Wishlist</span>
                      <Heart size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                    </Link>
                    {loginuserdata?.id && (
                      <Link href="/notifications" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                        <span>Notifications</span>
                        <Bell size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                      </Link>
                    )}
                    {loginuserdata?.id && (
                      <Link href="/wallet" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">
                        <span>My Wallet</span>
                        <Wallet size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                      </Link>
                    )}
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
                        <Link href="/support" onClick={() => setIsMenuOpen(false)} className="mobile-action-pill">
                          <MessageSquare size={15} />
                          Support
                        </Link>
                        <button onClick={() => { handleLogout(); setIsMenuOpen(false) }} className="mobile-action-pill">
                          <LogOut size={15} />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                      <button
  onClick={() => {
    setIsMenuOpen(false)
    setAuthMode('login')
    setOpenauth(true)
  }}
  className="mobile-action-pill primary"
>
                          <User size={15} />
                          Login / Register
                        </button>
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
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="search-overlay-input-row">
                  <Search size={19} style={{ color: 'rgba(26,58,42,0.4)', flexShrink: 0 }} />
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
                    <X size={15} />
                  </button>
                </div>
 
                <div className="search-overlay-results">
                  {searchLoading && (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'rgba(26,58,42,0.45)' }}>
                      Searching...
                    </div>
                  )}
 
                  {showResults && !searchLoading && (
                    <>
                      {searchResults.length === 0 ? (
                        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(26,58,42,0.45)' }}>
                          No products found for "{searchQuery}"
                        </div>
                      ) : (
                        searchResults.map((item: any) => (
                          <div
                            key={`${item._type}-${item.id}`}
                            className="search-result-item"
                            onClick={() => {
                              router.push(item._type === 'category' ? `/category/${item.slug || item.id}` : `/product/${item.slug || item.id}`)
                              setIsSearchOpen(false)
                              setSearchQuery('')
                              setSearchResults([])
                              setShowResults(false)
                            }}
                          >
                            {item._type === 'category' ? (
                              <div className="search-result-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5ee', fontSize: 18 }}>🌿</div>
                            ) : (
                              <img src={item?.images?.[0] || '/placeholder.png'} className="search-result-img" alt={item.name} />
                            )}
                            <div className="search-result-info">
                              <div className="search-result-name">{item.name}</div>
                              <div className="search-result-cat">{item._type === 'category' ? 'Browse category' : item.category_name}</div>
                            </div>
                            {item._type === 'product' && (
                              <div style={{ display: 'flex', alignItems: 'baseline', flexShrink: 0 }}>
                                <span className="search-result-price">₹{item.price}</span>
                                {item.compareprice && <span className="search-result-compare">₹{item.compareprice}</span>}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
 
      </div>
    </>
  )
}
