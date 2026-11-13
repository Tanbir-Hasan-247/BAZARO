import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES, SHADOWS } from '../constants/theme';
import { resolveMediaUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAppTheme } from '../context/ThemeContext';

const ProductCard = ({ product, onPress, onRequireAuth }) => {
  const { addToCart, loading } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { theme } = useAppTheme();

  const rawImage =
    product?.images && product.images.length > 0 ? product.images[0].image : null;
  const imageUrl = resolveMediaUrl(rawImage);

  const isOutOfStock = (product?.stock || 0) <= 0;
  const saved = isWishlisted(product?.id);
  const hasVariants =
    (Array.isArray(product?.available_colors) && product.available_colors.length > 0) ||
    (Array.isArray(product?.available_sizes) && product.available_sizes.length > 0);
  const avgRating = Number(product?.average_rating || 0);

  const handleQuickAdd = async () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      onPress?.();
      return;
    }
    const res = await addToCart(product.id, 1, '');
    if (res.requireAuth) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        Alert.alert('Sign In Required', res.message);
      }
    } else if (!res.success && res.message) {
      Alert.alert('Bag Notice', res.message);
    }
  };

  const handleToggleHeart = async () => {
    const res = await toggleWishlist(product.id);
    if (res.requireAuth) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        Alert.alert('Sign In Required', res.message);
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        theme.mode === 'light' && SHADOWS.light,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: theme.surface },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="bag-handle-outline" size={34} color={theme.textMuted} />
          </View>
        )}

        {/* Stock pill */}
        <View
          style={[
            styles.stockBadge,
            {
              backgroundColor: isOutOfStock
                ? 'rgba(185, 28, 28, 0.92)'
                : 'rgba(13, 10, 8, 0.78)',
              borderColor: isOutOfStock ? 'transparent' : 'rgba(229, 199, 122, 0.45)',
            },
          ]}
        >
          <Text
            style={[
              styles.stockBadgeText,
              { color: isOutOfStock ? '#FFFFFF' : '#E5C77A' },
            ]}
          >
            {isOutOfStock ? 'Sold Out' : `${product.stock} Available`}
          </Text>
        </View>

        {/* Wishlist Heart */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleHeart}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.heartBtn,
            {
              backgroundColor: saved
                ? '#0D0A08'
                : 'rgba(250, 245, 235, 0.92)',
              borderColor: saved ? '#E5C77A' : 'rgba(197, 155, 75, 0.4)',
            },
          ]}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? '#E5C77A' : '#1A1410'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.metaRow}>
          {avgRating > 0 ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color={theme.star} />
              <Text style={[styles.ratingText, { color: theme.textMuted }]}>
                {avgRating.toFixed(1)}
              </Text>
            </View>
          ) : (
            <Text style={[styles.atelierTag, { color: theme.primary }]}>
              Atelier Edit
            </Text>
          )}
          {hasVariants ? (
            <Text style={[styles.variantHint, { color: theme.textMuted }]}>
              Options
            </Text>
          ) : null}
        </View>

        <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, { color: theme.text }]}>
              ${Number(product.price || 0).toFixed(2)}
            </Text>
            {product.price_with_tax ? (
              <Text style={[styles.taxText, { color: theme.textMuted }]}>
                Tax incl: ${Number(product.price_with_tax).toFixed(2)}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.cartBtn,
              {
                backgroundColor: isOutOfStock ? theme.surface : theme.buttonBg,
                borderColor: isOutOfStock ? theme.border : theme.gold,
              },
            ]}
            onPress={handleQuickAdd}
            disabled={isOutOfStock || loading}
          >
            <Ionicons
              name={hasVariants ? 'options-outline' : 'bag-add-outline'}
              size={16}
              color={isOutOfStock ? theme.textMuted : theme.buttonText}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: 14,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  imageContainer: {
    width: '100%',
    height: 152,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  atelierTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  variantHint: {
    fontSize: 10,
    fontWeight: '600',
  },
  name: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
  },
  taxText: {
    fontSize: 10,
    marginTop: 1,
  },
  cartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductCard;
