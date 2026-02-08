'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CarouselProps {
  children: React.ReactNode[]
  autoSlide?: boolean
  autoSlideInterval?: number
  className?: string
}

export function Carousel({ children, autoSlide = false, autoSlideInterval = 3000, className }: CarouselProps) {
  const [curr, setCurr] = useState(0)

  const prev = () => setCurr((curr) => (curr === 0 ? children.length - 1 : curr - 1))
  const next = () => setCurr((curr) => (curr === children.length - 1 ? 0 : curr + 1))

  useEffect(() => {
    if (!autoSlide) return
    const slideInterval = setInterval(next, autoSlideInterval)
    return () => clearInterval(slideInterval)
  }, [])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="flex transition-transform ease-out duration-500"
        style={{ transform: `translateX(-${curr * 100}%)` }}
      >
        {children}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="bg-white/80 hover:bg-white text-gray-800 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="bg-white/80 hover:bg-white text-gray-800 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      <div className="absolute bottom-4 right-0 left-0">
        <div className="flex items-center justify-center gap-2">
          {children.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                curr === i ? 'bg-white w-8' : 'bg-white/50'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CarouselItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-full', className)}>
      {children}
    </div>
  )
}