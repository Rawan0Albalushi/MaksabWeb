'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { Addon } from '@/types';

interface AddonItemProps {
  addon: Addon;
  isActive: boolean;
  onToggle: () => void;
  currency?: string;
}

interface AddonsSelectorProps {
  addons: Addon[];
  addonsState: Map<number, { active: boolean; quantity: number }>;
  onToggle: (index: number) => void;
  currency?: string;
  className?: string;
}

/**
 * Helper function to get addon price from various possible fields
 */
const getAddonPrice = (addon: Addon): number => {
  // Check addon.stocks first (direct stock reference)
  if (addon.stocks) {
    return addon.stocks.total_price ?? addon.stocks.totalPrice ?? addon.stocks.price ?? 0;
  }
  
  // Check addon.product.stock (singular - common in API response)
  if (addon.product?.stock) {
    return addon.product.stock.total_price ?? addon.product.stock.totalPrice ?? addon.product.stock.price ?? 0;
  }
  
  // Check addon.product.stocks array
  if (addon.product?.stocks?.[0]) {
    const stock = addon.product.stocks[0];
    return stock.total_price ?? stock.totalPrice ?? stock.price ?? 0;
  }
  
  // Fallback to addon.price
  return addon.price ?? 0;
};

/**
 * Single addon item component
 */
const AddonItem = ({
  addon,
  isActive,
  onToggle,
  currency = 'ر.ع',
}: AddonItemProps) => {
  const product = addon.product;
  const price = getAddonPrice(addon);
  const title = product?.translation?.title || 'Addon';

  return (
    <div
      className={clsx(
        'relative flex items-center gap-3 p-4 rounded-xl',
        'border-2 transition-all cursor-pointer',
        isActive
          ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-md shadow-[var(--primary)]/20'
          : 'border-[var(--border)] bg-white hover:border-[var(--primary)]/50 hover:bg-[var(--main-bg)]'
      )}
      onClick={onToggle}
    >
      {/* Checkbox - More prominent */}
      <div
        className={clsx(
          'flex-shrink-0 w-7 h-7 rounded-lg border-2 transition-all',
          'flex items-center justify-center shadow-sm',
          isActive
            ? 'bg-[var(--primary)] border-[var(--primary)] shadow-[var(--primary)]/30'
            : 'border-gray-300 bg-white'
        )}
      >
        {isActive && <Check size={18} className="text-white" strokeWidth={3} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h5 className={clsx(
          'font-bold text-sm truncate transition-colors',
          isActive ? 'text-[var(--primary)]' : 'text-[var(--black)]'
        )}>
          {title}
        </h5>
        <p className={clsx(
          'text-sm font-bold mt-0.5',
          isActive ? 'text-[var(--primary)]' : 'text-[var(--text-grey)]'
        )}>
          +{price.toFixed(3)} {currency}
        </p>
      </div>
    </div>
  );
};

/**
 * AddonsSelector component - List of optional addons with checkboxes
 */
const AddonsSelector = ({
  addons,
  addonsState,
  onToggle,
  currency = 'ر.ع',
  className,
}: AddonsSelectorProps) => {
  if (!addons.length) return null;

  return (
    <div className={clsx('space-y-2', className)}>
      {addons.map((addon, index) => {
        const state = addonsState.get(addon.id) || { active: false, quantity: 1 };
        return (
          <AddonItem
            key={addon.id}
            addon={addon}
            isActive={state.active}
            onToggle={() => onToggle(index)}
            currency={currency}
          />
        );
      })}
    </div>
  );
};

export default AddonsSelector;
