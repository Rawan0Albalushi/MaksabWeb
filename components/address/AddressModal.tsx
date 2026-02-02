'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  MapPin,
  X,
  Plus,
  Check,
  ChevronRight,
  Crosshair,
  Loader2,
  Home,
  Briefcase,
  Trash2,
  Edit3,
  Star,
  Navigation2,
} from 'lucide-react';

import { Button } from '@/components/ui';
import { useAddressManager } from '@/hooks';
import { Address } from '@/types';
import { useAuthStore } from '@/store';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: Address | null) => void;
  onAddAddress?: () => void;
}

export const AddressModal = ({
  isOpen,
  onClose,
  onSelectAddress,
  onAddAddress,
}: AddressModalProps) => {
  const t = useTranslations('common');
  const tAddress = useTranslations('address');
  const { isAuthenticated } = useAuthStore();

  const {
    selectedAddress,
    savedAddresses,
    currentLocation,
    isLoading,
    isLoadingAddresses,
    error,
    selectAddress,
    useCurrentLocation,
    setActiveAddress,
    deleteAddress,
  } = useAddressManager();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<number | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Get address icon based on title
  const getAddressIcon = (title?: string) => {
    const lowerTitle = title?.toLowerCase() || '';
    if (lowerTitle.includes('home') || lowerTitle.includes('منزل') || lowerTitle.includes('بيت')) {
      return Home;
    }
    if (lowerTitle.includes('work') || lowerTitle.includes('عمل') || lowerTitle.includes('مكتب')) {
      return Briefcase;
    }
    return MapPin;
  };

  // Handle address selection
  const handleSelectAddress = (address: Address) => {
    selectAddress(address);
    onSelectAddress?.(address);
    onClose();
  };

  // Handle detect location
  const handleDetectLocation = async () => {
    await useCurrentLocation();
    onSelectAddress?.(null);
    onClose();
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: number) => {
    setDeletingId(addressId);
    const success = await deleteAddress(addressId);
    setDeletingId(null);
    return success;
  };

  // Handle set as default
  const handleSetActive = async (addressId: number) => {
    setSettingActiveId(addressId);
    await setActiveAddress(addressId);
    setSettingActiveId(null);
  };

  // Get location error message
  const getLocationErrorMessage = () => {
    switch (error) {
      case 'PERMISSION_DENIED':
        return t('locationPermissionDenied');
      case 'POSITION_UNAVAILABLE':
        return t('locationUnavailable');
      case 'TIMEOUT':
        return t('locationTimeout');
      default:
        return t('locationError');
    }
  };

  // Get formatted address string
  const getAddressString = (address: Address): string => {
    if (!address.address) return '';
    if (typeof address.address === 'string') return address.address;
    return address.address.address || '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[200] max-h-[90vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:rounded-3xl sm:max-h-[85vh]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--black)]">
                    {t('selectLocation')}
                  </h2>
                  <p className="text-sm text-[var(--text-grey)] mt-0.5">
                    {t('chooseDeliveryAddress')}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Drag Handle - Mobile */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 sm:hidden" />
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[calc(85vh-80px)]">
              <div className="p-4 sm:p-6 space-y-4">
                {/* GPS Detection Card */}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLoading}
                  className={clsx(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
                    "bg-gradient-to-r from-[var(--primary)]/[0.08] to-[var(--primary)]/[0.03]",
                    "border border-[var(--primary)]/20",
                    "hover:from-[var(--primary)]/[0.12] hover:to-[var(--primary)]/[0.06]",
                    "hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/10",
                    "active:scale-[0.98]",
                    "group"
                  )}
                >
                  <div className={clsx(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    "bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10",
                    "group-hover:from-[var(--primary)]/30 group-hover:to-[var(--primary)]/15"
                  )}>
                    {isLoading ? (
                      <Loader2 size={24} className="text-[var(--primary)] animate-spin" />
                    ) : (
                      <Crosshair size={24} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="text-start flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                      {isLoading ? t('detectingLocation') : t('detectLocation')}
                    </p>
                    <p className="text-[13px] text-gray-500 mt-0.5">{t('useGPSLocation')}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all flex-shrink-0" />
                </button>

                {/* Location Error */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X size={18} className="text-red-500" />
                    </div>
                    <p className="text-sm text-red-600 font-medium">{getLocationErrorMessage()}</p>
                  </div>
                )}

                {/* Current Location Card */}
                {currentLocation && selectedAddress?.isCurrentLocation && (
                  <div className="p-4 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 border border-green-200/60 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                        <Navigation2 size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[15px] font-bold text-green-800">{t('currentLocation')}</p>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <p className="text-[13px] text-green-700/80 line-clamp-2">
                          {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Addresses Section */}
                {isAuthenticated && (
                  <div className="space-y-3">
                    {/* Section Title */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {t('savedAddresses')}
                      </p>
                      {savedAddresses.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {savedAddresses.length} {savedAddresses.length === 1 ? tAddress('addressTitle') : t('savedAddresses')}
                        </span>
                      )}
                    </div>

                    {/* Loading State */}
                    {isLoadingAddresses && savedAddresses.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 size={28} className="text-[var(--primary)] animate-spin" />
                        <p className="text-sm text-gray-500 mt-4">{t('loadingAddresses')}</p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingAddresses && savedAddresses.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <MapPin size={28} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">{tAddress('noAddresses') || 'لا توجد عناوين محفوظة'}</p>
                        <p className="text-gray-400 text-xs mt-1">أضف عنوانك الأول للتوصيل السريع</p>
                      </div>
                    )}

                    {/* Address List */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        {savedAddresses.map((address) => {
                          const Icon = getAddressIcon(address.title);
                          const isSelected = selectedAddress?.id === address.id && !selectedAddress?.isCurrentLocation;
                          const isDeleting = deletingId === address.id;
                          const isSettingActive = settingActiveId === address.id;

                          return (
                            <div
                              key={address.id}
                              className={clsx(
                                "relative rounded-2xl border transition-all duration-200 overflow-hidden",
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)]/[0.03]"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              )}
                            >
                              {/* Main Address Button */}
                              <button
                                type="button"
                                onClick={() => handleSelectAddress(address)}
                                className="w-full flex items-center gap-4 p-4"
                              >
                                <div className={clsx(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
                                  isSelected
                                    ? "bg-[var(--primary)]/15"
                                    : "bg-gray-100"
                                )}>
                                  <Icon size={20} className={clsx(
                                    "transition-colors",
                                    isSelected ? "text-[var(--primary)]" : "text-gray-500"
                                  )} />
                                </div>
                                <div className="text-start flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={clsx(
                                      "text-[15px] font-semibold",
                                      isSelected ? "text-[var(--primary)]" : "text-gray-900"
                                    )}>
                                      {address.title || tAddress('other')}
                                    </p>
                                    {address.active && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full">
                                        {t('default')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[13px] text-gray-500 truncate mt-0.5">
                                    {getAddressString(address)}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--primary)]/30">
                                    <Check size={16} className="text-white" />
                                  </div>
                                )}
                              </button>

                              {/* Action Buttons */}
                              <div className="flex items-center border-t border-gray-100">
                                {/* Set as Default */}
                                {!address.active && (
                                  <button
                                    onClick={() => handleSetActive(address.id)}
                                    disabled={isSettingActive}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-600 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all border-e border-gray-100"
                                  >
                                    {isSettingActive ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Star size={14} />
                                    )}
                                    <span>{tAddress('setDefault')}</span>
                                  </button>
                                )}

                                {/* Edit */}
                                <button
                                  onClick={() => {
                                    // TODO: Open edit form
                                    console.log('Edit address:', address.id);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all border-e border-gray-100"
                                >
                                  <Edit3 size={14} />
                                  <span>{t('edit')}</span>
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  disabled={isDeleting}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                                >
                                  {isDeleting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                  <span>{t('delete')}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add New Address Button */}
                    <button
                      onClick={() => {
                        onAddAddress?.();
                        // For now, we'll close the modal - later we can show AddressForm
                        // onClose();
                      }}
                      className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-[0.98]"
                    >
                      <Plus size={20} />
                      <span className="text-sm font-semibold">{t('addNewAddress')}</span>
                    </button>
                  </div>
                )}

                {/* Guest User - Prompt to Login */}
                {!isAuthenticated && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm mb-4">
                      سجل دخولك لحفظ عناوينك والوصول إليها بسهولة
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                        window.location.href = '/auth/login';
                      }}
                      className="px-8"
                    >
                      {t('login')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddressModal;
