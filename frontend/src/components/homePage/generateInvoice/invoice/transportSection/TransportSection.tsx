import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
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
  const initialTransportState: TransportOption = { name: '', cost: '' };
  const [currentTransport, setCurrentTransport] = React.useState<TransportOption>(initialTransportState);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const updateCurrentTransport = (field: keyof TransportOption, value: string) => {
    setCurrentTransport({ ...currentTransport, [field]: value });
  };

  const handleAddOrUpdate = () => {
    if (!currentTransport.name.trim()) return;

    let updatedList = [...transportOptions];
    if (editingIndex !== null) {
      // Update existing
      updatedList[editingIndex] = currentTransport;
      setEditingIndex(null);
    } else {
      // Add new
      updatedList.push(currentTransport);
    }

    setTransportOptions(updatedList);
    triggerChange(updatedList);
    
    // Reset form
    setCurrentTransport(initialTransportState);
  };

  const handleEditItem = (item: TransportOption, index: number) => {
    setCurrentTransport(item);
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setCurrentTransport(initialTransportState);
    setEditingIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    const updated = transportOptions.filter((_, i) => i !== index);
    setTransportOptions(updated);
    triggerChange(updated);

    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
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

  const renderInputForm = () => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{editingIndex !== null ? 'Edit Transport' : 'Add Transport'}</Text>
          {editingIndex !== null && (
            <TouchableOpacity onPress={handleCancelEdit} style={styles.removeBtn}>
              <Text style={styles.removeText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', marginVertical: 10 }} />

        <View style={styles.inputBox}>
          <Text style={styles.label}>Transport Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Delivery, Freight"
            placeholderTextColor="#94a3b8"
            value={currentTransport.name}
            onChangeText={t => updateCurrentTransport('name', t)}
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={currentTransport.cost}
            onChangeText={t => updateCurrentTransport('cost', t)}
          />
        </View>

        <Text style={styles.totalText}>
          Amount: ₹{Number(currentTransport.cost || 0).toFixed(2)}
        </Text>
        
        {/* Add/Update Button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddOrUpdate}>
          <Text style={styles.addText}>{editingIndex !== null ? 'Update Charge' : 'Add Charge'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransportRow = ({ item, index }: { item: TransportOption; index: number }) => (
    <TouchableOpacity onPress={() => handleEditItem(item, index)} style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellIndex]}>{index + 1}</Text>
      <Text style={[styles.tableCell, styles.tableCellName]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.tableCell, styles.tableCellAmount]}>
        ₹{Number(item.cost || 0).toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => handleRemoveItem(index)} style={[styles.tableCellAction, { padding: 5 }]}>
        <Text style={{ color: '#ef4444', fontSize: 12 }}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Add Transport Charges</Text>

      {/* Transport Summary Table */}
      {transportOptions.length > 0 && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Transport Charges Added ({transportOptions.length})</Text>
          <Text style={{ fontSize: 12, color: '#64748b', paddingHorizontal: 12, paddingBottom: 8 }}>
            Tap a row to edit
          </Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellName]}>Name</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAmount]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAction]}></Text>
          </View>
          
          <ScrollView style={styles.tableBody} nestedScrollEnabled>
            <FlatList
              data={transportOptions}
              renderItem={renderTransportRow}
              keyExtractor={(_, index) => index.toString()}
              scrollEnabled={false}
            />
          </ScrollView>
          
          <View style={styles.tableFooter}>
            <Text style={styles.tableFooterLabel}>Total Transport:</Text>
            <Text style={styles.tableFooterValue}>
              ₹{transportTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Single Input Form */}
      {renderInputForm()}

      <View style={styles.grandBox}>
        <Text style={styles.grandLabel}>Total After Transport:</Text>
        <Text style={styles.grandValue}>
          ₹{afterTransportTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: scale(18),
    fontWeight: '700',
    marginLeft: scale(12),
    marginBottom: scale(8),
    color: '#1e293b',
  },
  productsContainer: { flex: 1, marginBottom: scale(6) },
  cardContainer: { paddingHorizontal: scale(8), marginBottom: scale(8) },
  card: {
    backgroundColor: '#ffffff',
    padding: scale(12),
    borderRadius: scale(10),
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  title: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(8),
    color: '#1e293b',
  },
  inputBox: { marginBottom: scale(8) },
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
    width: '90%',
  },
  totalText: {
    textAlign: 'right',
    marginTop: scale(8),
    fontWeight: '700',
    fontSize: scale(15),
    color: '#000',
    marginRight: scale(10),
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(6),
    marginRight: scale(10),
  },
  removeText: {
    color: '#dc2626',
    fontSize: scale(12),
    fontWeight: '600',
  },
  addBtn: {
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    marginBottom: scale(8),
    borderWidth: 0,
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: scale(14),
  },
  grandBox: {
    backgroundColor: '#1e293b',
    padding: scale(12),
    borderRadius: scale(10),
    marginHorizontal: scale(12),
    marginBottom: scale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  grandLabel: { 
    fontSize: scale(16), 
    fontWeight: '700', 
    color: '#fff',
    flex: 1,
    marginRight: scale(8),
  },
  grandValue: { 
    fontSize: scale(18), 
    fontWeight: '800', 
    color: '#3b82f6',
  },

  // Table Styles
  tableContainer: {
    backgroundColor: '#fff',
    marginHorizontal: scale(8),
    marginBottom: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    elevation: 2,
  },
  tableTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#1e293b',
    padding: scale(10),
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: scale(8),
    paddingHorizontal: scale(6),
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  tableHeaderCell: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: scale(150),
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: scale(8),
    paddingHorizontal: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: scale(11),
    color: '#1e293b',
    textAlign: 'center',
  },
  tableCellIndex: {
    width: '10%',
  },
  tableCellName: {
    width: '50%',
    textAlign: 'left',
    paddingLeft: scale(4),
  },
  tableCellAmount: {
    width: '25%',
    fontWeight: '600',
  },
  tableCellAction: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
    backgroundColor: '#f8fafc',
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
  },
  tableFooterLabel: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#334155',
  },
  tableFooterValue: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#1e293b',
  },
});

export default TransportSection;
