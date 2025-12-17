import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
} from '../../theme/theme';
import { getLedgerOverview, getCustomerHistory } from '../../services/OfflineService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const LEDGER_PASSWORD_KEY = '@ledger_password';
const DEFAULT_LEDGER_PASSWORD = '5678'; // Default password

type RootStackParamList = {
  InvoiceViewer: { invoiceId: string };
  CreditViewer: { creditId: string };
};

interface Customer {
  id: number;
  name: string;
  phone: string;
  firm: string;
  balance: number;
}

interface LedgerData {
  customers: Customer[];
  totalOwed: number;
  customerCount: number;
}

interface Transaction {
  type: 'invoice' | 'credit';
  id: number;
  date: string;
  amount: number;
  paid: number;
  previousBalance: number;
  newBalance: number;
  status: string;
}

interface CustomerHistory {
  customer: Customer;
  transactions: Transaction[];
  totalInvoices: number;
  totalCredits: number;
}

const LedgerPage: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerHistory, setCustomerHistory] =
    useState<CustomerHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkPasswordExists();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchLedgerData();
    }
  }, [isUnlocked]);

  const checkPasswordExists = async () => {
    try {
      const savedPassword = await AsyncStorage.getItem(LEDGER_PASSWORD_KEY);
      if (!savedPassword) {
        await AsyncStorage.setItem(
          LEDGER_PASSWORD_KEY,
          DEFAULT_LEDGER_PASSWORD,
        );
      }
    } catch (error) {
      console.error('Error checking ledger password:', error);
    }
  };

  const handleUnlock = async () => {
    try {
      const savedPassword = await AsyncStorage.getItem(LEDGER_PASSWORD_KEY);
      if (password === savedPassword) {
        setIsUnlocked(true);
        setPassword('');
      } else {
        Alert.alert('Error', 'Incorrect ledger password');
        setPassword('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify password');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await AsyncStorage.setItem(LEDGER_PASSWORD_KEY, newPassword);
      Alert.alert('Success', 'Ledger password changed successfully');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save password');
    }
  };

  const fetchLedgerData = async () => {
    setLoading(true);

    try {
      console.log('[Ledger] Fetching offline data');
      const response = await getLedgerOverview();
      if (response && response.success && response.data) {
        setLedgerData(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch ledger');
      }
    } catch (err: any) {
      console.error('[Ledger] Offline fetch failed:', err);
      Alert.alert('Error', err.message || 'Failed to load ledger data.');
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLedgerData();
    setRefreshing(false);
  };

  const fetchCustomerHistory = async (customerId: number) => {
    setHistoryLoading(true);

    try {
      console.log('[History] Fetching offline history for:', customerId);
      const response = await getCustomerHistory(customerId);
      if (response && response.success && response.data) {
        setCustomerHistory(response.data);
      } else {
        throw new Error(response?.message || 'Failed to fetch history');
      }
    } catch (err: any) {
      console.error('[History] Offline fetch failed:', err);
      Alert.alert('Error', err.message || 'Failed to fetch customer history');
    }

    setHistoryLoading(false);
  };

  const handleCustomerPress = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerHistory(customer.id);
  };

  const closeHistoryModal = () => {
    setSelectedCustomer(null);
    setCustomerHistory(null);
  };

  const filterCustomers = () => {
    if (!ledgerData || !searchQuery.trim()) {
      return ledgerData?.customers || [];
    }

    const query = searchQuery.toLowerCase().trim();
    return ledgerData.customers.filter(
      customer =>
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.firm && customer.firm.toLowerCase().includes(query)),
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => {
        if (item.status === 'ACTIVE') {
          if (item.type === 'invoice') {
            navigation.navigate('InvoiceViewer', {
              invoiceId: item.id.toString(),
            });
          } else if (item.type === 'credit') {
            navigation.navigate('CreditViewer', {
              creditId: item.id.toString(),
            });
          }
        }
      }}
      disabled={item.status !== 'ACTIVE'}
      activeOpacity={item.status === 'ACTIVE' ? 0.7 : 1}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionTypeContainer}>
          <Text
            style={[
              styles.transactionType,
              item.type === 'invoice' ? styles.invoiceType : styles.creditType,
            ]}
          >
            {item.type === 'invoice' ? '📄 Invoice' : '💰 Credit'}
          </Text>
          <Text style={styles.transactionId}>#{item.id}</Text>
        </View>
        <Text
          style={[
            styles.transactionStatus,
            item.status === 'ACTIVE' ? styles.statusActive : styles.statusVoid,
          ]}
        >
          {item.status}
        </Text>
      </View>

      <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>

      <View style={styles.transactionDetails}>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>Previous Balance:</Text>
          <Text style={styles.transactionValue}>
            {formatCurrency(item.previousBalance)}
          </Text>
        </View>

        {item.type === 'invoice' && item.amount > 0 && (
          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Invoice Amount:</Text>
            <Text style={[styles.transactionValue, styles.amountAdded]}>
              +{formatCurrency(item.amount)}
            </Text>
          </View>
        )}

        {item.paid > 0 && (
          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Amount Paid:</Text>
            <Text style={[styles.transactionValue, styles.amountPaid]}>
              -{formatCurrency(item.paid)}
            </Text>
          </View>
        )}

        <View style={[styles.transactionRow, styles.finalBalanceRow]}>
          <Text style={styles.finalBalanceLabel}>New Balance:</Text>
          <Text style={styles.finalBalanceValue}>
            {formatCurrency(item.newBalance)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => handleCustomerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerDetails}>{item.firm}</Text>
        <Text style={styles.customerDetails}>{item.phone}</Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text
          style={[
            styles.balance,
            item.balance > 0 ? styles.positive : styles.negative,
          ]}
        >
          {formatCurrency(item.balance)}
        </Text>
        <Text style={styles.tapHint}>Tap for history →</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockContent}>
          <Text style={styles.lockTitle}>Ledger Access</Text>
          <Text style={styles.lockSubtitle}>Enter Ledger Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Ledger Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleUnlock}
            autoFocus
          />
          <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
            <Text style={styles.buttonText}>Unlock Ledger</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isChangingPassword) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Change Ledger Password</Text>
        </View>
        <View style={styles.changePasswordContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.buttonText}>Save Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, styles.cancelButton]}
            onPress={() => {
              setIsChangingPassword(false);
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Ledger</Text>
        <TouchableOpacity
          style={styles.changePasswordLink}
          onPress={() => setIsChangingPassword(true)}
        >
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1e3a5f" style={styles.loader} />
      ) : (
        <>
          {ledgerData && (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Customers</Text>
                  <Text style={styles.summaryValue}>
                    {ledgerData.customerCount}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Owed</Text>
                  <Text style={[styles.summaryValue, styles.totalOwed]}>
                    {formatCurrency(ledgerData.totalOwed)}
                  </Text>
                </View>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, phone, or firm..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <FlatList
            data={filterCustomers()}
            renderItem={renderCustomer}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1e3a5f']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? 'No customers found'
                    : 'No outstanding balances'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Customer History Modal */}
      <Modal
        visible={selectedCustomer !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={closeHistoryModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedCustomer?.name}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedCustomer?.firm} • {selectedCustomer?.phone}
              </Text>
              <Text style={styles.modalBalance}>
                Current Balance:{' '}
                {selectedCustomer && formatCurrency(selectedCustomer.balance)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeHistoryModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            <ActivityIndicator
              size="large"
              color="#1e3a5f"
              style={styles.loader}
            />
          ) : (
            <>
              {customerHistory && (
                <View style={styles.historySummary}>
                  <View style={styles.historyStatBox}>
                    <Text style={styles.historyStatValue}>
                      {customerHistory.totalInvoices}
                    </Text>
                    <Text style={styles.historyStatLabel}>Invoices</Text>
                  </View>
                  <View style={styles.historyStatBox}>
                    <Text style={styles.historyStatValue}>
                      {customerHistory.totalCredits}
                    </Text>
                    <Text style={styles.historyStatLabel}>Credits</Text>
                  </View>
                  <View style={styles.historyStatBox}>
                    <Text style={styles.historyStatValue}>
                      {customerHistory.transactions.length}
                    </Text>
                    <Text style={styles.historyStatLabel}>
                      Total Transactions
                    </Text>
                  </View>
                </View>
              )}

              <FlatList
                data={customerHistory?.transactions || []}
                renderItem={renderTransaction}
                keyExtractor={item => `${item.type}-${item.id}`}
                contentContainerStyle={styles.historyListContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No transaction history</Text>
                  </View>
                }
              />
            </>
          )}
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
  lockContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    width: '85%',
    maxWidth: 400,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    elevation: shadows.elevation.lg,
    ...shadows.ios.lg,
  },
  lockTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  lockSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  changePasswordLink: {
    padding: spacing.xs,
  },
  changePasswordText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  changePasswordContainer: {
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.base,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  unlockButton: {
    ...commonStyles.button.primary,
  },
  saveButton: {
    ...commonStyles.button.primary,
    marginBottom: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
  },
  buttonText: {
    ...commonStyles.button.text,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    elevation: shadows.elevation.base,
    ...shadows.ios.base,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.base,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  totalOwed: {
    color: colors.error,
  },
  searchContainer: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingRight: spacing['3xl'],
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  listContainer: {
    padding: spacing.base,
  },
  customerCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  customerDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  positive: {
    color: colors.error,
  },
  negative: {
    color: colors.success,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textDisabled,
  },
  tapHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  modalBalance: {
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: typography.fontSize['2xl'],
    color: colors.textInverse,
    fontWeight: typography.fontWeight.bold,
  },
  historySummary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    elevation: shadows.elevation.base,
    ...shadows.ios.base,
    justifyContent: 'space-around',
  },
  historyStatBox: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  historyStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  historyStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  historyListContainer: {
    padding: spacing.base,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
  },
  invoiceType: {
    color: colors.primary,
  },
  creditType: {
    color: colors.success,
  },
  transactionId: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  transactionStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusVoid: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  transactionDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  transactionValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  amountAdded: {
    color: colors.error,
  },
  amountPaid: {
    color: colors.success,
  },
  finalBalanceRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  finalBalanceLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  finalBalanceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

export default LedgerPage;
