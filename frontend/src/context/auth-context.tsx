"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { usePathname } from 'next/navigation'
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

const AuthContext = createContext<any | undefined>(undefined)

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
const [settings,setSettings]=useState<any>([])
const [wishlistdata,setWishlistdata]=useState<any>({loading:false})

  const router = useRouter()
  const pathname=usePathname()

  /* ======================
     Fetch Cart
  ====================== */

  const fetchCart = async (id: number, value?: boolean) => {

    if (!id) return
await getwishlist()
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
      window.location.href = '/'
    } 
    else {
      notify.error('Failed to load cart')
    }
    }finally{
      setCartLoading(false)
    }
  }
  const getsettings = async () => {


    try {
  
      const res = await axios.get("/admin/settings")

      setSettings(res?.data?.data||[])
     

   

    } catch (err:any) {
      console.log(err)
      
   
    }
  }
  /* ======================
     Load User
  ====================== */
const getintdata=async()=>{
  try{
    await getsettings()
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
const getwishlist=async(params?:any)=>{
  setWishlistdata((pre:any)=>({...pre,loading:true}))
  try{
const wishlistres=await axios.get('/shop',params&&params)

setWishlistdata({
      items: wishlistres.data.data||[],
 loading:false,
      totalItems:wishlistres?.data?.pagination?.totalPages
    })
  }catch(err){
    if(err?.response?.status==401){
      router.push('/')
    }
  }finally{
      setWishlistdata((pre:any)=>({...pre,loading:false}))
  }
}
  useEffect(() => {
console.log(pathname,"pathname")
    const fetchUser = async () => {
if(pathname!="/adminauth"&&pathname!="/auth"&&pathname!="/"){


      try {
await getsettings()
        const res:any = await axios.get("/users/me")
console.log(res,"response")
        if (res.status==200) {
          setLoginUserdata(res.data.user)
          if(res?.data?.user?.role==3){
fetchCart(res.data.user.id)
          }
          if([1,2]?.includes(Number(res?.data?.user?.role))){
getintdata(res?.data?.user)

          }
              
        }

      } catch (err) {
        setLoginUserdata(null)
      if(err?.response?.status==401){
    notify.error('Please login first')
     
          router.push("/")}}
        
       finally {
        setLoading(false)
      }}
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

  const login = async(data: User) => {
    await getintdata()
    setLoginUserdata(data)
    if(data?.role==3){
  fetchCart(data.id)
    }
  
   
  }

  /* ======================
     Logout
  ====================== */

  const logout = async (type:any) => {

    try {

      const res = await axios.post(`/${type}/logout`)

      if (res.status === 200) {
if(type=="users"){
  setCartData([])
        setTotalCartProducts(0)

        router.push("/auth")
}else{
  router.push("/adminauth")}
        setLoginUserdata(null)
      
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
        setStatusList,
    settings,
wishlistdata,
    setWishlistdata,
    getwishlist,
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
