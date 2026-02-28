'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth, type Category } from '@/context/auth-context';
import { cn } from '@/lib/utils';

// Theme definitions with gradient colors
const THEMES = [
  {
    name: 'amber',
    gradient: 'from-amber-500 via-orange-400 to-yellow-500',
    glow: 'rgba(245, 158, 11, 0.4)',
    border: 'from-amber-400 to-orange-500',
    text: 'from-amber-600 to-orange-500',
    bgGradient: 'from-amber-500/20 via-orange-400/10 to-yellow-500/20',
  },
  {
    name: 'emerald',
    gradient: 'from-emerald-500 via-green-400 to-teal-500',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: 'from-emerald-400 to-teal-500',
    text: 'from-emerald-600 to-teal-500',
    bgGradient: 'from-emerald-500/20 via-green-400/10 to-teal-500/20',
  },
  {
    name: 'rose',
    gradient: 'from-rose-500 via-pink-400 to-red-500',
    glow: 'rgba(244, 63, 94, 0.4)',
    border: 'from-rose-400 to-pink-500',
    text: 'from-rose-600 to-pink-500',
    bgGradient: 'from-rose-500/20 via-pink-400/10 to-red-500/20',
  },
  {
    name: 'blue',
    gradient: 'from-blue-500 via-indigo-400 to-violet-500',
    glow: 'rgba(59, 130, 246, 0.4)',
    border: 'from-blue-400 to-violet-500',
    text: 'from-blue-600 to-indigo-500',
    bgGradient: 'from-blue-500/20 via-indigo-400/10 to-violet-500/20',
  },
];

// Floating Orb Component - using CSS animation directly
function FloatingOrb({ theme, delay = 0, top, left }: { 
  theme: typeof THEMES[0]; 
  delay?: number;
  top: number;
  left: number;
}) {
  return (
    <div
      className="absolute rounded-full blur-3xl opacity-30 pointer-events-none"
      style={{
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
        animation: 'float 8s ease-in-out infinite',
        animationDelay: `${delay}s`,
        top: `${top}%`,
        left: `${left}%`,
      }}
    />
  );
}

