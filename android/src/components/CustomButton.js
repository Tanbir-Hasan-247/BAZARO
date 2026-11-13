import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SIZES, SHADOWS } from '../constants/theme';
import { useAppTheme } from '../context/ThemeContext';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // primary | gold | secondary | outline | danger
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.mode === 'dark' ? '#27201A' : '#E6DAC2';
    switch (variant) {
      case 'gold':
        return theme.gold;
      case 'secondary':
        return theme.surface;
      case 'danger':
        return theme.danger;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return theme.buttonBg;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'gold':
        return '#0D0A08';
      case 'secondary':
        return theme.text;
      case 'outline':
        return theme.primary;
      case 'danger':
        return '#FFFFFF';
      case 'primary':
      default:
        return theme.buttonText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && {
          borderWidth: 1.5,
          borderColor: theme.primary,
        },
        variant === 'secondary' && {
          borderWidth: 1,
          borderColor: theme.border,
        },
        (variant === 'primary' || variant === 'gold') && !disabled && SHADOWS.medium,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? icon : null}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusFull,
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default CustomButton;
