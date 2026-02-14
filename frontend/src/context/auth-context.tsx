"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"

import axios from "@/lib/axios"
import { notify } from "@/app/utils/notify"

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
  login: (data: User) => void
  logout: () => void
  setLoginUserdata: React.Dispatch<React.SetStateAction<User | null>>

  // Cart
  opencart: boolean
  setOpencart: React.Dispatch<React.SetStateAction<boolean>>
  totalCartProducts: number
  fetchCart: (id: number, value?: boolean) => void
  handleCart: (value: boolean) => void
}

/* ======================
   Context
====================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ======================
   Provider
====================== */

export const AuthProvider = ({
  children,
}: {
  children: ReactNode
}) => {

  const [loginuserdata, setLoginUserdata] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [opencart, setOpencart] = useState(false)
  const [totalCartProducts, setTotalCartProducts] = useState(0)
  const [cartdata, setCartData] = useState<any>({})
const [cartloading,setCartLoading]=useState<boolean>(false)
const [statusList,setStatusList]=useState<any>([])
  const router = useRouter()

  /* ======================
     Fetch Cart
  ====================== */

  const fetchCart = async (id: number, value?: boolean) => {

    if (!id) return

    try {
      setCartLoading(true)
      const res = await axios.get("/cart")

      setCartData({
      items: res.data.items||[],
      subtotal: res.data.subtotal||0,
      totalItems: res.data.items.length||0
    })
      setTotalCartProducts(res?.data?.totalCartProducts || 0)

      if (value !== undefined) {
        setOpencart(value)
      }

    } catch (err:any) {
      console.log(err)
        if (err?.response?.status === 401) {
      notify.error('Please login first')
      window.location.href = '/login'
    } 
    else {
      notify.error('Failed to load cart')
    }
    }finally{
      setCartLoading(false)
    }
  }

  /* ======================
     Load User
  ====================== */
const getintdata=async()=>{
  try{
const res=await axios.get('/admin/status_codes')
if(res?.status==200){
  setStatusList(res?.data?.data)
}else{
  setStatusList([])
}
  }catch(err:any){
    console.log("something went wrong please try after some time")
  }
}
  useEffect(() => {

    const fetchUser = async () => {

      try {

        const res = await axios.get("/users/me")

        if (res.data?.user) {
          setLoginUserdata(res.data.user)
          fetchCart(res.data.user.id)
              getintdata(res?.data?.user)
        }

      } catch (err) {
        setLoginUserdata(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()


  }, [])

  /* ======================
     Handle Cart
  ====================== */

  const handleCart = (value: boolean) => {
    if (loginuserdata?.id) {
      fetchCart(loginuserdata.id, value)
    }
  }

  /* ======================
     Login
  ====================== */

  const login = (data: User) => {
    setLoginUserdata(data)
    fetchCart(data.id)
  }

  /* ======================
     Logout
  ====================== */

  const logout = async () => {

    try {

      const res = await axios.post("/users/logout")

      if (res.status === 200) {

        setLoginUserdata(null)
        setCartData([])
        setTotalCartProducts(0)

        router.push("/auth")
      }

    } catch (err) {
      console.error("Logout error", err)
    }
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
        cartloading,setCartLoading,
        statusList,
        setStatusList
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* ======================
   Hook
====================== */

export const useAuth = () => {

  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return ctx
}
