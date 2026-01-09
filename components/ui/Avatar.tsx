'use client';

import Image from 'next/image';
import { clsx } from 'clsx';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const Avatar = ({
  src,
  alt = '',
  size = 'md',
  fallback,
  className,
}: AvatarProps) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 28,
    xl: 36,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center rounded-full bg-[var(--primary-dark)] text-white font-semibold',
          sizes[size],
          className
        )}
      >
        {fallback ? (
          getInitials(fallback)
        ) : (
          <User size={iconSizes[size]} />
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'relative rounded-full overflow-hidden bg-[var(--main-bg)]',
        sizes[size],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  );
};

export default Avatar;

