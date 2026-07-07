"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import toast from "react-hot-toast"

import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"




export default function ReviewSection({ productId,fetchProduct,product,loginuserdata}: any) {

  const [reviews, setReviews] = useState<any[]>([])

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  const [loading, setLoading] = useState(false)

  /* ================= LOAD ================= */

  const loadReviews = async () => {
    try {
      const { data } = await axios.get(`/shop/reviews/product/${productId}`)
      setReviews(data.reviews || data.data || [])
      const mine = (data.reviews || data.data || []).find((r: any) => r.user_id == loginuserdata?.id)
      if (mine) { setRating(mine.rating); setComment(mine.comment || "") }
    } catch {
      // silent — reviews failing shouldn't block the product page
    }
  }

  useEffect(() => { loadReviews() }, [])

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!loginuserdata) { toast.error("Please login to submit a review"); return }
    if (!rating) { toast.error("Please select a rating"); return }
    try {
      setLoading(true)
      await axios.post("/shop/reviews/product", { productId, rating, comment })
      toast.success("Review saved")
      loadReviews()
      fetchProduct()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login required to review")
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="mt-20">

      <h2 className="text-3xl font-bold mb-6">
        Customer Reviews
      </h2>

      {/* ADD */}

      <div className="bg-white p-6 rounded-xl shadow mb-10">

        <p className="text-sm font-medium text-gray-700 mb-3">Your Rating</p>

        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map(i=>(
            <Star
              key={i}
              onClick={()=>setRating(i)}
              className={`cursor-pointer w-7 h-7 ${
                i<=rating
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
              }`}
            />
          ))}
        </div>

        <textarea
          className="w-full border rounded-lg p-3 mb-4"
          placeholder="Write your experience..."
          rows={3}
          value={comment}
          onChange={e=>setComment(e.target.value)}
        />

        <Button
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Submit Review"}
        </Button>

      </div>

      {/* LIST */}

      <div className="space-y-6">

        {reviews.map(r=>(
          <div
            key={r.id}
            className="bg-white p-5 rounded-xl shadow"
          >

            <div className="flex justify-between mb-2">

              <p className="font-semibold">
                {r.name}
              </p>

              <div className="flex gap-1">
                {[...Array(r.rating)].map((_,i)=>(
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

            </div>

            <p className="text-gray-700 mb-3">
              {r.comment}
            </p>

            {r.images?.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {r.images.map((img:any)=>(
                  <img
                    key={img}
                    src={img}
                    className="w-24 h-24 rounded"
                  />
                ))}
              </div>
            )}

          </div>
        ))}

      </div>

    </div>
  )
}