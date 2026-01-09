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
  <div className="min-h-[90vh] lg:min-h-[85vh] bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] flex items-center">
    <div className="container py-12">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Content skeleton */}
        <div className="space-y-6">
          <Skeleton width={180} height={36} className="rounded-full !bg-white/10" />
          <div className="space-y-3">
            <Skeleton width="90%" height={48} className="!bg-white/10" />
            <Skeleton width="70%" height={48} className="!bg-white/10" />
          </div>
          <Skeleton width="80%" height={24} className="!bg-white/10" />
          <Skeleton width="100%" height={64} className="rounded-2xl !bg-white/10" />
          <div className="flex gap-8 pt-4">
            <div className="space-y-2">
              <Skeleton width={80} height={32} className="!bg-white/10" />
              <Skeleton width={60} height={16} className="!bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={32} className="!bg-white/10" />
              <Skeleton width={60} height={16} className="!bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={32} className="!bg-white/10" />
              <Skeleton width={60} height={16} className="!bg-white/10" />
            </div>
          </div>
        </div>
        {/* Banner skeleton */}
        <Skeleton 
          variant="rectangular" 
          className="aspect-[4/3] sm:aspect-[16/10] rounded-3xl !bg-white/10" 
        />
      </div>
    </div>
  </div>
);

export default Skeleton;
