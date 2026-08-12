export interface User {
  id: number;
  username: string;
  full_name?: string;
  display_name?: string;
  email: string;
  phone?: string;
  role: 'STUDENT' | 'SHOPKEEPER' | 'ADMIN';
  college?: number;
  college_name?: string;
  shop_id?: number | null;
  is_active?: boolean;
  created_at?: string;
  last_login?: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  message?: string;
}

export interface College {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Shop {
  id: number;
  name: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  whatsapp_number?: string;
  is_open: boolean;
  owner?: number;
  owner_username?: string;
  college: number;
  college_name?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  unit: string;
  brand: string;
  category: number;
  category_name?: string;
}

export interface InventoryItem {
  id: number;
  shop: number;
  shop_name: string;
  product: number;
  product_details: Product;
  price: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_available: boolean;
}

export interface SearchResultItem {
  id: number;
  shop_id: number;
  shop: string;
  location_name: string;
  latitude: number;
  longitude: number;
  approx_distance_m: number;
  product_id: number;
  product: string;
  brand: string;
  description: string;
  unit: string;
  category: string;
  price: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_available: boolean;
}

export interface SearchResponse {
  query: string;
  filters: any;
  count: number;
  message?: string;
  results: SearchResultItem[];
}

export interface ReservationItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
}

export interface Reservation {
  id: number;
  reservation_code: string;
  student: number;
  student_username: string;
  shop: number;
  shop_name: string;
  shop_location?: string;
  status: 'PENDING' | 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  items: ReservationItem[];
  total_amount: string;
  estimated_eta_minutes: number;
  pickup_eta_minutes?: number;
  whatsapp_notification_status?: 'PENDING' | 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'MOCK' | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: number;
  reservation?: number;
  reservation_code?: string;
  shop?: number;
  shop_name?: string;
  recipient_phone: string;
  notification_type?: string;
  message: string;
  channel: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'MOCK';
  status_display?: string;
  provider_message_id?: string;
  error_message?: string;
  sent_at?: string | null;
  created_at: string;
}

export interface WhatsAppConfigStatus {
  success: boolean;
  configured: boolean;
  mode: 'REAL_WHATSAPP_CONFIGURED' | 'REAL_WHATSAPP_NOT_CONFIGURED';
  sender_number: string;
  phone_number_id?: string;
  business_account_id?: string;
  missing_credentials: string[];
  message: string;
}
