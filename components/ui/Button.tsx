'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-[var(--radius-md)]
      transition-all duration-[var(--transition-fast)]
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-[var(--primary)] text-white
        hover:bg-[var(--primary-hover)]
        focus-visible:ring-[var(--primary)]
        active:scale-[0.98]
      `,
      secondary: `
        bg-[var(--primary-dark)] text-white
        hover:bg-[var(--primary-dark-hover)]
        focus-visible:ring-[var(--primary-dark)]
        active:scale-[0.98]
      `,
      outline: `
        border-2 border-[var(--primary)] text-[var(--primary)]
        bg-transparent hover:bg-[var(--primary)] hover:text-white
        focus-visible:ring-[var(--primary)]
      `,
      ghost: `
        text-[var(--black)] bg-transparent
        hover:bg-[var(--main-bg)]
        focus-visible:ring-[var(--border)]
      `,
      danger: `
        bg-[var(--error)] text-white
        hover:bg-red-600
        focus-visible:ring-[var(--error)]
        active:scale-[0.98]
      `,
    };

    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };
    
    const sizePaddings = {
      sm: { padding: '8px 16px' },
      md: { padding: '12px 22px' },
      lg: { padding: '16px 28px' },
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        style={sizePaddings[size]}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

