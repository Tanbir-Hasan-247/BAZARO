import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resolveMediaUrl } from '../../api/client';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAppTheme } from '../../context/ThemeContext';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, loading, toggleWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { theme } = useAppTheme();

  const handleMoveToBag = async (product) => {
    const variant = [
      product?.available_colors?.[0],
      product?.available_sizes?.[0],
    ]
      .filter(Boolean)
      .join(' / ');
    const res = await addToCart(product.id, 1, variant);
    if (res.success) {
      Alert.alert('Added to Bag', `${product.name} moved to your bag.`);
    } else {
      Alert.alert('Notice', res.message || 'Could not move item.');
    }
  };

  if (loading && wishlistItems.length === 0) {
    return <LoadingSpinner message="Opening your Saved Vault..." />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <FlatList
        data={wishlistItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refreshWishlist}
        renderItem={({ item }) => {
          const prod = item.product;
          if (!prod) return null;
          const imgUrl = resolveMediaUrl(prod.images?.[0]?.image);
          const inStock = (prod.stock || 0) > 0;

          return (
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                theme.mode === 'light' && SHADOWS.light,
              ]}
            >
              <View style={[styles.thumbBox, { backgroundColor: theme.surface }]}>
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <Ionicons name="diamond-outline" size={24} color={theme.textMuted} />
                )}
              </View>

              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
                  {prod.name}
                </Text>
                <Text style={[styles.price, { color: theme.primary }]}>
                  ${Number(prod.price || 0).toFixed(2)}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    disabled={!inStock}
                    onPress={() => handleMoveToBag(prod)}
                    style={[
                      styles.moveBtn,
                      {
                        backgroundColor: inStock ? theme.buttonBg : theme.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name="bag-add-outline"
                      size={13}
                      color={inStock ? theme.buttonText : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.moveBtnText,
                        { color: inStock ? theme.buttonText : theme.textMuted },
                      ]}
                    >
                      {inStock ? 'Move to Bag' : 'Sold Out'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => toggleWishlist(prod.id)}
                    style={[styles.removeBtn, { borderColor: theme.border }]}
                  >
                    <Ionicons name="trash-outline" size={15} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.obsidianBadge}>
              <Ionicons name="heart-outline" size={32} color="#E5C77A" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Your Saved Vault is Empty
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Tap the heart icon on any edition to keep it curated here for later acquisition.
            </Text>
            <CustomButton
              title="Browse Editions"
              onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
              style={{ marginTop: 18, minWidth: 180 }}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  thumbBox: {
    width: 82,
    height: 92,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
  },
  moveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  removeBtn: {
    padding: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  obsidianBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0D0A08',
    borderWidth: 1.5,
    borderColor: '#C59B4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
});

export default WishlistScreen;
