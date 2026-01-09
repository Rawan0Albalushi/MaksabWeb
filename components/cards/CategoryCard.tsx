'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Layers } from 'lucide-react';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

const CategoryCard = ({ category, variant = 'default', className }: CategoryCardProps) => {
  if (variant === 'large') {
    return (
      <Link
        href={`/categories/${category.uuid}`}
        className={clsx(
          'group relative block aspect-[4/3] rounded-[var(--radius-xl)] overflow-hidden',
          className
        )}
      >
        {category.img ? (
          <Image
            src={category.img}
            alt={category.translation?.title || ''}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary)] flex items-center justify-center">
            <Layers size={64} className="text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 start-0 end-0 p-5">
          <h3 className="text-xl font-bold text-white mb-1">
            {category.translation?.title}
          </h3>
          {category.products_count !== undefined && (
            <span className="text-sm text-white/80">
              {category.products_count} منتج
            </span>
          )}
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/categories/${category.uuid}`}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 bg-white rounded-[var(--radius-full)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors',
          className
        )}
      >
        {category.img && (
          <div className="relative w-6 h-6 rounded-full overflow-hidden">
            <Image
              src={category.img}
              alt={category.translation?.title || ''}
              fill
              className="object-cover"
            />
          </div>
        )}
        <span className="font-medium text-sm whitespace-nowrap">
          {category.translation?.title}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/categories/${category.uuid}`}
      className={clsx(
        'group flex flex-col items-center text-center p-2',
        className
      )}
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 sm:mb-3 rounded-2xl overflow-hidden bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[var(--border-light)] group-hover:shadow-[0_8px_30px_rgba(255,61,0,0.15)] group-hover:border-[var(--primary)]/30 transition-all duration-300 group-hover:scale-105">
        {category.img ? (
          <Image
            src={category.img}
            alt={category.translation?.title || ''}
            fill
            className="object-cover p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary-dark)]/10">
            <Layers size={28} className="text-[var(--primary)]" />
          </div>
        )}
        
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/0 to-[var(--primary)]/0 group-hover:from-[var(--primary)]/5 group-hover:to-transparent transition-all duration-300" />
      </div>
      <h3 className="font-semibold text-xs sm:text-sm text-[var(--black)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-tight">
        {category.translation?.title}
      </h3>
    </Link>
  );
};

export default CategoryCard;
