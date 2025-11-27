import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import axios from 'axios';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
} from '../../theme/theme';
import { API_BASE_URL, API_FALLBACK_URLS } from '../../config/api';

// const API_BASE_URL = 'https://mkqfdpqq-3000.inc1.devtunnels.ms'; // Now using centralized config

interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string | null;
}

const EditProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    setLoading(true);

    const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
    let lastError: any = null;

    for (const baseUrl of candidates) {
      try {
        const response = await axios.get(`${baseUrl}/products`, {
          timeout: 5000,
        });
        if (response && response.data) {
          setProducts(response.data.data);
          setFilteredProducts(response.data.data);
          lastError = null;
          break;
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Failed to fetch from ${baseUrl}:`, error?.message);
      }
    }

    if (lastError) {
      Alert.alert('Error', 'Failed to fetch products from all endpoints');
      console.error(lastError);
    }

    setLoading(false);
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toString().includes(searchQuery),
    );
    setFilteredProducts(filtered);
  };

  const handleEditPress = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Product name cannot be empty');
      return;
    }

    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
    let lastError: any = null;
    let success = false;

    for (const baseUrl of candidates) {
      try {
        const response = await axios.put(
          `${baseUrl}/products/${editingProduct?.id}`,
          {
            name: editName.trim(),
            price,
          },
          { timeout: 5000 },
        );

        if (response && response.data) {
          // Update local state
          const updatedProducts = products.map(p =>
            p.id === editingProduct?.id ? response.data.data : p,
          );
          setProducts(updatedProducts);

          Alert.alert('Success', 'Product updated successfully');
          setModalVisible(false);
          setEditingProduct(null);
          success = true;
          break;
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Failed to update on ${baseUrl}:`, error?.message);
      }
    }

    if (!success && lastError) {
      Alert.alert('Error', 'Failed to update product');
      console.error(lastError);
    }
  };

  const handleDeletePress = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(product.id),
        },
      ],
    );
  };

  const handleDelete = async (productId: number) => {
    const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
    let lastError: any = null;
    let success = false;

    for (const baseUrl of candidates) {
      try {
        await axios.delete(`${baseUrl}/products/${productId}`, {
          timeout: 5000,
        });
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        Alert.alert('Success', 'Product deleted successfully');
        success = true;
        break;
      } catch (error: any) {
        lastError = error;
        console.warn(`Failed to delete on ${baseUrl}:`, error?.message);
      }
    }

    if (!success && lastError) {
      Alert.alert('Error', 'Failed to delete product');
      console.error(lastError);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productId}>ID: {item.id}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPress(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePress(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Products</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1e3a5f" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchProducts();
            setRefreshing(false);
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter product name"
            />

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="Enter price"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingProduct(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  listContainer: {
    padding: spacing.base,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  productId: {
    fontSize: typography.fontSize.xs,
    color: colors.textDisabled,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  editButton: {
    backgroundColor: colors.accent,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textDisabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    elevation: shadows.elevation.lg,
    ...shadows.ios.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    marginBottom: spacing.base,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default EditProductPage;
