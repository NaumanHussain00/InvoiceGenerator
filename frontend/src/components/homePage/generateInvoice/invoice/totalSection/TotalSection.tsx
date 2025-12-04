import React from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface Product {
  total: number;
}

interface Tax {
  value: string;
  type: '%' | '₹';
}

interface Discount {
  value: string;
  type: '%' | '₹';
}

interface PackingCharge {
  amount: string;
}

interface TransportOption {
  cost: string;
}

interface TotalSectionProps {
  products: Product[];
  taxes: Tax[];
  discounts: Discount[];
  packingCharges: PackingCharge[];
  transportOptions: TransportOption[];
  amountPaid: string;
  setAmountPaid: React.Dispatch<React.SetStateAction<string>>;
  onPaidChange?: (paidByCustomer: string) => void;
}


const TotalSection: React.FC<TotalSectionProps> = ({
  products,
  taxes,
  discounts,
  packingCharges,
  transportOptions,
  amountPaid,
  setAmountPaid,
  onPaidChange,
}) => {
  const subtotal = products.reduce((sum, p) => sum + (p.total || 0), 0);
  const discountAmount = discounts.reduce((sum, disc) => {
    const val = Number(disc.value) || 0;
    return sum + (disc.type === '%' ? (subtotal * val) / 100 : val);
  }, 0);

  const subtotalAfterDiscount = subtotal - discountAmount;

  // Step 2: Tax
  const taxAmount = taxes.reduce((sum, tax) => {
    const val = Number(tax.value) || 0;
    return sum + (tax.type === '%' ? (subtotalAfterDiscount * val) / 100 : val);
  }, 0);

  // Step 3: Packing + Transport
  const packingTotal = packingCharges.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const transportTotal = transportOptions.reduce((sum, t) => sum + Number(t.cost || 0), 0);

  // Step 4: Total
  const totalAmount = subtotalAfterDiscount + taxAmount + packingTotal + transportTotal;
  const balanceAmount = totalAmount - Number(amountPaid || 0);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal:</Text>
        <Text style={styles.normalAmount}>₹{subtotal.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Discount Amount:</Text>
        <Text style={styles.decreaseAmount}>- ₹{discountAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax Amount:</Text>
        <Text style={styles.increaseAmount}>+ ₹{taxAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Packing Charges:</Text>
        <Text style={styles.increaseAmount}>+ ₹{packingTotal.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRowLast}>
        <Text style={styles.summaryLabel}>Transport Charges:</Text>
        <Text style={styles.increaseAmount}>+ ₹{transportTotal.toFixed(2)}</Text>
      </View>

      <View style={styles.totalBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmountText}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount Paid by Customer (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amountPaid}
          onChangeText={(value) => {
            setAmountPaid(value);
            if (onPaidChange) onPaidChange(value);
          }}
          placeholder="0.00"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View
        style={[
          styles.balanceBox,
          {
            backgroundColor: balanceAmount > 0 ? '#fef2f2' : '#f0fdf4', // red-50 : green-50
            borderColor: balanceAmount > 0 ? '#ef4444' : '#22c55e',     // red-500 : green-500
          },
        ]}
      >
        <View style={styles.balanceRow}>
          <Text
            style={[
              styles.balanceLabel,
              { color: balanceAmount > 0 ? '#b91c1c' : '#15803d' }, // red-700 : green-700
            ]}
          >
            {balanceAmount > 0 ? 'Balance Due:' : 'Payment Complete'}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: balanceAmount > 0 ? '#b91c1c' : '#15803d' },
            ]}
          >
            ₹{Math.abs(balanceAmount).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: scale(12),
    borderRadius: scale(10),
    marginBottom: scale(20),
    marginHorizontal: scale(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
    paddingBottom: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(6),
    borderBottomWidth: 0,
    marginBottom: scale(6),
  },
  summaryLabel: {
    fontSize: scale(13),
    color: '#64748b',
    fontWeight: '500',
  },
  normalAmount: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#1e293b',
  },
  increaseAmount: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#ef4444', // red-500
  },
  decreaseAmount: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#22c55e', // green-500
  },
  totalBox: {
    marginTop: scale(10),
    marginBottom: scale(16),
    backgroundColor: '#1e293b', // Slate-800
    padding: scale(12),
    borderRadius: scale(10),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#fff',
  },
  totalAmountText: {
    fontSize: scale(18),
    color: '#3b82f6', // Blue-500
    fontWeight: '800',
  },
  inputContainer: { marginBottom: scale(12) },
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
  balanceBox: {
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: scale(14),
    fontWeight: '700',
  },
  balanceAmount: {
    fontSize: scale(18),
    fontWeight: '800',
  },
});

export default TotalSection;
