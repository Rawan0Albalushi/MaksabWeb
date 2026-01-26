/**
 * Format price with currency
 */
export const formatPrice = (price: number, currency = 'OMR'): string => {
  return `${price.toFixed(2)} ${currency}`;
};

/**
 * Format date to locale string
 */
export const formatDate = (date: string | Date, locale = 'ar'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-OM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time
 */
export const formatTime = (date: string | Date, locale = 'ar'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale === 'ar' ? 'ar-OM' : 'en-OM', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date, locale = 'ar'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ar') {
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(d, locale);
  } else {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(d, locale);
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (Oman)
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Oman phone: starts with +968 or 968 or 9, followed by 8 digits
  const phoneRegex = /^(\+?968)?[79]\d{7}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `+968 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('968')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Calculate distance between two coordinates (in km)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Storage helpers
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or not available
    }
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

/**
 * Class names helper
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get order status info
 */
export const getOrderStatusInfo = (status: string, locale = 'ar') => {
  const statusMap: Record<string, { label: { ar: string; en: string }; color: string }> = {
    new: { label: { ar: 'جديد', en: 'New' }, color: 'warning' },
    accepted: { label: { ar: 'تم القبول', en: 'Accepted' }, color: 'primary' },
    ready: { label: { ar: 'جاهز', en: 'Ready' }, color: 'primary' },
    on_a_way: { label: { ar: 'في الطريق', en: 'On the way' }, color: 'primary' },
    delivered: { label: { ar: 'تم التوصيل', en: 'Delivered' }, color: 'success' },
    canceled: { label: { ar: 'ملغي', en: 'Canceled' }, color: 'error' },
  };

  const info = statusMap[status] || { label: { ar: status, en: status }, color: 'outline' };
  return {
    label: info.label[locale as 'ar' | 'en'],
    color: info.color,
  };
};

/**
 * Address helpers - Normalize address data from API
 * API returns location as [latitude, longitude] array
 * We store it as { latitude, longitude } object
 */
export interface NormalizedAddress {
  id: number;
  title?: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  active: boolean;
  street_house_number?: string;
  additional_details?: string;
}

export interface ApiAddress {
  id: number;
  title?: string;
  address?: string | { address?: string; floor?: string; house?: string };
  location?: [number, number] | { latitude: number; longitude: number };
  active: boolean;
  street_house_number?: string;
  additional_details?: string;
}

/**
 * Normalize address from API format to app format
 */
export const normalizeAddress = (apiAddress: ApiAddress): NormalizedAddress | null => {
  if (!apiAddress) return null;

  // Normalize address string
  let addressString = '';
  if (typeof apiAddress.address === 'string') {
    addressString = apiAddress.address;
  } else if (apiAddress.address?.address) {
    addressString = apiAddress.address.address;
  }

  // Normalize location
  let location: { latitude: number; longitude: number } | null = null;
  if (apiAddress.location) {
    if (Array.isArray(apiAddress.location)) {
      // API format: [latitude, longitude]
      location = {
        latitude: apiAddress.location[0],
        longitude: apiAddress.location[1],
      };
    } else if (typeof apiAddress.location === 'object' && 'latitude' in apiAddress.location) {
      // Already in correct format
      location = apiAddress.location;
    }
  }

  if (!location) return null;

  return {
    id: apiAddress.id,
    title: apiAddress.title,
    address: addressString,
    location,
    active: apiAddress.active,
    street_house_number: apiAddress.street_house_number,
    additional_details: apiAddress.additional_details,
  };
};

/**
 * Normalize array of addresses
 */
export const normalizeAddresses = (apiAddresses: ApiAddress[]): NormalizedAddress[] => {
  return apiAddresses
    .map(normalizeAddress)
    .filter((addr): addr is NormalizedAddress => addr !== null);
};

/**
 * Get address display string
 */
export const getAddressDisplayString = (address: ApiAddress | NormalizedAddress): string => {
  if ('address' in address) {
    if (typeof address.address === 'string') {
      return address.address;
    } else if (typeof address.address === 'object' && address.address?.address) {
      return address.address.address;
    }
  }
  return '';
};

/**
 * Get location from address (handles both API and normalized formats)
 */
export const getAddressLocation = (address: ApiAddress | NormalizedAddress): { latitude: number; longitude: number } | null => {
  if (!address.location) return null;

  if (Array.isArray(address.location)) {
    return {
      latitude: address.location[0],
      longitude: address.location[1],
    };
  }

  if (typeof address.location === 'object' && 'latitude' in address.location) {
    return address.location;
  }

  return null;
};

