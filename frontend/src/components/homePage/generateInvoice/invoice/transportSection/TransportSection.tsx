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

interface TransportOption {
  name: string;
  cost: string;
}

interface TransportSectionProps {
  transportOptions: TransportOption[];
  setTransportOptions: React.Dispatch<React.SetStateAction<TransportOption[]>>;
  previousTotal?: number;
  onTransportChange?: (data: {
    transportationLineItems: any[];
    totalAmt: number;
  }) => void;
}

const TransportSection: React.FC<TransportSectionProps> = ({
  transportOptions,
  setTransportOptions,
  previousTotal = 0,
  onTransportChange,
}) => {
  const addTransport = () => {
    const updated = [...transportOptions, { name: '', cost: '' }];
    setTransportOptions(updated);
    triggerChange(updated);
  };

  const updateTransport = (
    index: number,
    field: keyof TransportOption,
    value: string,
  ) => {
    const updated = [...transportOptions];
    updated[index][field] = value;
    setTransportOptions(updated);
    triggerChange(updated);
  };

  const removeTransport = (index: number) => {
    const updated = transportOptions.filter((_, i) => i !== index);
    setTransportOptions(updated);
    triggerChange(updated);
  };

  const triggerChange = (list: TransportOption[]) => {
    if (!onTransportChange) return;
    const transportationLineItems = list.map(t => ({
      name: t.name,
      amount: Number(t.cost || 0),
    }));
    const totalAmt = list.reduce((sum, t) => sum + Number(t.cost || 0), 0);
    onTransportChange({ transportationLineItems, totalAmt });
  };

  const transportTotal = transportOptions.reduce(
    (sum, t) => sum + Number(t.cost || 0),
    0,
  );
  const afterTransportTotal = previousTotal + transportTotal;

  const renderTransport = ({
    item,
    index,
  }: {
    item: TransportOption;
    index: number;
  }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Transport {index + 1}</Text>

          {transportOptions.length > 1 && (
            <TouchableOpacity
              onPress={() => removeTransport(index)}
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

        {/* Transport Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Transport Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Delivery, Freight"
            value={item.name}
            onChangeText={t => updateTransport(index, 'name', t)}
          />
        </View>

        {/* Transport Cost */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={item.cost}
            onChangeText={t => updateTransport(index, 'cost', t)}
          />
        </View>

        <View style={styles.taxAmountBox}>
          <Text style={styles.taxAmountLabel}>Calculated:</Text>
          <Text style={styles.taxAmountValue}>
            ₹{Number(item.cost || 0).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Add Transport Charges</Text>

      <View style={styles.productsContainer}>
        <FlatList
          data={transportOptions}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderTransport}
          keyExtractor={(_, index) => index.toString()}
          snapToInterval={width}
          decelerationRate="fast"
        />
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addTransport}>
        <Text style={styles.addText}>+ Add Another Transport</Text>
      </TouchableOpacity>

      <View style={styles.grandBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.totalTaxLabel}>Total Transport Charges</Text>
          <Text style={styles.totalTaxValue}>₹{transportTotal.toFixed(2)}</Text>
        </View>

        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#888',
            marginVertical: scale(8),
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.grandLabel}>Total After Transport</Text>
          <Text style={styles.grandValue}>
            ₹{afterTransportTotal.toFixed(2)}
          </Text>
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
  productsContainer: { height: height * 0.5, marginBottom: scale(8) },
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
    marginBottom: scale(12),
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

export default TransportSection;
