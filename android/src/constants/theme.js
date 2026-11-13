import { Platform } from 'react-native';

export const FONTS = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const LIGHT_THEME = {
  mode: 'light',
  primary: '#8E6A28',         // Deep Brass for AA contrast on Warm Parchment
  primaryDark: '#6E501A',
  primaryLight: '#FEF7E4',    // Warm Champagne tint
  gold: '#C59B4B',            // Atelier Signature Gold
  champagne: '#E5C77A',       // Luminous Champagne Highlight
  obsidian: '#0D0A08',        // Royal Obsidian accent surface
  obsidianCard: '#140F0C',
  buttonBg: '#1A1512',        // Quiet Luxury Editorial CTA
  buttonText: '#F6E3B4',
  secondary: '#C59B4B',
  accent: '#059669',          // Emerald for Verified / In Stock
  danger: '#B91C1C',          // Deep Carmine Alert
  warning: '#B45309',         // Rich Ochre for Pending
  background: '#FAF5EB',      // Warm Atelier Parchment
  surface: '#F4EDE0',         // Subtle Cream Surface
  card: '#FFFFFF',
  text: '#1A1410',            // Espresso Charcoal Ink
  textMuted: '#6B5A4E',       // Warm Stone Taupe
  border: '#E6DAC2',          // Soft Parchment Border
  borderActive: '#8E6A28',
  star: '#C59B4B',            // Antique Gold Rating Star
  headerBg: '#FAF5EB',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E6DAC2',
  inputBg: '#FAF5EB',
};

export const DARK_THEME = {
  mode: 'dark',
  primary: '#C59B4B',         // Champagne Antique Gold
  primaryDark: '#9A722B',
  primaryLight: 'rgba(197, 155, 75, 0.16)',
  gold: '#E5C77A',
  champagne: '#F6E3B4',
  obsidian: '#0D0A08',
  obsidianCard: '#140F0C',
  buttonBg: '#C59B4B',        // Burnished Gold CTA on Obsidian
  buttonText: '#0D0A08',
  secondary: '#E5C77A',
  accent: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  background: '#0D0A08',      // Deep Atelier Obsidian
  surface: '#140F0C',         // Warm Charcoal Obsidian
  card: '#18120E',
  text: '#FAF5EB',            // Warm Parchment Ink
  textMuted: '#A89680',       // Soft Satin Taupe
  border: '#2E241C',          // Subtle Brass-dark Hairline
  borderActive: '#C59B4B',
  star: '#E5C77A',
  headerBg: '#0D0A08',
  tabBarBg: '#120D0A',
  tabBarBorder: '#2E241C',
  inputBg: '#140F0C',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusFull: 999,
};

export const SHADOWS = {
  light: {
    shadowColor: '#1A1410',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#8E6A28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
};
