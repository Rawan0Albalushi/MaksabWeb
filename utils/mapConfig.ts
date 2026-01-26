/**
 * Map Configuration
 * Contains all API keys and settings for maps and location services
 */

export const MapConfig = {
  // Google Maps & Places API Key
  googleApiKey: 'AIzaSyCIfRy1q6SBHRuZP-mekcr9Bji9LFKwjrA',
  
  // OpenRouteService (for routing/directions)
  routingBaseUrl: 'https://api.openrouteservice.org',
  routingApiKey: '5b3ce3597851110001cf62480384c1db92764d1b8959761ea2510ac8',
  
  // Default location (Muscat, Oman)
  defaultLocation: {
    latitude: 23.57143018021092,
    longitude: 58.40579029172659,
  },
  
  // Default zoom levels
  defaultZoom: 17,
  minZoom: 5,
  maxZoom: 20,
  
  // Country restriction for search
  countryCode: 'om', // Oman
};

/**
 * Get route between two points using OpenRouteService
 */
export const getRoute = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
} | null> => {
  try {
    const url = `${MapConfig.routingBaseUrl}/v2/directions/driving-car?api_key=${MapConfig.routingApiKey}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        coordinates: feature.geometry.coordinates,
        distance: feature.properties.segments[0].distance,
        duration: feature.properties.segments[0].duration,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get route:', error);
    return null;
  }
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} م`;
  }
  return `${(meters / 1000).toFixed(1)} كم`;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
};

export default MapConfig;
