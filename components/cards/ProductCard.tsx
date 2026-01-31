'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Heart, Plus, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '@/components/ui';
import { useFavoritesStore } from '@/store';
import { useTranslations } from 'next-intl';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
  showShop?: boolean;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

const ProductCard = ({
  product,
  variant = 'default',
  showShop = false,
  onAddToCart,
  className,
}: ProductCardProps) => {
  const t = useTranslations('common');
  const tProduct = useTranslations('product');
  const { toggleFavoriteProduct, isFavoriteProduct } = useFavoritesStore();
  const isFavorite = isFavoriteProduct(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteProduct(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const stock = product.stocks?.[0];
  const price = stock?.total_price ?? stock?.price ?? 0;
  const originalPrice = stock?.price ?? 0;
  const hasDiscount = stock?.discount && stock.discount > 0;
  const discountPercent = hasDiscount ? Math.round((stock!.discount! / originalPrice) * 100) : 0;
  const isOutOfStock = stock?.quantity === 0;

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/products/${product.uuid}`}
        className={clsx(
          'flex gap-4 p-4 bg-white rounded-[var(--radius-lg)] hover-lift',
          className
        )}
      >
        <div className="relative w-24 h-24 shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-[var(--main-bg)]">
          {product.img ? (
            <Image
              src={product.img}
              alt={product.translation?.title || ''}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-grey)]">
              <ShoppingBag size={32} />
            </div>
          )}
          {hasDiscount && (
            <Badge variant="error" size="sm" className="absolute top-1 start-1">
              -{discountPercent}%
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-bold text-[var(--black)] line-clamp-1 mb-1">
            {product.translation?.title}
          </h3>
          <p className="text-sm text-[var(--text-grey)] line-clamp-2 mb-auto">
            {product.translation?.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--primary)]">
                {t('sar')} {price.toFixed(3)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-[var(--text-grey)] line-through">
                  {t('sar')} {originalPrice.toFixed(3)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/products/${product.uuid}`}
        className={clsx(
          'block p-3 bg-white rounded-[var(--radius-md)] hover-scale',
          className
        )}
      >
        <div className="relative aspect-square mb-3 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--main-bg)]">
          {product.img ? (
            <Image
              src={product.img}
              alt={product.translation?.title || ''}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-grey)]">
              <ShoppingBag size={24} />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm text-[var(--black)] line-clamp-1">
          {product.translation?.title}
        </h3>
        <span className="text-sm font-bold text-[var(--primary)]">
          {t('sar')} {price.toFixed(3)}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.uuid}`}
      className={clsx(
        'group block bg-white rounded-[var(--radius-lg)] overflow-hidden hover-lift',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--main-bg)] overflow-hidden">
        {product.img ? (
          <Image
            src={product.img}
            alt={product.translation?.title || ''}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-grey)]">
            <ShoppingBag size={48} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="error" size="sm">
              -{discountPercent}%
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="outline" size="sm" className="bg-white">
              {tProduct('outOfStock')}
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={clsx(
            'absolute top-2 end-2 w-8 h-8 flex items-center justify-center rounded-full',
            'bg-white/90 backdrop-blur-sm transition-all hover:scale-110',
            isFavorite ? 'text-[var(--error)]' : 'text-[var(--text-grey)]'
          )}
        >
          <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-[var(--black)] line-clamp-1 mb-1.5">
          {product.translation?.title}
        </h3>
        {product.translation?.description && (
          <p className="text-sm text-[var(--text-grey)] line-clamp-2 mb-3">
            {product.translation.description}
          </p>
        )}

        {showShop && product.shop && (
          <p className="text-xs text-[var(--primary-dark)] font-medium mb-3">
            {product.shop.translation?.title}
          </p>
        )}

        {/* Price and Add button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-[var(--primary)]">
              {t('sar')} {price.toFixed(3)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[var(--text-grey)] line-through">
                {t('sar')} {originalPrice.toFixed(3)}
              </span>
            )}
          </div>
          
          {!isOutOfStock && onAddToCart && (
            <button
              onClick={handleAddToCart}
              className={clsx(
                'w-11 h-11 flex items-center justify-center rounded-full',
                'bg-[var(--primary)] text-white transition-all',
                'hover:bg-[var(--primary-hover)] hover:scale-110 active:scale-95',
                'shadow-lg shadow-[var(--primary)]/30',
                'ring-2 ring-white ring-offset-1'
              )}
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

