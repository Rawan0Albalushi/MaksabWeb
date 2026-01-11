'use client';

import { useCallback, useEffect } from 'react';
import { useLocationStore } from '@/store';
import { useAuthStore } from '@/store';
import { userService } from '@/services';
import { Address } from '@/types';

interface UseAddressManagerReturn {
  // State
  selectedAddress: ReturnType<typeof useLocationStore>['selectedAddress'];
  savedAddresses: Address[];
  currentLocation: ReturnType<typeof useLocationStore>['currentLocation'];
  isLoading: boolean;
  isLoadingAddresses: boolean;
  error: string | null;
  hasLocation: boolean;
  
  // Actions
  fetchAddresses: () => Promise<void>;
  selectAddress: (address: Address) => void;
  useCurrentLocation: () => Promise<void>;
  detectLocation: () => Promise<void>;
  addAddress: (data: AddressFormData) => Promise<Address | null>;
  updateAddress: (addressId: number, data: AddressFormData) => Promise<boolean>;
  deleteAddress: (addressId: number) => Promise<boolean>;
  setActiveAddress: (addressId: number) => Promise<boolean>;
  clearLocation: () => void;
  
  // Helpers
  getLocationForApi: () => { latitude: number; longitude: number };
  refreshTrigger: number;
}

export interface AddressFormData {
  title: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  street_house_number?: string;
  additional_details?: string;
}

export const useAddressManager = (): UseAddressManagerReturn => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    selectedAddress,
    savedAddresses,
    currentLocation,
    isLoading,
    isLoadingAddresses,
    error,
    setSavedAddresses,
    setLoadingAddresses,
    setError,
    selectSavedAddress,
    useCurrentLocationAsSelected,
    getCurrentLocation,
    getLocationForApi,
    hasLocation,
    clearLocation,
    refreshTrigger,
  } = useLocationStore();

  // Fetch addresses when authenticated
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedAddresses([]);
      return;
    }

    setLoadingAddresses(true);
    setError(null);

    try {
      const response = await userService.getAddresses();
      if (response.status && response.data) {
        setSavedAddresses(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setError('FETCH_ADDRESSES_FAILED');
    } finally {
      setLoadingAddresses(false);
    }
  }, [isAuthenticated, setSavedAddresses, setLoadingAddresses, setError]);

  // Load addresses on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      // Use addresses from user profile if available
      if (user?.addresses && user.addresses.length > 0) {
        setSavedAddresses(user.addresses);
      } else {
        fetchAddresses();
      }
    } else {
      setSavedAddresses([]);
    }
  }, [isAuthenticated, user?.addresses, fetchAddresses, setSavedAddresses]);

  // Select a saved address
  const selectAddress = useCallback((address: Address) => {
    selectSavedAddress(address);
  }, [selectSavedAddress]);

  // Detect and use current location
  const detectLocation = useCallback(async () => {
    await getCurrentLocation();
  }, [getCurrentLocation]);

  // Use current location as selected
  const useCurrentLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      useCurrentLocationAsSelected();
    }
  }, [getCurrentLocation, useCurrentLocationAsSelected]);

  // Add new address
  const addAddress = useCallback(async (data: AddressFormData): Promise<Address | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await userService.addAddress(data);
      if (response.status && response.data) {
        // Refresh addresses list
        await fetchAddresses();
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to add address:', err);
      setError('ADD_ADDRESS_FAILED');
      return null;
    }
  }, [isAuthenticated, fetchAddresses, setError]);

  // Update address
  const updateAddress = useCallback(async (addressId: number, data: AddressFormData): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await userService.updateAddress(addressId, data);
      if (response.status) {
        // Refresh addresses list
        await fetchAddresses();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update address:', err);
      setError('UPDATE_ADDRESS_FAILED');
      return false;
    }
  }, [isAuthenticated, fetchAddresses, setError]);

  // Delete address
  const deleteAddress = useCallback(async (addressId: number): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await userService.deleteAddress(addressId);
      if (response.status) {
        // Refresh addresses list
        await fetchAddresses();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete address:', err);
      setError('DELETE_ADDRESS_FAILED');
      return false;
    }
  }, [isAuthenticated, fetchAddresses, setError]);

  // Set active address
  const setActiveAddress = useCallback(async (addressId: number): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await userService.setActiveAddress(addressId);
      if (response.status) {
        // Refresh addresses list
        await fetchAddresses();
        
        // Select the newly activated address
        const address = savedAddresses.find(a => a.id === addressId);
        if (address) {
          selectSavedAddress(address);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to set active address:', err);
      setError('SET_ACTIVE_ADDRESS_FAILED');
      return false;
    }
  }, [isAuthenticated, fetchAddresses, savedAddresses, selectSavedAddress, setError]);

  return {
    // State
    selectedAddress,
    savedAddresses,
    currentLocation,
    isLoading,
    isLoadingAddresses,
    error,
    hasLocation: hasLocation(),
    
    // Actions
    fetchAddresses,
    selectAddress,
    useCurrentLocation,
    detectLocation,
    addAddress,
    updateAddress,
    deleteAddress,
    setActiveAddress,
    clearLocation,
    
    // Helpers
    getLocationForApi,
    refreshTrigger,
  };
};

export default useAddressManager;
