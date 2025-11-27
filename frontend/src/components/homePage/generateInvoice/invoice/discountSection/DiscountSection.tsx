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
    backgroundColor: '#f8fafc',
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(16),
    marginHorizontal: '4%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#1e293b',
  },
  inputContainer: { marginBottom: scale(12) },
  label: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#334155',
    marginBottom: scale(4),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    fontSize: scale(15),
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
    borderColor: '#888',
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: 'transparent',
  },
  toggleBtnSelected: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectedText: {
    color: '#000',
    fontWeight: '600',
  },
  unselectedText: {
    color: '#000',
    fontWeight: '500',
  },
  totalBox: {
    marginTop: scale(16),
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: scale(15),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#888',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: scale(20),
    fontWeight: '700',
    color: '#000',
  },
});

export default DiscountSection;
