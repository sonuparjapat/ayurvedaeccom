'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'


export default function StarRating({
  productId,
  avgRating,
  refresh
}: {
  productId: string
  avgRating: number
}) {

  const [rating, setRating] =
    useState(Math.round(avgRating))

  const [hover, setHover] = useState(0)


  const submitRating = async (value: number) => {

    try {

      await axios.post('/shop/review', {
        productId,
        rating: value,
        comment: '',
      })

      setRating(value)
refresh()
      toast.success('Thanks for rating ⭐')

    } catch {

      toast.error('Please login first')

    }

  }


  return (

    <div className="flex gap-1 items-center">

      {[1,2,3,4,5].map(i => (

        <button
          key={i}
          type="button"
          onClick={() => submitRating(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >

          <Star
            size={16}
            className={`transition ${
              i <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />

        </button>

      ))}

    </div>

  )
}