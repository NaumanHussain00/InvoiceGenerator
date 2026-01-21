import React, { useState, useEffect } from 'react';
import { searchCustomers, getCustomersInfo, addCustomer } from '../../../../../services/OfflineService';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
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
  onSelectCustomerId?: (id: number | string) => void;
  disabled?: boolean;
}

const STORAGE_KEY = 'customer_form_data';

const CustomerSection: React.FC<CustomerSectionProps> = ({
  customerData,
  setCustomerData,
  resetTrigger,
  onSelectCustomerId,
  disabled = false,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
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
      // Offline Search
      // If searchQuery is present, use searchCustomers, else getCustomersInfo
      if (searchQuery.trim().length > 0) {
          const res = await searchCustomers(searchQuery);
          setCustomers(res.data);
      } else {
          const res = await getCustomersInfo();
          setCustomers(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch customers offline:', err);
      // Fallback empty
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
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)) ||
        (c.firm && c.firm.toLowerCase().includes(query)),
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

  // --- Add New Customer Logic ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    firm: '',
    address: '',
    balance: '',
  });

  const handleSaveNewCustomer = async () => {
    const { name, phone, firm, address, balance } = newCustomer;

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name.');
      return;
    }
    if (!phone.trim() || !/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        firm: firm.trim(),
        address: address.trim(),
        balance: Number(balance) || 0,
      };

      const res = await addCustomer(payload);
      if (res.success && res.data) {
        Alert.alert('Success', 'Customer added successfully!');
        // Auto-select
        handleSelectCustomer(res.data);
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', firm: '', address: '', balance: '' });
      } else {
        Alert.alert('Error', res.message || 'Failed to add customer');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.card}>
      <View style={{ marginBottom: scale(8) }}>
        <Text style={styles.header}>Customer Information</Text>
        {!disabled && (
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={[styles.headerAddBtn, { alignSelf: 'flex-start' }]}>
            <Text style={styles.headerAddBtnText}>+ Add New Member</Text>
          </TouchableOpacity>
        )}
      </View>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#cbd5e1',
          marginVertical: 10,
        }}
      />

      {/* Name + Dropdown */}
      <View style={styles.inputContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Name *</Text>
          {!isEditable && !disabled && (
            <TouchableOpacity
              onPress={() => {
                setIsEditable(true);
                setCustomerData({ name: '', phone: '', firm: '', balance: '' });
                onSelectCustomerId?.(''); // Reset ID
              }}
              style={styles.changeBtn}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
        <TextInput
          editable={isEditable && !disabled}
          style={[styles.input, (!isEditable || disabled) && styles.disabledInput]}
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
                    <View style={{ padding: scale(12), alignItems: 'center' }}>
                      <Text style={[styles.noData, { padding: 0, marginBottom: scale(8) }]}>No customers found</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => {
                          setShowDropdown(false);
                          setShowAddModal(true);
                        }}
                      >
                         <Text style={styles.changeBtnText}>+ Add New Customer</Text>
                      </TouchableOpacity>
                    </View>
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

      {/* Add Customer Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeader}>Add New Member</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Text style={{ fontSize: scale(18), color: '#64748b' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(4) }}>
                  <Text style={styles.label}>Name *</Text>
                  <Text style={styles.charCount}>{50 - newCustomer.name.length} chars left</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={newCustomer.name}
                  onChangeText={t => setNewCustomer(prev => ({ ...prev, name: t }))}
                  placeholder="John Doe"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(4) }}>
                  <Text style={styles.label}>Phone *</Text>
                  <Text style={styles.charCount}>{10 - newCustomer.phone.length} digits left</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={newCustomer.phone}
                  onChangeText={t => setNewCustomer(prev => ({ ...prev, phone: t }))}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(4) }}>
                  <Text style={styles.label}>Firm (Optional)</Text>
                  <Text style={styles.charCount}>{50 - newCustomer.firm.length} chars left</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={newCustomer.firm}
                  onChangeText={t => setNewCustomer(prev => ({ ...prev, firm: t }))}
                  placeholder="Acme Corp"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(4) }}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.charCount}>{50 - newCustomer.address.length} chars left</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={newCustomer.address}
                  onChangeText={t => setNewCustomer(prev => ({ ...prev, address: t }))}
                  placeholder="City, State"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Balance</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.balance}
                  onChangeText={t => setNewCustomer(prev => ({ ...prev, balance: t }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNewCustomer}>
                <Text style={styles.saveBtnText}>Save & Select</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  changeBtn: {
    backgroundColor: '#3b82f6', // Blue-500
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  changeBtnText: {
    color: '#fff',
    fontSize: scale(12),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: scale(10),
    padding: scale(16),
    maxHeight: '90%',
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  modalHeader: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#1e293b',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: scale(12),
    borderRadius: scale(8),
    alignItems: 'center',
    marginTop: scale(16),
  },
  saveBtnText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '700',
  },
  headerAddBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(6),
  },
  headerAddBtnText: {
    color: '#fff',
    fontSize: scale(12),
    fontWeight: '600',
  },
  charCount: {
    fontSize: scale(11),
    color: '#64748b',
  },
});

export default CustomerSection;
