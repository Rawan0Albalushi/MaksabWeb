'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) => {
  const variants = {
    text: 'rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={clsx(
        'skeleton bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100',
        variants[variant], 
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
};

// Pre-built skeleton components
// ShopCardSkeleton - 1:1 match with ShopCard default variant structure
export const ShopCardSkeleton = () => (
  <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--border)]">
    {/* Background Image + Logo Container - exact match */}
    <div className="relative">
      {/* Background Image - fixed height, NOT aspect ratio */}
      <div className="relative h-36 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
        <div className="absolute inset-0 skeleton" />
        {/* Gradient overlay to match real card */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Spacer for logo overlap - exact same height */}
      <div className="h-9 sm:h-11 bg-white" />

      {/* Logo - exact position and size as real card */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div className="relative w-[68px] h-[68px] sm:w-[88px] sm:h-[88px] rounded-xl sm:rounded-2xl overflow-hidden bg-white ring-3 sm:ring-4 ring-gray-200 shadow-xl">
          <div className="absolute inset-0 skeleton" />
        </div>
      </div>
    </div>

    {/* Content - exact same padding and structure */}
    <div className="text-center" style={{ padding: '10px 14px 16px 14px' }}>
      {/* Title with badge placeholder */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <div className="h-5 sm:h-6 w-32 sm:w-40 bg-gray-100 rounded-lg skeleton" />
        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-100 rounded-full skeleton shrink-0" />
      </div>

      {/* Description placeholder */}
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className="h-3.5 sm:h-4 w-48 sm:w-56 bg-gray-100 rounded skeleton" />
      </div>

      {/* Rating placeholder - stars + number */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <div className="h-5 sm:h-6 w-8 sm:w-10 bg-gray-100 rounded skeleton" />
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-100 rounded-sm skeleton" />
          ))}
        </div>
        <div className="h-3.5 sm:h-4 w-8 sm:w-10 bg-gray-100 rounded skeleton" />
      </div>

      {/* Shop Info badges placeholder */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <div className="h-7 sm:h-8 w-20 sm:w-24 bg-gray-50 rounded-lg skeleton" />
        <div className="h-7 sm:h-8 w-28 sm:w-32 bg-gray-50 rounded-lg skeleton hidden sm:block" />
      </div>
    </div>
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50">
    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100/80">
      <div className="absolute inset-0 skeleton" />
    </div>
    <div className="p-3 space-y-2">
      <Skeleton width="80%" height={16} className="rounded-md" />
      <Skeleton width="50%" height={12} className="rounded-md" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width={65} height={22} className="rounded-lg" />
        <Skeleton variant="circular" width={38} height={38} />
      </div>
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <div className="flex flex-col items-center gap-2.5 p-2">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 skeleton" />
    <Skeleton width={55} height={12} className="rounded-md" />
  </div>
);

export const BannerSkeleton = () => (
  <div className="relative">
    <div className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 skeleton" />
    {/* Slide indicator skeleton */}
    <div className="absolute top-3 sm:top-4 end-3 sm:end-4 z-10">
      <div className="bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
        <div className="w-8 h-3 rounded bg-white/20" />
      </div>
    </div>
  </div>
);

