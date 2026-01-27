'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      type = 'text',
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-[var(--black)]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-grey)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            className={clsx(
              `w-full text-base
              bg-white border border-[var(--border)] rounded-[var(--radius-md)]
              text-[var(--black)] placeholder:text-[var(--text-grey)]
              transition-all duration-[var(--transition-fast)]
              focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
              disabled:bg-[var(--main-bg)] disabled:cursor-not-allowed`,
              leftIcon && 'ps-11',
              (rightIcon || isPassword) && 'pe-11',
              error && 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20',
              className
            )}
            style={{ padding: '14px 18px' }}
            disabled={disabled}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-grey)] hover:text-[var(--black)] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          ) : (
            rightIcon && (
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-grey)]">
                {rightIcon}
              </span>
            )
          )}
        </div>
        {error && (
          <span className="text-sm text-[var(--error)]">{error}</span>
        )}
        {hint && !error && (
          <span className="text-sm text-[var(--text-grey)]">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

