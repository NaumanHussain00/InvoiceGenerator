import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_FALLBACK_URLS } from '../../../../../config/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface CustomerData {
  name: string;
  phone: string;
  firm: string;
  balance: string;
}

interface CustomerSectionProps {
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
  resetTrigger?: boolean;
  onSelectCustomerId?: (id: number | string) => void; // 👈 new prop
}

const STORAGE_KEY = 'customer_form_data';

const CustomerSection: React.FC<CustomerSectionProps> = ({
  customerData,
  setCustomerData,
  resetTrigger,
  onSelectCustomerId,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(true); // 👈 controls edit
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    firm: '',
  });

  // Load saved data
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setCustomerData(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load saved customer data', err);
      }
    };
    loadSavedData();
  }, []);

  // Save to storage
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customerData)).catch(
      console.error,
    );
  }, [customerData]);

  // Reset logic
  useEffect(() => {
    if (resetTrigger) {
      setCustomerData({ name: '', phone: '', firm: '', balance: '' });
      setErrors({ name: '', phone: '', firm: '' });
      setIsEditable(true);
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, [resetTrigger]);

  const fetchCustomers = async () => {
    setLoading(true);

    const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
    let lastError: any = null;
    let success = false;

    for (const baseUrl of candidates) {
      try {
        const res = await fetch(`${baseUrl}/customers`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const json = await res.json();
        if (res.status === 200 && json?.data) {
          const sorted = json.data.sort((a: CustomerData, b: CustomerData) =>
            a.name.localeCompare(b.name),
          );
          setCustomers(sorted);
          success = true;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(
          `Failed to fetch customers from ${baseUrl}:`,
          err?.message,
        );
      }
    }

    if (!success) {
      console.error('Failed to fetch customers from all endpoints', lastError);
      setCustomers([]);
    }

    setLoading(false);
  };

  const handleSelectCustomer = (item: any) => {
    setCustomerData({
      name: item.name,
      phone: item.phone,
      firm: item.firm,
      balance: String(item.balance ?? ''),
    });
    setShowDropdown(false);
    setIsEditable(false); // 👈 lock fields
    onSelectCustomerId?.(item.id); // 👈 send id to parent
  };

  const handleNameFocus = () => {
    if (isEditable) {
      setShowDropdown(true);
      fetchCustomers();
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Customer Information</Text>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#cbd5e1',
          marginVertical: 10,
        }}
      />

      {/* Name + Dropdown */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          editable={isEditable}
          style={[styles.input, !isEditable && styles.disabledInput]}
          value={customerData.name}
          onFocus={handleNameFocus}
          onChangeText={text => setCustomerData(p => ({ ...p, name: text }))}
          placeholder="John Doe"
        />

        {showDropdown && (
          <View style={styles.dropdown}>
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : customers.length === 0 ? (
              <Text style={styles.noData}>No customers found</Text>
            ) : (
              <FlatList
                data={customers}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <Text style={styles.dropdownText}>{item.name}</Text>
                    <Text style={styles.dropdownSub}>
                      {item.phone} • {item.firm}
                    </Text>
                  </TouchableOpacity>
                )}
                nestedScrollEnabled
                scrollEnabled
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: scale(300) }} // 👈 increased height
              />
            )}
          </View>
        )}
      </View>

      {/* Phone */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone *</Text>
        <TextInput
          editable={false}
          style={[styles.input, styles.disabledInput]}
          value={customerData.phone}
          placeholder="1234567890"
        />
      </View>

      {/* Firm */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Firm *</Text>
        <TextInput
          editable={false}
          style={[styles.input, styles.disabledInput]}
          value={customerData.firm}
          placeholder="Acme Corp"
        />
      </View>

      {/* Balance */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Balance (optional)</Text>
        <TextInput
          editable={false}
          style={[styles.input, styles.disabledInput]}
          value={customerData.balance}
          placeholder="0"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: scale(16) },
  header: {
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: scale(16),
    color: '#2C3E50',
  },
  inputContainer: { marginBottom: scale(12), position: 'relative' },
  label: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#555',
    marginBottom: scale(4),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    backgroundColor: '#F9FBFC',
    fontSize: scale(15),
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  dropdown: {
    position: 'absolute',
    top: scale(68),
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: scale(8),
    zIndex: 10,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: { fontSize: scale(15), fontWeight: '600', color: '#000' },
  dropdownSub: { fontSize: scale(13), color: '#666' },
  noData: { textAlign: 'center', padding: 10, color: '#777' },
});

export default CustomerSection;
