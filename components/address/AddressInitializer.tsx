'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  X,
  Navigation2,
  Loader2,
  ChevronRight,
  Home,
  Briefcase,
  Plus,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Button } from '@/components/ui';
import { AddressForm } from './AddressForm';
import { useAddressManager } from '@/hooks';
import { useAuthStore, useLocationStore } from '@/store';
import { Address } from '@/types';

interface AddressInitializerProps {
  children: React.ReactNode;
}

/**
 * AddressInitializer - Component to handle initial location setup
 * 
 * Flow:
 * 1. User opens the app
 * 2. Check if user is authenticated
 *    - Yes: Fetch user profile with addresses
 *    - No: Check if location is already stored
 * 3. Check if address is already selected (from localStorage)
 *    - Yes: Use it (already done by zustand persist)
 *    - No: Continue
 * 4. If authenticated with addresses:
 *    - One address: Auto-select it
 *    - Multiple addresses: Show selection prompt
 * 5. If no addresses or guest:
 *    - Show prompt to detect location or select address
 */
export const AddressInitializer = ({ children }: AddressInitializerProps) => {
  const t = useTranslations('common');
  const { isAuthenticated, _hasHydrated: authHydrated } = useAuthStore();
  const { selectedAddress } = useLocationStore();
  const {
    savedAddresses,
    fetchAddresses,
    selectAddress,
    useCurrentLocation,
    isLoading,
    isLoadingAddresses,
  } = useAddressManager();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch addresses when prompt is shown (for authenticated users)
  useEffect(() => {
    if (showPrompt && isAuthenticated) {
      fetchAddresses();
    }
  }, [showPrompt, isAuthenticated, fetchAddresses]);

  // Initialize addresses when authenticated
  useEffect(() => {
    if (!authHydrated || hasInitialized) return;

    const initialize = async () => {
      // Wait a bit for other stores to hydrate
      await new Promise(resolve => setTimeout(resolve, 100));

      // If already has selected address, no need to prompt
      if (selectedAddress) {
        setHasInitialized(true);
        return;
      }

      if (isAuthenticated) {
        // Addresses will be fetched by useAddressManager
        // We'll handle the selection in the next effect
      } else {
        // Guest user - show prompt after a short delay
        setTimeout(() => {
          if (!selectedAddress) {
            setShowPrompt(true);
          }
        }, 2000);
      }

      setHasInitialized(true);
    };

    initialize();
  }, [authHydrated, isAuthenticated, selectedAddress, hasInitialized]);

  // Handle address selection after addresses are loaded
  useEffect(() => {
    if (!authHydrated || !hasInitialized || isLoadingAddresses) return;
    if (selectedAddress) return; // Already have selected address
    if (!isAuthenticated) return; // Guest users handled above

    if (savedAddresses.length > 0) {
      // If user has addresses but none selected
      if (savedAddresses.length === 1) {
        // Auto-select the only address
        selectAddress(savedAddresses[0]);
      } else {
        // Multiple addresses - find active one and select it
        const activeAddress = savedAddresses.find(a => a.active);
        if (activeAddress) {
          selectAddress(activeAddress);
        } else {
          // No active address - show prompt with addresses list
          setShowPrompt(true);
        }
      }
    } else {
      // Authenticated but no addresses - show prompt to add
      setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
    }
  }, [authHydrated, hasInitialized, isLoadingAddresses, isAuthenticated, savedAddresses, selectedAddress, selectAddress]);

  // Handle detect location
  const handleDetectLocation = async () => {
    setShowPrompt(false);
    await useCurrentLocation();
  };

  // Handle select from saved addresses or add new
  const handleOpenAddressForm = () => {
    setShowPrompt(false);
    setShowAddressForm(true);
  };

  // Handle selecting a saved address directly
  const handleSelectSavedAddress = (address: Address) => {
    selectAddress(address);
    setShowPrompt(false);
  };

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

  // Get formatted address string
  const getAddressString = (addr: Address): string => {
    if (!addr.address) return '';
    if (typeof addr.address === 'string') return addr.address;
    return addr.address.address || '';
  };

  // Handle address form success
  const handleAddressFormSuccess = (address: Address) => {
    setShowAddressForm(false);
    selectAddress(address);
  };

  return (
    <>
      {children}

      {/* Location Prompt for first-time users */}
      <AnimatePresence>
        {showPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPrompt(false)}
            />

            {/* Prompt Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                  onClick={() => setShowPrompt(false)}
                  className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                >
                  <X size={16} className="text-gray-600" />
                </button>

                {/* Header with gradient */}
                <div className="relative bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] p-6 pb-12">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -end-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -start-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  </div>
                  
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                      <MapPin size={28} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      أين نوصل لك؟
                    </h3>
                    <p className="text-white/80 text-sm">
                      حدد موقعك لنعرض لك المتاجر القريبة منك
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 -mt-6 relative z-10 max-h-[60vh] overflow-y-auto">
                  {/* Detect Location Button */}
                  <button
                    onClick={handleDetectLocation}
                    disabled={isLoading}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-[var(--primary)]/30 hover:shadow-xl transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                      {isLoading ? (
                        <Loader2 size={22} className="text-[var(--primary)] animate-spin" />
                      ) : (
                        <Navigation2 size={22} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="flex-1 text-start">
                      <p className="font-bold text-gray-900">
                        {isLoading ? t('detectingLocation') : 'استخدم موقعي الحالي'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        تحديد تلقائي عبر GPS
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[var(--primary)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                  </button>

                  {/* Saved Addresses Section - Show directly if user has addresses */}
                  {isAuthenticated && (
                    <>
                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 bg-white text-xs text-gray-400">
                            {savedAddresses.length > 0 ? 'أو اختر من عناوينك' : 'أو'}
                          </span>
                        </div>
                      </div>

                      {/* Loading State */}
                      {isLoadingAddresses && savedAddresses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Loader2 size={24} className="text-[var(--primary)] animate-spin" />
                          <p className="text-sm text-gray-500 mt-3">جاري تحميل العناوين...</p>
                        </div>
                      )}

                      {/* Saved Addresses List */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {savedAddresses.map((addr) => {
                            const Icon = getAddressIcon(addr.title);
                            return (
                              <button
                                key={addr.id}
                                onClick={() => handleSelectSavedAddress(addr)}
                                className={clsx(
                                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                                  "bg-white border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5",
                                  addr.active && "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                                )}
                              >
                                <div className={clsx(
                                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                  addr.active ? "bg-[var(--primary)]/15" : "bg-gray-100"
                                )}>
                                  <Icon size={18} className={addr.active ? "text-[var(--primary)]" : "text-gray-500"} />
                                </div>
                                <div className="flex-1 text-start min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={clsx(
                                      "text-sm font-semibold",
                                      addr.active ? "text-[var(--primary)]" : "text-gray-900"
                                    )}>
                                      {addr.title || 'عنوان'}
                                    </p>
                                    {addr.active && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full">
                                        افتراضي
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {getAddressString(addr)}
                                  </p>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 rtl:rotate-180" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Add New Address Button */}
                      <button
                        onClick={handleOpenAddressForm}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                      >
                        <Plus size={18} />
                        أضف عنوان جديد
                      </button>
                    </>
                  )}

                  {/* Guest User - Add address manually */}
                  {!isAuthenticated && (
                    <>
                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 bg-white text-xs text-gray-400">أو</span>
                        </div>
                      </div>

                      <button
                        onClick={handleOpenAddressForm}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)]/10 transition-all"
                      >
                        <MapPin size={18} />
                        حدد موقعك يدوياً
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Address Form Modal (includes saved addresses list) */}
      <AddressForm
        isOpen={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSuccess={handleAddressFormSuccess}
      />
    </>
  );
};

export default AddressInitializer;
