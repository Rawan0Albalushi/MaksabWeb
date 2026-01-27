'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import dynamic from 'next/dynamic';
import {
  MapPin,
  X,
  Crosshair,
  Loader2,
  Home,
  Briefcase,
  Building2,
  Check,
  ChevronLeft,
  Search,
  Navigation2,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';

import { Button, Input } from '@/components/ui';
import { useAddressManager } from '@/hooks';
import { useAuthStore } from '@/store';
import { Address } from '@/types';
import { AddressFormData } from '@/hooks/useAddressManager';
import { DEFAULT_LOCATION } from '@/store/useLocationStore';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 rounded-xl flex items-center justify-center">
      <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
    </div>
  ),
});

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  editAddress?: Address | null;
  onSuccess?: (address: Address) => void;
}

type AddressType = 'home' | 'work' | 'other';

export const AddressForm = ({
  isOpen,
  onClose,
  editAddress,
  onSuccess,
}: AddressFormProps) => {
  const t = useTranslations('common');
  const tAddress = useTranslations('address');
  const { isAuthenticated } = useAuthStore();

  const {
    addAddress,
    updateAddress,
    currentLocation,
    isLoading,
    detectLocation,
    savedAddresses,
    selectAddress,
    deleteAddress,
    setActiveAddress,
    isLoadingAddresses,
    fetchAddresses,
  } = useAddressManager();

  // Fetch addresses when modal opens (for authenticated users)
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAddresses();
    }
  }, [isOpen, isAuthenticated, fetchAddresses]);

  // View mode: 'list' shows saved addresses, 'form' shows the add/edit form
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<number | null>(null);

  // Form state
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [customTitle, setCustomTitle] = useState('');
  const [address, setAddress] = useState('');
  const [streetHouseNumber, setStreetHouseNumber] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form with edit data and set view mode
  useEffect(() => {
    if (!isOpen) {
      // Reset form when closed
      return;
    }

    if (editAddress) {
      // Editing mode - go directly to form
      setViewMode('form');
      
      // Determine address type from title
      const title = editAddress.title?.toLowerCase() || '';
      if (title.includes('home') || title.includes('منزل') || title.includes('بيت')) {
        setAddressType('home');
      } else if (title.includes('work') || title.includes('عمل') || title.includes('مكتب')) {
        setAddressType('work');
      } else {
        setAddressType('other');
        setCustomTitle(editAddress.title || '');
      }

      // Set address
      if (typeof editAddress.address === 'string') {
        setAddress(editAddress.address);
      } else if (editAddress.address?.address) {
        setAddress(editAddress.address.address);
      }

      // Set additional fields
      setStreetHouseNumber(editAddress.street_house_number || '');
      setAdditionalDetails(editAddress.additional_details || '');

      // Set location
      if (editAddress.location) {
        if (Array.isArray(editAddress.location)) {
          setLocation({
            latitude: editAddress.location[0],
            longitude: editAddress.location[1],
          });
        } else {
          setLocation({
            latitude: editAddress.location.latitude,
            longitude: editAddress.location.longitude,
          });
        }
      }
    } else {
      // New address mode - always start with list view (it will show saved addresses or empty state)
      // Only go to form view for guests who can't save addresses
      if (isAuthenticated) {
        setViewMode('list');
      } else {
        setViewMode('form');
      }
    }
  }, [editAddress, isOpen, isAuthenticated]);

  // If user just opened the modal and uses current location, set it
  useEffect(() => {
    if (isOpen && viewMode === 'form' && !editAddress && currentLocation && !address) {
      setLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setAddress(currentLocation.address || '');
    }
  }, [isOpen, viewMode, editAddress, currentLocation, address]);

  // Reset form
  const resetForm = () => {
    setAddressType('home');
    setCustomTitle('');
    setAddress('');
    setStreetHouseNumber('');
    setAdditionalDetails('');
    setLocation({
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    });
    setSearchQuery('');
    setSearchResults([]);
    setViewMode('list');
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

  // Handle select saved address
  const handleSelectSavedAddress = (addr: Address) => {
    selectAddress(addr);
    onSuccess?.(addr);
    onClose();
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: number) => {
    setDeletingId(addressId);
    await deleteAddress(addressId);
    setDeletingId(null);
  };

  // Handle set as default
  const handleSetActive = async (addressId: number) => {
    setSettingActiveId(addressId);
    await setActiveAddress(addressId);
    setSettingActiveId(null);
  };

  // Switch to add new address form
  const handleAddNewAddress = () => {
    resetForm();
    setViewMode('form');
    // Use current location if available
    if (currentLocation) {
      setLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setAddress(currentLocation.address || '');
    }
  };

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

  // Get title based on address type
  const getTitle = (): string => {
    switch (addressType) {
      case 'home':
        return tAddress('home');
      case 'work':
        return tAddress('work');
      case 'other':
        return customTitle || tAddress('other');
    }
  };

  // Handle map location change - using Google Geocoding
  const handleLocationChange = useCallback(async (lat: number, lng: number) => {
    setLocation({ latitude: lat, longitude: lng });
    
    // Wait for Google Maps to be loaded
    if (typeof window === 'undefined' || !window.google?.maps) {
      return;
    }

    // Reverse geocode to get address using Google Geocoder
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ 
        location: { lat, lng },
        language: 'ar'
      });
      
      if (result.results && result.results.length > 0) {
        // Get the formatted address
        const formattedAddress = result.results[0].formatted_address;
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  }, []);

  // Handle detect current location
  const handleDetectLocation = async () => {
    await detectLocation();
    if (currentLocation) {
      setLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setAddress(currentLocation.address || '');
    }
  };

  // Search for address using Google Places Autocomplete
  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Wait for Google Maps to be loaded
    if (typeof window === 'undefined' || !window.google?.maps?.places) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      
      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'om' }, // Restrict to Oman
          language: 'ar',
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions.map(p => ({
              place_id: p.place_id,
              description: p.description,
              main_text: p.structured_formatting?.main_text,
              secondary_text: p.structured_formatting?.secondary_text,
            })));
          } else {
            setSearchResults([]);
          }
          setIsSearching(false);
        }
      );
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  // Handle search result selection - using Google Places Details
  const handleSelectSearchResult = async (result: any) => {
    if (!result.place_id || typeof window === 'undefined' || !window.google?.maps?.places) {
      return;
    }

    setSearchQuery('');
    setSearchResults([]);
    setAddress(result.description);

    try {
      // Create a temporary div for PlacesService (required by Google API)
      const tempDiv = document.createElement('div');
      const placesService = new window.google.maps.places.PlacesService(tempDiv);

      placesService.getDetails(
        {
          placeId: result.place_id,
          fields: ['geometry', 'formatted_address'],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setLocation({ latitude: lat, longitude: lng });
            if (place.formatted_address) {
              setAddress(place.formatted_address);
            }
          }
        }
      );
    } catch (error) {
      console.error('Failed to get place details:', error);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!address || !location.latitude || !location.longitude) {
      return;
    }

    setIsSaving(true);

    const data: AddressFormData = {
      title: getTitle(),
      address: address,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      street_house_number: streetHouseNumber || undefined,
      additional_details: additionalDetails || undefined,
    };

    try {
      if (editAddress) {
        const success = await updateAddress(editAddress.id, data);
        if (success) {
          onSuccess?.(editAddress);
          onClose();
        }
      } else {
        const newAddress = await addAddress(data);
        if (newAddress) {
          onSuccess?.(newAddress);
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to save address:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Address type options
  const addressTypes: { type: AddressType; icon: typeof Home; label: string }[] = [
    { type: 'home', icon: Home, label: tAddress('home') },
    { type: 'work', icon: Briefcase, label: tAddress('work') },
    { type: 'other', icon: Building2, label: tAddress('other') },
  ];

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
            className="fixed inset-0 z-[200] bg-white flex flex-col sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:w-full sm:rounded-3xl sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3" style={{ padding: '20px 24px' }}>
                <button
                  onClick={() => {
                    if (viewMode === 'form' && !editAddress && savedAddresses.length > 0) {
                      setViewMode('list');
                    } else {
                      onClose();
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600 rtl:rotate-180" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--black)]">
                    {viewMode === 'list' 
                      ? t('selectLocation')
                      : (editAddress ? tAddress('edit') : tAddress('addNew'))
                    }
                  </h2>
                  {viewMode === 'list' && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      اختر عنوان التوصيل أو أضف عنوان جديد
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Saved Addresses List View */}
              {viewMode === 'list' && (
                <div className="space-y-4" style={{ padding: '20px 24px' }}>
                  {/* Detect Location Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      await detectLocation();
                      onClose();
                    }}
                    disabled={isLoading}
                    className={clsx(
                      "w-full flex items-center gap-4 rounded-2xl transition-all duration-200",
                      "bg-gradient-to-r from-[var(--primary)]/[0.08] to-[var(--primary)]/[0.03]",
                      "border border-[var(--primary)]/20",
                      "hover:from-[var(--primary)]/[0.12] hover:to-[var(--primary)]/[0.06]",
                      "hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/10",
                      "active:scale-[0.98]",
                      "group"
                    )}
                    style={{ padding: '16px 20px' }}
                  >
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      "bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10",
                    )}>
                      {isLoading ? (
                        <Loader2 size={22} className="text-[var(--primary)] animate-spin" />
                      ) : (
                        <Navigation2 size={22} className="text-[var(--primary)] group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="text-start flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                        {isLoading ? t('detectingLocation') : t('detectLocation')}
                      </p>
                      <p className="text-[13px] text-gray-500 mt-0.5">{t('useGPSLocation')}</p>
                    </div>
                    <ChevronLeft size={20} className="text-gray-300 group-hover:text-[var(--primary)] transition-all flex-shrink-0 rtl:rotate-180" />
                  </button>

                  {/* Saved Addresses Section */}
                  {isAuthenticated && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {t('savedAddresses')} ({savedAddresses.length})
                      </p>

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
                          <p className="text-gray-500 text-sm">لا توجد عناوين محفوظة</p>
                          <p className="text-gray-400 text-xs mt-1">أضف عنوانك الأول للتوصيل السريع</p>
                        </div>
                      )}

                      {/* Address List */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => {
                            const Icon = getAddressIcon(addr.title);
                            const isDeleting = deletingId === addr.id;
                            const isSettingActive = settingActiveId === addr.id;

                            return (
                              <div
                                key={addr.id}
                                className="relative rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all duration-200 overflow-hidden"
                              >
                                {/* Main Address Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectSavedAddress(addr)}
                                  className="w-full flex items-center gap-4"
                                  style={{ padding: '16px 20px' }}
                                >
                                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center transition-all duration-200 flex-shrink-0">
                                    <Icon size={20} className="text-gray-500" />
                                  </div>
                                  <div className="text-start flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[15px] font-semibold text-gray-900">
                                        {addr.title || tAddress('other')}
                                      </p>
                                      {addr.active && (
                                        <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full" style={{ padding: '4px 10px' }}>
                                          {t('default')}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[13px] text-gray-500 truncate mt-0.5">
                                      {getAddressString(addr)}
                                    </p>
                                  </div>
                                  <ChevronLeft size={18} className="text-gray-300 flex-shrink-0 rtl:rotate-180" />
                                </button>

                                {/* Action Buttons */}
                                <div className="flex items-center border-t border-gray-100">
                                  {/* Set as Default */}
                                  {!addr.active && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetActive(addr.id);
                                      }}
                                      disabled={isSettingActive}
                                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs text-gray-600 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all border-e border-gray-100"
                                    >
                                      {isSettingActive ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <Star size={12} />
                                      )}
                                      <span>{tAddress('setDefault')}</span>
                                    </button>
                                  )}

                                  {/* Delete */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAddress(addr.id);
                                    }}
                                    disabled={isDeleting}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                                  >
                                    {isDeleting ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={12} />
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
                        onClick={handleAddNewAddress}
                        className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-[0.98]"
                        style={{ padding: '16px 20px' }}
                      >
                        <Plus size={20} />
                        <span className="text-sm font-semibold">{t('addNewAddress')}</span>
                      </button>
                    </div>
                  )}

                  {/* Guest User */}
                  {!isAuthenticated && (
                    <button
                      onClick={handleAddNewAddress}
                      className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-[0.98]"
                      style={{ padding: '16px 20px' }}
                    >
                      <Plus size={20} />
                      <span className="text-sm font-semibold">حدد موقعك يدوياً</span>
                    </button>
                  )}
                </div>
              )}

              {/* Add/Edit Address Form View */}
              {viewMode === 'form' && (
              <div className="space-y-5" style={{ padding: '20px 24px' }}>
                {/* Map Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--black)]">
                      حدد موقعك على الخريطة
                    </p>
                    <button
                      onClick={handleDetectLocation}
                      disabled={isLoading}
                      className="flex items-center gap-2 text-sm text-[var(--primary)] font-medium hover:underline"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Crosshair size={16} />
                      )}
                      <span>موقعي الحالي</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <div className="relative">
                      <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن عنوان..."
                        className="w-full ps-11 pe-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-sm"
                      />
                      {isSearching && (
                        <Loader2 size={18} className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10 max-h-60 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <button
                            key={result.place_id || index}
                            onClick={() => handleSelectSearchResult(result)}
                            className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-start border-b border-gray-100 last:border-b-0"
                          >
                            <MapPin size={18} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.main_text || result.description}
                              </p>
                              {result.secondary_text && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {result.secondary_text}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Map */}
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <MapComponent
                      center={[location.latitude, location.longitude]}
                      onLocationChange={handleLocationChange}
                    />
                  </div>

                  {/* Selected Address Display */}
                  {address && (
                    <div className="flex items-start gap-3 bg-green-50 rounded-xl border border-green-200" style={{ padding: '14px 18px' }}>
                      <MapPin size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-700">{address}</p>
                    </div>
                  )}
                </div>

                {/* Address Type Selection */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[var(--black)]">نوع العنوان</p>
                  <div className="flex gap-3">
                    {addressTypes.map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => setAddressType(type)}
                        className={clsx(
                          "flex-1 flex flex-col items-center gap-2 rounded-xl border-2 transition-all",
                          addressType === type
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        style={{ padding: '16px 12px' }}
                      >
                        <div className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          addressType === type
                            ? "bg-[var(--primary)]/15"
                            : "bg-gray-100"
                        )}>
                          <Icon size={20} className={addressType === type ? "text-[var(--primary)]" : "text-gray-500"} />
                        </div>
                        <span className={clsx(
                          "text-sm font-medium",
                          addressType === type ? "text-[var(--primary)]" : "text-gray-600"
                        )}>
                          {label}
                        </span>
                        {addressType === type && (
                          <div className="absolute -top-1 -end-1 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Title (for "other" type) */}
                {addressType === 'other' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[var(--black)]">
                      {tAddress('addressTitle')}
                    </label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="مثال: بيت الجدة"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Address Details */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[var(--black)]">تفاصيل إضافية (اختياري)</p>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">{tAddress('street')} / رقم المنزل</label>
                    <Input
                      value={streetHouseNumber}
                      onChange={(e) => setStreetHouseNumber(e.target.value)}
                      placeholder="شارع 15، منزل رقم 23"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">ملاحظات للتوصيل</label>
                    <textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="مثال: البوابة الزرقاء، الدور الثاني"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Footer - Only show in form mode */}
            {viewMode === 'form' && (
            <div className="flex-shrink-0 bg-white border-t border-gray-100" style={{ padding: '20px 24px' }}>
              <button
                onClick={handleSave}
                disabled={isSaving || !address}
                style={{ backgroundColor: '#FF3D00', padding: '16px 24px' }}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 rounded-xl text-base font-bold transition-all",
                  "text-white",
                  "hover:opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg"
                )}
              >
                {isSaving ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <>
                    <Check size={20} className="text-white" />
                    <span className="text-white">{editAddress ? t('save') : 'حفظ العنوان'}</span>
                  </>
                )}
              </button>
            </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddressForm;
