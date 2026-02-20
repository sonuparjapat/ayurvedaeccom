'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Eye,
  Truck,
  Edit,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Upload,
  Download,
} from 'lucide-react'

import Link from 'next/link'
import axios from '@/lib/axios'

import { useAuth } from '@/context/auth-context'
import AppModal from '@/components/modal/AppModal'
import { notify } from '../utils/notify'


/* ================= TYPES ================= */

interface OrderItem {
  product_id: number
  name: string
  quantity: number
  price: number
  image?: string
}

interface Order {
  id: number
  orderNumber: string
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
  totalAmount: number
  createdAt: string
  estimatedDelivery?: string
  items: OrderItem[]
}

interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  street: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

const intarrdata={
                    "product_id":"",
                    "name":"",
                    "quantity":0,
                    "price": 0,
                    "image": "",
                    rating:0,
                    comment:"",
                    images:[],
                    oldimages:[]
}
/* ================= COMPONENT ================= */

export default function AccountPage() {

  const params = useSearchParams()
  const activeTab = params.get('tab') || 'profile'

  const {
    loginuserdata,
    logout,
    orders,
    loadOrders,
  } = useAuth()


  /* ================= STATES ================= */

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  })


  /* ===== MODAL ===== */

  const [openModal, setOpenModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
const [realreviewdata,setRealReviewData]=useState<any>([])

  /* ===== REVIEW ===== */

const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");
const [images, setImages] = useState([]);

  const [reviewLoading, setReviewLoading] = useState(false)
const [oldImages, setOldImages] = useState([]);
const {loadReviews,reviewsData} = useAuth()

  /* ================= LOAD ================= */

  useEffect(() => {

    if (!loginuserdata?.id) return

    const init = async () => {

      try {

        setLoading(true)

        await loadOrders(loginuserdata.id)

      } finally {
        setLoading(false)
      }
    }

    init()

  }, [loginuserdata, loadOrders])


  /* ================= PROFILE ================= */

  const handleProfileUpdate = async (e: any) => {

    e.preventDefault()

    await new Promise((r) => setTimeout(r, 1000))

    setIsEditing(false)
  }


  /* ================= HELPERS ================= */

  const getStatusColor = (status: string) => {

    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  const getStatusIcon = (status: string) => {

    switch (status) {
      case 'delivered': return <CheckCircle size={16} />
      case 'shipped': return <Truck size={16} />
      case 'processing': return <Clock size={16} />
      default: return <Package size={16} />
    }
  }


  const formatPrice = (price: number) => {

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(price))
  }
console.log(selectedOrder,"selected order")

  /* ================= MODAL ================= */

  const openOrderModal = (order: Order) => {

    setSelectedOrder(order)

    setRating(0)
    setComment('')
    setImages([])

    setOpenModal(true)
  }

const handleImageChange = (e: any) => {

  const files = Array.from(e.target.files || []);

  if (!files.length) return;

  const valid = files.filter((f: any) =>
    f.type.startsWith("image/")
  );

  const totalCount = oldImages.length + images.length + valid.length;

  if (totalCount > 5) {
    alert("Maximum 5 images allowed");
    return;
  }

  const previewImages = valid.map((file: any) => ({
    file,
    preview: URL.createObjectURL(file),
  }));

  setImages((prev) => [...prev, ...previewImages]);

  e.target.value = null;
};
 
const removeNewImage = (index: number) => {
  setImages((prev) => {
    URL.revokeObjectURL(prev[index].preview);
    return prev.filter((_, i) => i !== index);
  });
};
const removeOldImage = (index: number) => {
  setOldImages((prev) =>
    prev.filter((_, i) => i !== index)
  );
};
  /* ================= REVIEW ================= */

const submitReview = async (order?:any,productId: any) => {

  if (!rating) return alert("Select rating");

  try {

    setReviewLoading(true);

    const form = new FormData();

    form.append("rating", String(rating));
    form.append("comment", comment);

    // VERY IMPORTANT
    form.append("oldImages", JSON.stringify(oldImages));

    images.forEach((img) =>
      form.append("images", img.file)
    );

    await axios.post(`/shop/reviews/order/${order.id}/product/${productId}`, form);

    notify.success("Review submitted");
loadReviews(productId,1,20,1)  
  setRating(0);
    setComment("");
    setImages([]);
    setOldImages([]);

  } catch (err) {

    alert("Review failed");

  } finally {

    setReviewLoading(false);
  }
};
console.log(realreview)
  /* ================= LOADER ================= */

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }


  /* ================= UI ================= */

  return (

    <div className="min-h-screen flex flex-col">

      <Header />


      <main className="flex-1 bg-gray-50">

        <div className="container mx-auto px-4 py-8">


          {/* HEADER */}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">

            <div className="flex flex-col md:flex-row justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">

                  <User className="w-8 h-8 text-emerald-600" />

                </div>


                <div>

                  <h1 className="text-2xl font-bold">

                    Welcome, {loginuserdata?.name}!

                  </h1>

                  <p className="text-gray-600">

                    Manage your account and orders

                  </p>

                </div>

              </div>


              <Button
                variant="outline"
                onClick={() => logout('users')}
              >

                <LogOut size={16} className="mr-2" />
                Logout

              </Button>

            </div>

          </div>


          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">


            {/* SIDEBAR */}

            <div>

              <Card>

                <CardContent className="p-0">

                  <nav className="space-y-1">


                    <Link href="/account"
                      className="flex gap-3 px-4 py-3 font-medium text-emerald-600 bg-emerald-50"
                    >
                      <User size={16} /> Profile
                    </Link>


                    <Link href="/account?tab=orders"
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                      <Package size={16} /> Orders
                    </Link>


                    <Link href="/account?tab=addresses"
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                      <MapPin size={16} /> Addresses
                    </Link>


                    <Link href="/wishlist"
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                      <Heart size={16} /> Wishlist
                    </Link>


                    <Link href="/account?tab=payment"
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                      <CreditCard size={16} /> Payment
                    </Link>


                    <Link href="/account?tab=settings"
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                      <Settings size={16} /> Settings
                    </Link>

                  </nav>

                </CardContent>

              </Card>

            </div>


            {/* MAIN */}

            <div className="lg:col-span-3">


              <Tabs value={activeTab} className="space-y-6">


                <TabsList className="grid grid-cols-2 md:grid-cols-5">

                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>

                </TabsList>


                {/* ================= PROFILE ================= */}

                <TabsContent value="profile">

                  <Card>

                    <CardHeader>

                      <div className="flex justify-between">

                        <CardTitle>Profile</CardTitle>


                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(!isEditing)}
                        >

                          <Edit size={14} className="mr-2" />
                          {isEditing ? 'Cancel' : 'Edit'}

                        </Button>

                      </div>

                    </CardHeader>


                    <CardContent>

                      {isEditing ? (

                        <form
                          onSubmit={handleProfileUpdate}
                          className="space-y-4"
                        >

                          <Input
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                name: e.target.value,
                              })
                            }
                          />

                          <Input
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                          />

                          <Input
                            placeholder="Phone"
                            value={editForm.phone}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                phone: e.target.value,
                              })
                            }
                          />


                          <div className="flex gap-3">

                            <Button type="submit">
                              Save
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>

                          </div>

                        </form>

                      ) : (

                        <div className="grid grid-cols-2 gap-4">

                          <div>
                            <p className="text-sm">Name</p>
                            <p>{loginuserdata?.name}</p>
                          </div>

                          <div>
                            <p className="text-sm">Email</p>
                            <p>{loginuserdata?.email}</p>
                          </div>

                          <div>
                            <p className="text-sm">Phone</p>
                            <p>{loginuserdata?.phone}</p>
                          </div>

                          <div>
                            <p className="text-sm">Member Since</p>
                            <p>2024</p>
                          </div>

                        </div>

                      )}

                    </CardContent>

                  </Card>

                </TabsContent>


                {/* ================= ORDERS ================= */}

                <TabsContent value="orders">

                  <div className="space-y-4">


                    {!orders?.length ? (

                      <Card>

                        <CardContent className="text-center py-12">

                          <Package size={64} className="mx-auto text-gray-300 mb-4" />

                          <h3 className="font-semibold mb-2">

                            No orders yet

                          </h3>


                          <Button asChild>

                            <Link href="/products">

                              Start Shopping
                              <ArrowRight size={14} className="ml-2" />

                            </Link>

                          </Button>

                        </CardContent>

                      </Card>

                    ) : (


                      orders.map((order: Order) => (

                        <Card key={order.id}>

                          <CardContent className="p-6">


                            {/* HEADER */}

                            <div className="flex justify-between mb-4">

                              <div>

                                <h3 className="font-semibold">

                                  Order #{order.orderNumber}

                                </h3>

                                <p className="text-sm text-gray-500">

                                  {new Date(order.createdAt).toDateString()}

                                </p>

                              </div>


                              <Badge className={getStatusColor(order.status)}>

                                <span className="flex gap-1 items-center">

                                  {getStatusIcon(order.status)}
                                  {order.status}

                                </span>

                              </Badge>

                            </div>


                            {/* ITEMS */}

                            <div className="space-y-3 mb-4">

                              {order.items.map((item, i) => (

                                <div key={i} className="flex gap-4 items-center">

                                  <img
                                    src={item.image || '/placeholder.png'}
                                    className="w-12 h-12 rounded object-cover"
                                  />


                                  <div className="flex-1">

                                    <p className="font-medium">{item.name}</p>

                                    <p className="text-sm text-gray-500">

                                      Qty: {item.quantity}

                                    </p>

                                  </div>


                                  <p className="font-medium">

                                    {formatPrice(item.price * item.quantity)}

                                  </p>

                                </div>

                              ))}

                            </div>


                            {/* FOOTER */}

                            <div className="flex justify-between border-t pt-4">

                              <div>

                                <p className="text-sm text-gray-500">Total</p>

                                <p className="text-lg font-bold">

                                  {formatPrice(order.totalAmount)}

                                </p>

                              </div>


                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async() =>{ 
                                 await loadReviews(order?.items?.map((item:any)=>item?.product_id),1,10,1)
                            const data=reviewsData?.data?.filter((item:any)=>item?.order_id==selectedOrder?.id)
                      const data2 = orders?.flatMap((el: any) =>
  el.items.map((item: any) => ({
    ...item,

    // always present
    rating:reviewsData?.data?.find((item2:any)=>item2?.order_id==selectedOrder?.id&&item2?.product_id==item?.product_id)?.rating ?? null,
    comment: reviewsData?.data?.find((item2:any)=>item2?.order_id==selectedOrder?.id&&item2?.product_id==item?.product_id)?.comment ?? "",
    images:[],
    oldImages:reviewsData?.data?.find((item2:any)=>item2?.order_id==selectedOrder?.id&&item2?.product_id==item?.product_id)?.images ?? [],
  }))
);
                     setRealReviewData(data2)
                                  openOrderModal(order)}}
                              >

                                <Eye size={14} className="mr-2" />
                                View Details

                              </Button>

                            </div>

                          </CardContent>

                        </Card>

                      ))

                    )}

                  </div>

                </TabsContent>


                {/* OTHER TABS */}

                <TabsContent value="addresses" />
                <TabsContent value="payment" />
                <TabsContent value="settings" />


              </Tabs>

            </div>

          </div>

        </div>

      </main>


      <Footer />


      {/* ================= MODAL ================= */}

      <AppModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Order Details"
        width="max-w-4xl"
      >

        {selectedOrder && (

          <div className="space-y-6">


            {/* SUMMARY */}

           <div className="bg-gray-50 p-4 rounded-lg space-y-4">

  {/* Order Basic Info */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

    <div>
      <p className="text-xs text-gray-500">Order</p>
      <p className="font-medium">{selectedOrder.orderNumber}</p>
    </div>

    <div>
      <p className="text-xs text-gray-500">Order Date</p>
      <p className="font-medium">
        {new Date(selectedOrder?.createdAt).toDateString()}
      </p>
    </div>

    <div>
      <p className="text-xs text-gray-500">Status</p>
      <Badge className={getStatusColor(selectedOrder.status)}>
        {selectedOrder.status}
      </Badge>
    </div>

    {selectedOrder?.invoice_date && 
    <div>
    <div className="flex flex-row">
      <div>
      <p className="text-xs text-gray-500">Invoice Date</p>
      <p className="font-medium">
        {new Date(selectedOrder?.invoice_date).toDateString()}
      </p></div>
      <a  href={selectedOrder?.pdf_url} target="_blank">
      <Download className="ml-2 mt-4 text-green-400" /></a>
    </div>
    
   </div>}

  </div>

  {/* Price Breakup */}
  <div className="border-t pt-3 space-y-2 text-sm">

    <div className="flex justify-between">
      <span className="text-gray-600">Subtotal</span>
      <span>{formatPrice(selectedOrder?.shipping_address?.price_breakup?.subtotal || 0)}</span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-600">GST</span>
      <span>{formatPrice(selectedOrder?.shipping_address?.price_breakup?.gst || 0)}</span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-600">Delivery</span>
      <span>{formatPrice(selectedOrder?.shipping_address?.price_breakup?.delivery || 0)}</span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-600">Platform Fee</span>
      <span>{formatPrice(selectedOrder?.shipping_address?.price_breakup?.platform_fee || 0)}</span>
    </div>

    <div className="border-t pt-2 flex justify-between font-semibold text-base">
      <span>Grand Total</span>
      <span>{formatPrice(selectedOrder?.shipping_address?.price_breakup?.grand_total || selectedOrder?.total_amount)}</span>
    </div>

  </div>

</div>


            {/* PRODUCTS */}

          <div className="space-y-4">

  {realreviewdata?.map((item: any, i: number) => (

    <div
      key={i}
      className="border rounded-xl p-4 bg-white shadow-sm space-y-4"
    >

      {/* ================= PRODUCT ROW ================= */}
      <div className="flex gap-4 items-center">

        <img
          src={item.image || "/placeholder.png"}
          className="w-14 h-14 rounded-lg object-cover border"
          alt={item.name}
        />

        <div className="flex-1">

          <p className="font-medium text-sm">
            {item.name}
          </p>

          <p className="text-xs text-gray-500">
            Qty: {item.quantity}
          </p>

        </div>

        <p className="font-semibold text-sm">
          {formatPrice(item.price * item.quantity)}
        </p>

      </div>

      {/* ================= REVIEW SECTION ================= */}
      {selectedOrder?.status === "delivered" && (

        <div className="border-t pt-4 space-y-4">

          <h4 className="font-semibold text-sm">
            Rate this Product
          </h4>

          {/* ⭐ Rating */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={24}
                onClick={() => setRating(n)}
                className={`cursor-pointer transition ${
                  n <= item?.rating
                    ? "text-yellow-400 fill-yellow-400 scale-110"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              />
            ))}
          </div>

          {item?.rating === 0 && (
            <p className="text-xs text-red-500">
              Please select rating
            </p>
          )}

          {/* 📝 Comment */}
          <textarea
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none"
            rows={3}
            placeholder="Share your experience..."
            value={item?.comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
          />

          <p className="text-xs text-gray-400 text-right">
            {comment.length}/300
          </p>

          {/* 📤 Upload */}
          <label className="flex items-center gap-2 text-xs cursor-pointer text-primary hover:underline">

            <Upload size={16} />

            Add Photos (Max 5)

            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />

          </label>

          {/* 🖼️ OLD IMAGES */}
          {item?.oldImages?.length > 0 && (

            <div className="flex gap-3 flex-wrap">

              {item?.oldImages?.map((url: string, i: number) => (

                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border group"
                >

                  <img
                    src={url}
                    className="w-full h-full object-cover"
                    alt="old"
                  />

                  <button
                    onClick={() => removeOldImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>

                </div>
              ))}

            </div>
          )}

          {/* 🖼️ NEW IMAGES */}
          {item?.images?.length > 0 && (

            <div className="flex gap-3 flex-wrap">

              {item?.images.map((img: any, i: number) => (

                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border group"
                >

                  <img
                    src={img.preview}
                    className="w-full h-full object-cover"
                    alt="preview"
                  />

                  <button
                    onClick={() => removeNewImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>

                </div>
              ))}

            </div>
          )}

          {/* 🚀 Submit */}
          <Button
            disabled={
              reviewLoading ||
              rating === 0 ||
              comment.trim().length < 5
            }
            onClick={() =>
              submitReview(selectedOrder, item.product_id)
            }
            className="w-full text-sm"
          >
            {reviewLoading ? "Submitting..." : "Submit Review"}
          </Button>

        </div>
      )}

    </div>
  ))}

</div>


            {/* REVIEW */}

          

          </div>

        )}

      </AppModal>

    </div>
  )
}
