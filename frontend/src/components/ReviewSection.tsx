"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import toast from "react-hot-toast"

import { Star, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"




export default function ReviewSection({ productId,fetchProduct,product,loginuserdata}: any) {

  const [reviews, setReviews] = useState<any[]>([])

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [oldImages, setOldImages] = useState<string[]>([])

  const [loading, setLoading] = useState(false)

  /* ================= LOAD ================= */

  const loadReviews = async () => {
    const { data } = await axios.get(
      `/shop/getreview/${productId}`
    );

    setReviews(data.data);
    console.log(data?.data?.find((item:any)=>item?.user_id==loginuserdata?.id)?.rating,"user")
    setRating(data?.data?.find((item:any)=>item?.user_id==loginuserdata?.id)?.rating)
  

  };

  useEffect(() => {
    loadReviews();
    console.log(product,"product")

  }, []);

  /* ================= SUBMIT ================= */

  const submit = async () => {
    try {
      setLoading(true);

      const form = new FormData();

      form.append("productId", String(productId));
      form.append("rating", String(rating));
      form.append("comment", comment);

      form.append(
        "oldImages",
        JSON.stringify(oldImages)
      );

      images.forEach(img =>
        form.append("images", img)
      );

      await axios.post("/shop/addreview", form);

      toast.success("Review saved");

      setImages([]);
      setComment("");

      loadReviews();
      fetchProduct()

    } catch(err:any) {
        console.log(err)
      toast.error("Login required");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="mt-20">

      <h2 className="text-3xl font-bold mb-6">
        Customer Reviews
      </h2>

      {/* ADD */}

      <div className="bg-white p-6 rounded-xl shadow mb-10">

        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map(i=>(
            <Star
              key={i}
              onClick={()=>setRating(i)}
              className={`cursor-pointer ${
                i<=rating
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
              }`}
            />
          ))}
        </div>

        <textarea
          className="w-full border rounded-lg p-3 mb-3"
          placeholder="Write your experience..."
          value={comment}
          onChange={e=>setComment(e.target.value)}
        />

        {/* Images */}

        <div className="flex gap-3 mb-4 flex-wrap">

          {oldImages.map(img=>(
            <div key={img} className="relative">
              <img src={img} className="w-20 h-20 rounded" />

              <button
                onClick={() =>
                  setOldImages(prev =>
                    prev.filter(i=>i!==img)
                  )
                }
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <Trash2 size={12}/>
              </button>
            </div>
          ))}

        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={e =>
            setImages(
              Array.from(e.target.files||[])
            )
          }
        />

        <Button
          onClick={submit}
          disabled={loading}
          className="mt-4"
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