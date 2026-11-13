import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { formatApiError } from '../api/client';
import {
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  getStoredValue,
  clearAuthAndCartStorage,
} from '../constants/storageKeys';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/users/me/');
      if (res.data) {
        setUser(res.data);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await getStoredValue(
        STORAGE_KEYS.ACCESS_TOKEN,
        LEGACY_STORAGE_KEYS.ACCESS_TOKEN
      );
      const storedUser = await getStoredValue(
        STORAGE_KEYS.USER,
        LEGACY_STORAGE_KEYS.USER
      );

      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        fetchUserProfile();
      }
    } catch (e) {
      console.error('Failed to load auth credentials:', e);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/jwt/create/', { email, password });
      const { access, refresh } = res.data;

      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      setAccessToken(access);

      const profileRes = await apiClient.get('/auth/users/me/');
      const userData = profileRes.data;

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Sign in failed. Please check your credentials.'),
      };
    }
  };

  const register = async (userData) => {
    try {
      await apiClient.post('/auth/users/', userData);
      return await login(userData.email, userData.password);
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Registration failed.'),
      };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      await apiClient.post('/auth/users/reset_password/', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Could not send reset email.'),
      };
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const res = await apiClient.patch('/auth/users/me/', updatedData);
      setUser(res.data);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
      return { success: true, user: res.data };
    } catch (error) {
      return {
        success: false,
        message: formatApiError(error, 'Failed to update profile.'),
      };
    }
  };

  const logout = async () => {
    try {
      await clearAuthAndCartStorage();
      setUser(null);
      setAccessToken(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        requestPasswordReset,
        logout,
        updateProfile,
        refreshUserProfile: fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
