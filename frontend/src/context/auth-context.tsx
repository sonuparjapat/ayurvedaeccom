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
import toast from "react-hot-toast"
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

  // Cart
  opencart: boolean
  setOpencart: React.Dispatch<React.SetStateAction<boolean>>
  totalCartProducts: number
fetchCart: (id?: number, value?: boolean) => void
  handleCart: (value: boolean) => void
 openauth: boolean
setOpenauth: React.Dispatch<React.SetStateAction<boolean>>
authMode: "login" | "register" | "otp"
setAuthMode: React.Dispatch<React.SetStateAction<"login" | "register" | "otp">>
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
  const [openauth, setOpenauth] = useState(false)

const [authMode, setAuthMode] = useState<
  "login" | "register" | "otp"
>("login")
  const [totalCartProducts, setTotalCartProducts] = useState(0)
  const [cartdata, setCartData] = useState<any>({})
const [cartloading,setCartLoading]=useState<boolean>(false)
const [statusList,setStatusList]=useState<any>([])
const [settings,setSettings]=useState<any>([])
const [wishlistdata,setWishlistdata]=useState<any>({loading:false})
const [reviewsData, setReviewsData] = useState({
  loading: false,
  data: [],
  pagination: {
    totalReviews: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
  error: null,
});
const [companydata,setCompanyData]=useState<any>([])
const [postLoginRedirect,
  setPostLoginRedirect] =
  useState("")
const [categoriesdata,setCategoriesdata]=useState<any>([])
const [orders,setOrders]=useState<any>([])
const [topratedReviews,setTopRatedReviews]=useState<any>([])
const [permissions, setPermissions] = useState<string[]>([])

// ========================companydatafun======================
const getcompanydata=useCallback(async()=>{
try{
const res=await axios.get('/company')
if(res?.status==200){
  setCompanyData(res?.data?.data)
}
}catch(error:any){
console.log(error,"companydataerror")
}
},[])
/* ================= LOAD REVIEWS ================= */

const loadReviews = useCallback(
  async (productId: number, page: number = 1, limit: number = 10,me?:any) => {
    try {
      if (!productId) return;

      setReviewsData((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const res =Array.isArray(productId)?await axios.post(`/shop/reviews/product?me=1&page=${page}&limit=${100}`,
         {
          productId
          
        }): await axios.get(
        `/shop/reviews/product/${productId}`,
        {
          params: {
            page,
            limit,
            me,productId
          },
        }
      );

      if (res?.status!=200) {
        throw new Error("Failed to load reviews");
      }

      setReviewsData({
        loading: false,
        data: res?.data.data || [],
        pagination:res?.data.pagination,
        error: null,
      });
      return res?.data?.data

    } catch (error: any) {
      console.error("Review Load Error:", error);

      setReviewsData((prev) => ({
        ...prev,
        loading: false,
        error:
          error?.response?.data?.message ||
          "Unable to load reviews. Try again.",
      }));
    }
  },
  []
);

const getGuestSessionId = useCallback(
  () => {
    if (typeof window === "undefined") return null;

    const value = localStorage.getItem(
      "guest_session_id"
    );

    if (
      !value ||
      value === "null" ||
      value === "undefined" ||
      value.trim() === ""
    ) {
      localStorage.removeItem(
        "guest_session_id"
      );
      return null;
    }

    return value;
  },
  []
);

const createGuestSession = async (
  forceFresh = false
) => {
  try {
    let sessionId = null;

    if (!forceFresh) {
      sessionId =
        getGuestSessionId();
    }

    if (sessionId) {
      return sessionId;
    }

    const res = await axios.post(
      "/cart/guest-session"
    );

    if (
      res.status === 200 &&
      res.data?.sessionId
    ) {
      localStorage.setItem(
        "guest_session_id",
        res.data.sessionId
      );

      return res.data.sessionId;
    }

    return null;

  } catch (err) {
    console.log(err);
    return null;
  }
};

  const router = useRouter()
  const pathname=usePathname()

  /* ======================
     Fetch Cart
  ====================== */

const fetchCart = async (
  id?: number,
  value?: boolean,
  retried = false
) => {
  try {
    setCartLoading(true);

    let url = "/cart";

    const currentUserId =
      id || loginuserdata?.id;

    if (!currentUserId) {
      const sessionId =
        await createGuestSession();

      if (!sessionId) {
        setCartData({
          items: [],
          subtotal: 0,
          totalItems: 0
        });

        setTotalCartProducts(0);

        if (value !== undefined) {
          setOpencart(value);
        }

        return;
      }

      url =
        `/cart?sessionId=${sessionId}`;
    }

    const res = await axios.get(url);

    const items =
      res?.data?.items || [];

    setCartData({
      items,
      subtotal:
        res?.data?.subtotal || 0,
      totalItems: items.length
    });

    setTotalCartProducts(
      items.length
    );

    if (value !== undefined) {
      setOpencart(value);
    }

  } catch (err: any) {
    console.log(err);

    const status =
      err?.response?.status;

    const code =
      err?.response?.data?.code;

    const message =
      err?.response?.data?.message;

    const isSessionIssue =
      status === 410 ||
      code === "SESSION_EXPIRED" ||
      code === "INVALID_SESSION" ||
      code === "SESSION_REQUIRED" ||
      message ===
        "Guest session required" ||
      message ===
        "Invalid guest session" ||
      message ===
        "Guest session expired";

    if (
      !loginuserdata?.id &&
      isSessionIssue &&
      !retried
    ) {
      localStorage.removeItem(
        "guest_session_id"
      );

      const newSession =
        await createGuestSession(
          true
        );

      if (newSession) {
        return fetchCart(
          id,
          value,
          true
        );
      }

      setCartData({
        items: [],
        subtotal: 0,
        totalItems: 0
      });

      setTotalCartProducts(0);

      return;
    }

    if (
      err?.response?.status ===
      500
    ) {
      toast.error(
        "Oops! Unable to load cart"
      );
    }

  } finally {
    setCartLoading(false);
  }
};
  // ======================fetch categores=================
  const fetchcat=useCallback(async()=>{
try{const res=await getCategories()
  setCategoriesdata(res?.data?.data||[])
}catch(err:any){
  console.log(err)
}
  },[])
  const mapOrderStatus = (status: number) => {
  switch (status) {
     case 0: return "pending";
    case 1: return "confirmed";
    case 2: return "processing";
    case 3: return "shipped";
        case 4: return "out for delivery";
    case 5: return "delivered";
    case 6: return "cancelled";
    case 7: return "Return Requested";
    case 8: return "Refund";
    case 9: return "Refunded";
    default: return "pending";
  }
};
  const loadOrders =useCallback(
    async (id:any) => {
  try {
    setLoading(true);
    const res = await axios.get("/orders/my-orders");

    if (res.status != 200) {
      throw new Error("Failed");
    }

    const formatted = res?.data?.data.map((order: any) => ({
      ...order,
      id: order.id,
      orderNumber: order.invoice_no || `ORD-${order.id}`,
   
      status: mapOrderStatus(order.status),
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
shipping_address:order.shipping_address,
      items: order.items.map((item: any) => ({
        ...item,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || "📦",
      })),
    }));

    setOrders(formatted);

  } catch (err) {
    console.error("Order Load Error:", err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
},[]);


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
const hasPermission = (key: string): boolean => {
  if (!loginuserdata) return false
  if (Number(loginuserdata.role) === 1) return true
  return permissions.includes(key)
}

const fetchPermissions = async () => {
  try {
    const res = await axios.get('/admin/my-permissions')
    if (res?.data?.success) {
      setPermissions(res.data.permissions || [])
    }
  } catch {
    setPermissions([])
  }
}

const getintdata=async(user?: User)=>{
  try{
    await getsettings()
    // /admin/status_codes is an admin-only endpoint — skip for regular customers
    if(user?.role !== 3){
      const res=await axios.get('/admin/status_codes')
      if(res?.status==200){
        setStatusList(res?.data?.data)
      }else{
        setStatusList([])
      }
      // Fetch RBAC permissions for admin users
      await fetchPermissions()
    }
  }catch(err:any){
    console.log("something went wrong please try after some time")
  }
}
const getwishlist=async(params?:any)=>{
  setWishlistdata((pre:any)=>({...pre,loading:true}))
  try{
const wishlistres=await axios.get('/shop/wishlist',params&&params)

setWishlistdata({
      items: wishlistres.data.data||[],
 loading:false,
      totalItems:wishlistres?.data?.pagination?.totalPages
    })
  }catch (err:any) {
  if (err?.response?.status === 401) {
    setWishlistdata({
      items: [],
      totalItems: 0,
      loading: false
    });
    return;
  }
}finally{
      setWishlistdata((pre:any)=>({...pre,loading:false}))
  }
}
const fetchUser = async () => {
  if (
    pathname === "/adminauth" ||
    pathname === "/auth"
  ) {
    setLoading(false);
    return;
  }

  try {
    await getsettings();

    const res: any = await axios.get("/users/me");

    if (res.status === 200) {
      setLoginUserdata(res.data.user);

      if (res?.data?.user?.role == 3) {
        fetchCart(res.data.user.id);
      }

      if (
        [1, 2].includes(
          Number(res?.data?.user?.role)
        )
      ) {
        getintdata();
      }

      await fetchcat();
    }

  } catch (err: any) {
    setLoginUserdata(null);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  const init = async () => {
    await fetchUser();
    await fetchcat();
await getcompanydata()
    if (
      pathname !== "/adminauth" &&
      pathname !== "/auth" &&
      !loginuserdata?.id
    ) {
      fetchCart();
    }
  };

  init();
}, []);

  /* ======================
     Handle Cart
  ====================== */

const handleCart = (value: boolean) => {
  fetchCart(undefined, value);
};

  /* ======================
     Login
  ====================== */

const login = async (data: User) => {
  await getintdata(data);

  setLoginUserdata(data);

  try {
    const sessionId =
      getGuestSessionId();

    if (
      sessionId &&
      data?.role == 3
    ) {
      await axios.post(
        "/cart/merge",
        { sessionId }
      );

      localStorage.removeItem(
        "guest_session_id"
      );
    }
  } catch (err) {
    console.log(err);
  }

  if (data?.role == 3) {
    await fetchCart(data.id);
  }

  await fetchcat();
};

  /* ======================
     Logout
  ====================== */

  const logout = async (type:any) => {

    try {

      const res = await axios.post(`/${type}/logout`)

      if (res.status === 200) {
        setPermissions([])
if(type=="users"){
setCartData({
  items: [],
  subtotal: 0,
  totalItems: 0
});
        setTotalCartProducts(0)

        router.push("/")
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
    reviewsData,loadReviews,
    orders,loadOrders,
    fetchUser,
    categoriesdata,
    openauth,
setOpenauth,
authMode,
setAuthMode,
postLoginRedirect,
setPostLoginRedirect,
companydata,
permissions,
hasPermission
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
