// Base API Response
export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  status: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Translation
export interface Translation {
  id: number;
  locale: string;
  title: string;
  description?: string;
  short_desc?: string;
}

// Category
export interface Category {
  id: number;
  uuid: string;
  img?: string;
  active: boolean;
  translation?: Translation;
  children?: Category[];
  products_count?: number;
}

// Shop
export interface Shop {
  id: number;
  uuid: string;
  slug?: string;
  logo_img?: string;
  background_img?: string;
  open: boolean;
  verify?: boolean;
  delivery_time?: {
    from: number | string;
    to: number | string;
    type: string;
  };
  delivery_range?: number;
  delivery_fee?: number;
  price?: number; // Delivery fee (from API)
  price_per_km?: number; // Delivery price per km
  min_amount?: number;
  tax?: number;
  percentage?: number;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  translation?: Translation;
  rating_avg?: number;
  reviews_count?: number;
  products_count?: number;
  shop_working_days?: WorkingDay[];
  shop_closed_date?: ClosedDate[];
  distance?: number;
  created_at?: string;
}

export interface WorkingDay {
  id: number;
  day: string;
  from: string;
  to: string;
  disabled: boolean;
}

export interface ClosedDate {
  id: number;
  date: string;
}

// Product
export interface Product {
  id: number;
  uuid: string;
  img?: string;
  active: boolean;
  min_qty?: number;
  max_qty?: number;
  translation?: Translation;
  stocks?: Stock[];
  galleries?: Gallery[];
  category?: Category;
  shop?: Shop;
  rating_avg?: number;
  reviews_count?: number;
}

export interface Stock {
  id: number;
  quantity: number;
  price: number;
  total_price: number;
  discount?: number;
  extras?: Extra[];
  addons?: Addon[];
  product?: Product;
}

export interface Extra {
  id: number;
  value: string;
  group?: ExtraGroup;
}

export interface ExtraGroup {
  id: number;
  type: 'color' | 'text' | 'image';
  translation?: Translation;
}

export interface Addon {
  id: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Gallery {
  id: number;
  path: string;
}

// Banner
export interface Banner {
  id: number;
  url?: string;
  img: string;
  active: boolean;
  clickable: boolean;
  products?: Product[];
  shops?: Shop[];
  translation?: Translation;
}

// Story
export interface Story {
  id: number;
  file_urls: string[];
  product_id?: number;
  shop_id?: number;
  product?: Product;
  shop?: Shop;
}

// Cart
export interface Cart {
  id: number;
  shop_id: number;
  total_price: number;
  shop?: Shop;
  user_carts?: UserCart[];
}

export interface UserCart {
  id: number;
  uuid: string;
  name?: string;
  cart_details?: CartDetail[];
  cartDetails?: CartDetail[]; // API sometimes returns camelCase
}

export interface CartDetail {
  id: number;
  quantity: number;
  price: number;
  discount?: number;
  stock?: Stock;
  addons?: CartAddon[];
}

export interface CartAddon {
  id: number;
  quantity: number;
  stock_id: number;
}

// Order
export interface Order {
  id: number;
  status: OrderStatus;
  total_price: number;
  delivery_fee: number;
  tax?: number;
  service_fee?: number;
  discount?: number;
  coupon_price?: number;
  delivery_date?: string;
  delivery_time?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  location?: OrderLocation;
  // API may return address in different fields
  my_address?: OrderAddress;
  address?: OrderAddress;
  delivery_man?: DeliveryMan;
  details?: OrderDetail[];
  transaction?: Transaction;
}

export type OrderStatus = 
  | 'new' 
  | 'accepted' 
  | 'ready' 
  | 'on_a_way' 
  | 'delivered' 
  | 'canceled';

export interface OrderLocation {
  latitude: number;
  longitude: number;
  address: string;
}

// OrderAddress - API may return address in this format
export interface OrderAddress {
  id?: number;
  address?: string | { address?: string; floor?: string; house?: string };
  location?: [number, number] | { latitude: number; longitude: number };
  title?: string;
  active?: boolean;
}

export interface DeliveryMan {
  id: number;
  firstname?: string;
  lastname?: string;
  phone?: string;
  img?: string;
  rating_avg?: number;
}

export interface OrderDetail {
  id: number;
  quantity: number;
  origin_price: number;
  total_price: number;
  discount?: number;
  stock?: Stock;
  addons?: OrderAddon[];
}

export interface OrderAddon {
  id: number;
  quantity: number;
  stock?: Stock;
}

export interface Transaction {
  id: number;
  status: 'progress' | 'paid' | 'canceled' | 'rejected';
  payment_system?: PaymentSystem;
}

export interface PaymentSystem {
  id: number;
  tag: string;
  input?: number;
}

// User
export interface User {
  id: number;
  uuid: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  img?: string;
  gender?: 'male' | 'female';
  birthday?: string;
  wallet?: Wallet;
  addresses?: Address[];
  maksab_pin?: string;
}

export interface Wallet {
  uuid: string;
  price: number;
}

export interface Address {
  id: number;
  title?: string;
  address?: string | { address?: string; floor?: string; house?: string };
  // Location can be either [latitude, longitude] array or { latitude, longitude } object
  location?: [number, number] | { latitude: number; longitude: number };
  active: boolean;
  street_house_number?: string;
  additional_details?: string;
}

// Auth
export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  verifyId: string;
  message: string;
}

