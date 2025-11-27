import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

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
  onPaidChange?: (paidByCustomer: string) => void; // new
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
        <Text>Subtotal:</Text>
        <Text style={styles.normalAmount}>₹{subtotal.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text>Discount Amount:</Text>
        <Text style={styles.decreaseAmount}>- ₹{discountAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text>Tax Amount:</Text>
        <Text style={styles.increaseAmount}>+ ₹{taxAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text>Packing Charges:</Text>
        <Text style={styles.increaseAmount}>+ ₹{packingTotal.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRowLast}>
        <Text>Transport Charges:</Text>
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
        />

      </View>

      <View
        style={[
          styles.balanceBox,
          {
            backgroundColor: balanceAmount > 0 ? '#FFEBEE' : '#E8F5E9',
            borderColor: balanceAmount > 0 ? '#E53935' : '#4CAF50',
          },
        ]}
      >
        <View style={styles.balanceRow}>
          <Text
            style={[
              styles.balanceLabel,
              { color: balanceAmount > 0 ? '#C62828' : '#2E7D32' },
            ]}
          >
            {balanceAmount > 0 ? 'Balance Due:' : 'Payment Complete'}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: balanceAmount > 0 ? '#C62828' : '#2E7D32' },
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E8F4FF',
  },
  sectionIcon: { fontSize: 24, marginRight: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  summaryRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  normalAmount: {
    fontWeight: '600',
  },
  increaseAmount: {
    fontWeight: '600',
    color: '#E53935',
  },
  decreaseAmount: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  totalBox: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  totalAmountText: {
    fontSize: 24,
    color: '#2E7D32',
    fontWeight: '700',
  },
  inputContainer: { marginBottom: 15 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#F9FBFC',
    color: '#000',
  },
  balanceBox: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default TotalSection;
