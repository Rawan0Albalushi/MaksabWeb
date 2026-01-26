import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address } from '@/types';
import { getAddressLocation, getAddressDisplayString } from '@/utils/helpers';
import { MapConfig } from '@/utils/mapConfig';

// Default coordinates (Muscat, Oman)
export const DEFAULT_LOCATION = MapConfig.defaultLocation;

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface SelectedAddress {
  id?: number;
  title?: string;
  address?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  active?: boolean;
  isCurrentLocation?: boolean; // true if from browser geolocation
}

interface LocationState {
  // Current browser location (from geolocation)
  currentLocation: UserLocation | null;
  
  // Selected address for shopping (either from saved addresses or current location)
  selectedAddress: SelectedAddress | null;
  
  // Saved addresses from user profile
  savedAddresses: Address[];
  
  // Loading states
  isLoading: boolean;
  isLoadingAddresses: boolean;
  
  // Errors
  error: string | null;
  
  // Actions
  setCurrentLocation: (location: UserLocation | null) => void;
  setSelectedAddress: (address: SelectedAddress | null) => void;
  setSavedAddresses: (addresses: Address[]) => void;
  clearLocation: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingAddresses: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Select address from saved addresses
  selectSavedAddress: (address: Address) => void;
  
  // Use current location as selected address
  useCurrentLocationAsSelected: () => void;
  
  // Get current location using browser geolocation
  getCurrentLocation: () => Promise<UserLocation | null>;
  
  // Get location for API requests
  getLocationForApi: () => { latitude: number; longitude: number };
  
  // Check if location is set
  hasLocation: () => boolean;
  
  // Refresh shops trigger (incremented when address changes to trigger refetch)
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      selectedAddress: null,
      savedAddresses: [],
      isLoading: false,
      isLoadingAddresses: false,
      error: null,
      refreshTrigger: 0,

      setCurrentLocation: (location) => {
        set({ currentLocation: location, error: null });
      },

      setSelectedAddress: (address) => {
        set({ selectedAddress: address, error: null });
        // Trigger refresh when address changes
        get().triggerRefresh();
      },

      setSavedAddresses: (addresses) => {
        set({ savedAddresses: addresses });
        
        // If no selected address and there are saved addresses, select the active one
        const state = get();
        if (!state.selectedAddress && addresses.length > 0) {
          const activeAddress = addresses.find(a => a.active) || addresses[0];
          const location = getAddressLocation(activeAddress);
          if (location) {
            set({
              selectedAddress: {
                id: activeAddress.id,
                title: activeAddress.title,
                address: getAddressDisplayString(activeAddress),
                location: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
                active: activeAddress.active,
                isCurrentLocation: false,
              }
            });
          }
        }
      },

      clearLocation: () => {
        set({ 
          currentLocation: null, 
          selectedAddress: null,
          error: null 
        });
        get().triggerRefresh();
      },

      setLoading: (isLoading) => set({ isLoading }),

      setLoadingAddresses: (isLoadingAddresses) => set({ isLoadingAddresses }),

      setError: (error) => set({ error }),

      selectSavedAddress: (address) => {
        const location = getAddressLocation(address);
        if (location) {
          set({
            selectedAddress: {
              id: address.id,
              title: address.title,
              address: getAddressDisplayString(address),
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              active: address.active,
              isCurrentLocation: false,
            },
            error: null,
          });
          get().triggerRefresh();
        }
      },

      useCurrentLocationAsSelected: () => {
        const { currentLocation } = get();
        if (currentLocation) {
          set({
            selectedAddress: {
              title: currentLocation.city || 'الموقع الحالي',
              address: currentLocation.address,
              location: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
              isCurrentLocation: true,
            },
            error: null,
          });
          get().triggerRefresh();
        }
      },

      getCurrentLocation: async () => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          set({ error: 'GEOLOCATION_NOT_SUPPORTED' });
          return null;
        }

        set({ isLoading: true, error: null });

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Try to get address from coordinates using Google Geocoding
              let address = '';
              let city = '';
              
              try {
                // Wait for Google Maps to be loaded
                if (window.google?.maps) {
                  const geocoder = new window.google.maps.Geocoder();
                  const result = await geocoder.geocode({ 
                    location: { lat: latitude, lng: longitude },
                    language: 'ar'
                  });
                  
                  if (result.results && result.results.length > 0) {
                    address = result.results[0].formatted_address;
                    
                    // Extract city from address components
                    const addressComponents = result.results[0].address_components;
                    for (const component of addressComponents) {
                      if (component.types.includes('locality') || 
                          component.types.includes('administrative_area_level_1')) {
                        city = component.long_name;
                        break;
                      }
                    }
                  }
                }
              } catch (e) {
                // Geocoding failed, continue with coordinates only
                console.warn('Reverse geocoding failed:', e);
              }

              const newLocation: UserLocation = {
                latitude,
                longitude,
                address: address || undefined,
                city: city || undefined,
              };

              set({ currentLocation: newLocation, isLoading: false, error: null });
              
              // Also set as selected address if no address is selected
              const state = get();
              if (!state.selectedAddress) {
                set({
                  selectedAddress: {
                    title: city || 'الموقع الحالي',
                    address: address || undefined,
                    location: { latitude, longitude },
                    isCurrentLocation: true,
                  }
                });
                get().triggerRefresh();
              }
              
              resolve(newLocation);
            },
            (error) => {
              let errorCode = 'UNKNOWN_ERROR';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorCode = 'PERMISSION_DENIED';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorCode = 'POSITION_UNAVAILABLE';
                  break;
                case error.TIMEOUT:
                  errorCode = 'TIMEOUT';
                  break;
              }
              set({ isLoading: false, error: errorCode });
              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes cache
            }
          );
        });
      },

      getLocationForApi: () => {
        const { selectedAddress, currentLocation } = get();
        
        // Priority: selectedAddress > currentLocation > default
        if (selectedAddress?.location) {
          return {
            latitude: selectedAddress.location.latitude,
            longitude: selectedAddress.location.longitude,
          };
        }
        
        if (currentLocation) {
          return {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          };
        }
        
        return DEFAULT_LOCATION;
      },

      hasLocation: () => {
        const { selectedAddress, currentLocation } = get();
        return !!(selectedAddress?.location || currentLocation);
      },

      triggerRefresh: () => {
        set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
      },
    }),
    {
      name: 'location-storage',
      partialize: (state) => ({ 
        selectedAddress: state.selectedAddress,
        currentLocation: state.currentLocation,
      }),
    }
  )
);

// Legacy export for backward compatibility
export const location = null;
