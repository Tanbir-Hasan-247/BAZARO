import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { formatApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderTimelineStepper from '../../components/OrderTimelineStepper';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';

const OrdersScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useAppTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await apiClient.get('/orders/');
      const data = res.data?.results || res.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchOrders();
    });
    return () => {
      active = false;
    };
  }, [fetchOrders]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) fetchOrders();
    });
    return unsubscribe;
  }, [navigation, isAuthenticated, fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Cancel Reservation',
      'Cancel this order and restore items to inventory?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/orders/${orderId}/cancel/`);
              Alert.alert('Order Canceled', 'Your order has been closed cleanly.');
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', formatApiError(error, 'Could not cancel this order.'));
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: 'rgba(5, 150, 105, 0.14)', text: theme.accent };
      case 'Shipped':
      case 'Ready To Ship':
        return { bg: theme.primaryLight, text: theme.primary };
      case 'Canceled':
        return { bg: 'rgba(185, 28, 28, 0.12)', text: theme.danger };
      case 'Not Paid':
      default:
        return { bg: 'rgba(180, 83, 9, 0.14)', text: theme.warning };
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <View style={styles.obsidianBadge}>
          <Ionicons name="receipt-outline" size={30} color="#E5C77A" />
        </View>
        <Text style={[styles.authTitle, { color: theme.text }]}>
          Your Acquisition Ledger
        </Text>
        <Text style={[styles.authSubtitle, { color: theme.textMuted }]}>
          Sign in for your full order history, or look up any shipment reference directly.
        </Text>
        <CustomButton
          title="Sign In"
          onPress={() => navigation.navigate('ProfileTab')}
          style={styles.authBtn}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('TrackOrder')}
          style={styles.guestTrackLink}
        >
          <Text style={[styles.guestTrackText, { color: theme.primary }]}>
            Track Order Without Sign In →
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return <LoadingSpinner message="Fetching your ledger..." />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.gold]}
            tintColor={theme.gold}
          />
        }
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('TrackOrder')}
            style={[
              styles.trackBanner,
              { backgroundColor: '#0D0A08', borderColor: 'rgba(197, 155, 75, 0.45)' },
            ]}
          >
            <View style={styles.trackBannerLeft}>
              <Ionicons name="locate-outline" size={20} color="#E5C77A" />
              <View>
                <Text style={styles.trackBannerTitle}>Live Order Reference Lookup</Text>
                <Text style={styles.trackBannerSub}>
                  Inspect real-time courier telemetry by UUID
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#E5C77A" />
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const st = getStatusStyle(item.status);
          const itemCount = item.items ? item.items.length : 0;
          const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const canCancel = item.status === 'Not Paid' || item.status === 'Ready To Ship';

          return (
            <TouchableOpacity
              style={[
                styles.orderCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                theme.mode === 'light' && SHADOWS.light,
              ]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.orderIdText, { color: theme.text }]}>
                    Order #{item.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                    {formattedDate} • {item.payment_method || 'Settlement'}
                  </Text>
                </View>

                <View style={styles.badgeCol}>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.paymentTag,
                      {
                        color:
                          item.payment_status === 'Paid' ? theme.accent : theme.warning,
                      },
                    ]}
                  >
                    {item.payment_status || 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineContainer}>
                <OrderTimelineStepper order={item} compact />
              </View>

              <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

              <View style={styles.cardFooter}>
                <Text style={[styles.itemsSummary, { color: theme.textMuted }]}>
                  {itemCount} {itemCount === 1 ? 'edition' : 'editions'}
                </Text>
                <Text style={[styles.totalPrice, { color: theme.text }]}>
                  ${Number(item.total_price || 0).toFixed(2)}
                </Text>
              </View>

              {canCancel ? (
                <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelOrder(item.id)}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.danger }]}>
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.detailsLink, { color: theme.primary }]}>
                    Inspect Ledger →
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.obsidianBadge}>
              <Ionicons name="bag-check-outline" size={32} color="#E5C77A" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Acquisitions Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Your confirmed orders and dispatch timelines will appear here.
            </Text>
            <CustomButton
              title="Explore Catalog"
              onPress={() => navigation.navigate('HomeTab')}
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
  listContainer: {
    padding: 14,
    gap: 12,
  },
  trackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
  },
  trackBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackBannerTitle: {
    color: '#FAF5EB',
    fontSize: 13,
    fontWeight: '800',
  },
  trackBannerSub: {
    color: '#A89680',
    fontSize: 11,
  },
  orderCard: {
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 11.5,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentTag: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  timelineContainer: {
    marginTop: 14,
    marginBottom: 4,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsSummary: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  totalPrice: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: '800',
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
  guestTrackLink: {
    marginTop: 18,
  },
  guestTrackText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
});

export default OrdersScreen;
