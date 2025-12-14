import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_FALLBACK_URLS, fetchWithFallback } from '../../../../../config/api';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface Product {
  id: string;
  name: string;
  price: string;
  quantity: string;
  discount: string;
  discountType: '%' | '₹';
  total: number;
}

interface ApiProduct {
  id: number;
  name: string;
  price: number;
}

interface ProductSectionProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onLineItemsChange?: (data: { lineItems: any[]; totalAmt: number }) => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  setProducts,
  onLineItemsChange,
}) => {
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single Input Form State
  const initialProductState: Product = {
    id: '',
    name: '',
    price: '',
    quantity: '',
    discount: '',
    discountType: '%',
    total: 0,
  };
  const [currentProduct, setCurrentProduct] = useState<Product>(initialProductState);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Effect to call onLineItemsChange when products array changes
  useEffect(() => {
    if (onLineItemsChange) {
      const lineItems = products.map(prod => ({
        productId: Number(prod.id) || null, // Assuming prod.id is the backend product ID
        productPrice: Number(prod.price || 0), // Pass the custom price
        productQuantity: Number(prod.quantity || 0),
        productAmountDiscount:
          prod.discountType === '₹' ? Number(prod.discount || 0) : 0,
        productPercentDiscount:
          prod.discountType === '%' ? Number(prod.discount || 0) : 0,
      }));
      const totalAmt = products.reduce((sum, p) => sum + (p.total || 0), 0);
      onLineItemsChange({ lineItems, totalAmt });
    }
  }, [products, onLineItemsChange]);

  // Fetch products on mount (or when needed)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchWithFallback('/products', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (res.status === 200 && json?.data) {
        const sorted = json.data.sort((a: ApiProduct, b: ApiProduct) =>
          a.name.localeCompare(b.name),
        );
        setAllProducts(sorted);
      } else {
        setAllProducts([]);
      }
    } catch (err: any) {
      console.warn('Failed to fetch products:', err?.message);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter(p => p.name.toLowerCase().includes(query));
  };

  // Update local form state
  const updateCurrentProduct = <K extends keyof Product>(field: K, value: Product[K]) => {
    const updated = { ...currentProduct, [field]: value };
    
    // Recalculate total
    if (field === 'price' || field === 'quantity' || field === 'discount' || field === 'discountType') {
      let price = Number(updated.price || 0);
      let qty = Number(updated.quantity || 0);
      let total = price * qty;
      
      if (updated.discount) {
        if (updated.discountType === '%') {
          total -= (total * Number(updated.discount)) / 100;
        } else {
          total -= Number(updated.discount);
        }
      }
      updated.total = Math.max(0, total);
    }
    
    setCurrentProduct(updated);
  };

  const handleSelectProduct = (item: ApiProduct) => {
    const price = String(item.price);
    const quantity = currentProduct.quantity || '1';
    const total = Number(price) * Number(quantity);
    
    setCurrentProduct({
      ...currentProduct,
      name: item.name,
      price: price,
      // We don't overwrite ID here with backend ID immediately if we want to track it as a line item ID,
      // but usually we want to store the product ID. 
      // However, for the invoice line item, we need a unique ID for the list key.
      // We'll keep the existing ID if editing, or generate/use backend ID.
      // Let's store backend ID in a separate field if needed, but for now we use it as is.
      // Wait, if we use backend ID as key, we can't add same product twice?
      // Usually we can. So we should generate a unique ID for the line item.
      // But the previous code used `id: String(item.id)`.
      // Let's stick to unique line item ID.
      // We'll store the backend product ID in `id`? No, that causes duplicate keys.
      // Let's use a unique ID for the row, and maybe store productId separately?
      // The `Product` interface has `id`.
      // In `InvoiceForm`, it maps `p.id` to `productId`.
      // So `id` MUST be the backend product ID for the backend to recognize it.
      // This implies we CANNOT add the same product twice?
      // If so, we should check if it exists.
      id: String(item.id), 
      quantity: quantity,
      total: total,
    });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleAddOrUpdate = () => {
    if (!currentProduct.name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }
    if (!currentProduct.quantity.trim() || Number(currentProduct.quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }

    if (editingId) {
      // Update existing
      const updatedList = products.map(p => 
        p.id === editingId ? { ...currentProduct, id: editingId } : p
      );
      setProducts(updatedList);
      setEditingId(null);
    } else {
      // Add new
      // If we don't have an ID (manual entry), generate one.
      // If we selected from dropdown, we have an ID.
      // Check for duplicates if ID exists?
      // For now, allow duplicates or generate unique ID if manual.
      const newProduct = { 
        ...currentProduct, 
        id: currentProduct.id || `PRD-${Date.now()}` 
      };
      setProducts([...products, newProduct]);
    }

    // Reset form
    setCurrentProduct(initialProductState);
  };

  const handleEditItem = (item: Product) => {
    setCurrentProduct(item);
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    setCurrentProduct(initialProductState);
    setEditingId(null);
  };

  const handleRemoveItem = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const grandTotal = products.reduce((sum, p) => sum + (p.total || 0), 0);

  const renderInputForm = () => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{editingId ? 'Edit Product' : 'Add Product'}</Text>
          {editingId && (
            <TouchableOpacity onPress={handleCancelEdit} style={styles.removeBtn}>
              <Text style={styles.removeText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', marginVertical: 10 }} />

        {/* Product Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={[
              styles.input,
              currentProduct.name && allProducts.some(p => p.name === currentProduct.name) && styles.disabledInput
            ]}
            placeholder="Select or enter product name"
            placeholderTextColor="#94a3b8"
            value={currentProduct.name}
            editable={!allProducts.some(p => p.name === currentProduct.name)}
            onFocus={() => {
              if (!allProducts.some(p => p.name === currentProduct.name)) {
                fetchProducts();
                setShowDropdown(true);
              }
            }}
            onChangeText={t => updateCurrentProduct('name', t)}
          />
          
          {/* Clear Button for selected product */}
          {currentProduct.name && allProducts.some(p => p.name === currentProduct.name) && (
             <TouchableOpacity
               style={{ position: 'absolute', right: scale(10), top: scale(32) }}
               onPress={() => {
                 setCurrentProduct({
                   ...currentProduct,
                   name: '',
                   price: '',
                   id: '',
                 });
               }}
             >
               <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
             </TouchableOpacity>
          )}

          {showDropdown && (
            <View style={styles.dropdown}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.loadingText}>Loading products...</Text>
                </View>
              ) : allProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.noData}>No products found</Text>
                  <TouchableOpacity
                    style={styles.closeOnlyBtn}
                    onPress={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.closeOnlyBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search products..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  <FlatList
                    data={filterProducts()}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item: p }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleSelectProduct(p)}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownText}>{p.name}</Text>
                          <Text style={styles.dropdownSub}>₹{p.price}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    nestedScrollEnabled
                    scrollEnabled
                    showsVerticalScrollIndicator={true}
                    style={{ maxHeight: scale(200) }}
                  />
                  <TouchableOpacity
                    style={styles.closeDropdownBtnBottom}
                    onPress={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.closeDropdownTextBottom}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={currentProduct.price}
            onChangeText={t => updateCurrentProduct('price', t)}
          />
        </View>

        {/* Quantity */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={currentProduct.quantity}
            onChangeText={t => updateCurrentProduct('quantity', t)}
          />
        </View>

        {/* Discount */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Discount</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={currentProduct.discount}
            onChangeText={t => updateCurrentProduct('discount', t)}
          />
          <View style={styles.discountRow}>
            <TouchableOpacity
              onPress={() => updateCurrentProduct('discountType', '%')}
              style={[styles.discountBtn, currentProduct.discountType === '%' && styles.discountSelected]}
            >
              <Text style={currentProduct.discountType === '%' ? styles.selectedText : styles.unselectedText}>%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateCurrentProduct('discountType', '₹')}
              style={[styles.discountBtn, currentProduct.discountType === '₹' && styles.discountSelected]}
            >
              <Text style={currentProduct.discountType === '₹' ? styles.selectedText : styles.unselectedText}>₹</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total */}
        <Text style={styles.totalText}>Total: ₹{currentProduct.total.toFixed(2)}</Text>
        
        {/* Add/Update Button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddOrUpdate}>
          <Text style={styles.addText}>{editingId ? 'Update Product' : 'Add Product'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTableRow = ({ item, index }: { item: Product; index: number }) => (
    <TouchableOpacity onPress={() => handleEditItem(item)} style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellIndex]}>{index + 1}</Text>
      <Text style={[styles.tableCell, styles.tableCellName]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.tableCell, styles.tableCellPrice]}>₹{item.price || '0'}</Text>
      <Text style={[styles.tableCell, styles.tableCellQty]}>{item.quantity || '0'}</Text>
      <Text style={[styles.tableCell, styles.tableCellDiscount]}>
        {item.discount ? `${item.discount}${item.discountType}` : '-'}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellTotal]}>₹{item.total.toFixed(2)}</Text>
      <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={[styles.tableCellAction, { padding: 5 }]}>
        <Text style={{ color: '#ef4444', fontSize: 12 }}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Product Details</Text>
      
      {/* Products Table */}
      {products.length > 0 && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Added Products ({products.length})</Text>
          <Text style={{ fontSize: 12, color: '#64748b', paddingHorizontal: 12, paddingBottom: 8 }}>
            Tap a row to edit
          </Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellName]}>Name</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellDiscount]}>Disc.</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellTotal]}>Total</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAction]}></Text>
          </View>
          
          <ScrollView style={styles.tableBody} nestedScrollEnabled>
            <FlatList
              data={products}
              renderItem={renderTableRow}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </ScrollView>
          
          <View style={styles.tableFooter}>
            <Text style={styles.tableFooterLabel}>Subtotal:</Text>
            <Text style={styles.tableFooterValue}>
              ₹{products.reduce((sum, p) => sum + (p.total || 0), 0).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
      
      {/* Single Input Form */}
      {renderInputForm()}

      <View style={styles.grandBox}>
        <Text style={styles.grandLabel}>Total:</Text>
        <Text style={styles.grandValue}>₹{grandTotal.toFixed(2)}</Text>
      </View>
    </View>
  );
};

