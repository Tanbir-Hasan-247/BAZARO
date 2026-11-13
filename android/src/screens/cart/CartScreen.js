import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { resolveMediaUrl, formatApiError } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';

const CHANNELS = [
  { id: 'card', label: 'Card Sandbox', icon: 'card-outline', method: 'Visa / Mastercard' },
  { id: 'mfs', label: 'bKash / Nagad', icon: 'phone-portrait-outline', method: 'bKash MFS' },
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline', method: 'Cash on Delivery' },
];

const CartScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
    checkout,
    checkoutAndInitiateGateway,
    totalPrice,
    refreshCart,
  } = useCart();
  const { theme } = useAppTheme();

  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponErr, setCouponErr] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [settlementOpen, setSettlementOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [channel, setChannel] = useState('card');
  const [mfsWallet, setMfsWallet] = useState('bKash');
  const [settling, setSettling] = useState(false);

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <View style={styles.obsidianBadge}>
          <Ionicons name="lock-closed" size={30} color="#E5C77A" />
        </View>
        <Text style={[styles.authTitle, { color: theme.text }]}>
          Sign In to Your Bag
        </Text>
        <Text style={[styles.authSubtitle, { color: theme.textMuted }]}>
          Access your synchronized shopping bag, saved delivery vault, and order settlement.
        </Text>
        <CustomButton
          title="Sign In"
          onPress={() => navigation.navigate('ProfileTab')}
          style={styles.authBtn}
        />
      </SafeAreaView>
    );
  }

  if (loading && !cart) {
    return <LoadingSpinner message="Opening your shopping bag..." />;
  }

  const items = cart?.items || [];
  const activeCoupon = items.length > 0 ? couponApplied : null;
  const activeCouponErr = items.length > 0 ? couponErr : '';
  const subtotal = Number(totalPrice || 0);
  const discountAmount = Number(activeCoupon?.discount_amount || 0);
  const shippingFee = subtotal > 50 || subtotal === 0 ? 0 : 5;
  const finalPayable = Math.max(0, subtotal - discountAmount + shippingFee);
  const shippingProgress = Math.min(100, Math.round((subtotal / 50) * 100));

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponErr('Enter a vault coupon code (e.g. BAZARO20).');
      return;
    }
    setValidatingCoupon(true);
    setCouponErr('');
    try {
      const res = await apiClient.post('/orders/validate_coupon/', {
        code,
        subtotal: subtotal.toFixed(2),
      });
      setCouponApplied({
        code,
        discount_amount: Number(res.data?.discount_amount || 0),
        discount_percent: Number(res.data?.discount_percent || 0),
      });
    } catch (error) {
      setCouponApplied(null);
      setCouponErr(formatApiError(error, 'Invalid or expired promo code.'));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const openSettlementModal = () => {
    if (items.length === 0) {
      Alert.alert('Empty Bag', 'Add pieces from the Atelier before checking out.');
      return;
    }
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      setRecipientName((prev) => prev || fullName || user.email?.split('@')[0] || '');
      setContactPhone((prev) => prev || user.phone_number || '');
      setShippingAddress((prev) => prev || user.address || '');
    }
    setSettlementOpen(true);
  };

  const validateDestination = () => {
    if (!shippingAddress.trim()) {
      Alert.alert('Delivery Address', 'Please enter a delivery street address.');
      return false;
    }
    if (!contactPhone.trim()) {
      Alert.alert('Contact Phone', 'Please enter an active contact phone number.');
      return false;
    }
    return true;
  };

  const handleCompleteSandbox = async () => {
    if (!validateDestination()) return;
    setSettling(true);
    const chosen = CHANNELS.find((c) => c.id === channel);
    const methodLabel =
      channel === 'mfs' ? `${mfsWallet} MFS` : chosen?.method || 'Card';
    const isOnline = channel !== 'cod';
    const txnId = isOnline
      ? `BAZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : '';

    const res = await checkout({
      shipping_address: shippingAddress.trim(),
      contact_phone: contactPhone.trim(),
      recipient_name: recipientName.trim(),
      payment_method: methodLabel,
      transaction_id: txnId,
      coupon_code: activeCoupon?.code || '',
      confirmPaid: isOnline,
    });
    setSettling(false);

    if (res.success) {
      setSettlementOpen(false);
      setCouponApplied(null);
      setCouponInput('');
      Alert.alert(
        'Reservation Confirmed',
        `Order #${String(res.order?.id || '').slice(0, 8).toUpperCase()} has been recorded.`,
        [
          { text: 'Track Live', onPress: () => navigation.navigate('OrdersTab') },
        ]
      );
    } else {
      Alert.alert('Settlement Notice', res.message);
    }
  };

  const handleExternalGateway = async (provider) => {
    if (!validateDestination()) return;
    setSettling(true);
    const res = await checkoutAndInitiateGateway({
      provider,
      shipping_address: shippingAddress.trim(),
      contact_phone: contactPhone.trim(),
      recipient_name: recipientName.trim(),
      coupon_code: activeCoupon?.code || '',
    });
    setSettling(false);

    if (!res.success) {
      Alert.alert('Gateway Notice', res.message);
      return;
    }

    setSettlementOpen(false);
    setCouponApplied(null);
    setCouponInput('');

    if (res.gateway?.mode === 'redirect' && res.gateway?.gateway_url) {
      try {
        await Linking.openURL(res.gateway.gateway_url);
      } catch {
        Alert.alert(
          'Open Checkout URL',
          'Could not launch external browser automatically. Check Orders tab for payment status.'
        );
      }
      navigation.navigate('OrdersTab');
      return;
    }

    Alert.alert(
      'Order Reserved (Sandbox Mode)',
      `${res.gateway?.detail || 'Gateway keys are not set in backend .env.'} Your order #${String(
        res.order?.id || ''
      )
        .slice(0, 8)
        .toUpperCase()} is saved in Orders where you can settle immediately.`,
      [{ text: 'View Orders', onPress: () => navigation.navigate('OrdersTab') }]
    );
  };

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.obsidianBadge}>
            <Ionicons name="bag-outline" size={34} color="#E5C77A" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Your Acquisition Bag is Empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Explore our curated chambers to add signature pieces to your bag.
          </Text>
          <CustomButton
            title="Explore Catalog"
            onPress={() => navigation.navigate('HomeTab')}
            style={styles.shopNowBtn}
          />
        </View>
      ) : (
        <View style={styles.container}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            onRefresh={refreshCart}
            refreshing={loading}
            ListHeaderComponent={
              <View
                style={[
                  styles.progressCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: theme.text }]}>
                    {subtotal >= 50
                      ? 'Complimentary Insured Courier Unlocked'
                      : `Add $${(50 - subtotal).toFixed(2)} for complimentary courier`}
                  </Text>
                  <Text style={[styles.progressPct, { color: theme.primary }]}>
                    {shippingProgress}%
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.surface }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${shippingProgress}%`, backgroundColor: theme.gold },
                    ]}
                  />
                </View>
              </View>
            }
            ListFooterComponent={
              <View
                style={[
                  styles.couponCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.couponTitle, { color: theme.text }]}>
                  Atelier Promo Privilege
                </Text>
                <View style={styles.couponRow}>
                  <TextInput
                    style={[
                      styles.couponInput,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={couponInput}
                    onChangeText={setCouponInput}
                    placeholder="Enter code (e.g. BAZARO20)"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    onPress={handleApplyCoupon}
                    disabled={validatingCoupon}
                    style={[styles.couponBtn, { backgroundColor: theme.buttonBg }]}
                  >
                    <Text style={[styles.couponBtnText, { color: theme.buttonText }]}>
                      {validatingCoupon ? '...' : 'Apply'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {activeCoupon ? (
                  <Text style={[styles.couponSuccess, { color: theme.accent }]}>
                    Applied {activeCoupon.code}: saving $
                    {activeCoupon.discount_amount.toFixed(2)} (
                    {activeCoupon.discount_percent}% off)
                  </Text>
                ) : null}
                {activeCouponErr ? (
                  <Text style={[styles.couponError, { color: theme.danger }]}>
                    {activeCouponErr}
                  </Text>
                ) : null}
              </View>
            }
            renderItem={({ item }) => {
              const rawImg =
                item.product?.images?.[0]?.image || item.product?.image || null;
              const imgUrl = resolveMediaUrl(rawImg);

              return (
                <View
                  style={[
                    styles.itemCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    theme.mode === 'light' && SHADOWS.light,
                  ]}
                >
                  <View style={[styles.thumbWrap, { backgroundColor: theme.surface }]}>
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <Ionicons name="bag-handle-outline" size={22} color={theme.textMuted} />
                    )}
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
                      {item.product?.name}
                    </Text>
                    {item.selected_variant ? (
                      <View
                        style={[
                          styles.variantChip,
                          { backgroundColor: theme.primaryLight, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.variantChipText, { color: theme.primary }]}>
                          {item.selected_variant}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.unitPrice, { color: theme.textMuted }]}>
                      ${Number(item.product?.price || 0).toFixed(2)} each
                    </Text>
                    <Text style={[styles.subtotalText, { color: theme.primary }]}>
                      Subtotal: ${Number(item.total_price || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.actionCol}>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.quantityRow,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: theme.card }]}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={14} color={theme.text} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyValue, { color: theme.text }]}>
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: theme.card }]}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={14} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* Checkout Sticky Footer */}
          <View
            style={[
              styles.checkoutBar,
              { backgroundColor: '#0D0A08', borderTopColor: 'rgba(197, 155, 75, 0.35)' },
            ]}
          >
            <View style={styles.priceSummary}>
              <View>
                <Text style={styles.totalLabel}>Net Payable (Courier {shippingFee === 0 ? 'Free' : '$5.00'})</Text>
                {discountAmount > 0 ? (
                  <Text style={styles.savingsHint}>
                    Saved ${discountAmount.toFixed(2)} with {activeCoupon?.code}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.totalAmount}>${finalPayable.toFixed(2)}</Text>
            </View>

            <CustomButton
              variant="gold"
              title="Proceed to Settlement"
              onPress={openSettlementModal}
              loading={loading}
              style={styles.checkoutBtn}
              icon={<Ionicons name="shield-checkmark-outline" size={18} color="#0D0A08" />}
            />
          </View>
        </View>
      )}

      {/* Settlement Vault Modal */}
      <Modal
        visible={settlementOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettlementOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>BAZARO SETTLEMENT VAULT</Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Delivery & Payment
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSettlementOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <CustomInput
                label="Recipient Name"
                placeholder="Patron full name"
                iconName="person-outline"
                value={recipientName}
                onChangeText={setRecipientName}
              />
              <CustomInput
                label="Contact Phone *"
                placeholder="01700-000000"
                iconName="call-outline"
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
              <CustomInput
                label="Delivery Address *"
                placeholder="Road, Sector, City"
                iconName="location-outline"
                multiline
                numberOfLines={2}
                value={shippingAddress}
                onChangeText={setShippingAddress}
              />

              <Text style={[styles.channelHeading, { color: theme.textMuted }]}>
                BUILT-IN SETTLEMENT CHANNEL
              </Text>
              <View style={styles.channelRow}>
                {CHANNELS.map((ch) => {
                  const active = channel === ch.id;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      onPress={() => setChannel(ch.id)}
                      style={[
                        styles.channelTab,
                        {
                          backgroundColor: active ? '#0D0A08' : theme.card,
                          borderColor: active ? theme.gold : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={ch.icon}
                        size={17}
                        color={active ? '#E5C77A' : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.channelTabText,
                          { color: active ? '#FAF5EB' : theme.text },
                        ]}
                      >
                        {ch.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {channel === 'mfs' ? (
                <View style={styles.mfsRow}>
                  {['bKash', 'Nagad', 'Rocket'].map((wallet) => (
                    <TouchableOpacity
                      key={wallet}
                      onPress={() => setMfsWallet(wallet)}
                      style={[
                        styles.walletPill,
                        {
                          backgroundColor:
                            mfsWallet === wallet ? theme.primary : theme.card,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: mfsWallet === wallet ? '#FAF5EB' : theme.text,
                        }}
                      >
                        {wallet}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <CustomButton
                title={
                  channel === 'cod'
                    ? `Confirm COD Order ($${finalPayable.toFixed(2)})`
                    : `Authorize & Pay $${finalPayable.toFixed(2)}`
                }
                onPress={handleCompleteSandbox}
                loading={settling}
                style={{ marginTop: 6 }}
              />

              <Text style={[styles.externalLabel, { color: theme.textMuted }]}>
                EXTERNAL LIVE SANDBOX REDIRECT
              </Text>
              <View style={styles.externalRow}>
                <TouchableOpacity
                  disabled={settling}
                  onPress={() => handleExternalGateway('sslcommerz')}
                  style={[styles.extBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Ionicons name="open-outline" size={14} color={theme.primary} />
                  <Text style={[styles.extBtnText, { color: theme.text }]}>
                    SSLCommerz BD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={settling}
                  onPress={() => handleExternalGateway('stripe')}
                  style={[styles.extBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Ionicons name="open-outline" size={14} color={theme.primary} />
                  <Text style={[styles.extBtnText, { color: theme.text }]}>
                    Stripe Test
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 14,
    paddingBottom: 140,
    gap: 12,
  },
  progressCard: {
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  couponCard: {
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  couponTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONTS.mono,
  },
  couponBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: SIZES.radiusSm,
  },
  couponBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  couponSuccess: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
  couponError: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
  },
  itemCard: {
    borderRadius: SIZES.radiusLg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  thumbWrap: {
    width: 68,
    height: 76,
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: '700',
  },
  variantChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  variantChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unitPrice: {
    fontSize: 12,
    marginTop: 4,
  },
  subtotalText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 74,
  },
  deleteBtn: {
    padding: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusFull,
    padding: 3,
    borderWidth: 1,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    borderTopWidth: 1,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6C8B0',
  },
  savingsHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  totalAmount: {
    fontFamily: FONTS.serif,
    fontSize: 26,
    fontWeight: '800',
    color: '#E5C77A',
  },
  checkoutBtn: {
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  obsidianBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0D0A08',
    borderWidth: 1.5,
    borderColor: '#C59B4B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
  },
  authSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 19,
  },
  authBtn: {
    minWidth: 190,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 19,
  },
  shopNowBtn: {
    minWidth: 190,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 10, 8, 0.76)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#C59B4B',
  },
  modalTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  channelHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 8,
    marginTop: 2,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  channelTab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  channelTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  mfsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  walletPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    alignItems: 'center',
  },
  externalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  externalRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  extBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
  },
  extBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default CartScreen;
