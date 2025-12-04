import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface DiscountSectionProps {
  onDiscountChange: (data: { amountDiscount: number; percentDiscount: number }) => void;
  previousTotal: number;
}

const DiscountSection: React.FC<DiscountSectionProps> = ({ onDiscountChange, previousTotal }) => {
  const [value, setValue] = useState<string>('');
  const [type, setType] = useState<'%' | '₹'>('%');

  useEffect(() => {
    const amountDiscount = type === '₹' ? Number(value || 0) : 0;
    const percentDiscount = type === '%' ? Number(value || 0) : 0;
    onDiscountChange({ amountDiscount, percentDiscount });
  }, [value, type]);

  const discountAmount =
    type === '%'
      ? (previousTotal * Number(value || 0)) / 100
      : Number(value || 0);

  const afterDiscountTotal = previousTotal - discountAmount;

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Discount</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Discount Value *</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={value}
            onChangeText={setValue}
          />
          <TouchableOpacity
            style={[styles.toggleBtn, type === '%' && styles.toggleBtnSelected]}
            onPress={() => setType('%')}
          >
            <Text style={type === '%' ? styles.selectedText : styles.unselectedText}>%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === '₹' && styles.toggleBtnSelected]}
            onPress={() => setType('₹')}
          >
            <Text style={type === '₹' ? styles.selectedText : styles.unselectedText}>₹</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>₹{afterDiscountTotal.toFixed(2)}</Text>
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
  inputContainer: { marginBottom: scale(8) },
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
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'center',
  },
  flex1: { flex: 1 },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: '#fff',
  },
  toggleBtnSelected: {
    backgroundColor: '#eff6ff', // Light blue bg
    borderColor: '#3b82f6',
  },
  selectedText: {
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: scale(13),
  },
  unselectedText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: scale(13),
  },
  totalBox: {
    marginTop: scale(12),
    backgroundColor: '#1e293b',
    padding: scale(12),
    borderRadius: scale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  totalLabel: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#fff',
  },
  totalValue: {
    fontSize: scale(18),
    fontWeight: '800',
    color: '#3b82f6',
  },
});

export default DiscountSection;
