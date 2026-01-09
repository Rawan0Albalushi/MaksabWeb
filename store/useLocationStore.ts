import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

interface LocationState {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  
  setLocation: (location: UserLocation) => void;
  clearLocation: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Get current location using browser geolocation
  getCurrentLocation: () => Promise<UserLocation | null>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      location: null,
      isLoading: false,
      error: null,

      setLocation: (location) => {
        set({ location, error: null });
      },

      clearLocation: () => {
        set({ location: null, error: null });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

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
              
              // Try to get address from coordinates using reverse geocoding
              let address = '';
              let city = '';
              
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
                );
                const data = await response.json();
                
                if (data.address) {
                  city = data.address.city || data.address.town || data.address.village || data.address.state || '';
                  address = data.display_name || '';
                  
                  // Simplify the address
                  if (data.address.road) {
                    address = data.address.road;
                    if (data.address.suburb) {
                      address += ', ' + data.address.suburb;
                    }
                    if (city) {
                      address += ', ' + city;
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

              set({ location: newLocation, isLoading: false, error: null });
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
    }),
    {
      name: 'location-storage',
      partialize: (state) => ({ location: state.location }),
    }
  )
);