//
// ✅ STYLES
//
const styles = StyleSheet.create({
  header: {
    fontSize: scale(18),
    fontWeight: '700',
    marginLeft: scale(12),
    marginBottom: scale(8),
    color: '#1e293b',
  },
  productsContainer: { flex: 1, marginBottom: scale(6) },
  cardContainer: { paddingHorizontal: scale(8), marginBottom: scale(8) },
  card: {
    backgroundColor: '#ffffff',
    padding: scale(12),
    borderRadius: scale(10),
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  title: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(8),
    color: '#1e293b',
  },
  inputBox: { marginBottom: scale(8), position: 'relative' },
  label: {
    fontSize: scale(13),
    fontWeight: '500',
    color: '#334155',
    marginBottom: scale(4),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    fontSize: scale(14),
    color: '#000',
    width: '100%',
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(12),
  },
  half: { width: '47%' },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scale(8),
    marginTop: scale(8),
  },
  discountBtn: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: 'transparent',
  },
  discountSelected: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectedText: { color: '#000', fontWeight: '600', fontSize: scale(13) },
  unselectedText: { color: '#000', fontWeight: '500', fontSize: scale(13) },
  totalText: {
    textAlign: 'right',
    marginTop: scale(8),
    fontWeight: '700',
    fontSize: scale(15),
    color: '#000',
    marginRight: scale(10),
  },
  addBtn: {
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    marginTop: scale(12),
    marginBottom: scale(8),
    borderWidth: 0,
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: scale(14),
  },
  grandBox: {
    backgroundColor: '#1e293b',
    padding: scale(12),
    borderRadius: scale(10),
    marginHorizontal: scale(12),
    marginBottom: scale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  grandLabel: { 
    fontSize: scale(16), 
    fontWeight: '700', 
    color: '#fff',
  },
  grandValue: { 
    fontSize: scale(18), 
    fontWeight: '800', 
    color: '#3b82f6',
  },
  dropdown: {
    position: 'absolute',
    top: scale(60),
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: scale(6),
    zIndex: 10,
    elevation: 5,
    maxHeight: scale(250),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  loadingContainer: {
    padding: scale(16),
    alignItems: 'center',
    gap: scale(6),
  },
  loadingText: {
    fontSize: scale(12),
    color: '#64748b',
    marginTop: scale(4),
  },
  emptyContainer: {
    padding: scale(16),
    alignItems: 'center',
  },
  closeOnlyBtn: {
    marginTop: scale(8),
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    backgroundColor: '#f1f5f9',
    borderRadius: scale(6),
  },
  closeOnlyBtnText: {
    fontSize: scale(12),
    color: '#64748b',
    fontWeight: '600',
  },
  searchInput: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(10),
    fontSize: scale(13),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    color: '#1e293b',
  },
  dropdownItem: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { 
    fontSize: scale(14), 
    fontWeight: '600', 
    color: '#1e293b',
    flex: 1,
  },
  dropdownSub: { 
    fontSize: scale(13), 
    color: '#3b82f6',
    fontWeight: '700',
  },
  closeDropdownBtnBottom: {
    paddingVertical: scale(10),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  closeDropdownTextBottom: {
    fontSize: scale(13),
    color: '#64748b',
    fontWeight: '600',
  },
  noData: { 
    textAlign: 'center', 
    padding: scale(12), 
    color: '#94a3b8',
    fontSize: scale(12),
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)', // transparent red
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginRight: scale(10),
  },
  removeText: {
    color: '#dc2626',
    fontSize: scale(12),
    fontWeight: '600',
  },
  // Table Styles
  tableContainer: {
    backgroundColor: '#fff',
    marginHorizontal: scale(8),
    marginBottom: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    elevation: 2,
  },
  tableTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#1e293b',
    padding: scale(10),
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: scale(8),
    paddingHorizontal: scale(6),
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  tableHeaderCell: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: scale(180),
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: scale(8),
    paddingHorizontal: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: scale(11),
    color: '#1e293b',
    textAlign: 'center',
  },
  tableCellIndex: {
    width: '7%',
  },
  tableCellName: {
    width: '25%',
    textAlign: 'left',
  },
  tableCellPrice: {
    width: '15%',
  },
  tableCellQty: {
    width: '10%',
  },
  tableCellDiscount: {
    width: '13%',
  },
  tableCellTotal: {
    width: '20%',
    fontWeight: '600',
  },
  tableCellAction: {
    width: '10%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
    backgroundColor: '#f8fafc',
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
  },
  tableFooterLabel: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#334155',
  },
  tableFooterValue: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#1e293b',
  },
});

export default ProductSection;
