"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "@/lib/axios"
import toast from "react-hot-toast"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

import {
  Heart,
  ShoppingCart,
  Star,
  Trash2,
  Search,
  ArrowLeft,
  Package,
  ChevronRight,
  Check,
  Eye,
  LayoutGrid,
  List,
  X,
  Sparkles,
  TrendingDown,
} from "lucide-react"

import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import StarRating from "@/components/StartRatings"

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

interface WishlistItem {
  wishlist_id: number
  id: number
  name: string
  slug: string
  shortdescription?: string
  price: number
  compareprice?: number
  images: string
  inventory: number
  averagerating: number
  reviewcount: number
  category_name: string
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const getImage = (images: any): string => {
  try {
    if (Array.isArray(images)) return images[0] || "/placeholder-product.jpg"
    const arr = JSON.parse(images || "[]")
    return arr[0] || "/placeholder-product.jpg"
  } catch {
    return "/placeholder-product.jpg"
  }
}

const formatPrice = (val: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val)

const getDiscount = (price: number, compare?: number): number | null => {
  if (!compare || compare <= price) return null
  return Math.round(((compare - price) / compare) * 100)
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export default function WishlistPage() {
  const { wishlistdata, getwishlist, cartdata, fetchCart, loginuserdata, handleCart } = useAuth()

  const [page, setPage] = useState(1)
  const [limit] = useState(8)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [addingAll, setAddingAll] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  /* ── Fetch ── */
  useEffect(() => {
    getwishlist({ params: { limit, page, search } })
  }, [page, search])

  /* ── Remove ── */
  const removeItem = async (productId: number) => {
    try {
      setProcessingId(productId)
      await new Promise(r => setTimeout(r, 280))
      await axios.delete(`/shop/${productId}`)
      toast.success("Removed from wishlist")
      getwishlist({ params: { page, limit, search } })
    } catch {
      toast.error("Remove failed")
    } finally {
      setProcessingId(null)
    }
  }

  /* ── Add to cart ── */
  const addToCart = async (productId: number) => {
    try {
      await axios.post("/cart", { productId, quantity: 1 })
      toast.success("Added to cart!")
      fetchCart(loginuserdata?.id)
    } catch {
      toast.error("Add to cart failed")
    }
  }

  /* ── Add all to cart ── */
  const addAllToCart = async () => {
    const eligible = items.filter(i => i.inventory > 0 && !cartdata?.items?.some((c: any) => c.product_id === i.id))
    if (eligible.length === 0) { toast.success("All in-stock items are already in your cart!"); return }
    setAddingAll(true)
    try {
      await Promise.all(eligible.map(i => axios.post("/cart", { productId: i.id, quantity: 1 })))
      fetchCart(loginuserdata?.id)
      toast.success(`${eligible.length} item${eligible.length > 1 ? "s" : ""} added to cart!`)
    } catch {
      toast.error("Some items could not be added")
    } finally {
      setAddingAll(false)
    }
  }

  /* ── Search ── */
  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  const clearSearch = () => {
    setSearchInput("")
    setSearch("")
    setPage(1)
  }

  const items: WishlistItem[] = wishlistdata?.items || []
  const isLoading = wishlistdata?.loading
  const totalPages = wishlistdata?.totalPages || 1

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */

  return (
    <div style={s.page}>
      <Header />

      {/* Background decorations */}
      <div style={s.blob1} aria-hidden />
      <div style={s.blob2} aria-hidden />
      <div style={s.gridPattern} aria-hidden />

      <main style={s.main}>

        {/* ══════════ HERO HEADER ══════════ */}
        <motion.section
          style={s.hero}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={s.heroLeft}>
            <div style={s.eyebrow}>
              <span style={s.eyebrowDot} />
              <span style={s.eyebrowText}>MY COLLECTION</span>
            </div>

            <h1 style={s.title}>
              Saved <em style={s.titleAccent}>Pieces</em>
            </h1>

            <div style={s.statsRow}>
              <div style={s.statPill}>
                <Heart style={{ width: 12, height: 12, fill: "#3d7a5a", color: "#3d7a5a" }} />
                <span>{items.length} {items.length === 1 ? "item" : "items"} saved</span>
              </div>
              {items.filter(i => (i.compareprice ?? 0) > i.price).length > 0 && (
                <div style={{ ...s.statPill, background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.15)", color: "#dc2626" }}>
                  <TrendingDown style={{ width: 12, height: 12 }} />
                  <span>{items.filter(i => (i.compareprice ?? 0) > i.price).length} on sale</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={s.controls}>
            {/* Add all to cart */}
            {items.length > 0 && (
              <button
                style={s.addAllBtn}
                className="wl-addAllBtn"
                onClick={addAllToCart}
                disabled={addingAll}
              >
                <ShoppingCart style={{ width: 14, height: 14 }} />
                <span>{addingAll ? "Adding…" : "Add All to Cart"}</span>
              </button>
            )}
            {/* Search */}
            <div style={s.searchBar}>
              <Search style={{ width: 15, height: 15, color: "#3d7a5a", flexShrink: 0 }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search your collection…"
                style={s.searchInput}
              />
              {searchInput && (
                <button style={s.clearBtn} onClick={clearSearch}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              )}
              <button style={s.searchSubmit} onClick={handleSearch} className="wl-searchSubmit">
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* View toggle */}
            <div style={s.viewToggle}>
              <button
                style={{ ...s.viewBtn, ...(viewMode === "grid" ? s.viewBtnActive : {}) }}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid style={{ width: 15, height: 15 }} />
              </button>
              <button
                style={{ ...s.viewBtn, ...(viewMode === "list" ? s.viewBtnActive : {}) }}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── Divider ── */}
        <div style={s.divider} aria-hidden>
          <div style={s.dividerLine} />
          <Heart style={{ width: 12, height: 12, color: "#3d7a5a", flexShrink: 0, fill: "#3d7a5a" }} />
          <div style={s.dividerLine} />
        </div>

        {/* ══════════ LOADING ══════════ */}
        {isLoading && (
          <div style={s.loadingWrap}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={s.skeleton}>
                <div style={s.skelImg} className="wl-shimmer" />
                <div style={s.skelBody}>
                  <div style={{ ...s.skelLine, width: "40%", height: 10 }} className="wl-shimmer" />
                  <div style={{ ...s.skelLine, width: "80%" }} className="wl-shimmer" />
                  <div style={{ ...s.skelLine, width: "60%" }} className="wl-shimmer" />
                  <div style={{ ...s.skelLine, width: "35%", height: 10, marginTop: 8 }} className="wl-shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ EMPTY ══════════ */}
        <AnimatePresence>
          {!isLoading && items.length === 0 && (
            <motion.div
              style={s.emptyWrap}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Decorative hearts */}
              <div style={s.emptyDeco} aria-hidden>
                {[...Array(6)].map((_, i) => (
                  <Heart
                    key={i}
                    style={{
                      position: "absolute",
                      width: 14 + i * 4,
                      height: 14 + i * 4,
                      color: "#3d7a5a",
                      opacity: 0.06 + i * 0.015,
                      top: `${[10, 60, 30, 70, 20, 80][i]}%`,
                      left: `${[5, 15, 80, 70, 45, 55][i]}%`,
                    }}
                  />
                ))}
              </div>

              <div style={s.emptyOrb}>
                <Heart style={{ width: 34, height: 34, color: "#3d7a5a", fill: "rgba(61,122,90,0.2)" }} />
              </div>
              <h2 style={s.emptyTitle}>
                {search ? `No results for "${search}"` : "Your collection is empty"}
              </h2>
              <p style={s.emptySub}>
                {search ? "Try a different search term" : "Save products you love and find them here anytime"}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {search ? (
                  <button style={s.emptyBtnOutline} onClick={clearSearch} className="wl-emptyBtn">
                    Clear search
                  </button>
                ) : null}
                <Link href="/products" style={s.emptyBtn} className="wl-emptyBtn">
                  <Package style={{ width: 15, height: 15 }} />
                  <span>Explore Products</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ PRODUCT GRID / LIST ══════════ */}
        {!isLoading && items.length > 0 && (
          <motion.div
            style={viewMode === "grid" ? s.grid : s.listView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <AnimatePresence mode="popLayout">
              {items.map((product, i) => {
                const inCart = cartdata?.items?.some((c: any) => c.product_id === product.id)
                const disc = getDiscount(product.price, product.compareprice)
                const isOutOfStock = product.inventory === 0
                const isLowStock = product.inventory > 0 && product.inventory <= 5
                const isRemoving = processingId === product.id

                return viewMode === "grid"
                  ? /* ── GRID CARD ── */
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: isRemoving ? 0 : 1, y: 0, scale: isRemoving ? 0.93 : 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.35, delay: isRemoving ? 0 : i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    style={s.card}
                    className="wl-card"
                  >
                    {/* Discount ribbon */}
                    {disc && !isOutOfStock && (
                      <div style={s.ribbon}>
                        <Sparkles style={{ width: 9, height: 9 }} />
                        {disc}% OFF
                      </div>
                    )}

                    {/* Remove */}
                    <button
                      style={s.removeBtn}
                      className="wl-removeBtn"
                      disabled={!!processingId}
                      onClick={() => removeItem(product.id)}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>

                    {/* Image */}
                    <Link href={`/product/${product.slug || product.id}`} style={{ display: "block" }}>
                      <div style={s.imgBox} className="wl-imgBox">
                        <img
                          src={getImage(product.images)}
                          alt={product.name}
                          style={s.img}
                          className="wl-img"
                        />
                        <div style={s.imgGradient} />

                        {isOutOfStock && (
                          <div style={s.stockOverlay}>
                            <span style={s.stockLabel}>Out of Stock</span>
                          </div>
                        )}

                        {/* Quick view hover */}
                        <div style={s.quickViewLayer} className="wl-quickView">
                          <span style={s.quickViewBtn}>
                            <Eye style={{ width: 14, height: 14 }} />
                            Quick View
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Body */}
                    <div style={s.cardBody}>
                      {/* Category + stock */}
                      <div style={s.cardMeta}>
                        <span style={s.catTag}>{product.category_name}</span>
                        {isLowStock && (
                          <span style={s.lowStockTag}>Only {product.inventory} left</span>
                        )}
                        {!isOutOfStock && !isLowStock && (
                          <span style={s.inStockTag}>In Stock</span>
                        )}
                      </div>

                      <Link href={`/product/${product.slug || product.id}`} style={{ textDecoration: "none" }}>
                        <h3 style={s.cardTitle} className="wl-cardTitle">{product.name}</h3>
                      </Link>

                      {product.shortdescription && (
                        <p style={s.cardDesc}>{product.shortdescription}</p>
                      )}

                      {/* Stars */}
                      <div style={s.starsRow}>
                        <StarRating
                          productId={product.id}
                          avgRating={product.averagerating}
                          refresh={() => getwishlist({ params: { page, limit, search } })}
                        />
                        <span style={s.reviewCount}>({product.reviewcount})</span>
                      </div>

                      {/* Price */}
                      <div style={s.priceRow}>
                        <span style={s.price}>{formatPrice(product.price)}</span>
                        {product.compareprice && (
                          <span style={s.priceStrike}>{formatPrice(product.compareprice)}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={s.actions}>
                        <Link href={`/product/${product.slug || product.id}`} style={{ flex: "0 0 auto" }}>
                          <button style={s.viewBtn2} className="wl-viewBtn">
                            <Eye style={{ width: 14, height: 14 }} />
                          </button>
                        </Link>

                        {isOutOfStock ? (
                          <button style={{ ...s.cartBtn, ...s.cartBtnDisabled }} disabled>
                            Out of Stock
                          </button>
                        ) : inCart ? (
                          <button style={{ ...s.cartBtn, ...s.cartBtnInCart }} onClick={() => handleCart(true)}>
                            <Check style={{ width: 14, height: 14 }} />
                            <span>In Cart</span>
                          </button>
                        ) : (
                          <button style={s.cartBtn} className="wl-cartBtn" onClick={() => addToCart(product.id)}>
                            <ShoppingCart style={{ width: 14, height: 14 }} />
                            <span>Add to Cart</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>

                  : /* ── LIST CARD ── */
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: isRemoving ? 0 : 1, x: 0, scale: isRemoving ? 0.97 : 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.32, delay: isRemoving ? 0 : i * 0.04 }}
                    style={s.listCard}
                    className="wl-card"
                  >
                    {/* Image */}
                    <Link href={`/product/${product.slug || product.id}`} style={{ flexShrink: 0 }}>
                      <div style={s.listImgBox} className="wl-imgBox">
                        <img src={getImage(product.images)} alt={product.name} style={s.listImg} className="wl-img" />
                        {disc && !isOutOfStock && (
                          <div style={s.ribbon}><Sparkles style={{ width: 9, height: 9 }} />{disc}% OFF</div>
                        )}
                        {isOutOfStock && <div style={s.stockOverlay}><span style={s.stockLabel}>Out of Stock</span></div>}
                      </div>
                    </Link>

                    {/* Info */}
                    <div style={s.listBody}>
                      <div style={s.listTop}>
                        <div style={s.cardMeta}>
                          <span style={s.catTag}>{product.category_name}</span>
                          {isLowStock && <span style={s.lowStockTag}>Only {product.inventory} left</span>}
                          {!isOutOfStock && !isLowStock && <span style={s.inStockTag}>In Stock</span>}
                        </div>
                        <button style={s.removeBtnList} className="wl-removeBtn" disabled={!!processingId} onClick={() => removeItem(product.id)}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>

                      <Link href={`/product/${product.slug || product.id}`} style={{ textDecoration: "none" }}>
                        <h3 style={s.listTitle} className="wl-cardTitle">{product.name}</h3>
                      </Link>

                      {product.shortdescription && <p style={s.cardDesc}>{product.shortdescription}</p>}

                      <div style={s.starsRow}>
                        <StarRating productId={product.id} avgRating={product.averagerating} refresh={() => getwishlist({ params: { page, limit, search } })} />
                        <span style={s.reviewCount}>({product.reviewcount})</span>
                      </div>

                      <div style={s.listBottom}>
                        <div style={s.priceRow}>
                          <span style={s.price}>{formatPrice(product.price)}</span>
                          {product.compareprice && <span style={s.priceStrike}>{formatPrice(product.compareprice)}</span>}
                        </div>

                        <div style={s.actions}>
                          <Link href={`/product/${product.slug || product.id}`}><button style={s.viewBtn2} className="wl-viewBtn"><Eye style={{ width: 14, height: 14 }} /></button></Link>
                          {isOutOfStock ? (
                            <button style={{ ...s.cartBtn, ...s.cartBtnDisabled }} disabled>Out of Stock</button>
                          ) : inCart ? (
                            <button style={{ ...s.cartBtn, ...s.cartBtnInCart }} onClick={() => handleCart(true)}>
                              <Check style={{ width: 14, height: 14 }} /><span>In Cart</span>
                            </button>
                          ) : (
                            <button style={s.cartBtn} className="wl-cartBtn" onClick={() => addToCart(product.id)}>
                              <ShoppingCart style={{ width: 14, height: 14 }} /><span>Add to Cart</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ══════════ PAGINATION ══════════ */}
        {totalPages > 1 && !isLoading && (
          <motion.nav
            style={s.pagination}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              style={{ ...s.pgBtn, ...(page === 1 ? s.pgBtnOff : {}) }}
              className={page > 1 ? "wl-pgBtn" : ""}
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Prev</span>
            </button>

            <div style={s.dotRow}>
              {Array.from({ length: totalPages }).map((_, pi) => (
                <button
                  key={pi}
                  style={{ ...s.dot, ...(pi + 1 === page ? s.dotActive : {}) }}
                  onClick={() => setPage(pi + 1)}
                />
              ))}
            </div>

            <button
              style={{ ...s.pgBtn, ...(page === totalPages ? s.pgBtnOff : {}) }}
              className={page < totalPages ? "wl-pgBtn" : ""}
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <span>Next</span>
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </motion.nav>
        )}

      </main>

      <Footer />
      <style>{css}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f4f7f4",
    fontFamily: "'Outfit', 'Helvetica Neue', sans-serif",
    position: "relative",
    overflowX: "hidden",
  },

  /* backgrounds */
  blob1: {
    position: "fixed", top: -200, right: -150,
    width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(61,122,90,0.1) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", bottom: -250, left: -200,
    width: 700, height: 700, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(61,122,90,0.07) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  gridPattern: {
    position: "fixed", inset: 0, zIndex: 0,
    backgroundImage: "radial-gradient(rgba(61,122,90,0.07) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    pointerEvents: "none",
  },

  main: {
    flex: 1, maxWidth: 1300, width: "100%",
    margin: "0 auto", padding: "48px 24px 80px",
    position: "relative", zIndex: 1,
  },

  /* hero */
  hero: {
    display: "flex", flexWrap: "wrap",
    alignItems: "flex-start", justifyContent: "space-between",
    gap: 24, marginBottom: 28,
  },
  heroLeft: { display: "flex", flexDirection: "column", gap: 12 },
  eyebrow: { display: "flex", alignItems: "center", gap: 8 },
  eyebrowDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#3d7a5a",
    boxShadow: "0 0 0 3px rgba(61,122,90,0.2)", animation: "wlPulse 2s ease infinite",
  },
  eyebrowText: {
    fontFamily: "'Outfit', sans-serif", fontSize: 10,
    letterSpacing: "0.3em", color: "#3d7a5a", fontWeight: 600,
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
    fontWeight: 700, color: "#1a2e1a", lineHeight: 1.08, margin: 0,
  },
  titleAccent: { fontStyle: "italic", color: "#3d7a5a" },
  statsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  statPill: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "rgba(61,122,90,0.1)", border: "1px solid rgba(61,122,90,0.2)",
    color: "#3d7a5a", fontSize: 12, fontWeight: 600,
    padding: "5px 12px", borderRadius: 50,
  },

  controls: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  addAllBtn: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "linear-gradient(135deg, #1a2e1a, #3d7a5a)",
    color: "#f7f5f0", border: "none",
    padding: "10px 20px", borderRadius: 50,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", letterSpacing: "0.03em",
    boxShadow: "0 4px 14px rgba(26,46,26,0.2)",
    transition: "all 0.25s ease",
  },
  searchBar: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#fff", border: "1.5px solid rgba(61,122,90,0.18)",
    borderRadius: 50, padding: "9px 9px 9px 16px",
    boxShadow: "0 2px 16px rgba(26,46,26,0.06)", minWidth: 280,
  },
  searchInput: {
    border: "none", outline: "none", flex: 1,
    fontSize: 14, color: "#1a2e1a", background: "transparent",
    fontFamily: "'Outfit', sans-serif",
  },
  clearBtn: {
    background: "rgba(61,122,90,0.1)", border: "none", color: "#3d7a5a",
    width: 20, height: 20, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  searchSubmit: {
    background: "#1a2e1a", color: "#f7f5f0", border: "none",
    borderRadius: "50%", width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
  },
  viewToggle: {
    display: "flex",
    background: "#fff",
    border: "1.5px solid rgba(61,122,90,0.15)",
    borderRadius: 50, overflow: "hidden",
    boxShadow: "0 2px 8px rgba(26,46,26,0.05)",
  },
  viewBtn: {
    padding: "9px 14px", border: "none", background: "transparent",
    color: "#9aa89a", cursor: "pointer", display: "flex",
    alignItems: "center", transition: "all 0.2s",
  },
  viewBtnActive: { background: "#1a2e1a", color: "#f0ece4" },

  /* divider */
  divider: { display: "flex", alignItems: "center", gap: 14, marginBottom: 36 },
  dividerLine: { flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(61,122,90,0.25), transparent)" },

  /* loading skeletons */
  loadingWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))",
    gap: 24,
  },
  skeleton: {
    background: "#fff", borderRadius: 20,
    overflow: "hidden", border: "1px solid rgba(61,122,90,0.06)",
  },
  skelImg: { height: 220, background: "#e8ede8" },
  skelBody: { padding: "18px 20px 22px", display: "flex", flexDirection: "column", gap: 10 },
  skelLine: { height: 14, borderRadius: 8, background: "#e8ede8" },

  /* empty */
  emptyWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "80px 24px", textAlign: "center", position: "relative",
  },
  emptyDeco: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" },
  emptyOrb: {
    width: 96, height: 96, borderRadius: "50%",
    background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 24,
    boxShadow: "0 12px 40px rgba(61,122,90,0.15), inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.9rem", fontWeight: 700, color: "#1a2e1a", marginBottom: 8,
  },
  emptySub: { color: "#6b7c6b", fontSize: 15, marginBottom: 28, maxWidth: 340 },
  emptyBtn: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "#1a2e1a", color: "#f7f5f0",
    padding: "13px 26px", borderRadius: 50,
    fontSize: 14, fontWeight: 600, textDecoration: "none",
    letterSpacing: "0.04em", transition: "all 0.25s",
    boxShadow: "0 8px 24px rgba(26,46,26,0.2)",
  },
  emptyBtnOutline: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "transparent", color: "#3d7a5a",
    border: "1.5px solid #3d7a5a",
    padding: "12px 26px", borderRadius: 50,
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    letterSpacing: "0.04em", transition: "all 0.25s",
  },

  /* grid */
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: 24 },
  listView: { display: "flex", flexDirection: "column", gap: 16 },

  /* grid card */
  card: {
    background: "#fff", borderRadius: 22,
    overflow: "hidden", position: "relative",
    border: "1px solid rgba(61,122,90,0.07)",
    boxShadow: "0 4px 20px rgba(26,46,26,0.06)",
    transition: "transform 0.32s ease, box-shadow 0.32s ease",
  },
  ribbon: {
    position: "absolute", top: 12, left: 12, zIndex: 10,
    background: "linear-gradient(135deg, #1a2e1a, #3d7a5a)",
    color: "#f7f5f0", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.12em", fontFamily: "'Outfit', sans-serif",
    padding: "4px 10px", borderRadius: 50,
    display: "flex", alignItems: "center", gap: 4,
    boxShadow: "0 2px 8px rgba(26,46,26,0.25)",
  },
  removeBtn: {
    position: "absolute", top: 12, right: 12, zIndex: 10,
    width: 34, height: 34, borderRadius: "50%",
    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  imgBox: { height: 230, overflow: "hidden", position: "relative" },
  img: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", display: "block" },
  imgGradient: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(26,46,26,0.18) 0%, transparent 55%)",
  },
  stockOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(244,247,244,0.78)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  stockLabel: {
    fontFamily: "'Outfit', sans-serif", fontSize: 11,
    fontWeight: 700, letterSpacing: "0.18em", color: "#6b7c6b",
    textTransform: "uppercase", border: "1px solid rgba(107,124,107,0.3)",
    padding: "6px 14px", borderRadius: 50,
  },
  quickViewLayer: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    paddingBottom: 16, opacity: 0, transition: "opacity 0.25s",
  },
  quickViewBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "rgba(255,255,255,0.95)", color: "#1a2e1a",
    fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 50,
    backdropFilter: "blur(8px)", boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },
  cardBody: { padding: "16px 18px 20px" },
  cardMeta: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 },
  catTag: {
    fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.2em", textTransform: "uppercase", color: "#3d7a5a",
    background: "rgba(61,122,90,0.09)", padding: "3px 9px", borderRadius: 50,
  },
  lowStockTag: {
    fontSize: 10, fontWeight: 600, color: "#e65100",
    background: "#fff3e0", padding: "2px 8px", borderRadius: 50,
  },
  inStockTag: {
    fontSize: 10, fontWeight: 600, color: "#2e7d32",
    background: "#e8f5e9", padding: "2px 8px", borderRadius: 50,
  },
  cardTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.05rem", fontWeight: 700, color: "#1a2e1a",
    lineHeight: 1.4, marginBottom: 6, cursor: "pointer",
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  cardDesc: {
    fontSize: 13, color: "#7a8c7a", lineHeight: 1.55,
    marginBottom: 10, display: "-webkit-box",
    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  starsRow: { display: "flex", alignItems: "center", gap: 4, marginBottom: 10 },
  reviewCount: { fontSize: 11, color: "#9aa89a" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 },
  price: {
    fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem",
    fontWeight: 700, color: "#1a2e1a", letterSpacing: "-0.01em",
  },
  priceStrike: { fontSize: 13, color: "#c0ccc0", textDecoration: "line-through" },
  actions: { display: "flex", gap: 8, alignItems: "center" },
  viewBtn2: {
    width: 40, height: 40, borderRadius: 12, background: "#f0f5f0",
    border: "1px solid rgba(61,122,90,0.12)", color: "#3d7a5a",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
  },
  cartBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    background: "#1a2e1a", color: "#f7f5f0", border: "none",
    padding: "11px 18px", borderRadius: 12,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", letterSpacing: "0.03em",
    transition: "all 0.25s ease", boxShadow: "0 4px 12px rgba(26,46,26,0.15)",
  },
  cartBtnInCart: {
    background: "rgba(61,122,90,0.12)", color: "#3d7a5a",
    border: "1.5px solid rgba(61,122,90,0.25)", boxShadow: "none",
  },
  cartBtnDisabled: {
    background: "#edf0ed", color: "#a8b8a8", cursor: "not-allowed", boxShadow: "none",
  },

  /* list card */
  listCard: {
    background: "#fff", borderRadius: 18,
    overflow: "hidden", position: "relative",
    border: "1px solid rgba(61,122,90,0.07)",
    boxShadow: "0 2px 12px rgba(26,46,26,0.05)",
    display: "flex", transition: "all 0.3s ease",
  },
  listImgBox: { width: 200, flexShrink: 0, position: "relative", overflow: "hidden" },
  listImg: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" },
  listBody: { flex: 1, padding: "18px 22px 20px", display: "flex", flexDirection: "column" },
  listTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  listTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.2rem", fontWeight: 700, color: "#1a2e1a",
    lineHeight: 1.35, marginBottom: 6, cursor: "pointer",
  },
  listBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", flexWrap: "wrap", gap: 12 },
  removeBtnList: {
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
    color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
  },

