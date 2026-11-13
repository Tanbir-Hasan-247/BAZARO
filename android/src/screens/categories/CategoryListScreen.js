import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { getCategoryIconName } from '../../constants/categoryIcons';
import { useAppTheme } from '../../context/ThemeContext';

const CategoryListScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useAppTheme();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/categories/');
      const data = res.data?.results || res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchCategories();
    });
    return () => {
      active = false;
    };
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Opening Royal Chambers..." />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <FlatList
        data={categories}
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
          <View style={styles.headerBanner}>
            <Text style={styles.headerEyebrow}>CURATED DEPARTMENTS</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Atelier Chambers
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.86}
            style={[
              styles.categoryCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
              theme.mode === 'light' && SHADOWS.light,
            ]}
            onPress={() =>
              navigation.navigate('CategoryProducts', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name={getCategoryIconName(item.name)}
                size={21}
                color="#E5C77A"
              />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: theme.text }]}>
                {item.name}
              </Text>
              {item.description ? (
                <Text
                  style={[styles.categoryDesc, { color: theme.textMuted }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.productCount, { color: theme.primary }]}>
                {item.product_count || 0} Curated Pieces
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  headerBanner: {
    marginBottom: 4,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: '#8E6A28',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    fontWeight: '700',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#0D0A08',
    borderWidth: 1,
    borderColor: 'rgba(197, 155, 75, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: FONTS.serif,
    fontSize: 17,
    fontWeight: '700',
  },
  categoryDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  productCount: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});

export default CategoryListScreen;
