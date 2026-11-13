import { create as createAxios } from 'axios';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  getStoredValue,
  clearAuthAndCartStorage,
} from '../constants/storageKeys';

const PRODUCTION_FALLBACK_URL = 'https://dokanly-server.vercel.app/api/v1';

function resolveDefaultBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    try {
      const scriptUrl = NativeModules?.SourceCode?.scriptURL;
      if (typeof scriptUrl === 'string' && scriptUrl.startsWith('http')) {
        const match = scriptUrl.match(/^https?:\/\/([^/:]+)/);
        const host = match?.[1];
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          return `http://${host}:8000/api/v1`;
        }
      }
    } catch {
      // Safe fallback under Hermes / Bridgeless mode
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  return PRODUCTION_FALLBACK_URL;
}

export const BASE_URL = resolveDefaultBaseUrl();
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

export function resolveMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${normalizedPath}`;
}

export function formatApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) {
    return error?.message?.includes('Network')
      ? `Cannot reach BAZARO server (${BASE_URL}). Verify backend is running or set EXPO_PUBLIC_API_BASE_URL.`
      : fallback;
  }
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return String(data.non_field_errors[0]);
  }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    if (Array.isArray(val) && val.length > 0) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return val;
  }
  return fallback;
}

const apiClient = createAxios({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getStoredValue(
        STORAGE_KEYS.ACCESS_TOKEN,
        LEGACY_STORAGE_KEYS.ACCESS_TOKEN
      );
      if (token) {
        config.headers.Authorization = `JWT ${token}`;
      }
    } catch (e) {
      console.error('Error fetching access token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/jwt/')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getStoredValue(
          STORAGE_KEYS.REFRESH_TOKEN,
          LEGACY_STORAGE_KEYS.REFRESH_TOKEN
        );
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/jwt/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data?.access;
          if (newAccessToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
            originalRequest.headers.Authorization = `JWT ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        await clearAuthAndCartStorage();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
