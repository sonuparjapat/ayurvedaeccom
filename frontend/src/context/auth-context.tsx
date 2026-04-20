"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react"
import { usePathname } from 'next/navigation'
import axios from "@/lib/axios"
import { notify } from "@/app/utils/notify"
import { getCategories } from "@/lib/service"

/* ======================
   Types
====================== */

export interface User {
  id: number
  name: string
  email: string
  role: number
  is_verified: boolean
}

interface AuthContextType {
  loginuserdata: User | null
  loading: boolean
  login: (data: User) => Promise<void>
  logout: () => void
  setLoginUserdata: React.Dispatch<React.SetStateAction<User | null>>

  opencart: boolean
  setOpencart: React.Dispatch<React.SetStateAction<boolean>>
  totalCartProducts: number
  fetchCart: (id?: number, value?: boolean) => void
  handleCart: (value: boolean) => void

  openauth: boolean
  setOpenauth: React.Dispatch<React.SetStateAction<boolean>>
  authMode: "login" | "register" | "otp"
  setAuthMode: React.Dispatch<
    React.SetStateAction<"login" | "register" | "otp">
  >
}

const AuthContext = createContext<any | undefined>(undefined)

export const AuthProvider = ({
  children,
}: {
  children: ReactNode
}) => {

  const [loginuserdata, setLoginUserdata] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [opencart, setOpencart] = useState(false)
  const [openauth, setOpenauth] = useState(false)

  const [authMode, setAuthMode] = useState<
    "login" | "register" | "otp"
  >("login")

  const [totalCartProducts, setTotalCartProducts] = useState(0)
  const [cartdata, setCartData] = useState<any>({})
  const [cartloading, setCartLoading] = useState(false)

  const [statusList, setStatusList] = useState<any>([])
  const [settings, setSettings] = useState<any>([])
  const [wishlistdata, setWishlistdata] = useState<any>({ loading: false })

  const [postLoginRedirect, setPostLoginRedirect] = useState("")
  const [categoriesdata, setCategoriesdata] = useState<any>([])
  const [orders, setOrders] = useState<any>([])

  const router = useRouter()
  const pathname = usePathname()

  /* ======================
     Guest Session
  ====================== */

  const getGuestSessionId = useCallback(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("guest_session_id")
  }, [])

  const clearGuestSession = () => {
    if (typeof window === "undefined") return
    localStorage.removeItem("guest_session_id")
  }

  const createGuestSession = async () => {
    try {
      const oldId = getGuestSessionId()

      if (oldId) return oldId

      const res = await axios.post("/cart/guest-session")

      if (res.status === 200 && res.data?.sessionId) {
        localStorage.setItem(
          "guest_session_id",
          res.data.sessionId
        )

        return res.data.sessionId
      }

      return null
    } catch (err) {
      console.log(err)
      return null
    }
  }

  /* ======================
     Fetch Cart
  ====================== */

  const fetchCart = async (
    id?: number,
    value?: boolean,
    retried = false
  ) => {
    try {
      setCartLoading(true)

      let url = "/cart"

      const currentUserId = id || loginuserdata?.id

      if (!currentUserId) {
        const sessionId = await createGuestSession()

        if (sessionId) {
          url = `/cart?sessionId=${sessionId}`
        }
      }

      const res = await axios.get(url)

      const items = res?.data?.items || []

      setCartData({
        items,
        subtotal: res?.data?.subtotal || 0,
        totalItems: items.length,
      })

      setTotalCartProducts(items.length)

      if (value !== undefined) {
        setOpencart(value)
      }

    } catch (err: any) {
      console.log(err)

      const status = err?.response?.status
      const code = err?.response?.data?.code

      const isGuestExpired =
        status === 410 ||
        status === 401 ||
        code === "SESSION_EXPIRED" ||
        code === "INVALID_SESSION"

      if (
        !loginuserdata?.id &&
        isGuestExpired &&
        !retried
      ) {
        clearGuestSession()

        const newSession =
          await createGuestSession()

        if (newSession) {
          return fetchCart(id, value, true)
        }
      }

      if (status === 500) {
        notify.error("Oops! Unable to load cart")
      }

    } finally {
      setCartLoading(false)
    }
  }

  /* ======================
     Categories
  ====================== */

  const fetchcat = useCallback(async () => {
    try {
      const res = await getCategories()
      setCategoriesdata(res?.data?.data || [])
    } catch (err) {
      console.log(err)
    }
  }, [])

  /* ======================
     User Load
  ====================== */

  const getsettings = async () => {
    try {
      const res = await axios.get("/admin/settings")
      setSettings(res?.data?.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  const fetchUser = async () => {
    if (
      pathname === "/adminauth" ||
      pathname === "/auth"
    ) {
      setLoading(false)
      return
    }

    try {
      await getsettings()

      const res: any =
        await axios.get("/users/me")

      if (res.status === 200) {
        setLoginUserdata(res.data.user)

        if (res?.data?.user?.role == 3) {
          fetchCart(res.data.user.id)
        }

        await fetchcat()
      }

    } catch (err) {
      setLoginUserdata(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchUser()
      await fetchcat()

      if (
        pathname !== "/adminauth" &&
        pathname !== "/auth" &&
        !loginuserdata?.id
      ) {
        fetchCart()
      }
    }

    init()
  }, [])

  /* ======================
     Login
  ====================== */

  const login = async (data: User) => {
    setLoginUserdata(data)

    try {
      const sessionId =
        getGuestSessionId()

      if (
        sessionId &&
        data?.role == 3
      ) {
        await axios.post(
          "/cart/merge",
          { sessionId }
        )

        clearGuestSession()
      }
    } catch (err) {
      console.log(err)
    }

    if (data?.role == 3) {
      await fetchCart(data.id)
    }

    await fetchcat()
  }

  /* ======================
     Logout
  ====================== */

  const logout = async (type: any) => {
    try {
      const res = await axios.post(
        `/${type}/logout`
      )

      if (res.status === 200) {
        if (type == "users") {
          setCartData({
            items: [],
            subtotal: 0,
            totalItems: 0,
          })

          setTotalCartProducts(0)
          router.push("/auth")

        } else {
          router.push("/adminauth")
        }

        setLoginUserdata(null)
      }

    } catch (err) {
      console.error("Logout error", err)
    }
  }

  const handleCart = (value: boolean) => {
    fetchCart(undefined, value)
  }

  return (
    <AuthContext.Provider
      value={{
        loginuserdata,
        loading,
        login,
        logout,
        setLoginUserdata,

        opencart,
        setOpencart,
        totalCartProducts,
        fetchCart,
        handleCart,

        cartdata,
        cartloading,

        statusList,
        settings,
        wishlistdata,
        orders,

        categoriesdata,

        openauth,
        setOpenauth,
        authMode,
        setAuthMode,

        postLoginRedirect,
        setPostLoginRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    )
  }

  return ctx
}