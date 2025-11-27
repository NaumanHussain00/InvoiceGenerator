import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface Tax {
  name: string;
  value: string;
  type: '%' | '₹';
}

interface TaxSectionProps {
  taxLineItems: Tax[];
  setTaxLineItems: React.Dispatch<React.SetStateAction<Tax[]>>;
  productsTotal: number;
  onTaxChange?: (data: { taxLineItems: Tax[]; totalTax: number }) => void;
  grandTotal?: number; // ✅ new
}

const TaxSection: React.FC<TaxSectionProps> = ({
  taxLineItems,
  setTaxLineItems,
  productsTotal,
  onTaxChange,
  grandTotal,
}) => {
  const addTax = () => {
    setTaxLineItems([...taxLineItems, { name: '', value: '', type: '%' }]);
  };

  const updateTax = <K extends keyof Tax>(
    index: number,
    field: K,
    value: Tax[K],
  ) => {
    // Clone to avoid shared references
    const updated = taxLineItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : { ...item },
    );

    // Update amount only for that specific tax row
    const current = updated[index];
    const val = Number(current.value) || 0;
    const amount = current.type === '%' ? (productsTotal * val) / 100 : val;

    // Ensure the new tax has correct amount while others stay the same
    updated[index] = { ...current, value: String(val), type: current.type };

    // Compute total tax for callback
    const totalTax = updated.reduce((sum, t) => {
      const v = Number(t.value) || 0;
      return sum + (t.type === '%' ? (productsTotal * v) / 100 : v);
    }, 0);

    // Update state and notify parent
    setTaxLineItems(updated);
    if (onTaxChange) onTaxChange({ taxLineItems: updated, totalTax });
  };

  const removeTax = (index: number) => {
    const updated = taxLineItems.filter((_, i) => i !== index);
    setTaxLineItems(updated);
  };

  const totalTax = taxLineItems.reduce((sum, t) => {
    const val = Number(t.value) || 0;
    return sum + (t.type === '%' ? (productsTotal * val) / 100 : val);
  }, 0);

  const renderTax = ({ item, index }: { item: Tax; index: number }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tax {index + 1}</Text>

          {taxLineItems.length > 1 && (
            <TouchableOpacity
              onPress={() => removeTax(index)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeText}>Remove</Text>
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

        {/* Tax Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Tax Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. GST, VAT"
            value={item.name}
            onChangeText={t => updateTax(index, 'name', t)}
          />
        </View>

        {/* Tax Value */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Tax Value</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={item.value}
            onChangeText={t => updateTax(index, 'value', t)}
          />

          {/* Toggle Button Row */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => updateTax(index, 'type', '%')}
              style={[
                styles.toggleBtn,
                item.type === '%' && styles.toggleSelected,
              ]}
            >
              <Text
                style={
                  item.type === '%'
                    ? styles.selectedText
                    : styles.unselectedText
                }
              >
                %
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateTax(index, 'type', '₹')}
              style={[
                styles.toggleBtn,
                item.type === '₹' && styles.toggleSelected,
              ]}
            >
              <Text
                style={
                  item.type === '₹'
                    ? styles.selectedText
                    : styles.unselectedText
                }
              >
                ₹
              </Text>
            </TouchableOpacity>
          </View>
          {/* ✅ Individual Tax Amount */}
          <View style={styles.taxAmountBox}>
            <Text style={styles.taxAmountLabel}>Calculated:</Text>
            <Text style={styles.taxAmountValue}>
              ₹
              {(item.type === '%'
                ? (productsTotal * (Number(item.value) || 0)) / 100
                : Number(item.value) || 0
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Add Tax</Text>

      <View style={styles.productsContainer}>
        <FlatList
          data={taxLineItems}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderTax}
          keyExtractor={(_, index) => index.toString()}
          snapToInterval={width}
          decelerationRate="fast"
        />
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addTax}>
        <Text style={styles.addText}>+ Add Another Tax</Text>
      </TouchableOpacity>

      {grandTotal !== undefined && (
        <View style={styles.grandBox}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={styles.totalTaxLabel}>Total Tax</Text>
            <Text style={styles.totalTaxValue}>₹{totalTax.toFixed(2)}</Text>
          </View>

          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#888',
              marginVertical: scale(8),
            }}
          />

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={styles.grandLabel}>Total After Tax</Text>
            <Text style={styles.grandValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

//
// ✅ STYLES (identical to ProductSection theme)
//
const styles = StyleSheet.create({
  header: {
    fontSize: scale(20),
    fontWeight: '700',
    marginLeft: scale(16),
    marginBottom: scale(12),
    color: '#1e293b',
  },
  productsContainer: { height: height * 0.5, marginBottom: scale(8) },
  cardContainer: { width, paddingHorizontal: scale(12) },
  card: {
    backgroundColor: '#f8fafc',
    padding: scale(16),
    borderRadius: scale(12),
    flex: 1,
  },
  title: {
    fontSize: scale(18),
    fontWeight: '600',
    marginBottom: scale(12),
    color: '#1e293b',
  },
  inputBox: { marginBottom: scale(12), position: 'relative' },
  label: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#334155',
    marginBottom: scale(6),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: scale(15),
    color: '#000',
    width: '90%',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scale(12),
    marginTop: scale(10),
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: 'transparent',
  },
  toggleSelected: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectedText: { color: '#000', fontWeight: '600' },
  unselectedText: { color: '#000', fontWeight: '500' },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    marginRight: scale(20),
  },
  removeText: {
    color: '#dc2626',
    fontSize: scale(13),
    fontWeight: '600',
  },

  addBtn: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(10),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: '#888',
  },
  addText: { color: '#000', fontWeight: '600', fontSize: scale(15) },
  grandBox: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: scale(16),
    borderRadius: scale(10),
    marginHorizontal: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: '#888',
  },
  totalTaxLabel: {
    fontSize: scale(15),
    fontWeight: '500',
    color: '#475569',
  },
  totalTaxValue: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#475569',
  },
  grandLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#000',
  },
  grandValue: {
    fontSize: scale(20),
    fontWeight: '800',
    color: '#000',
  },

  taxAmountBox: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scale(12),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginRight: scale(30),
  },
  taxAmountLabel: {
    fontSize: scale(14),
    color: '#475569',
    marginRight: scale(6),
    fontWeight: '500',
  },
  taxAmountValue: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#1e293b',
  },

  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: scale(16),
    marginTop: scale(12),
    marginBottom: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#1e293b',
  },
});

export default TaxSection;
