import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient, { getApiBaseUrl, formatApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAppTheme } from '../../context/ThemeContext';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';
import LoginScreen from '../auth/LoginScreen';

const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistedIds } = useWishlist();
  const { theme, isDarkMode, toggleTheme } = useAppTheme();

  const [footerConfig, setFooterConfig] = useState(null);
  const [newsletterEmailInput, setNewsletterEmailInput] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  const newsletterEmail = newsletterEmailInput ?? user?.email ?? '';

  useEffect(() => {
    apiClient
      .get('/footer-settings/')
      .then((res) => {
        if (res.data) setFooterConfig(res.data);
      })
      .catch(() => {
        // Optional endpoint
      });
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen navigation={navigation} />;
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Exit your BAZARO Patron session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSubscribeNewsletter = async () => {
    const clean = newsletterEmail.trim();
    if (!clean) {
      Alert.alert('Email Needed', 'Enter your email address for private dispatches.');
      return;
    }
    setSubscribing(true);
    try {
      await apiClient.post('/newsletter/', { email: clean, source: 'android_app' });
      Alert.alert(
        'Royal Dispatch Subscribed',
        `${clean} is now registered for private releases and vault coupons.`
      );
    } catch (error) {
      Alert.alert('Notice', formatApiError(error, 'Could not subscribe at this moment.'));
    } finally {
      setSubscribing(false);
    }
  };

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user?.first_name
      ? user.first_name[0].toUpperCase()
      : 'P';

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Obsidian Patron Medallion */}
        <View style={styles.patronHeroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.patronBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#E5C77A" />
            <Text style={styles.patronBadgeText}>
              {user?.is_staff ? 'ATELIER ADMINISTRATOR' : 'VERIFIED PATRON'}
            </Text>
          </View>
        </View>

        {/* Preferences: Obsidian Dark / Parchment Light */}
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            theme.mode === 'light' && SHADOWS.light,
          ]}
        >
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={20}
                color={theme.primary}
              />
              <View>
                <Text style={[styles.menuText, { color: theme.text }]}>
                  {isDarkMode ? 'Obsidian Night Theme' : 'Parchment Atelier Theme'}
                </Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>
                  Switch ambient luxury aesthetic
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D8C7AE', true: 'rgba(197, 155, 75, 0.45)' }}
              thumbColor={isDarkMode ? '#E5C77A' : '#0D0A08'}
            />
          </View>
        </View>

        {/* Portal Shortcuts */}
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            theme.mode === 'light' && SHADOWS.light,
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="heart-outline" size={21} color={theme.primary} />
              <Text style={[styles.menuText, { color: theme.text }]}>Saved Vault</Text>
            </View>
            <View style={styles.rightCluster}>
              {wishlistedIds.length > 0 ? (
                <View style={[styles.countPill, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.countPillText, { color: theme.primary }]}>
                    {wishlistedIds.length}
                  </Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="receipt-outline" size={21} color={theme.primary} />
              <Text style={[styles.menuText, { color: theme.text }]}>Acquisition Ledger</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('TrackOrder')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="locate-outline" size={21} color={theme.primary} />
              <Text style={[styles.menuText, { color: theme.text }]}>
                Track Order by Reference
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={21} color={theme.primary} />
              <Text style={[styles.menuText, { color: theme.text }]}>
                Edit Patron Details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Shipping Vault Details */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            theme.mode === 'light' && SHADOWS.light,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Saved Delivery Vault
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={theme.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Contact Phone</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {user?.phone_number || 'Not recorded'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Ionicons name="location-outline" size={18} color={theme.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                Primary Destination
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {user?.address || 'No delivery address saved'}
              </Text>
            </View>
          </View>
        </View>

        {/* Concierge & Royal Dispatch Opt-In */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            theme.mode === 'light' && SHADOWS.light,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            The Royal Dispatch & Concierge
          </Text>
          <Text style={[styles.conciergeLine, { color: theme.textMuted }]}>
            {footerConfig?.address || 'Road 11, Banani Atelier, Dhaka 1213, Bangladesh'}
          </Text>
          <Text style={[styles.conciergeLine, { color: theme.textMuted }]}>
            {footerConfig?.phone || '+880 1800-BAZARO (229276)'} •{' '}
            {footerConfig?.email || 'concierge@bazaro.com.bd'}
          </Text>

          <View style={styles.newsRow}>
            <TextInput
              style={[
                styles.newsInput,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder={footerConfig?.newsletter_placeholder || 'you@example.com'}
              placeholderTextColor={theme.textMuted}
              value={newsletterEmail}
              onChangeText={setNewsletterEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              disabled={subscribing}
              onPress={handleSubscribeNewsletter}
              style={[styles.newsBtn, { backgroundColor: theme.buttonBg }]}
            >
              <Ionicons name="arrow-forward" size={16} color={theme.buttonText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutCard,
            { backgroundColor: theme.card, borderColor: 'rgba(185, 28, 28, 0.3)' },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.apiHint, { color: theme.textMuted }]}>
          Endpoint: {getApiBaseUrl()}
        </Text>
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
    paddingBottom: 28,
  },
  patronHeroCard: {
    backgroundColor: '#0D0A08',
    borderRadius: SIZES.radiusLg,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.45)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C59B4B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FAF5EB',
  },
  avatarText: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    fontWeight: '800',
    color: '#0D0A08',
  },
  userName: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
    color: '#FAF5EB',
  },
  userEmail: {
    fontSize: 13,
    color: '#A89680',
    marginTop: 2,
  },
  patronBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: 'rgba(197, 155, 75, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(229, 199, 122, 0.35)',
  },
  patronBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#E5C77A',
  },
  menuCard: {
    borderRadius: SIZES.radiusLg,
    paddingVertical: 4,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 11,
    marginTop: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  infoCard: {
    borderRadius: SIZES.radiusLg,
    padding: 18,
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 11,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  conciergeLine: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 3,
  },
  newsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  newsInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  newsBtn: {
    width: 42,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  apiHint: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ProfileScreen;
