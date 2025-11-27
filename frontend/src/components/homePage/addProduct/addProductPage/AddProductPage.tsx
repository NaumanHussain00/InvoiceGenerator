import React from 'react';
import { API_BASE_URL, API_FALLBACK_URLS } from '../../../../config/api';
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

      console.log('Sending data:', payload);

      const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
      let lastError: any = null;
      let success = false;

      for (const baseUrl of candidates) {
        try {
          const response = await fetch(`${baseUrl}/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const text = await response.text();
          console.log('Response status:', response.status);
          console.log('Response body:', text);

          if (response.status === 201) {
            Alert.alert('Success', 'Product saved successfully!');
            setProductData({ name: '', price: '' });
            navigation.goBack();
            success = true;
            break;
          } else {
            const errorData = JSON.parse(text);
            Alert.alert('Error', errorData.message || 'Failed to save product');
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Failed to save product on ${baseUrl}:`, err?.message);
        }
      }

      if (!success && lastError) {
        console.error('Network error:', lastError);
        Alert.alert('Error', 'Failed to connect to server');
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert('Error', 'Failed to connect to the server.');
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
