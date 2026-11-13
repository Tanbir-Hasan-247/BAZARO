import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAppTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

const CategoryProductsScreen = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useAppTheme();

  const fetchCategoryProducts = useCallback(async () => {
    try {
      const res = await apiClient.get('/products/', {
        params: { category_id: categoryId, page_size: 50 },
      });
      const data = res.data?.results || res.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch category products:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    navigation.setOptions({ title: categoryName || 'Department' });
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchCategoryProducts();
    });
    return () => {
      active = false;
    };
  }, [categoryId, categoryName, navigation, fetchCategoryProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoryProducts();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message={`Opening ${categoryName || 'Chamber'}...`} />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <FlatList
        data={products}
        numColumns={2}
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
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onRequireAuth={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="diamond-outline" size={50} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Chamber Empty
            </Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No editions are currently assigned to this department.
            </Text>
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
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default CategoryProductsScreen;
