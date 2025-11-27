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

interface PackingItem {
  name: string;
  amount: string;
}

interface PackingSectionProps {
  packingCharges: PackingItem[];
  setPackingCharges: React.Dispatch<React.SetStateAction<PackingItem[]>>;
  previousTotal?: number;
  onPackingChange?: (data: {
    packagingLineItems: any[];
    totalAmt: number;
  }) => void;
}

const PackingSection: React.FC<PackingSectionProps> = ({
  packingCharges,
  setPackingCharges,
  previousTotal = 0,
  onPackingChange,
}) => {
  const addPacking = () => {
    const updated = [...packingCharges, { name: '', amount: '' }];
    setPackingCharges(updated);
    triggerChange(updated);
  };

  const updatePacking = (
    index: number,
    field: keyof PackingItem,
    value: string,
  ) => {
    const updated = [...packingCharges];
    updated[index][field] = value;
    setPackingCharges(updated);
    triggerChange(updated);
  };

  const removePacking = (index: number) => {
    const updated = packingCharges.filter((_, i) => i !== index);
    setPackingCharges(updated);
    triggerChange(updated);
  };

  const triggerChange = (list: PackingItem[]) => {
    if (!onPackingChange) return;
    const packagingLineItems = list.map(p => ({
      name: p.name,
      amount: Number(p.amount || 0),
    }));
    const totalAmt = list.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    onPackingChange({ packagingLineItems, totalAmt });
  };

  const packingTotal = packingCharges.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  const afterPackingTotal = previousTotal + packingTotal;

  const renderPacking = ({
    item,
    index,
  }: {
    item: PackingItem;
    index: number;
  }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Packing {index + 1}</Text>

          {packingCharges.length > 1 && (
            <TouchableOpacity
              onPress={() => removePacking(index)}
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

        <View style={styles.inputBox}>
          <Text style={styles.label}>Packing Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Box Packaging"
            value={item.name}
            onChangeText={t => updatePacking(index, 'name', t)}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={item.amount}
            onChangeText={t => updatePacking(index, 'amount', t)}
          />

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Calculated:</Text>
            <Text style={styles.amountValue}>
              ₹{Number(item.amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Add Packaging Charges</Text>

      <View style={styles.productsContainer}>
        <FlatList
          data={packingCharges}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderPacking}
          keyExtractor={(_, index) => index.toString()}
          snapToInterval={width}
          decelerationRate="fast"
        />
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addPacking}>
        <Text style={styles.addText}>+ Add Another Charge</Text>
      </TouchableOpacity>

      <View style={styles.grandBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.totalTaxLabel}>Total Packaging Charges</Text>
          <Text style={styles.totalTaxValue}>₹{packingTotal.toFixed(2)}</Text>
        </View>

        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#888',
            marginVertical: scale(8),
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.grandLabel}>Total After Packaging</Text>
          <Text style={styles.grandValue}>₹{afterPackingTotal.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: scale(20),
    fontWeight: '700',
    marginLeft: scale(16),
    marginBottom: scale(12),
    color: '#1e293b',
  },
  productsContainer: { height: height * 0.45, marginBottom: scale(8) },
  cardContainer: { width, paddingHorizontal: scale(12) },
  card: {
    backgroundColor: '#f8fafc',
    padding: scale(16),
    borderRadius: scale(12),
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  title: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#1e293b',
  },
  inputBox: { marginBottom: scale(12) },
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
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scale(12),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginRight: scale(30),
  },
  amountLabel: {
    fontSize: scale(14),
    color: '#475569',
    marginRight: scale(6),
    fontWeight: '500',
  },
  amountValue: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#1e293b',
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
  grandBox: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: scale(16),
    borderRadius: scale(10),
    marginHorizontal: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: '#888',
  },
});

export default PackingSection;
