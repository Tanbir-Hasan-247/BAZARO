import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { getCategoryIconName } from '../../constants/categoryIcons';
import { useCart } from '../../context/CartContext';
import { useAppTheme } from '../../context/ThemeContext';

function computeRemainingTime(targetIso) {
  const targetMs = targetIso ? new Date(targetIso).getTime() : NaN;
  const fallbackMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const diff = Math.max(0, (Number.isFinite(targetMs) ? targetMs : fallbackMs) - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return { days: pad(days), hours: pad(hours), mins: pad(mins), secs: pad(secs), expired: diff <= 0 };
}

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [countdown, setCountdown] = useState(() => computeRemainingTime(null));
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { cartItemCount } = useCart();
  const { theme, isDarkMode, toggleTheme } = useAppTheme();

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await apiClient.get('/campaign-settings/');
      if (res.data) {
        setCampaign(res.data);
        setCountdown(computeRemainingTime(res.data.flash_ends_at));
      }
    } catch {
      // Optional endpoint; storefront renders cleanly if offline/older server
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/categories/');
      const data = res.data?.results || res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }, []);

  const fetchProducts = useCallback(async (catId = selectedCategory, search = searchQuery) => {
    try {
      const params = {};
      if (catId) params.category_id = catId;
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get('/products/', { params });
      const data = res.data?.results || res.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  }, [selectedCategory, searchQuery]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCampaign(), fetchCategories(), fetchProducts(null, '')]);
    setLoading(false);
  }, [fetchCampaign, fetchCategories, fetchProducts]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchInitialData();
    });
    return () => {
      active = false;
    };
    // Initial boot load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!campaign?.flash_enabled) return undefined;
    const id = setInterval(() => {
      setCountdown(computeRemainingTime(campaign.flash_ends_at));
    }, 1000);
    return () => clearInterval(id);
  }, [campaign?.flash_enabled, campaign?.flash_ends_at]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCampaign(), fetchCategories(), fetchProducts(selectedCategory, searchQuery)]);
    setRefreshing(false);
  };

  const handleCategorySelect = (id) => {
    const newSelected = selectedCategory === id ? null : id;
    setSelectedCategory(newSelected);
    fetchProducts(newSelected, searchQuery);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    fetchProducts(selectedCategory, text);
  };

  const navigateAuth = () => navigation.navigate('ProfileTab');

  const showTopAnnouncement = campaign ? campaign.top_bar_enabled !== false : false;
  const showFlashBanner = campaign ? campaign.flash_enabled !== false : false;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Dynamic Royal Announcement Ribbon */}
      {showTopAnnouncement && campaign?.top_bar_message ? (
        <View style={styles.announcementRibbon}>
          <View style={styles.announcementLeft}>
            <Text style={styles.announcementBadge} numberOfLines={1}>
              {campaign.top_bar_badge || 'ROYAL ATELIER'}
            </Text>
            <Text style={styles.announcementText} numberOfLines={1}>
              {campaign.top_bar_message}
            </Text>
          </View>
          {campaign.top_bar_code ? (
            <View style={styles.announcementCodePill}>
              <Text style={styles.announcementCode}>{campaign.top_bar_code}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Top Brand Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.crestImage}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              BAZARO
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.primary }]}>
              APNAR DESHER BAZAAR
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          {/* Live Order Tracking Quick Access */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => navigation.navigate('TrackOrder')}
            accessibilityLabel="Track an order"
          >
            <Ionicons name="locate-outline" size={19} color={theme.primary} />
          </TouchableOpacity>

          {/* Theme Switch */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle dark or light theme"
          >
            <Ionicons
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={19}
              color={isDarkMode ? theme.champagne : theme.text}
            />
          </TouchableOpacity>

          {/* Bag Button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => navigation.navigate('CartTab')}
            accessibilityLabel="Open shopping bag"
          >
            <Ionicons name="bag-outline" size={19} color={theme.text} />
            {cartItemCount > 0 ? (
              <View style={[styles.cartBadge, { backgroundColor: theme.gold }]}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
          theme.mode === 'light' && SHADOWS.light,
        ]}
      >
        <Ionicons name="search-outline" size={19} color={theme.primary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search timepieces, oud, artisan goods..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Atelier Flash Vault Card (when enabled and unfiltered) */}
      {showFlashBanner && !selectedCategory && !searchQuery.trim() ? (
        <View style={styles.flashVaultCard}>
          <View style={styles.flashTopRow}>
            <Text style={styles.flashBadge}>
              {campaign.flash_badge || 'PRIVATE VAULT OFFER'}
            </Text>
            {campaign.flash_coupon_code ? (
              <View style={styles.flashCodeChip}>
                <Ionicons name="pricetag-outline" size={11} color="#0D0A08" />
                <Text style={styles.flashCodeText}>{campaign.flash_coupon_code}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.flashTitle}>
            {campaign.flash_title || 'Atelier Flash Sale —'}{' '}
            <Text style={styles.flashHighlight}>
              {campaign.flash_highlight || 'Save 20%'}
            </Text>
          </Text>

          {campaign.flash_description ? (
            <Text style={styles.flashDesc} numberOfLines={2}>
              {campaign.flash_description}
            </Text>
          ) : null}

          <View style={styles.countdownRow}>
            {[
              { label: 'Days', val: countdown.days },
              { label: 'Hrs', val: countdown.hours },
              { label: 'Min', val: countdown.mins },
              { label: 'Sec', val: countdown.secs },
            ].map((slot) => (
              <View key={slot.label} style={styles.timerBox}>
                <Text style={styles.timerNum}>{slot.val}</Text>
                <Text style={styles.timerLabel}>{slot.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Single-Row Horizontal Curated Chambers Slider */}
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: theme.primary }]}>
              ROYAL CHAMBERS
            </Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Explore Departments
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CategoriesTab')}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All Editions' }, ...categories]}
          keyExtractor={(item) => (item.id !== null ? item.id.toString() : 'all')}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            const iconName =
              item.id === null ? 'sparkles-outline' : getCategoryIconName(item.name);
            return (
              <TouchableOpacity
                onPress={() => handleCategorySelect(item.id)}
                activeOpacity={0.85}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? '#0D0A08' : theme.card,
                    borderColor: isSelected ? theme.gold : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={14}
                  color={isSelected ? '#E5C77A' : theme.primary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#FAF5EB' : theme.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {item.name}
                  {item.product_count !== undefined && !isSelected
                    ? ` · ${item.product_count}`
                    : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.catalogHeadingRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {selectedCategory ? 'Filtered Collection' : 'Curated Masterpieces'}
        </Text>
        <Text style={[styles.countLabel, { color: theme.textMuted }]}>
          {products.length} {products.length === 1 ? 'piece' : 'pieces'}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner message="Preparing BAZARO Atelier..." />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onRequireAuth={navigateAuth}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.gold]}
            tintColor={theme.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="diamond-outline" size={50} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No pieces matched your current selection.
            </Text>
            <TouchableOpacity
              style={[
                styles.resetBtn,
                { backgroundColor: theme.buttonBg, borderColor: theme.gold },
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setSearchQuery('');
                fetchProducts(null, '');
              }}
            >
              <Text style={[styles.resetBtnText, { color: theme.buttonText }]}>
                Show All Pieces
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 10,
    paddingBottom: 28,
  },
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  announcementRibbon: {
    backgroundColor: '#0D0A08',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  announcementLeft: {
    flex: 1,
    gap: 2,
  },
  announcementBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#C59B4B',
    textTransform: 'uppercase',
  },
  announcementText: {
    fontSize: 11,
    color: '#FAF5EB',
    fontWeight: '500',
  },
  announcementCodePill: {
    backgroundColor: '#C59B4B',
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  announcementCode: {
    color: '#0D0A08',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crestImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.5)',
  },
  brandTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#0D0A08',
    fontSize: 10,
    fontWeight: '900',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
  },
  flashVaultCard: {
    backgroundColor: '#0D0A08',
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.42)',
    marginBottom: 16,
  },
  flashTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  flashBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: '#C59B4B',
    textTransform: 'uppercase',
  },
  flashCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5C77A',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  flashCodeText: {
    color: '#0D0A08',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  flashTitle: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    fontWeight: '700',
    color: '#FAF5EB',
  },
  flashHighlight: {
    color: '#E5C77A',
  },
  flashDesc: {
    fontSize: 12,
    color: '#D6C8B0',
    marginTop: 4,
    lineHeight: 17,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timerBox: {
    flex: 1,
    backgroundColor: '#18120E',
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.3)',
    borderRadius: SIZES.radiusSm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  timerNum: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    fontWeight: '800',
    color: '#E5C77A',
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#A89680',
    marginTop: 1,
  },
  categoriesSection: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryList: {
    paddingVertical: 2,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12.5,
  },
  catalogHeadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  resetBtnText: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default HomeScreen;
