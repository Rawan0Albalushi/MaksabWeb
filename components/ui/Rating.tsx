'use client';

import { Star } from 'lucide-react';
import { clsx } from 'clsx';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewsCount?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

const Rating = ({
  value,
  max = 5,
  size = 'md',
  showValue = true,
  reviewsCount,
  className,
  interactive = false,
  onChange,
}: RatingProps) => {
  const sizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const handleClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue);
    }
  };

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= Math.floor(value);
          const isHalf = !isFilled && starValue <= Math.ceil(value) && value % 1 >= 0.5;

          return (
            <button
              key={i}
              type={interactive ? 'button' : undefined}
              onClick={() => handleClick(starValue)}
              className={clsx(
                'relative',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default'
              )}
              disabled={!interactive}
            >
              <Star
                size={sizes[size]}
                className={clsx(
                  'transition-colors',
                  isFilled || isHalf
                    ? 'fill-[var(--star)] text-[var(--star)]'
                    : 'fill-[var(--border)] text-[var(--border)]'
                )}
              />
              {isHalf && (
                <Star
                  size={sizes[size]}
                  className="absolute inset-0 fill-[var(--star)] text-[var(--star)]"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span
          className={clsx(
            'font-semibold text-[var(--black)]',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
      {reviewsCount !== undefined && (
        <span className="text-[var(--text-grey)] text-sm">({reviewsCount})</span>
      )}
    </div>
  );
};

export default Rating;