// Language & Currency
export interface Language {
  id: number;
  locale: string;
  title: string;
  img?: string;
  is_default: boolean;
}

export interface Currency {
  id: number;
  title: string;
  symbol: string;
  rate: number;
  is_default: boolean;
}

// Coupon
export interface Coupon {
  id: number;
  name: string;
  type: 'fix' | 'percent';
  price: number;
  valid: boolean;
}

// Notification
export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

// Settings
export interface GlobalSettings {
  title: string;
  min_version?: string;
  currency?: Currency;
  languages?: Language[];
}

// Reviews
export interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    id: number;
    firstname?: string;
    lastname?: string;
    img?: string;
  };
}

// FAQ
export interface FAQ {
  id: number;
  uuid: string;
  translation?: Translation;
}

// Parcel
export interface ParcelType {
  id: number;
  type: string;
  img?: string;
  price?: number;
}

export interface ParcelOrder {
  id: number;
  status: string;
  total_price: number;
  address_from?: OrderLocation;
  address_to?: OrderLocation;
  delivery_man?: DeliveryMan;
}

// Calculate
export interface CalculateResult {
  // Snake case (from API)
  price?: number; // Subtotal
  total_price: number;
  delivery_fee: number;
  tax: number;
  total_tax?: number;
  service_fee: number;
  discount: number;
  total_discount?: number;
  coupon_price: number;
  // Camel case alternatives (some APIs return this)
  totalPrice?: number;
  deliveryFee?: number;
  totalTax?: number;
  serviceFee?: number;
  couponPrice?: number;
  totalDiscount?: number;
}

// Wallet History
export interface WalletHistory {
  id: number;
  uuid: string;
  type: 'topup' | 'withdraw' | 'order';
  price: number;
  note?: string;
  created_at: string;
}

// Referral
export interface Referral {
  referral_code: string;
  referral_count: number;
  referral_earnings: number;
}

// Price Range
export interface PriceRange {
  min: number;
  max: number;
  avg: number;
}

// Saved Payment Card (Thawani)
export interface SavedCard {
  id: string;
  payment_method_id: string;
  brand: string; // visa, mastercard, etc.
  last_four: string;
  exp_month: string;
  exp_year: string;
  is_default?: boolean;
}

// Create Order Response (Thawani integration)
export interface CreateOrderResponse {
  id: number;
  status: OrderStatus;
  total_price: number;
  // For new card payment (Checkout Session)
  payment_url?: string;
  // For saved card payment (Payment Intent with OTP)
  otp_verification_url?: string;
  // Additional order data
  shop?: Shop;
  created_at?: string;
}

// Thawani Payment Result
export interface ThawaniPaymentResult {
  order_id: number;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  message?: string;
  transaction_id?: string;
}
