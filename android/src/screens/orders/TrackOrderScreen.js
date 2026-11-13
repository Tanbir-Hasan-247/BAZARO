import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { formatApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import OrderTimelineStepper from '../../components/OrderTimelineStepper';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';

const TrackOrderScreen = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useAppTheme();

  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);

  const handleLookup = async () => {
    const cleanId = orderId.trim();
    const cleanContact = contact.trim();

    if (!cleanId) {
      setErrorMsg('Enter an Order Reference ID (short 8-char prefix when signed in, or full UUID).');
      return;
    }
    if (!isAuthenticated && !cleanContact) {
      setErrorMsg('Enter your checkout email or phone number to verify ownership.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const params = { order_id: cleanId };
      if (cleanContact) params.contact = cleanContact;
      const res = await apiClient.get('/orders/track/', { params });
      setTrackedOrder(res.data);
    } catch (error) {
      setTrackedOrder(null);
      setErrorMsg(
        formatApiError(error, 'Order could not be verified. Check your reference & contact.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.masthead}>
            <Text style={styles.eyebrow}>CONCIERGE TELEMETRY</Text>
            <Text style={styles.heading}>Track Any Acquisition</Text>
            <Text style={styles.subtext}>
              Verify live atelier milestones using your Order UUID and checkout email or phone.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              theme.mode === 'light' && SHADOWS.light,
            ]}
          >
            <CustomInput
              label="Order Reference ID *"
              placeholder={isAuthenticated ? 'A1B2C3D4 or full UUID' : 'Full Order UUID'}
              iconName="barcode-outline"
              value={orderId}
              onChangeText={(t) => {
                setOrderId(t);
                setErrorMsg('');
              }}
            />

            <CustomInput
              label={isAuthenticated ? 'Email / Phone (Optional for your orders)' : 'Verification Email / Phone *'}
              placeholder="patron@example.com or 017..."
              iconName="shield-checkmark-outline"
              value={contact}
              onChangeText={(t) => {
                setContact(t);
                setErrorMsg('');
              }}
            />

            {errorMsg ? (
              <View style={styles.errBox}>
                <Ionicons name="alert-circle-outline" size={17} color={theme.danger} />
                <Text style={[styles.errText, { color: theme.danger }]}>{errorMsg}</Text>
              </View>
            ) : null}

            <CustomButton
              title="Locate Shipment"
              onPress={handleLookup}
              loading={loading}
              icon={<Ionicons name="search-outline" size={16} color={theme.buttonText} />}
            />
          </View>

          {trackedOrder ? (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                theme.mode === 'light' && SHADOWS.light,
              ]}
            >
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.eyebrow}>VERIFIED DISPATCH</Text>
                  <Text style={[styles.resultTitle, { color: theme.text }]}>
                    Order #{String(trackedOrder.id).slice(0, 8).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.totalValue, { color: theme.primary }]}>
                  ${Number(trackedOrder.total_price || 0).toFixed(2)}
                </Text>
              </View>

              <OrderTimelineStepper order={trackedOrder} />

              <View style={[styles.metaBlock, { borderTopColor: theme.border }]}>
                <Text style={[styles.metaRow, { color: theme.textMuted }]}>
                  Patron:{' '}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>
                    {trackedOrder.recipient_name || trackedOrder.recipient_label || 'Verified Patron'}
                  </Text>
                </Text>
                <Text style={[styles.metaRow, { color: theme.textMuted }]}>
                  Destination:{' '}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>
                    {trackedOrder.shipping_address || trackedOrder.destination_hint || 'Courier Confirmed'}
                  </Text>
                </Text>
                <Text style={[styles.metaRow, { color: theme.textMuted }]}>
                  Payment:{' '}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>
                    {trackedOrder.payment_status} ({trackedOrder.payment_method || 'Digital'})
                  </Text>
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 14,
  },
  masthead: {
    backgroundColor: '#0D0A08',
    borderRadius: SIZES.radiusLg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.42)',
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#C59B4B',
  },
  heading: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    fontWeight: '700',
    color: '#FAF5EB',
    marginTop: 4,
  },
  subtext: {
    fontSize: 12.5,
    color: '#D6C8B0',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    borderRadius: SIZES.radiusLg,
    padding: 18,
    borderWidth: 1,
  },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(185, 28, 28, 0.1)',
    padding: 10,
    borderRadius: SIZES.radiusSm,
    marginBottom: 12,
  },
  errText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitle: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '700',
  },
  totalValue: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '800',
  },
  metaBlock: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 5,
  },
  metaRow: {
    fontSize: 12.5,
  },
});

export default TrackOrderScreen;
