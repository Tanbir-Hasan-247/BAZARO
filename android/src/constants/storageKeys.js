import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@bazaro_access_token',
  REFRESH_TOKEN: '@bazaro_refresh_token',
  USER: '@bazaro_user',
  CART_ID: '@bazaro_cart_id',
  THEME_MODE: '@bazaro_theme_mode',
};

export const LEGACY_STORAGE_KEYS = {
  ACCESS_TOKEN: '@dokanly_access_token',
  REFRESH_TOKEN: '@dokanly_refresh_token',
  USER: '@dokanly_user',
  CART_ID: '@dokanly_cart_id',
  THEME_MODE: '@dokanly_theme_mode',
};

export async function getStoredValue(primaryKey, legacyKey) {
  const val = await AsyncStorage.getItem(primaryKey);
  if (val !== null) return val;
  if (!legacyKey) return null;
  const legacyVal = await AsyncStorage.getItem(legacyKey);
  if (legacyVal !== null) {
    await AsyncStorage.setItem(primaryKey, legacyVal);
  }
  return legacyVal;
}

export async function clearAuthAndCartStorage() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.CART_ID,
    LEGACY_STORAGE_KEYS.ACCESS_TOKEN,
    LEGACY_STORAGE_KEYS.REFRESH_TOKEN,
    LEGACY_STORAGE_KEYS.USER,
    LEGACY_STORAGE_KEYS.CART_ID,
  ]);
}