// Ambient Background Component
function AmbientBackground() {
  // Pre-computed positions for consistent SSR
  const orbPositions = [
    { top: 10, left: 20 },
    { top: 30, left: 70 },
    { top: 60, left: 15 },
    { top: 80, left: 60 },
  ];

  const particlePositions = Array.from({ length: 20 }, (_, i) => ({
    top: (i * 5) % 100,
    left: (i * 7 + 10) % 100,
    delay: i * 0.15,
    duration: 2 + (i % 3),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      
      {/* Floating orbs */}
      {THEMES.map((theme, index) => (
        <FloatingOrb
          key={theme.name}
          theme={theme}
          delay={index * 0.8}
          top={orbPositions[index].top}
          left={orbPositions[index].left}
        />
      ))}
      
      {/* Particle decorations */}
      <div className="absolute inset-0">
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              animation: `pulse ${pos.duration}s ease-in-out infinite`,
              animationDelay: `${pos.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Category Card Component with 3D tilt effect
function CategoryCard({
  category,
  theme,
  index
}: {
  category: Category;
  theme: typeof THEMES[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse move handler for 3D tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateX = (mouseY / (rect.height / 2)) * -10;
    const rotateY = (mouseX / (rect.width / 2)) * 10;
    
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      className="group relative animate-fadeUp"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Glow effect behind card */}
      <div
        className={cn(
          "absolute -inset-1 rounded-2xl blur-xl transition-opacity duration-500",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `linear-gradient(135deg, ${theme.glow}, transparent)`,
        }}
      />
      
      {/* Animated border gradient */}
      <div
        className={cn(
          "absolute -inset-[1px] rounded-2xl bg-gradient-to-r opacity-0 transition-opacity duration-300",
          theme.border,
          isHovered && "opacity-100 animate-gradient-rotate"
        )}
        style={{
          backgroundSize: '200% 200%',
        }}
      />
      <a href={`/category/${category?.id}`}>

      <div
        ref={cardRef}
        className={cn(
          "relative h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out",
          "bg-white/80 backdrop-blur-xl",
          "border border-white/50",
          "shadow-[0_8px_32px_rgba(0,0,0,0.1)]",
          "hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
        )}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.02 : 1})`,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        
        {/* Shimmer effect on hover */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none",
            isHovered && "opacity-100"
          )}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0.6) 55%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Theme-colored background gradient */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-500",
            `bg-gradient-to-br ${theme.bgGradient}`,
            isHovered && "opacity-100"
          )}
        />

        {/* Card content */}
        <div className="relative p-6 h-full flex flex-col">
          {/* Icon */}
          <div
            className={cn(
              "text-5xl mb-4 transition-transform duration-300",
              isHovered && "scale-110"
            )}
            style={{
              transform: `translateZ(30px)`,
            }}
          >
            {category.image}
          </div>

          {/* Title */}
          <h3
            className={cn(
              "text-xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent",
              theme.text
            )}
            style={{
              transform: `translateZ(20px)`,
            }}
          >
            {category.name}
          </h3>

          {/* Description */}
          <p
            className="text-gray-600 text-sm mb-4 flex-grow leading-relaxed"
            style={{
              transform: `translateZ(10px)`,
            }}
          >
            {category.description}
          </p>

          {/* Product count and button */}
          <div
            className="flex items-center justify-between mt-auto"
            style={{
              transform: `translateZ(15px)`,
            }}
          >
            <span className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              `bg-gradient-to-r ${theme.bgGradient} text-gray-700`
            )}>
              {category.product_count} Products
            </span>

            <Link href={`/category/${category.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "group/btn relative overflow-hidden transition-all duration-300",
                  "hover:bg-transparent",
                  isHovered && "translate-x-1"
                )}
              >
                <span className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent font-medium",
                  theme.text
                )}>
                  Explore
                </span>
                <ArrowRight
                  className={cn(
                    "ml-1 h-4 w-4 transition-transform duration-300",
                    isHovered && "translate-x-1"
                  )}
                  style={{
                    color: theme.glow.replace('0.4', '1'),
                  }}
                />
              </Button>
            </Link>
          </div>

          {/* Decorative corner gradient */}
          <div
            className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500",
              isHovered && "opacity-60"
            )}
            style={{
              background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
            }}
          />
        </div>
      </div></a>
    </div>
  );
}

// Main CategoriesSection Component
export function CategoriesSection() {
  const { categoriesdata } = useAuth();

  if (!categoriesdata?.rows?.length) {
    return null;
  }

  return (
    <section className="relative min-h-screen py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background */}
      <AmbientBackground />

      {/* Content container */}
      <div className="relative max-w-7xl mx-auto">
        {/* Section header - using CSS animation */}
        <div className="text-center mb-16 animate-fadeUp" style={{ animationDelay: '0ms' }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-white/50 backdrop-blur-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-gray-700">Discover Premium Categories</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
              Shop by Category
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection of premium wellness products, each category crafted with care for your holistic health journey
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesdata?.rows?.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              theme={THEMES[index % THEMES.length]}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA - using CSS animation */}
       
      </div>

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(10px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-10px, 10px) scale(0.9);
          }
          75% {
            transform: translate(15px, 15px) scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes gradient-rotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-fadeUp {
          animation: fadeUp 0.7s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }

        .animate-gradient-rotate {
          animation: gradient-rotate 3s ease infinite;
        }

        .bg-gradient-mesh {
          background-image:
            radial-gradient(at 40% 20%, rgba(245, 158, 11, 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(244, 63, 94, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
        }
      `}</style>
    </section>
  );
}

export default CategoriesSection;