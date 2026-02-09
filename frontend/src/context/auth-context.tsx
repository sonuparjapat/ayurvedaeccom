"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"

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

  const [loginuserdata, setLoginUserdata] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  /* Load User On Refresh */

  useEffect(() => {

    const storedUser = localStorage.getItem("user")

    if (storedUser) {
      setLoginUserdata(JSON.parse(storedUser))
    }

    setLoading(false)

  }, [])


  /* Login */

  const login = (data: User) => {

    localStorage.setItem("user", JSON.stringify(data))

    setLoginUserdata(data)
  }


  /* Logout */

  const logout = () => {

    localStorage.removeItem("user")

    setLoginUserdata(null)
    router.push("/")
  }


  return (
    <AuthContext.Provider
      value={{
        loginuserdata,
        loading,
        login,
        logout,
        setLoginUserdata,
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
