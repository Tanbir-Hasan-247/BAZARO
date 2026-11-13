import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';

const STEPS = [
  { key: 'placed', label: 'Placed', icon: 'bag-check-outline' },
  { key: 'paid', label: 'Settled', icon: 'card-outline' },
  { key: 'packed', label: 'Packed', icon: 'cube-outline' },
  { key: 'shipped', label: 'Dispatched', icon: 'car-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'home-outline' },
];

function computeActiveStep(order) {
  const status = order?.status || 'Not Paid';
  const paymentStatus = order?.payment_status || 'Pending';

  if (status === 'Delivered') return 4;
  if (status === 'Shipped') return 3;
  if (status === 'Ready To Ship' || status === 'Processing') return 2;
  if (paymentStatus === 'Paid') return 1;
  return 0;
}

const OrderTimelineStepper = ({ order, compact = false }) => {
  const { theme } = useAppTheme();

  if (!order) return null;

  if (order.status === 'Canceled') {
    return (
      <View
        style={[
          styles.canceledBox,
          {
            backgroundColor: 'rgba(185, 28, 28, 0.1)',
            borderColor: 'rgba(185, 28, 28, 0.3)',
          },
        ]}
      >
        <Ionicons name="close-circle-outline" size={18} color={theme.danger} />
        <Text style={[styles.canceledText, { color: theme.danger }]}>
          Order Canceled — Reservation closed & items restored to vault.
        </Text>
      </View>
    );
  }

  const activeIdx = computeActiveStep(order);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {STEPS.map((step, idx) => {
          const completed = idx < activeIdx;
          const current = idx === activeIdx;
          const active = completed || current;

          const circleBg = completed
            ? theme.gold
            : current
            ? '#0D0A08'
            : theme.surface;

          const circleBorder = completed
            ? theme.gold
            : current
            ? theme.gold
            : theme.border;

          const iconColor = completed
            ? '#0D0A08'
            : current
            ? '#E5C77A'
            : theme.textMuted;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    compact && styles.circleCompact,
                    {
                      backgroundColor: circleBg,
                      borderColor: circleBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={completed ? 'checkmark' : step.icon}
                    size={compact ? 12 : 14}
                    color={iconColor}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.stepLabel,
                    compact && styles.stepLabelCompact,
                    {
                      color: active ? theme.text : theme.textMuted,
                      fontWeight: active ? '800' : '500',
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {idx < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor:
                        idx < activeIdx ? theme.gold : theme.border,
                    },
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 54,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  stepLabelCompact: {
    fontSize: 9,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 13,
    marginHorizontal: -6,
    borderRadius: 1,
  },
  canceledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
  },
  canceledText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OrderTimelineStepper;