  /* pagination */
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 56 },
  pgBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#fff", border: "1.5px solid rgba(61,122,90,0.2)",
    color: "#1a2e1a", padding: "10px 20px", borderRadius: 50,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
  },
  pgBtnOff: { opacity: 0.35, cursor: "not-allowed" },
  dotRow: { display: "flex", gap: 6, alignItems: "center" },
  dot: { height: 7, width: 7, borderRadius: 50, background: "#c8d8c2", border: "none", cursor: "pointer", transition: "all 0.25s" },
  dotActive: { width: 22, background: "#3d7a5a", borderRadius: 50 },
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Outfit:wght@400;500;600;700&display=swap');

  @keyframes wlPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(61,122,90,0.2); }
    50% { box-shadow: 0 0 0 6px rgba(61,122,90,0.07); }
  }
  @keyframes wlShimmer {
    from { background-position: -400px 0; }
    to { background-position: 400px 0; }
  }

  .wl-shimmer {
    background: linear-gradient(90deg, #e8ede8 25%, #d8e8d8 50%, #e8ede8 75%);
    background-size: 800px 100%;
    animation: wlShimmer 1.4s ease infinite;
  }

  /* Card hover */
  .wl-card:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 18px 48px rgba(26,46,26,0.11), 0 0 0 1px rgba(61,122,90,0.1) !important;
  }
  .wl-card:hover .wl-img { transform: scale(1.05); }
  .wl-card:hover .wl-quickView { opacity: 1 !important; }

  /* Remove btn hover */
  .wl-removeBtn:hover {
    background: rgba(239,68,68,0.12) !important;
    border-color: rgba(239,68,68,0.35) !important;
    transform: scale(1.1) rotate(6deg);
  }

  /* Cart btn hover */
  .wl-cartBtn:hover {
    background: #3d7a5a !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(61,122,90,0.28) !important;
  }

  /* View btn hover */
  .wl-viewBtn:hover {
    background: #1a2e1a !important;
    color: #f7f5f0 !important;
    border-color: #1a2e1a !important;
  }

  /* Title hover */
  .wl-cardTitle:hover { color: #3d7a5a !important; transition: color 0.2s; }

  /* Search submit hover */
  .wl-searchSubmit:hover { background: #3d7a5a !important; }

  /* Pagination hover */
  .wl-pgBtn:hover { background: #1a2e1a !important; color: #f7f5f0 !important; border-color: #1a2e1a !important; }

  /* Empty CTA hover */
  .wl-emptyBtn:hover { background: #3d7a5a !important; transform: translateY(-2px) !important; box-shadow: 0 10px 28px rgba(61,122,90,0.25) !important; }

  /* Add all btn hover */
  .wl-addAllBtn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(26,46,26,0.28) !important; }
  .wl-addAllBtn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

  input::placeholder { color: #9aa89a !important; }
  * { box-sizing: border-box; }
`