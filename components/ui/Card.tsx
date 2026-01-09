'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white',
      elevated: 'bg-white shadow-[var(--shadow-md)]',
      outline: 'bg-white border border-[var(--border)]',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-[var(--radius-lg)] overflow-hidden',
          variants[variant],
          paddings[padding],
          hoverable && 'hover-lift cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

