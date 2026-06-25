// src/store/index.ts
import { create } from 'zustand'

export interface User {
  id: number
  name: string
  email: string
  role: number
  is_verified: boolean
  phone?: string
}

// ── CartItem: matches your API's GET /cart response shape ─────────────────────
// Your API returns items with these fields — adjust if your backend differs
export interface CartItem {
  id: number           // cart row id
  product_id: number   // foreign key to products
  name: string
  price: number
  quantity: number
  images: string[]     // array of URLs
  inventory: number
  gst_percent?: number
}

export interface CartData {
  items: CartItem[]
  subtotal: number
  totalItems: number
}

export interface Category {
  id: number | string
  name: string
  description?: string
  image_url?: string
  product_count?: number
  tag?: string
  slug?: string
  parent_id?: number | null
  level?: number
  sort_order?: number
  is_featured?: boolean
  banner_url?: string
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo_url?: string
}

export interface CompanyData {
  phone?: string
  email?: string
  name?: string
  logo?: string
}

export interface WishlistItem {
  wishlist_id: number
  id: number
  name: string
  price: number
  compareprice?: number
  images: string
  inventory: number
  averagerating: number
  reviewcount: number
  category_name: string
}

interface AppState {
  // Bootstrap
  bootstrapped: boolean
  setBootstrapped: (v: boolean) => void

  // Auth
  user: User | null
  setUser: (u: User | null) => void

  // Auth modal (screen-level flag — open /auth route)
  authOpen: boolean
  authMode: 'login' | 'register' | 'otp' | 'mobileOtp' | 'forgot'
  setAuthOpen: (v: boolean) => void
  setAuthMode: (m: 'login' | 'register' | 'otp' | 'mobileOtp' | 'forgot') => void

  // Categories
  categories: Category[]
  setCategories: (c: Category[]) => void

  // Company
  companyData: CompanyData[]
  setCompanyData: (d: CompanyData[]) => void

  // Cart — cartCount is derived from items.length and kept in sync
  cartData: CartData
  cartCount: number
  cartLoading: boolean
  setCartData: (d: CartData) => void
  setCartLoading: (v: boolean) => void

  // Wishlist
  wishlistData: { items: WishlistItem[]; loading: boolean; totalItems: number }
  setWishlistData: (d: any) => void
}

export const useStore = create<AppState>((set) => ({
  bootstrapped: false,
  setBootstrapped: (v) => set({ bootstrapped: v }),

  user: null,
  setUser: (u) => set({ user: u }),

  authOpen: false,
  authMode: 'login',
  setAuthOpen: (v) => set({ authOpen: v }),
  setAuthMode: (m) => set({ authMode: m }),

  categories: [],
  setCategories: (c) => set({ categories: c }),

  companyData: [],
  setCompanyData: (d) => set({ companyData: d }),

  cartData: { items: [], subtotal: 0, totalItems: 0 },
  cartCount: 0,
  cartLoading: false,
  // Always sync cartCount with items.length
  setCartData: (d) =>
    set({
      cartData: { ...d, totalItems: d.items?.length ?? 0 },
      cartCount: d.items?.length ?? 0,
    }),
  setCartLoading: (v) => set({ cartLoading: v }),

  wishlistData: { items: [], loading: false, totalItems: 0 },
  setWishlistData: (d) => set({ wishlistData: d }),
}))