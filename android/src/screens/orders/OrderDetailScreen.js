import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { formatApiError } from '../../api/client';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import CustomButton from '../../components/CustomButton';
import OrderTimelineStepper from '../../components/OrderTimelineStepper';

const OrderDetailScreen = ({ route }) => {
  const [order, setOrder] = useState(route.params?.order);
  const { theme } = useAppTheme();
  const [settling, setSettling] = useState(false);

  if (!order) return null;

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent order';

  const subtotal = Number(order.subtotal || order.total_price || 0);
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_fee || 0);
  const total = Number(order.total_price || 0);
  const canSettle = order.payment_status !== 'Paid' && order.status !== 'Canceled';

  const handleSandboxSettle = async () => {
    setSettling(true);
    try {
      const txnId = `BAZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const res = await apiClient.post(`/orders/${order.id}/confirm_payment/`, {
        payment_method: order.payment_method || 'Card Sandbox',
        transaction_id: txnId,
      });
      if (res.data) setOrder(res.data);
      Alert.alert('Settlement Confirmed', `Transaction Ref: ${txnId}`);
    } catch (error) {
      Alert.alert('Notice', formatApiError(error, 'Could not complete settlement.'));
    } finally {
      setSettling(false);
    }
  };

  const handleLaunchGateway = async (provider) => {
    setSettling(true);
    try {
      const res = await apiClient.post(`/orders/${order.id}/initiate_payment/`, {
        provider,
      });
      if (res.data?.mode === 'redirect' && res.data?.gateway_url) {
        await Linking.openURL(res.data.gateway_url);
      } else {
        Alert.alert(
          'Sandbox Mode Notice',
          res.data?.detail ||
            'External gateway credentials are not set; use Built-in Settlement above.'
        );
      }
    } catch (error) {
      Alert.alert('Notice', formatApiError(error, 'Could not contact gateway.'));
    } finally {
      setSettling(false);
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header & Timeline */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            theme.mode === 'light' && SHADOWS.light,
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.eyebrow}>VERIFIED ACQUISITION</Text>
              <Text style={[styles.orderTitle, { color: theme.text }]}>
                Order #{String(order.id).slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    order.payment_status === 'Paid'
                      ? 'rgba(5, 150, 105, 0.14)'
                      : 'rgba(180, 83, 9, 0.14)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      order.payment_status === 'Paid' ? theme.accent : theme.warning,
                  },
                ]}
              >
                {order.payment_status || 'Pending'}
              </Text>
            </View>
          </View>

          <Text style={[styles.fullId, { color: theme.textMuted }]}>
            UUID: {order.id}
          </Text>
          <Text style={[styles.orderDate, { color: theme.textMuted }]}>
            Recorded: {formattedDate}
          </Text>
          {order.transaction_id ? (
            <Text style={[styles.orderDate, { color: theme.primary, fontWeight: '700' }]}>
              Payment Ref: {order.transaction_id} ({order.payment_method || 'Digital'})
            </Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <OrderTimelineStepper order={order} />
        </View>

        {/* Quick Payment Recovery if Unpaid */}
        {canSettle ? (
          <View
            style={[
              styles.card,
              { backgroundColor: '#0D0A08', borderColor: 'rgba(197, 155, 75, 0.45)' },
            ]}
          >
            <Text style={styles.eyebrow}>SETTLEMENT PENDING</Text>
            <Text style={styles.pendingTitle}>Complete Order Payment</Text>
            <CustomButton
              variant="gold"
              title={`Instant Sandbox Pay ($${total.toFixed(2)})`}
              onPress={handleSandboxSettle}
              loading={settling}
              style={{ marginTop: 12 }}
            />
            <View style={styles.gatewayRow}>
              <TouchableOpacity
                disabled={settling}
                onPress={() => handleLaunchGateway('sslcommerz')}
                style={styles.gatewayBtn}
              >
                <Ionicons name="open-outline" size={14} color="#E5C77A" />
                <Text style={styles.gatewayBtnText}>SSLCommerz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={settling}
                onPress={() => handleLaunchGateway('stripe')}
                style={styles.gatewayBtn}
              >
                <Ionicons name="open-outline" size={14} color="#E5C77A" />
                <Text style={styles.gatewayBtnText}>Stripe Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Destination Card */}
        {(order.shipping_address || order.recipient_name || order.contact_phone) ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.mode === 'light' && SHADOWS.light,
            ]}
          >
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Courier Destination
            </Text>
            {order.recipient_name ? (
              <Text style={[styles.destBold, { color: theme.text }]}>
                {order.recipient_name}
              </Text>
            ) : null}
            {order.shipping_address ? (
              <Text style={[styles.destText, { color: theme.textMuted }]}>
                {order.shipping_address}
              </Text>
            ) : null}
            {order.contact_phone ? (
              <Text style={[styles.destText, { color: theme.textMuted }]}>
                Phone: {order.contact_phone}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Ordered Items & Financial Ledger */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            theme.mode === 'light' && SHADOWS.light,
          ]}
        >
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Curated Pieces ({order.items?.length || 0})
          </Text>
          {order.items?.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[styles.itemRow, { borderBottomColor: theme.border }]}
            >
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.text }]}>
                  {item.product?.name}
                </Text>
                {item.selected_variant ? (
                  <Text style={[styles.variantNote, { color: theme.primary }]}>
                    Finish / Size: {item.selected_variant}
                  </Text>
                ) : null}
                <Text style={[styles.itemSubtext, { color: theme.textMuted }]}>
                  Qty: {item.quantity} × ${Number(item.price || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: theme.text }]}>
                ${Number(item.total_price || item.price * item.quantity || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.breakdown}>
            <View style={styles.summaryRow}>
              <Text style={[styles.breakLabel, { color: theme.textMuted }]}>Subtotal</Text>
              <Text style={[styles.breakValue, { color: theme.text }]}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            {discount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.breakLabel, { color: theme.accent }]}>
                  Coupon{order.coupon_code ? ` (${order.coupon_code})` : ''}
                </Text>
                <Text style={[styles.breakValue, { color: theme.accent }]}>
                  -${discount.toFixed(2)}
                </Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={[styles.breakLabel, { color: theme.textMuted }]}>
                Insured Courier
              </Text>
              <Text style={[styles.breakValue, { color: theme.text }]}>
                {shipping === 0 ? 'Complimentary' : `$${shipping.toFixed(2)}`}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>Grand Total</Text>
            <Text style={[styles.summaryTotal, { color: theme.primary }]}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: SIZES.radiusLg,
    padding: 18,
    borderWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#C59B4B',
  },
  orderTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  fullId: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  statusBadgeText: {
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  pendingTitle: {
    fontFamily: FONTS.serif,
    fontSize: 19,
    fontWeight: '700',
    color: '#FAF5EB',
    marginTop: 3,
  },
  gatewayRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  gatewayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.35)',
  },
  gatewayBtnText: {
    color: '#E5C77A',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  destBold: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  destText: {
    fontSize: 13,
    lineHeight: 19,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontFamily: FONTS.serif,
    fontSize: 15,
    fontWeight: '700',
  },
  variantNote: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  itemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '800',
  },
  breakdown: {
    marginTop: 12,
    gap: 6,
  },
  breakLabel: {
    fontSize: 13,
  },
  breakValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryTotal: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    fontWeight: '800',
  },
});

export default OrderDetailScreen;
