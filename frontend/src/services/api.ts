import axios from 'axios';
import { AuthResponse, User, Shop, Product, InventoryItem, SearchResponse, Reservation, NotificationLog, WhatsAppConfigStatus } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerStudent: async (data: { full_name: string; email: string; phone: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register/', data);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

export const searchService = {
  search: async (query: string): Promise<SearchResponse> => {
    const response = await api.get('/search/', { params: { q: query } });
    return response.data;
  },
};

export const reservationService = {
  create: async (shopId: number, items: { product_id: number; quantity: number }[], etaMinutes: number = 30): Promise<Reservation> => {
    const response = await api.post('/reservations/', {
      shop_id: shopId,
      items: items,
      pickup_eta_minutes: etaMinutes,
    });
    return response.data;
  },

  getReservations: async (): Promise<Reservation[]> => {
    const response = await api.get('/reservations/');
    return response.data;
  },

  cancel: async (reservationId: number): Promise<Reservation> => {
    const response = await api.post(`/reservations/${reservationId}/cancel/`);
    return response.data;
  },
};

export const notificationService = {
  getWhatsAppConfigStatus: async (): Promise<WhatsAppConfigStatus> => {
    const response = await api.get('/notifications/whatsapp-config/');
    return response.data;
  },
};

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats/');
    return response.data;
  },
  getShops: async (): Promise<Shop[]> => {
    const response = await api.get('/admin/shops/');
    return response.data;
  },
  createShop: async (data: any): Promise<Shop> => {
    const response = await api.post('/admin/shops/', data);
    return response.data;
  },
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get('/admin/products/');
    return response.data;
  },
  createProduct: async (data: any): Promise<Product> => {
    const response = await api.post('/admin/products/', data);
    return response.data;
  },
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/admin/inventory/');
    return response.data;
  },
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users/');
    return response.data;
  },
  getReservations: async (): Promise<Reservation[]> => {
    const response = await api.get('/admin/reservations/');
    return response.data;
  },
  getNotifications: async (): Promise<NotificationLog[]> => {
    const response = await api.get('/admin/notifications/');
    return response.data;
  },
  getWhatsAppConfigStatus: async (): Promise<WhatsAppConfigStatus> => {
    const response = await api.get('/notifications/whatsapp-config/');
    return response.data;
  },
};
