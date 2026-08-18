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
  upi_id?: string;
  upi_name?: string;
  qr_code_image?: string;
  is_open: boolean;
  owner?: number;
  owner_username?: string;
  college: number;
  college_name?: string;
}

export interface AttributeOption {
  id: number;
  attribute?: number;
  attribute_name?: string;
  value: string;
  display_name: string;
  created_at?: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  category?: number | null;
  category_name?: string;
  data_type: string;
  is_required: boolean;
  is_filterable: boolean;
  options?: AttributeOption[];
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  attributes?: ProductAttribute[];
}

export interface ProductVariant {
  id: number;
  product: number;
  product_name?: string;
  sku: string;
  name: string;
  price: string | number;
  attribute_options?: number[];
  attribute_options_detail?: AttributeOption[];
  image?: string;
  is_active?: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  base_price?: string | number;
  unit: string;
  brand: string;
  category: number | null;
  category_name?: string;
  has_variants?: boolean;
  attributes?: number[];
  attributes_detail?: ProductAttribute[];
  variants?: ProductVariant[];
  image?: string;
  is_active?: boolean;
}

export interface InventoryItem {
  id: number;
  shop: number;
  shop_name: string;
  shop_location?: string;
  product: number;
  product_details?: Product;
  variant?: number | null;
  variant_name?: string;
  variant_details?: ProductVariant;
  item_name?: string;
  price: string | number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_available: boolean;
}

export interface SearchResultItem {
  id: number;
  inventory_id: number;
  shop_id: number;
  shop: string;
  shop_phone?: string;
  shop_upi_id?: string;
  shop_upi_name?: string;
  shop_qr_code_image?: string;
  location_name: string;
  approx_distance_m: number;
  product_id: number;
  variant_id?: number | null;
  product: string;
  base_product_name?: string;
  variant_name?: string;
  sku?: string;
  brand: string;
  description: string;
  unit: string;
  category: string;
  image?: string;
  price: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_in_stock: boolean;
  shop_is_open: boolean;
}

export interface ClarificationOption {
  id: number;
  name: string;
  value: string;
  attribute_name: string;
}

export interface ClarificationContext {
  product_id?: number;
  product_name?: string;
  selected_option_ids?: number[];
}

export interface SearchResponse {
  query: string;
  is_clarification: boolean;
  clarification_question?: string;
  clarification_options?: ClarificationOption[];
  context?: ClarificationContext;
  matched_product?: string;
  matched_variant?: string;
  in_stock?: boolean;
  count: number;
  message?: string;
  results: SearchResultItem[];
}

export interface ReservationItem {
  id: number;
  product: number;
  product_name: string;
  variant?: number | null;
  variant_name?: string;
  item_name?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Reservation {
  id: number;
  reservation_code: string;
  student: number;
  student_username: string;
  shop: number;
  shop_name: string;
  shop_location?: string;
  shop_phone?: string;
  shop_upi_id?: string;
  shop_upi_name?: string;
  shop_qr_code_image?: string;
  upi_payment_uri?: string;
  status: 'PENDING' | 'PAYMENT_SUBMITTED' | 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
  payment_status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'FAILED';
  payment_method?: string;
  payment_reference?: string;
  payment_submitted_at?: string;
  items: ReservationItem[];
  total_amount: string;
  pickup_eta_minutes?: number;
  whatsapp_notification_status?: 'PENDING' | 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'MOCK' | null;
  whatsapp_link?: string;
  whatsapp_error?: string;
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
