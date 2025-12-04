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
  ScrollView,
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

interface CustomerData {
  name: string;
  phone: string;
  firm: string;
  balance: string;
  address: string;
}

interface AddCustomerPageProps {
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
}

const AddCustomerPage: React.FC<AddCustomerPageProps> = ({
  customerData,
  setCustomerData,
}) => {
  const navigation = useNavigation();

  const validateFields = () => {
    const { name, phone, firm, address } = customerData;

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name.');
      return false;
    }
    if (name.trim().length > 50) {
      Alert.alert('Validation Error', 'Customer name cannot exceed 50 characters.');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number.');
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 10-digit phone number.',
      );
      return false;
    }

    // Firm is optional, but if provided, must be <= 50 chars
    if (firm.trim().length > 50) {
      Alert.alert('Validation Error', 'Firm name cannot exceed 50 characters.');
      return false;
    }

    if (address.trim().length > 50) {
      Alert.alert('Validation Error', 'Address cannot exceed 50 characters.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    try {
      const payload = {
        name: customerData.name.trim(),
        phone: customerData.phone.trim(),
        firm: customerData.firm.trim(),
        balance: Number(customerData.balance) || 0,
        address: customerData.address.trim(),
      };

      console.log('[AddCustomer] Sending data:', payload);

      const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
      console.log('[AddCustomer] Will try URLs:', candidates);
      let lastError: any = null;
      let success = false;

      for (const baseUrl of candidates) {
        try {
          console.log(`[AddCustomer] Trying ${baseUrl}/customers`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(`${baseUrl}/customers`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const text = await response.text();
          console.log(`[AddCustomer] Response from ${baseUrl} - Status:`, response.status);
          console.log('[AddCustomer] Response body:', text.substring(0, 200));

          if (response.status === 201) {
            Alert.alert('Success', 'Customer saved successfully!');
            setCustomerData({
              name: '',
              phone: '',
              firm: '',
              balance: '',
              address: '',
            });
            navigation.goBack();
            success = true;
            break;
          } else {
            const errorData = text ? JSON.parse(text) : { message: 'Unknown error' };
            Alert.alert(
              'Error',
              errorData.message || 'Failed to save customer',
            );
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[AddCustomer] Failed on ${baseUrl}:`, err?.message || err);
          continue;
        }
      }

      if (!success && lastError) {
        console.error('[AddCustomer] All endpoints failed. Last error:', lastError);
        Alert.alert(
          'Connection Error', 
          'Cannot connect to server. Please check:\n\n' +
          '• Backend is running (npm run dev)\n' +
          '• Android Emulator: Use 10.0.2.2:3000\n' +
          '• iOS Simulator: Use localhost:3000\n' +
          '• Physical device: Use computer IP\n\n' +
          `Details: ${lastError.message}`
        );
      }
    } catch (error: any) {
      console.error('Save error:', error.message);
      Alert.alert('Error', error.message || 'Failed to save customer');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Add Customer</Text>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Name *</Text>
          <Text style={styles.charCount}>
            {50 - (customerData.name?.length || 0)} chars left
          </Text>
        </View>
        <TextInput
          style={styles.input}
          value={customerData?.name || ''}
          onChangeText={text =>
            setCustomerData(prev => ({ ...prev, name: text }))
          }
          placeholder="John Doe"
          maxLength={50}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Phone *</Text>
          <Text style={styles.charCount}>
            {10 - (customerData.phone?.length || 0)} digits left
          </Text>
        </View>
        <TextInput
          style={styles.input}
          value={customerData?.phone || ''}
          onChangeText={text =>
            setCustomerData(prev => ({ ...prev, phone: text }))
          }
          placeholder="9876543210"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Firm (optional)</Text>
          <Text style={styles.charCount}>
            {50 - (customerData.firm?.length || 0)} chars left
          </Text>
        </View>
        <TextInput
          style={styles.input}
          value={customerData?.firm || ''}
          onChangeText={text =>
            setCustomerData(prev => ({ ...prev, firm: text }))
          }
          placeholder="Acme Corp"
          maxLength={50}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.charCount}>
            {50 - (customerData.address?.length || 0)} chars left
          </Text>
        </View>
        <TextInput
          style={styles.input}
          value={customerData?.address || ''}
          onChangeText={text =>
            setCustomerData(prev => ({ ...prev, address: text }))
          }
          placeholder="123 Main Street, City"
          maxLength={50}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Balance (optional)</Text>
        <TextInput
          style={styles.input}
          value={customerData?.balance || ''}
          onChangeText={text =>
            setCustomerData(prev => ({ ...prev, balance: text }))
          }
          placeholder="0"
          keyboardType="numeric"
        />
      </View>

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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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

export default AddCustomerPage;
