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
    text: 'rounded-[var(--radius-sm)]',
    circular: 'rounded-full',
    rectangular: 'rounded-[var(--radius-md)]',
  };

  return (
    <div
      className={clsx('skeleton bg-[var(--border)]', variants[variant], className)}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
};

// Pre-built skeleton components
export const ShopCardSkeleton = () => (
  <div className="bg-white rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
    <Skeleton variant="rectangular" className="w-full aspect-[4/3]" />
    <div className="p-4 pt-8 space-y-3">
      <Skeleton width="70%" height={18} />
      <Skeleton width="50%" height={14} />
      <div className="flex gap-2 pt-2">
        <Skeleton width={50} height={22} className="rounded-full" />
        <Skeleton width={70} height={22} className="rounded-full" />
        <Skeleton width={50} height={22} className="rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
    <Skeleton variant="rectangular" className="w-full aspect-square" />
    <div className="p-3 space-y-2">
      <Skeleton width="80%" height={16} />
      <Skeleton width="50%" height={12} />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width={60} height={20} />
        <Skeleton variant="circular" width={36} height={36} />
      </div>
    </div>
  </div>
);

export const CategorySkeleton = () => (
  <div className="flex flex-col items-center gap-2 p-2">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl skeleton bg-[var(--border)]" />
    <Skeleton width={50} height={12} />
  </div>
);

export const BannerSkeleton = () => (
  <div className="relative">
    <Skeleton 
      variant="rectangular" 
      className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl" 
    />
    {/* Floating promo skeleton */}
    <div className="absolute -bottom-6 -end-6 lg:end-auto lg:-start-12 bg-white rounded-2xl p-4 shadow-xl hidden sm:flex items-center gap-3">
      <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
      <div className="space-y-1">
        <Skeleton width={60} height={12} />
        <Skeleton width={100} height={16} />
      </div>
    </div>
  </div>
);

export const StorySkeleton = () => (
  <div className="flex-shrink-0">
    <div className="w-20 h-20 rounded-full p-[3px] bg-[var(--border)]">
      <div className="w-full h-full rounded-full bg-white p-[2px]">
        <Skeleton variant="circular" className="w-full h-full" />
      </div>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <section className="relative min-h-[auto] sm:min-h-[420px] lg:min-h-[480px] flex items-start sm:items-center z-[100]">
    {/* Background matching the actual hero */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] overflow-hidden">
      <div className="absolute top-10 sm:top-20 start-5 sm:start-10 w-32 sm:w-72 h-32 sm:h-72 bg-[var(--primary)]/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 sm:bottom-24 end-5 sm:end-10 w-32 sm:w-72 h-32 sm:h-72 bg-[var(--primary-dark)]/30 rounded-full blur-3xl opacity-50" />
    </div>

    <div className="container relative z-10 sm:pt-6 sm:pb-6 lg:py-10" style={{ paddingTop: '70px', paddingBottom: '40px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 items-center">
        {/* Hero Content Skeleton */}
        <div className="text-center lg:text-start flex flex-col items-center lg:items-start gap-2 sm:gap-0">
          {/* Title */}
          <div className="space-y-1.5 sm:space-y-2 w-full flex flex-col items-center lg:items-start">
            <Skeleton width="85%" height={28} className="!bg-white/10 sm:hidden rounded-lg" />
            <Skeleton width="65%" height={28} className="!bg-white/10 sm:hidden rounded-lg" />
            <Skeleton width="80%" height={40} className="!bg-white/10 hidden sm:block lg:hidden rounded-lg" />
            <Skeleton width="60%" height={40} className="!bg-white/10 hidden sm:block lg:hidden rounded-lg" />
            <Skeleton width="90%" height={48} className="!bg-white/10 hidden lg:block rounded-lg" />
            <Skeleton width="70%" height={48} className="!bg-white/10 hidden lg:block rounded-lg" />
          </div>

          {/* Spacer */}
          <div className="h-1.5 sm:h-3" />
          
          {/* Subtitle */}
          <div className="w-full flex justify-center lg:justify-start">
            <Skeleton width="90%" height={16} className="!bg-white/10 max-w-lg rounded-md sm:hidden" />
            <Skeleton width="85%" height={20} className="!bg-white/10 max-w-lg rounded-md hidden sm:block" />
          </div>

          {/* Spacer */}
          <div className="h-2 sm:h-4" />

          {/* Location Selector Skeleton */}
          <div className="relative max-w-md mx-auto lg:mx-0 z-[60] w-full px-1 sm:px-0">
            <div className="relative flex items-center rounded-xl sm:rounded-2xl border transition-all duration-300 bg-gradient-to-r from-white/[0.08] to-white/[0.04] backdrop-blur-xl border-white/[0.12] h-12 sm:h-14">
              <div className="flex items-center gap-3 px-4 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton width={60} height={10} className="!bg-white/15 rounded mb-1" />
                  <Skeleton width={120} height={14} className="!bg-white/20 rounded" />
                </div>
                <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-3 sm:h-5" />

          {/* Stats Skeleton */}
          <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-10 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative text-center lg:text-start">
                {i > 1 && (
                  <div className="absolute -start-2 sm:-start-5 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                )}
                <Skeleton width={50} height={20} className="!bg-white/15 rounded mb-1 sm:hidden mx-auto lg:mx-0" />
                <Skeleton width={70} height={28} className="!bg-white/15 rounded mb-1 hidden sm:block mx-auto lg:mx-0" />
                <Skeleton width={45} height={10} className="!bg-white/10 rounded sm:hidden mx-auto lg:mx-0" />
                <Skeleton width={55} height={12} className="!bg-white/10 rounded hidden sm:block mx-auto lg:mx-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Hero Banner Skeleton */}
        <div className="relative mt-4 lg:mt-0">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl">
            <Skeleton 
              variant="rectangular" 
              className="w-full aspect-[16/10] sm:aspect-[16/9] !bg-white/10 rounded-xl sm:rounded-2xl lg:rounded-3xl" 
            />
            {/* Slide indicator skeleton */}
            <div className="absolute top-3 sm:top-4 end-3 sm:end-4 z-10">
              <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1">
                <Skeleton width={20} height={10} className="!bg-white/20 rounded" />
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
