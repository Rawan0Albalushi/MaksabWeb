'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'primary', size = 'md', className, ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--primary)] text-white',
      secondary: 'bg-[var(--primary-dark)] text-white',
      success: 'bg-[var(--success-light)] text-[var(--success)]',
      warning: 'bg-[var(--warning-light)] text-[var(--warning)]',
      error: 'bg-[var(--error-light)] text-[var(--error)]',
      outline: 'border border-[var(--border)] text-[var(--text-grey)] bg-white',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-full)]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;

