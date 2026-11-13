import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { resolveMediaUrl, formatApiError } from '../../api/client';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { addToCart, loading: cartLoading } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useAppTheme();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review Modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    try {
      const res = await apiClient.get(`/products/${productId}/`);
      const data = res.data;
      setProduct(data);
      const colors = Array.isArray(data?.available_colors) ? data.available_colors : [];
      const sizes = Array.isArray(data?.available_sizes) ? data.available_sizes : [];
      setSelectedColor(colors[0] || '');
      setSelectedSize(sizes[0] || '');
    } catch (e) {
      console.error('Failed to fetch product details:', e);
      Alert.alert('Unavailable', 'Edition could not be loaded.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [productId, navigation]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await apiClient.get(`/products/${productId}/reviews/`);
      const data = res.data?.results || res.data;
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    }
  }, [productId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      fetchProductDetails();
      fetchReviews();
    });
    return () => {
      active = false;
    };
  }, [fetchProductDetails, fetchReviews]);

  const navigateAuth = () =>
    navigation.navigate('MainTabs', { screen: 'ProfileTab' });

  const handleToggleWishlist = async () => {
    if (!product) return;
    const res = await toggleWishlist(product.id);
    if (res.requireAuth) {
      Alert.alert('Sign In Required', res.message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: navigateAuth },
      ]);
    }
  };

  const selectedVariant = [selectedColor, selectedSize].filter(Boolean).join(' / ');

  const handleAddToCart = async () => {
    if (!product) return;
    const res = await addToCart(product.id, quantity, selectedVariant);
    if (res.requireAuth) {
      Alert.alert('Sign In Required', res.message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: navigateAuth },
      ]);
    } else if (res.success) {
      Alert.alert(
        'Added to Bag',
        `${product.name}${selectedVariant ? ` (${selectedVariant})` : ''} × ${quantity} has been reserved in your bag.`,
        [
          { text: 'Continue Browsing' },
          {
            text: 'View Bag',
            onPress: () => navigation.navigate('MainTabs', { screen: 'CartTab' }),
          },
        ]
      );
    } else {
      Alert.alert('Notice', res.message);
    }
  };

  const handleAddReview = async () => {
    if (!isAuthenticated) {
      setReviewModalVisible(false);
      Alert.alert('Sign In Required', 'Sign in to publish a patron review.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: navigateAuth },
      ]);
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Review Needed', 'Please share brief notes about this edition.');
      return;
    }

    setSubmittingReview(true);
    try {
      await apiClient.post(`/products/${productId}/reviews/`, {
        ratings: rating,
        comment: comment.trim(),
      });
      setComment('');
      setRating(5);
      setReviewModalVisible(false);
      await Promise.all([fetchReviews(), fetchProductDetails()]);
      Alert.alert('Thank You', 'Your review has been recorded.');
    } catch (error) {
      Alert.alert('Notice', formatApiError(error, 'Could not post review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert('Remove Review', 'Delete your published review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/products/${productId}/reviews/${reviewId}/`);
            await Promise.all([fetchReviews(), fetchProductDetails()]);
          } catch {
            Alert.alert('Error', 'Failed to delete review.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingSpinner message="Inspecting edition details..." />;
  }

  if (!product) return null;

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
          .map((img) => ({ ...img, resolved: resolveMediaUrl(img.image) }))
          .filter((img) => Boolean(img.resolved))
      : [];
  const colors = Array.isArray(product.available_colors) ? product.available_colors : [];
  const sizes = Array.isArray(product.available_sizes) ? product.available_sizes : [];
  const inStock = (product.stock || 0) > 0;
  const saved = isWishlisted(product.id);
  const avgRating = Number(product.average_rating || 0);

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Editorial Image Gallery */}
        <View style={[styles.imageGallery, { backgroundColor: theme.surface }]}>
          {images.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={images}
              keyExtractor={(item, idx) => String(item.id || idx)}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.resolved }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              )}
            />
          ) : (
            <View style={styles.placeholderGallery}>
              <Ionicons name="bag-handle-outline" size={64} color={theme.textMuted} />
            </View>
          )}

          {/* Save to Wishlist Button */}
          <TouchableOpacity
            onPress={handleToggleWishlist}
            style={[
              styles.floatingHeart,
              {
                backgroundColor: saved ? '#0D0A08' : 'rgba(250, 245, 235, 0.94)',
                borderColor: saved ? '#E5C77A' : 'rgba(197, 155, 75, 0.5)',
              },
            ]}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={20}
              color={saved ? '#E5C77A' : '#1A1410'}
            />
          </TouchableOpacity>

          {images.length > 1 ? (
            <View style={styles.indicatorContainer}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.indicator,
                    { backgroundColor: 'rgba(13, 10, 8, 0.25)' },
                    i === activeImageIndex && {
                      backgroundColor: theme.gold,
                      width: 22,
                    },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Product Detail Sheet */}
        <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
          <View style={styles.metaTopRow}>
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor: inStock
                    ? 'rgba(5, 150, 105, 0.12)'
                    : 'rgba(185, 28, 28, 0.12)',
                },
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  { color: inStock ? theme.accent : theme.danger },
                ]}
              >
                {inStock ? `${product.stock} In Vault` : 'Sold Out'}
              </Text>
            </View>

            {avgRating > 0 ? (
              <View style={styles.ratingSummaryPill}>
                <Ionicons name="star" size={13} color={theme.star} />
                <Text style={[styles.ratingSummaryText, { color: theme.text }]}>
                  {avgRating.toFixed(1)} ({product.review_count || reviews.length})
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.productName, { color: theme.text }]}>
            {product.name}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.primary }]}>
              ${Number(product.price || 0).toFixed(2)}
            </Text>
            {product.price_with_tax ? (
              <Text style={[styles.taxPrice, { color: theme.textMuted }]}>
                Incl. Tax ${Number(product.price_with_tax).toFixed(2)}
              </Text>
            ) : null}
          </View>

          {/* Finish / Color Variants */}
          {colors.length > 0 ? (
            <View style={[styles.section, { borderTopColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Finish / Color{' '}
                {selectedColor ? (
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>
                    · {selectedColor}
                  </Text>
                ) : null}
              </Text>
              <View style={styles.chipGrid}>
                {colors.map((c) => {
                  const active = selectedColor === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={[
                        styles.variantChip,
                        {
                          backgroundColor: active ? '#0D0A08' : theme.card,
                          borderColor: active ? theme.gold : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          { color: active ? '#E5C77A' : theme.text },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Size Variants */}
          {sizes.length > 0 ? (
            <View style={[styles.section, { borderTopColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Edition Size{' '}
                {selectedSize ? (
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>
                    · {selectedSize}
                  </Text>
                ) : null}
              </Text>
              <View style={styles.chipGrid}>
                {sizes.map((s) => {
                  const active = selectedSize === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSelectedSize(s)}
                      style={[
                        styles.variantChip,
                        {
                          backgroundColor: active ? '#0D0A08' : theme.card,
                          borderColor: active ? theme.gold : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          { color: active ? '#E5C77A' : theme.text },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Editorial Description */}
          <View style={[styles.section, { borderTopColor: theme.border }]}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Atelier Provenance & Notes
            </Text>
            <Text style={[styles.descriptionText, { color: theme.textMuted }]}>
              {product.description || 'Crafted for the BAZARO private collection.'}
            </Text>
          </View>

          {/* Quantity Selector */}
          {inStock ? (
            <View style={[styles.quantitySection, { borderTopColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
                Quantity
              </Text>
              <View
                style={[
                  styles.quantityControls,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.surface }]}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={17} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: theme.text }]}>
                  {quantity}
                </Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.surface }]}
                  onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  <Ionicons name="add" size={17} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Patron Reviews */}
          <View style={[styles.section, { borderTopColor: theme.border }]}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
                Patron Impressions ({reviews.length})
              </Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(true)}
                style={styles.writeReviewBtn}
              >
                <Ionicons name="create-outline" size={15} color={theme.primary} />
                <Text style={[styles.writeReviewText, { color: theme.primary }]}>
                  Write Review
                </Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <Text style={[styles.noReviews, { color: theme.textMuted }]}>
                No patron notes yet. Share the first impression.
              </Text>
            ) : (
              reviews.map((rev) => (
                <View
                  key={rev.id}
                  style={[
                    styles.reviewItem,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.reviewTopRow}>
                    <Text style={[styles.reviewerName, { color: theme.text }]}>
                      {rev.user?.name || 'Verified Patron'}
                    </Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= rev.ratings ? 'star' : 'star-outline'}
                          size={12}
                          color={theme.star}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewComment, { color: theme.textMuted }]}>
                    {rev.comment}
                  </Text>
                  {user && rev.user?.id === user.id ? (
                    <TouchableOpacity
                      onPress={() => handleDeleteReview(rev.id)}
                      style={styles.deleteReviewBtn}
                    >
                      <Text style={[styles.deleteReviewText, { color: theme.danger }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Settlement Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
          theme.mode === 'light' && SHADOWS.light,
        ]}
      >
        <View style={styles.bottomPriceCol}>
          <Text style={[styles.bottomTotalLabel, { color: theme.textMuted }]}>
            {selectedVariant ? selectedVariant : 'Total Allocation'}
          </Text>
          <Text style={[styles.bottomTotalPrice, { color: theme.text }]}>
            ${(Number(product.price || 0) * quantity).toFixed(2)}
          </Text>
        </View>
        <CustomButton
          title={inStock ? 'Add to Bag' : 'Sold Out'}
          onPress={handleAddToCart}
          disabled={!inStock}
          loading={cartLoading}
          style={styles.addToCartBtn}
          icon={<Ionicons name="bag-add-outline" size={18} color={theme.buttonText} />}
        />
      </View>

      {/* Review Submission Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Rate & Review Edition
              </Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.starLabel, { color: theme.textMuted }]}>
              Select rating:
            </Text>
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity key={val} onPress={() => setRating(val)}>
                  <Ionicons
                    name={val <= rating ? 'star' : 'star-outline'}
                    size={30}
                    color={theme.star}
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput
              label="Your Impression"
              placeholder="Notes on craftsmanship, packaging, or performance..."
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />

            <CustomButton
              title="Publish Review"
              onPress={handleAddReview}
              loading={submittingReview}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 112,
  },
  imageGallery: {
    width: SCREEN_WIDTH,
    height: 320,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 320,
  },
  placeholderGallery: {
    width: SCREEN_WIDTH,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -20,
    padding: 20,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ratingSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingSummaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productName: {
    fontFamily: FONTS.serif,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 31,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
  },
  taxPrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  variantChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  quantitySection: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    padding: 4,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '800',
    marginHorizontal: 14,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  writeReviewText: {
    fontSize: 12,
    fontWeight: '800',
  },
  noReviews: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reviewItem: {
    borderRadius: SIZES.radiusMd,
    padding: 13,
    borderWidth: 1,
    marginBottom: 10,
  },
  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '800',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 19,
  },
  deleteReviewBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  deleteReviewText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottomTotalPrice: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 1,
  },
  addToCartBtn: {
    minWidth: 168,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 10, 8, 0.72)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '700',
  },
  starLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
});

export default ProductDetailScreen;
