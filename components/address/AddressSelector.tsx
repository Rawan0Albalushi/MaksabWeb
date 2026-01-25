'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  MapPin,
  ChevronDown,
  Navigation2,
  Loader2,
  Home,
  Briefcase,
  MapPinned,
  X,
  Plus,
  Check,
  ChevronRight,
  Crosshair,
} from 'lucide-react';

import { useAddressManager } from '@/hooks';
import { Address } from '@/types';

interface AddressSelectorProps {
  variant?: 'hero' | 'compact' | 'full';
  showAddButton?: boolean;
  onAddressChange?: (address: Address | null) => void;
  className?: string;
}

export const AddressSelector = ({
  variant = 'hero',
  showAddButton = false,
  onAddressChange,
  className,
}: AddressSelectorProps) => {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    selectedAddress,
    savedAddresses,
    currentLocation,
    isLoading,
    isLoadingAddresses,
    error,
    selectAddress,
    useCurrentLocation,
    clearLocation,
  } = useAddressManager();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle address selection
  const handleSelectAddress = (address: Address) => {
    selectAddress(address);
    setIsOpen(false);
    onAddressChange?.(address);
  };

  // Handle detect location
  const handleDetectLocation = async () => {
    await useCurrentLocation();
    setIsOpen(false);
    onAddressChange?.(null);
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

  // Get address icon
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

  // Compact variant (for header)
  if (variant === 'compact') {
    return (
      <div className={clsx("relative", className)} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MapPin size={18} className={selectedAddress ? "text-green-500" : "text-[var(--primary)]"} />
          <span className="text-sm font-medium text-[var(--black)] max-w-[120px] truncate">
            {selectedAddress?.title || selectedAddress?.address?.split(',')[0] || t('selectLocation')}
          </span>
          <ChevronDown size={16} className={clsx(
            "text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full end-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
            >
              {renderDropdownContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant (for settings page)
  if (variant === 'full') {
    return (
      <div className={clsx("space-y-4", className)}>
        {/* Current/Selected Address */}
        {selectedAddress && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MapPinned size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">{t('currentLocation')}</p>
                <p className="text-sm text-green-600">
                  {selectedAddress.address || `${selectedAddress.location.latitude.toFixed(4)}, ${selectedAddress.location.longitude.toFixed(4)}`}
                </p>
              </div>
              <button
                onClick={clearLocation}
                className="text-green-600 hover:text-green-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Detect Location Button */}
        <button
          onClick={handleDetectLocation}
          disabled={isLoading}
          className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            {isLoading ? (
              <Loader2 size={20} className="text-[var(--primary)] animate-spin" />
            ) : (
              <Navigation2 size={20} className="text-[var(--primary)]" />
            )}
          </div>
          <div className="text-start flex-1">
            <p className="text-sm font-semibold text-[var(--black)]">
              {isLoading ? t('detectingLocation') : t('detectLocation')}
            </p>
            <p className="text-xs text-[var(--text-grey)]">{t('nearYou')}</p>
          </div>
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{getLocationErrorMessage()}</p>
          </div>
        )}

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text-grey)]">{t('savedAddresses')}</p>
            {savedAddresses.map((address) => {
              const Icon = getAddressIcon(address.title);
              const isSelected = selectedAddress?.id === address.id;
              
              return (
                <button
                  key={address.id}
                  onClick={() => handleSelectAddress(address)}
                  className={clsx(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all",
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-[var(--primary)]/20" : "bg-gray-100"
                  )}>
                    <Icon size={20} className={isSelected ? "text-[var(--primary)]" : "text-gray-500"} />
                  </div>
                  <div className="text-start flex-1">
                    <p className={clsx(
                      "text-sm font-semibold",
                      isSelected ? "text-[var(--primary)]" : "text-[var(--black)]"
                    )}>
                      {address.title}
                    </p>
                    <p className="text-xs text-[var(--text-grey)] truncate">{address.address}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  {address.active && !isSelected && (
                    <span className="text-xs text-[var(--primary)] font-medium">{t('default')}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Add New Address Button */}
        {showAddButton && (
          <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-[var(--text-grey)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
            <Plus size={20} />
            <span className="text-sm font-medium">{t('addNewAddress')}</span>
          </button>
        )}
      </div>
    );
  }

  // Hero variant (default - for homepage)
  return (
    <div className={clsx("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 sm:gap-3 px-2 sm:px-5 py-2.5 sm:py-5 border-e border-white/10 transition-all duration-200 rounded-s-xl group",
          isOpen ? "bg-white/10" : "hover:bg-white/[0.06]"
        )}
      >
        <div className="relative flex-shrink-0">
          <div className={clsx(
            "w-7 h-7 sm:w-11 sm:h-11 rounded-md sm:rounded-xl flex items-center justify-center transition-all duration-300",
            selectedAddress
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10"
              : "bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 group-hover:from-[var(--primary)]/30 group-hover:to-[var(--primary-light)]/20"
          )}>
            <MapPin size={14} className={clsx("sm:hidden", selectedAddress ? "text-green-400" : "text-[var(--primary-light)]")} />
            <MapPin size={20} className={clsx("hidden sm:block", selectedAddress ? "text-green-400" : "text-[var(--primary-light)]")} />
          </div>
          {selectedAddress && (
            <span className="absolute -top-0.5 -end-0.5 w-2 sm:w-3 h-2 sm:h-3 bg-green-500 rounded-full border border-[#1a3a4a] sm:border-2 animate-pulse" />
          )}
        </div>
        <div className="hidden sm:block text-start min-w-[100px] max-w-[140px]">
          {selectedAddress ? (
            <>
              <span className="text-[10px] text-green-400/80 font-semibold uppercase tracking-wider block">{t('yourLocation')}</span>
              <span className="text-sm text-white font-bold truncate block leading-tight mt-0.5">
                {selectedAddress.title || selectedAddress.address?.split(',')[0] || t('currentLocation')}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider block">{t('location')}</span>
              <span className="text-sm text-white/80 font-semibold block leading-tight mt-0.5">{t('selectLocation')}</span>
            </>
          )}
        </div>
        <ChevronDown size={16} className={clsx(
          "text-white/40 transition-transform duration-300 hidden sm:block ms-1",
          isOpen && "rotate-180 text-white/60"
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full start-0 mt-3 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-gray-200/60 overflow-hidden z-50"
          >
            {renderDropdownContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render dropdown content (shared between variants)
  function renderDropdownContent() {
    return (
      <div className="max-h-[450px] overflow-y-auto">
        {/* Header Section */}
        <div className="px-6 py-5 bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 leading-relaxed">{t('selectLocation')}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('chooseDeliveryAddress')}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* GPS Detection Card */}
        <div className="p-4">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLoading}
            className={clsx(
              "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
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
              "group-hover:from-[var(--primary)]/30 group-hover:to-[var(--primary)]/15",
              "group-hover:shadow-md group-hover:shadow-[var(--primary)]/20"
            )}>
              {isLoading ? (
                <Loader2 size={24} className="text-[var(--primary)] animate-spin" />
              ) : (
                <Crosshair size={24} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
              )}
            </div>
            <div className="text-start flex-1 min-w-0">
              <p className="text-[15px] font-bold text-gray-900 leading-relaxed group-hover:text-[var(--primary)] transition-colors">
                {isLoading ? t('detectingLocation') : t('detectLocation')}
              </p>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{t('useGPSLocation')}</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all flex-shrink-0" />
          </button>
        </div>

        {/* Location Error */}
        {error && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X size={18} className="text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium leading-relaxed">{getLocationErrorMessage()}</p>
            </div>
          </div>
        )}

        {/* Current Location Card */}
        {currentLocation && selectedAddress?.isCurrentLocation && (
          <>
            {/* Section Divider */}
            <div className="px-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            <div className="p-4">
              <div className="p-4 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 border border-green-200/60 rounded-xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                    <MapPinned size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[15px] font-bold text-green-800 leading-relaxed">{t('currentLocation')}</p>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-[13px] text-green-700/80 leading-relaxed line-clamp-2">
                      {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearLocation();
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 text-[13px] font-semibold text-green-700 hover:text-white hover:bg-green-600 bg-green-100 rounded-lg transition-all flex-shrink-0"
                  >
                    {t('change')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Saved Addresses Section */}
        {savedAddresses.length > 0 && (
          <>
            {/* Section Divider */}
            <div className="px-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            <div className="py-4">
              {/* Section Title */}
              <p className="px-6 pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('savedAddresses')}
              </p>

              {/* Address List */}
              <div className="space-y-1 px-4">
                {savedAddresses.slice(0, 5).map((addr) => {
                  const Icon = getAddressIcon(addr.title);
                  const isSelected = selectedAddress?.id === addr.id && !selectedAddress?.isCurrentLocation;
                  
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectAddress(addr)}
                      className={clsx(
                        "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group",
                        isSelected 
                          ? "bg-[var(--primary)]/[0.08] border border-[var(--primary)]/20" 
                          : "bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-100",
                        "active:scale-[0.98]"
                      )}
                    >
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
                        isSelected 
                          ? "bg-[var(--primary)]/15" 
                          : "bg-gray-100 group-hover:bg-[var(--primary)]/10"
                      )}>
                        <Icon size={20} className={clsx(
                          "transition-colors",
                          isSelected ? "text-[var(--primary)]" : "text-gray-500 group-hover:text-[var(--primary)]"
                        )} />
                      </div>
                      <div className="text-start flex-1 min-w-0">
                        <p className={clsx(
                          "text-[15px] font-semibold leading-relaxed",
                          isSelected ? "text-[var(--primary)]" : "text-gray-900"
                        )}>{addr.title}</p>
                        <p className="text-[13px] text-gray-500 truncate mt-0.5 leading-relaxed">{addr.address}</p>
                      </div>
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--primary)]/30">
                          <Check size={16} className="text-white" />
                        </div>
                      ) : addr.active ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full flex-shrink-0">
                          {t('default')}
                        </span>
                      ) : (
                        <ChevronRight size={18} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Loading Addresses */}
        {isLoadingAddresses && savedAddresses.length === 0 && (
          <div className="px-6 py-10 flex flex-col items-center justify-center">
            <Loader2 size={28} className="text-[var(--primary)] animate-spin" />
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">{t('loadingAddresses')}</p>
          </div>
        )}

        {/* Add New Address */}
        {showAddButton && (
          <>
            {/* Section Divider */}
            <div className="px-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            <div className="p-4">
              <button className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-[0.98]">
                <Plus size={20} />
                <span className="text-sm font-semibold">{t('addNewAddress')}</span>
              </button>
            </div>
          </>
        )}

        {/* Bottom Safe Area */}
        <div className="h-2" />
      </div>
    );
  }
};

export default AddressSelector;
