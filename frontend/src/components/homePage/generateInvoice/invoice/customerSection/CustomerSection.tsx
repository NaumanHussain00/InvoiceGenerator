import React, { useState, useEffect } from 'react';
import customerService from '../../../../../services/customer.service';
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
  const [searchQuery, setSearchQuery] = useState('');
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

    try {
      const customersData = await customerService.getAllCustomers();
      const sorted = customersData.sort((a: any, b: any) =>
        a.name.localeCompare(b.name),
      );
      setCustomers(sorted);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err?.message);
      setCustomers([]);
    }

    setLoading(false);
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      return customers;
    }
    const query = searchQuery.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.firm.toLowerCase().includes(query),
    );
  };

  const handleSelectCustomer = (item: any) => {
    setCustomerData({
      name: item.name,
      phone: item.phone,
      firm: item.firm,
      balance: String(item.balance ?? ''),
    });
    setShowDropdown(false);
    setSearchQuery('');
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
          placeholderTextColor="#94a3b8"
        />

        {showDropdown && (
          <View style={styles.dropdown}>
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : customers.length === 0 ? (
              <Text style={styles.noData}>No customers found</Text>
            ) : (
              <>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search customers..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <FlatList
                  data={filterCustomers()}
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
                  style={{ maxHeight: scale(250) }}
                  ListEmptyComponent={
                    <Text style={styles.noData}>No customers found</Text>
                  }
                />
              </>
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
          placeholderTextColor="#94a3b8"
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
          placeholderTextColor="#94a3b8"
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
          placeholderTextColor="#94a3b8"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: scale(12),
    borderRadius: scale(10),
    marginBottom: scale(8),
    marginHorizontal: scale(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    fontSize: scale(16),
    fontWeight: '700',
    marginBottom: scale(8),
    color: '#1e293b',
  },
  inputContainer: { marginBottom: scale(8), position: 'relative' },
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
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    borderColor: '#e2e8f0',
  },
  dropdown: {
    position: 'absolute',
    top: scale(65),
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: scale(6),
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: scale(10),
    paddingVertical: scale(10),
    fontSize: scale(13),
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  dropdownItem: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownText: { 
    fontSize: scale(14), 
    fontWeight: '600', 
    color: '#1e293b',
    marginBottom: scale(2),
  },
  dropdownSub: { 
    fontSize: scale(12), 
    color: '#64748b' 
  },
  noData: { 
    textAlign: 'center', 
    padding: scale(12), 
    color: '#64748b',
    fontStyle: 'italic',
  },
});

export default CustomerSection;
