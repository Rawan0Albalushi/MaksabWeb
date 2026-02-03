'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Timer, Star, Heart, MapPin, BadgeCheck, CalendarDays } from 'lucide-react';
import { Shop } from '@/types';
import { useFavoritesStore } from '@/store';
import { useTranslations } from 'next-intl';

interface ShopCardProps {
  shop: Shop;
  variant?: 'default' | 'compact' | 'horizontal';
  className?: string;
}

const ShopCard = ({ shop, variant = 'default', className }: ShopCardProps) => {
  const t = useTranslations('common');
  const { toggleFavoriteShop, isFavoriteShop } = useFavoritesStore();
  const isFavorite = isFavoriteShop(shop.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteShop(shop.id);
  };

  const deliveryTime = shop.delivery_time
    ? `${shop.delivery_time.from}-${shop.delivery_time.to} ${t('min')}`
    : null;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/shops/${shop.uuid}`}
        className={clsx(
          'group flex gap-4 bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-300',
          className
        )}
        style={{ padding: '16px 18px' }}
      >
        {/* Logo */}
        <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-[var(--main-bg)] ring-2 ring-[var(--primary)]/20 group-hover:ring-[var(--primary)]/40 transition-all">
          {shop.logo_img ? (
            <Image
              src={shop.logo_img}
              alt={shop.translation?.title || ''}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold text-2xl">
              {shop.translation?.title?.charAt(0)}
            </div>
          )}
          {/* Closed overlay */}
          {!shop.open && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <span className="text-white text-xs font-medium">
                {t('closed')}
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-[var(--black)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
              {shop.translation?.title}
            </h3>
            {shop.verify && (
              <BadgeCheck size={18} className="text-blue-500 fill-blue-100 shrink-0" />
            )}
          </div>
          <p className="text-sm text-[var(--text-grey)] line-clamp-1 mb-3">
            {shop.translation?.description}
          </p>
          
          {/* Info Row */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {shop.rating_avg !== undefined && shop.rating_avg > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-[var(--star)] text-[var(--star)]" />
                <span className="font-semibold text-[var(--black)]">{shop.rating_avg.toFixed(1)}</span>
                {shop.reviews_count !== undefined && (
                  <span className="text-[var(--text-grey)]">({shop.reviews_count})</span>
                )}
              </div>
            )}
            {deliveryTime && (
              <div className="flex items-center gap-1 text-[var(--text-grey)]">
                <Timer size={14} strokeWidth={2.5} />
                <span>{deliveryTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Favorite - Hidden temporarily */}
        {/* <button
          onClick={handleFavoriteClick}
          className={clsx(
            'shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110',
            isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          )}
        >
          <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
        </button> */}
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/shops/${shop.uuid}`}
        className={clsx(
          'group flex flex-col items-center text-center bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-md transition-all duration-300',
          className
        )}
        style={{ padding: '16px 18px' }}
      >
        {/* Logo with ring */}
        <div className="relative w-16 h-16 mb-3 rounded-full overflow-hidden ring-2 ring-[var(--primary)]/20 group-hover:ring-[var(--primary)]/50 transition-all">
          {shop.logo_img ? (
            <Image
              src={shop.logo_img}
              alt={shop.translation?.title || ''}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold">
              {shop.translation?.title?.charAt(0)}
            </div>
          )}
          {/* Closed overlay */}
          {!shop.open && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <span className="text-white text-[10px] font-medium">
                {t('closed')}
              </span>
            </div>
          )}
        </div>
        
        {/* Title with verify */}
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-semibold text-sm text-[var(--black)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
            {shop.translation?.title}
          </h3>
          {shop.verify && (
            <BadgeCheck size={14} className="text-blue-500 fill-blue-100 shrink-0" />
          )}
        </div>
        
        {/* Rating */}
        {shop.rating_avg !== undefined && shop.rating_avg > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="fill-[var(--star)] text-[var(--star)]" />
            <span className="text-xs font-medium text-[var(--text-grey)]">{shop.rating_avg.toFixed(1)}</span>
          </div>
        )}
      </Link>
    );
  }

  // Default variant - Enhanced design
  return (
    <Link
      href={`/shops/${shop.uuid}`}
      className={clsx(
        'group block bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Background Image + Logo Container */}
      <div className="relative">
        {/* Background Image */}
        <div className="relative h-36 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
          {shop.background_img ? (
            <Image
              src={shop.background_img}
              alt={shop.translation?.title || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary)]/10 to-[var(--primary)]/5" />
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          {/* Favorite button - Hidden temporarily */}
          {/* <button
            onClick={handleFavoriteClick}
            className={clsx(
              'absolute top-2 end-2 sm:top-3 sm:end-3 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all hover:scale-110',
              'bg-white/95 backdrop-blur-sm shadow-md',
              isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            )}
          >
            <Heart size={16} className={clsx("sm:hidden", isFavorite && 'fill-current')} />
            <Heart size={18} className={clsx("hidden sm:block", isFavorite && 'fill-current')} />
          </button> */}

          {/* Closed overlay */}
          {!shop.open && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <span className="text-white text-lg sm:text-xl font-medium">
                {t('closed')}
              </span>
            </div>
          )}
        </div>

        {/* Spacer for logo overlap */}
        <div className="h-9 sm:h-11 bg-white" />

        {/* Logo - Absolutely positioned at the boundary */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
          <div className="relative w-[68px] h-[68px] sm:w-[88px] sm:h-[88px] rounded-xl sm:rounded-2xl overflow-hidden bg-white ring-3 sm:ring-4 ring-[var(--primary)] shadow-xl group-hover:ring-[var(--primary-hover)] transition-all">
          {shop.logo_img ? (
            <Image
              src={shop.logo_img}
              alt={shop.translation?.title || ''}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold text-xl sm:text-2xl">
              {shop.translation?.title?.charAt(0)}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-center" style={{ padding: '10px 14px 16px 14px' }}>
        {/* Title with verify badge */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <h3 className="font-bold text-base sm:text-lg text-[var(--black)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
            {shop.translation?.title}
          </h3>
          {shop.verify && (
            <BadgeCheck size={16} className="text-blue-500 fill-blue-100 shrink-0 sm:hidden" />
          )}
          {shop.verify && (
            <BadgeCheck size={20} className="text-blue-500 fill-blue-100 shrink-0 hidden sm:block" />
          )}
        </div>

        {/* Description/Categories */}
        <p className="text-xs sm:text-sm text-[var(--text-grey)] line-clamp-1 mb-3 sm:mb-4">
          {shop.translation?.description}
        </p>

        {/* Rating */}
        {shop.rating_avg !== undefined && shop.rating_avg > 0 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <span className="font-bold text-base sm:text-lg text-[var(--black)]">{shop.rating_avg.toFixed(1)}</span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={clsx(
                    "sm:hidden",
                    i < Math.round(shop.rating_avg || 0)
                      ? 'fill-[var(--star)] text-[var(--star)]'
                      : 'fill-gray-200 text-gray-200'
                  )}
                />
              ))}
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`lg-${i}`}
                  size={16}
                  className={clsx(
                    "hidden sm:block",
                    i < Math.round(shop.rating_avg || 0)
                      ? 'fill-[var(--star)] text-[var(--star)]'
                      : 'fill-gray-200 text-gray-200'
                  )}
                />
              ))}
            </div>
            {shop.reviews_count !== undefined && (
              <span className="text-xs sm:text-sm text-[var(--text-grey)]">({shop.reviews_count})</span>
            )}
          </div>
        )}

        {/* Shop Info - Horizontal layout */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-[var(--text-grey)] mb-3 sm:mb-4 flex-wrap">
          {deliveryTime && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 rounded-lg" style={{ padding: '6px 10px' }}>
              <Timer size={12} className="text-[var(--primary)] sm:hidden" strokeWidth={2.5} />
              <Timer size={14} className="text-[var(--primary)] hidden sm:block" strokeWidth={2.5} />
              <span>{deliveryTime}</span>
            </div>
          )}
          {shop.created_at && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 rounded-lg hidden sm:flex" style={{ padding: '6px 10px' }}>
              <CalendarDays size={14} className="text-[var(--primary)]" strokeWidth={2.5} />
              <span>{formatDate(shop.created_at)}</span>
            </div>
          )}
        </div>

      </div>
    </Link>
  );
};

export default ShopCard;
