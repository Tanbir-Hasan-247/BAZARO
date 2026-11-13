import { create as createAxios } from 'axios';
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  getStoredValue,
  clearAuthAndCartStorage,
} from '../constants/storageKeys';

const PRODUCTION_FALLBACK_URL = 'https://apibazaro-alpha.vercel.app/api/v1';

function extractScriptUrl() {
  try {
    const turboUrl = TurboModuleRegistry?.get?.('SourceCode')?.getConstants?.()?.scriptURL;
    if (typeof turboUrl === 'string' && turboUrl) return turboUrl;
  } catch {
    // Ignore when TurboModule SourceCode is unavailable
  }
  try {
    const mod = NativeModules?.SourceCode;
    const modUrl = mod?.getConstants?.()?.scriptURL || mod?.scriptURL;
    if (typeof modUrl === 'string' && modUrl) return modUrl;
  } catch {
    // Ignore under Bridgeless fallback
  }
  return null;
}

function buildDevCandidates() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return [envUrl.trim().replace(/\/+$/, '')];
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const candidates = [];
    const scriptUrl = extractScriptUrl();
    if (typeof scriptUrl === 'string' && scriptUrl.startsWith('http')) {
      const match = scriptUrl.match(/^https?:\/\/([^/:]+)/);
      const host = match?.[1];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        candidates.push(`http://${host}:8000/api/v1`);
      }
    }

    if (Platform.OS === 'android') {
      // 127.0.0.1 works over USB (`adb reverse tcp:8000 tcp:8000`); 10.0.2.2 works on Android Emulator
      candidates.push('http://127.0.0.1:8000/api/v1');
      candidates.push('http://10.0.2.2:8000/api/v1');
    } else {
      candidates.push('http://127.0.0.1:8000/api/v1');
    }

    candidates.push(PRODUCTION_FALLBACK_URL);
    return [...new Set(candidates)];
  }

  return [PRODUCTION_FALLBACK_URL];
}

const DEV_CANDIDATES = buildDevCandidates();
let activeBaseUrl = DEV_CANDIDATES[0] || PRODUCTION_FALLBACK_URL;
let probePromise = null;

export const BASE_URL = activeBaseUrl;
export const API_ORIGIN = activeBaseUrl.replace(/\/api\/v1\/?$/, '');

export function getApiBaseUrl() {
  return activeBaseUrl;
}

export function getApiOrigin() {
  return activeBaseUrl.replace(/\/api\/v1\/?$/, '');
}

export function resolveMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const origin = getApiOrigin();
  if (/^https?:\/\//i.test(trimmed)) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return trimmed.replace(
        /^https?:\/\/(?:127\.0\.0\.1|localhost|10\.0\.2\.2)(?::\d+)?(\/.*)$/i,
        `${origin}$1`
      );
    }
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${normalizedPath}`;
}

export function formatApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) {
    return error?.message?.includes('Network') || error?.code === 'ECONNABORTED'
      ? `Cannot reach BAZARO server (${activeBaseUrl}). Ensure Django runs on 0.0.0.0:8000 or USB adb reverse is active.`
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

function findReachableDevBaseUrl(failedUrl) {
  const explicitEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitEnv && explicitEnv.trim()) return Promise.resolve(null);
  if (typeof __DEV__ === 'undefined' || !__DEV__ || Platform.OS === 'web') {
    return Promise.resolve(null);
  }
  if (probePromise) return probePromise;

  const others = DEV_CANDIDATES.filter((c) => c !== failedUrl);
  if (others.length === 0) return Promise.resolve(null);

  probePromise = new Promise((resolve) => {
    let remaining = others.length;
    let settled = false;

    others.forEach((candidate) => {
      createAxios({ timeout: 3500 })
        .get(`${candidate}/categories/`)
        .then((res) => {
          if (!settled && res.status < 500) {
            settled = true;
            activeBaseUrl = candidate;
            apiClient.defaults.baseURL = candidate;
            resolve(candidate);
          }
        })
        .catch(() => {
          // Candidate unreachable on this network interface
        })
        .finally(() => {
          remaining -= 1;
          if (!settled && remaining <= 0) {
            settled = true;
            resolve(null);
          }
        });
    });
  }).finally(() => {
    probePromise = null;
  });

  return probePromise;
}

const apiClient = createAxios({
  baseURL: activeBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

apiClient.interceptors.request.use(
  async (config) => {
    config.baseURL = activeBaseUrl;
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

    // Auto-failover across LAN IP / USB 127.0.0.1 / Emulator 10.0.2.2 in dev
    if (!error.response && originalRequest && !originalRequest._baseUrlRetried) {
      originalRequest._baseUrlRetried = true;
      const failedBaseUrl = originalRequest.baseURL || activeBaseUrl;
      const fallbackUrl = await findReachableDevBaseUrl(failedBaseUrl);
      if (fallbackUrl) {
        originalRequest.baseURL = fallbackUrl;
        return apiClient(originalRequest);
      }
    }

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
          const res = await createAxios({ timeout: 12000 }).post(
            `${activeBaseUrl}/auth/jwt/refresh/`,
            {
              refresh: refreshToken,
            }
          );
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
