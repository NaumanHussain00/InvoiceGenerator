import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
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

interface Invoice {
  id: number;
  customer: {
    id: number;
    name: string;
    phone: string;
    firm: string;
  };
  totalAmount: number;
  finalAmount: number;
  paidByCustomer: number;
  remainingBalance: number;
  status: string;
  createdAt: string;
}

const EditInvoicePage: React.FC = () => {
  const [searchType, setSearchType] = useState<
    'id' | 'phone' | 'name' | 'date'
  >('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (searchType !== 'date' && !searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    if (searchType === 'date') {
      if (!dateFrom || !dateTo) {
        Alert.alert('Error', 'Please enter both date from and date to');
        return;
      }

      // Validate date format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(dateFrom) || !datePattern.test(dateTo)) {
        Alert.alert(
          'Error',
          'Please use date format YYYY-MM-DD (e.g., 2025-11-25)',
        );
        return;
      }
    }

    setLoading(true);

    const params: any = {};

    switch (searchType) {
      case 'id':
        params.invoiceId = searchQuery;
        break;
      case 'phone':
        params.phone = searchQuery;
        break;
      case 'name':
        params.customerName = searchQuery;
        break;
      case 'date':
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
        break;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/invoices/search`, {
        params,
        timeout: 5000,
      });

      if (response && response.data) {
        setInvoices(response.data.data);
        if (response.data.data.length === 0) {
          Alert.alert('No Results', 'No invoices found matching your search');
        }
      }
    } catch (error: any) {
      // Try fallback URLs if primary fails
      let lastError = error;
      let success = false;

      for (const baseUrl of API_FALLBACK_URLS) {
        if (baseUrl === API_BASE_URL) continue;

        try {
          const response = await axios.get(`${baseUrl}/invoices/search`, {
            params,
            timeout: 5000,
          });

          if (response && response.data) {
            setInvoices(response.data.data);
            if (response.data.data.length === 0) {
              Alert.alert(
                'No Results',
                'No invoices found matching your search',
              );
            }
            success = true;
            break;
          }
        } catch (fallbackError: any) {
          lastError = fallbackError;
          console.warn(`Failed fallback ${baseUrl}:`, fallbackError?.message);
        }
      }

      if (!success) {
        console.error(
          'Search error:',
          lastError.response?.data || lastError.message,
        );
        Alert.alert(
          'Error',
          lastError.response?.data?.message || 'Failed to search invoices',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (invoiceId: number) => {
    // Navigate to edit form with invoice data
    Alert.alert(
      'Edit Invoice',
      `Editing invoice #${invoiceId}\n\nThis will open the edit form.`,
    );
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => handleEditInvoice(item.id)}
    >
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceId}>Invoice #{item.id}</Text>
        <Text
          style={[
            styles.status,
            item.status === 'ACTIVE' ? styles.active : styles.void,
          ]}
        >
          {item.status}
        </Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerDetails}>{item.customer.firm}</Text>
        <Text style={styles.customerDetails}>{item.customer.phone}</Text>
      </View>
      <View style={styles.amountInfo}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.finalAmount)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Paid:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.paidByCustomer)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Balance:</Text>
          <Text style={[styles.amountValue, styles.balance]}>
            {formatCurrency(item.remainingBalance)}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>Date: {formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search & Edit Invoices</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.label}>Search By:</Text>
        <Picker
          selectedValue={searchType}
          onValueChange={value => {
            setSearchType(value);
            setSearchQuery('');
            setDateFrom('');
            setDateTo('');
          }}
          style={styles.picker}
        >
          <Picker.Item label="Invoice ID" value="id" />
          <Picker.Item label="Phone Number" value="phone" />
          <Picker.Item label="Customer Name" value="name" />
          <Picker.Item label="Date Range" value="date" />
        </Picker>

        {searchType !== 'date' ? (
          <TextInput
            style={styles.input}
            placeholder={`Enter ${
              searchType === 'id'
                ? 'Invoice ID'
                : searchType === 'phone'
                ? 'Phone Number'
                : 'Customer Name'
            }`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType={searchType === 'id' ? 'numeric' : 'default'}
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Date From (YYYY-MM-DD)"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <TextInput
              style={styles.input}
              placeholder="Date To (YYYY-MM-DD)"
              value={dateTo}
              onChangeText={setDateTo}
            />
          </>
        )}

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1e3a5f" style={styles.loader} />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoice}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery || dateFrom
                  ? 'No invoices found'
                  : 'Enter search criteria above'}
              </Text>
            </View>
          }
        />
      )}
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
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  picker: {
    marginBottom: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.base,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  searchButton: {
    ...commonStyles.button.primary,
  },
  searchButtonText: {
    ...commonStyles.button.text,
  },
  listContainer: {
    padding: spacing.base,
  },
  invoiceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    elevation: shadows.elevation.base,
    ...shadows.ios.base,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  invoiceId: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  status: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  active: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  void: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  customerInfo: {
    marginBottom: spacing.md,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  customerDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  amountInfo: {
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  balance: {
    color: colors.error,
    fontSize: typography.fontSize.base,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textDisabled,
    textAlign: 'right',
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
    textAlign: 'center',
  },
});

export default EditInvoicePage;