export const StorySkeleton = () => (
  <div className="flex-shrink-0">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] bg-gradient-to-br from-gray-200 to-gray-100">
      <div className="w-full h-full rounded-full bg-white p-[2px]">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-gray-100 skeleton" />
      </div>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <section className="relative min-h-[auto] sm:min-h-[420px] lg:min-h-[480px] flex items-start sm:items-center z-[100]">
    {/* Background matching the actual hero */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1E272E] via-[#267881] to-[#1A222C] overflow-hidden">
      <div className="absolute top-10 sm:top-20 start-5 sm:start-10 w-32 sm:w-72 h-32 sm:h-72 bg-[var(--primary)]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 sm:bottom-24 end-5 sm:end-10 w-32 sm:w-72 h-32 sm:h-72 bg-[var(--primary-dark)]/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      {/* Grid pattern like actual hero */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>

    <div className="container relative z-10 sm:pt-6 sm:pb-6 lg:py-10" style={{ paddingTop: '70px', paddingBottom: '40px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 items-center">
        {/* Hero Content Skeleton */}
        <div className="text-center lg:text-start flex flex-col items-center lg:items-start gap-2 sm:gap-0">
          {/* Title */}
          <div className="space-y-2 sm:space-y-3 w-full flex flex-col items-center lg:items-start">
            <div className="h-7 sm:h-10 lg:h-12 w-[85%] sm:w-[80%] bg-white/10 rounded-lg animate-pulse" />
            <div className="h-7 sm:h-10 lg:h-12 w-[65%] sm:w-[60%] bg-gradient-to-r from-[var(--primary)]/30 to-[var(--primary-light)]/20 rounded-lg animate-pulse" />
          </div>

          {/* Spacer */}
          <div className="h-2 sm:h-4" />
          
          {/* Subtitle */}
          <div className="w-full flex justify-center lg:justify-start">
            <div className="h-4 sm:h-5 w-[90%] max-w-lg bg-white/8 rounded-md animate-pulse" />
          </div>

          {/* Spacer */}
          <div className="h-3 sm:h-5" />

          {/* Location Selector Skeleton */}
          <div className="relative max-w-md mx-auto lg:mx-0 w-full px-1 sm:px-0">
            {/* Outer glow effect */}
            <div className="absolute -inset-1 rounded-xl sm:rounded-2xl blur-lg opacity-30 bg-gradient-to-r from-[var(--primary)]/20 via-[#ff6b3d]/10 to-[var(--primary-light)]/20 animate-pulse" />
            
            <div className="relative flex items-center rounded-xl sm:rounded-2xl border bg-gradient-to-r from-white/[0.08] to-white/[0.04] backdrop-blur-xl border-white/[0.12] h-12 sm:h-14">
              <div className="flex items-center gap-3 px-4 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--primary)]/20 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-3.5 w-28 bg-white/15 rounded animate-pulse" />
                </div>
                <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-4 sm:h-6" />

          {/* Stats Skeleton */}
          <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-10 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative text-center lg:text-start">
                {i > 1 && (
                  <div className="absolute -start-2 sm:-start-5 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                )}
                <div className="h-5 sm:h-7 w-12 sm:w-16 bg-white/15 rounded mb-1.5 mx-auto lg:mx-0 animate-pulse" />
                <div className="h-2.5 sm:h-3 w-10 sm:w-14 bg-white/8 rounded mx-auto lg:mx-0 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Hero Banner Skeleton */}
        <div className="relative mt-4 lg:mt-0">
          {/* Glow effect */}
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--primary-dark)]/10 rounded-2xl sm:rounded-3xl blur-xl animate-pulse" />
          
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl">
            <div className="w-full aspect-[16/10] sm:aspect-[16/9] bg-white/5 backdrop-blur-sm animate-pulse" />
            {/* Slide indicator skeleton */}
            <div className="absolute top-3 sm:top-4 end-3 sm:end-4 z-10">
              <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                <div className="w-8 h-3 rounded bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Wave Decoration */}
    <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
      <svg
        viewBox="0 0 1440 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-6 sm:h-10 lg:h-[50px]"
        preserveAspectRatio="none"
      >
        <path
          d="M0 50L60 46C120 42 240 34 360 30C480 26 600 26 720 28C840 30 960 34 1080 36C1200 38 1320 38 1380 38L1440 38V50H1380C1320 50 1200 50 1080 50C960 50 840 50 720 50C600 50 480 50 360 50C240 50 120 50 60 50H0Z"
          fill="var(--main-bg)"
        />
      </svg>
    </div>
  </section>
);

export default Skeleton;
