'use client';

import Image from 'next/image';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { TypedExtra, UiExtra, ExtrasType } from '@/types';
import { motion } from 'framer-motion';

interface ExtrasSelectorProps {
  typedExtras: TypedExtra[];
  onSelect: (groupIndex: number, extraIndex: number) => void;
  className?: string;
}

interface ExtraGroupProps {
  typedExtra: TypedExtra;
  onSelect: (extraIndex: number) => void;
}

/**
 * Text type extra - Large selection cards
 */
const TextExtras = ({ typedExtra, onSelect }: ExtraGroupProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {typedExtra.uiExtras.map((extra, idx) => (
        <motion.button
          key={extra.index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(extra.index)}
          className={clsx(
            'relative rounded-xl border-2 transition-all duration-200',
            'font-semibold text-sm',
            'flex items-center justify-center text-center',
            'min-h-[48px]',
            extra.isSelected
              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-[var(--primary)]/50 hover:bg-gray-50 shadow-sm'
          )}
          style={{ padding: '10px 12px' }}
        >
          {/* Selection checkmark */}
          {extra.isSelected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-md"
            >
              <Check size={10} className="text-white" strokeWidth={3} />
            </motion.span>
          )}
          <span>{extra.value}</span>
        </motion.button>
      ))}
    </div>
  );
};

/**
 * Color type extra - Enhanced color circles
 */
const ColorExtras = ({ typedExtra, onSelect }: ExtraGroupProps) => {
  const isLightColor = (color: string): boolean => {
    const lightColors = ['white', '#fff', '#ffffff', 'yellow', '#ff0', '#ffff00', 'beige', 'ivory', 'cream', '#ffd', '#ffe'];
    return lightColors.some(c => color.toLowerCase().includes(c));
  };

  return (
    <div className="flex flex-wrap gap-4">
      {typedExtra.uiExtras.map((extra, idx) => {
        const isLight = isLightColor(extra.value);
        return (
          <motion.button
            key={extra.index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
            onClick={() => onSelect(extra.index)}
            className={clsx(
              'relative w-14 h-14 rounded-full transition-all duration-200',
              'shadow-md hover:shadow-xl',
              extra.isSelected
                ? 'ring-4 ring-[var(--primary)] ring-offset-2 scale-110'
                : 'hover:scale-105 ring-2 ring-gray-200'
            )}
            style={{ backgroundColor: extra.value }}
            title={extra.value}
          >
            {extra.isSelected && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center',
                  isLight ? 'bg-black/20' : 'bg-white/30'
                )}>
                  <Check 
                    size={16} 
                    strokeWidth={3}
                    className={isLight ? 'text-gray-800' : 'text-white'} 
                  />
                </span>
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

/**
 * Image type extra - Large image cards
 */
const ImageExtras = ({ typedExtra, onSelect }: ExtraGroupProps) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {typedExtra.uiExtras.map((extra, idx) => (
        <motion.button
          key={extra.index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(extra.index)}
          className={clsx(
            'relative aspect-square rounded-2xl overflow-hidden',
            'border-3 transition-all duration-200',
            'shadow-md hover:shadow-xl',
            extra.isSelected
              ? 'border-[var(--primary)] ring-4 ring-[var(--primary)]/20 scale-105'
              : 'border-gray-200 hover:border-[var(--primary)]/50'
          )}
        >
          <Image
            src={extra.value}
            alt=""
            fill
            className="object-cover"
          />
          {extra.isSelected && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[var(--primary)]/20"
              />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 end-2 w-7 h-7 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-lg"
              >
                <Check size={14} className="text-white" strokeWidth={3} />
              </motion.span>
            </>
          )}
        </motion.button>
      ))}
    </div>
  );
};

/**
 * Main ExtrasSelector component
 */
const ExtrasSelector = ({
  typedExtras,
  onSelect,
  className,
}: ExtrasSelectorProps) => {
  if (!typedExtras.length) return null;

  const renderExtraGroup = (typedExtra: TypedExtra) => {
    const handleSelect = (extraIndex: number) => {
      onSelect(typedExtra.groupIndex, extraIndex);
    };

    switch (typedExtra.type) {
      case 'color':
        return <ColorExtras typedExtra={typedExtra} onSelect={handleSelect} />;
      case 'image':
        return <ImageExtras typedExtra={typedExtra} onSelect={handleSelect} />;
      case 'text':
      default:
        return <TextExtras typedExtra={typedExtra} onSelect={handleSelect} />;
    }
  };

  return (
    <div className={clsx('space-y-5', className)}>
      {typedExtras.map((typedExtra, groupIdx) => (
        <motion.div 
          key={typedExtra.groupId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIdx * 0.1 }}
        >
          {/* Group Title */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            <h4 className="font-bold text-gray-800 text-sm">
              {typedExtra.title}
            </h4>
          </div>
          
          {/* Options Grid */}
          {renderExtraGroup(typedExtra)}
        </motion.div>
      ))}
    </div>
  );
};

export default ExtrasSelector;
