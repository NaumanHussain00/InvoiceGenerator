import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
} from '../../../../theme/theme';
import productService from '../../../../services/product.service';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface ProductData {
  name: string;
  price: string;
}

interface AddProductPageProps {
  productData: ProductData;
  setProductData: React.Dispatch<React.SetStateAction<ProductData>>;
}

const AddProductPage: React.FC<AddProductPageProps> = ({
  productData,
  setProductData,
}) => {
  const navigation = useNavigation();

  const validateFields = () => {
    const { name, price } = productData;

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter product name.');
      return false;
    }

    if (!price.trim()) {
      Alert.alert('Validation Error', 'Please enter product price.');
      return false;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    try {
      const payload = {
        name: productData.name.trim(),
        price: Number(productData.price),
      };

      console.log('Creating product:', payload);

      await productService.createProduct(payload);
      
      Alert.alert('Success', 'Product saved successfully!');
      setProductData({ name: '', price: '' });
      navigation.goBack();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save product');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Add Product</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={productData?.name || ''}
          onChangeText={text =>
            setProductData(prev => ({ ...prev, name: text }))
          }
          placeholder="Item A"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Price *</Text>
        <TextInput
          style={styles.input}
          value={productData?.price || ''}
          onChangeText={text =>
            setProductData(prev => ({ ...prev, price: text }))
          }
          placeholder="99.99"
          keyboardType="numeric"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  header: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  inputContainer: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.inputBackground,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.lg,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  saveText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

export default AddProductPage;
