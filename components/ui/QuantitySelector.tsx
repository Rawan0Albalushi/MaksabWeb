'use client';

import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const QuantitySelector = ({
  value,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  disabled = false,
  className,
}: QuantitySelectorProps) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const sizes = {
    sm: {
      container: 'h-8',
      button: 'w-8',
      icon: 14,
      text: 'text-sm',
    },
    md: {
      container: 'h-10',
      button: 'w-10',
      icon: 18,
      text: 'text-base',
    },
    lg: {
      container: 'h-12',
      button: 'w-12',
      icon: 20,
      text: 'text-lg',
    },
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center bg-[var(--main-bg)] rounded-[var(--radius-md)]',
        sizes[size].container,
        disabled && 'opacity-50',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={clsx(
          'flex items-center justify-center rounded-s-[var(--radius-md)]',
          'transition-colors hover:bg-[var(--border)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizes[size].button,
          sizes[size].container
        )}
      >
        <Minus size={sizes[size].icon} className="text-[var(--black)]" />
      </button>
      <span
        className={clsx(
          'min-w-[3rem] text-center font-semibold text-[var(--black)]',
          sizes[size].text
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={clsx(
          'flex items-center justify-center rounded-e-[var(--radius-md)]',
          'transition-colors hover:bg-[var(--border)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizes[size].button,
          sizes[size].container
        )}
      >
        <Plus size={sizes[size].icon} className="text-[var(--black)]" />
      </button>
    </div>
  );
};

export default QuantitySelector;

