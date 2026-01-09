'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ShoppingBag, Package, Heart, Bell, Search } from 'lucide-react';
import Button from './Button';

type EmptyStateType = 'cart' | 'orders' | 'favorites' | 'notifications' | 'search' | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons: Record<Exclude<EmptyStateType, 'custom'>, ReactNode> = {
  cart: <ShoppingBag size={64} />,
  orders: <Package size={64} />,
  favorites: <Heart size={64} />,
  notifications: <Bell size={64} />,
  search: <Search size={64} />,
};

const EmptyState = ({
  type = 'custom',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) => {
  const displayIcon = icon || (type !== 'custom' ? defaultIcons[type] : null);

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {displayIcon && (
        <div className="mb-6 text-[var(--border)]">{displayIcon}</div>
      )}
      <h3 className="text-xl font-bold text-[var(--black)] mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--text-grey)] mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
};

export default EmptyState;

