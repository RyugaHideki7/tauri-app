export const APP_NAME = 'Tauri App';
export const APP_VERSION = '1.0.0';

export const API_ENDPOINTS = {
  BASE_URL: process.env.NODE_ENV === 'production' ? 'https://api.example.com' : 'http://localhost:3001',
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  AUTH_TOKEN: 'auth_token',
} as const;