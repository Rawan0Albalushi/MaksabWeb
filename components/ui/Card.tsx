'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'lg',
      hoverable = false,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white shadow-sm border border-[var(--border)]/50',
      elevated: 'bg-white shadow-lg shadow-black/5 border border-white/80',
      outline: 'bg-white border-2 border-[var(--border)]',
      glass: 'bg-white/80 backdrop-blur-sm border border-white/60 shadow-lg shadow-black/5',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-2xl overflow-hidden transition-all duration-200',
          variants[variant],
          paddings[padding],
          hoverable && 'hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5 cursor-pointer',
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

