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
  grandTotal?: number;
}

const TaxSection: React.FC<TaxSectionProps> = ({
  taxLineItems,
  setTaxLineItems,
  productsTotal,
  onTaxChange,
  grandTotal,
}) => {
  const initialTaxState: Tax = { name: '', value: '', type: '₹' };
  const [currentTax, setCurrentTax] = React.useState<Tax>(initialTaxState);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const updateCurrentTax = <K extends keyof Tax>(field: K, value: Tax[K]) => {
    setCurrentTax({ ...currentTax, [field]: value });
  };

  const handleAddOrUpdate = () => {
    if (!currentTax.name.trim()) return;

    let updatedList = [...taxLineItems];
    if (editingIndex !== null) {
      // Update existing
      updatedList[editingIndex] = currentTax;
      setEditingIndex(null);
    } else {
      // Add new
      updatedList.push(currentTax);
    }

    // Calculate total tax
    const totalTax = updatedList.reduce((sum, t) => {
      const v = Number(t.value) || 0;
      return sum + (t.type === '%' ? (productsTotal * v) / 100 : v);
    }, 0);

    setTaxLineItems(updatedList);
    if (onTaxChange) onTaxChange({ taxLineItems: updatedList, totalTax });
    
    // Reset form
    setCurrentTax(initialTaxState);
  };

  const handleEditItem = (item: Tax, index: number) => {
    setCurrentTax(item);
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setCurrentTax(initialTaxState);
    setEditingIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    const updated = taxLineItems.filter((_, i) => i !== index);
    
    const totalTax = updated.reduce((sum, t) => {
      const v = Number(t.value) || 0;
      return sum + (t.type === '%' ? (productsTotal * v) / 100 : v);
    }, 0);

    setTaxLineItems(updated);
    if (onTaxChange) onTaxChange({ taxLineItems: updated, totalTax });

    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const totalTax = taxLineItems.reduce((sum, t) => {
    const val = Number(t.value) || 0;
    return sum + (t.type === '%' ? (productsTotal * val) / 100 : val);
  }, 0);

  const renderInputForm = () => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{editingIndex !== null ? 'Edit Tax' : 'Add Tax'}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {editingIndex === null && (
              <TouchableOpacity
                onPress={() => {
                  setCurrentTax({ name: 'GST', value: '', type: '%' });
                }}
                style={styles.gstBtn}
              >
                <Text style={styles.gstText}>+ GST</Text>
              </TouchableOpacity>
            )}
            {editingIndex !== null && (
              <TouchableOpacity onPress={handleCancelEdit} style={styles.removeBtn}>
                <Text style={styles.removeText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', marginVertical: 10 }} />

        {/* Tax Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Tax Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. GST, VAT"
            placeholderTextColor="#94a3b8"
            value={currentTax.name}
            onChangeText={t => updateCurrentTax('name', t)}
          />
        </View>

        {/* Tax Value */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Tax Value</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={currentTax.value}
            onChangeText={t => updateCurrentTax('value', t)}
          />

          {/* Toggle Button Row */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => updateCurrentTax('type', '%')}
              style={[styles.toggleBtn, currentTax.type === '%' && styles.toggleSelected]}
            >
              <Text style={currentTax.type === '%' ? styles.selectedText : styles.unselectedText}>%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateCurrentTax('type', '₹')}
              style={[styles.toggleBtn, currentTax.type === '₹' && styles.toggleSelected]}
            >
              <Text style={currentTax.type === '₹' ? styles.selectedText : styles.unselectedText}>₹</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calculated Amount */}
        <Text style={styles.totalText}>
          Amount: ₹
          {(currentTax.type === '%'
            ? (productsTotal * (Number(currentTax.value) || 0)) / 100
            : Number(currentTax.value) || 0
          ).toFixed(2)}
        </Text>
        
        {/* Add/Update Button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddOrUpdate}>
          <Text style={styles.addText}>{editingIndex !== null ? 'Update Tax' : 'Add Tax'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTaxRow = ({ item, index }: { item: Tax; index: number }) => (
    <TouchableOpacity onPress={() => handleEditItem(item, index)} style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellIndex]}>{index + 1}</Text>
      <Text style={[styles.tableCell, styles.tableCellName]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.tableCell, styles.tableCellValue]}>
        {item.value}{item.type}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellAmount]}>
        ₹{(item.type === '%'
          ? (productsTotal * (Number(item.value) || 0)) / 100
          : Number(item.value) || 0
        ).toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => handleRemoveItem(index)} style={[styles.tableCellAction, { padding: 5 }]}>
        <Text style={{ color: '#ef4444', fontSize: 12 }}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Tax Details</Text>
      
      {/* Tax Summary Table */}
      {taxLineItems.length > 0 && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Taxes Added ({taxLineItems.length})</Text>
          <Text style={{ fontSize: 12, color: '#64748b', paddingHorizontal: 12, paddingBottom: 8 }}>
            Tap a row to edit
          </Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellName]}>Name</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellValue]}>Value</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAmount]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAction]}></Text>
          </View>
          
          <ScrollView style={styles.tableBody} nestedScrollEnabled>
            <FlatList
              data={taxLineItems}
              renderItem={renderTaxRow}
              keyExtractor={(_, index) => index.toString()}
              scrollEnabled={false}
            />
          </ScrollView>
          
          <View style={styles.tableFooter}>
            <Text style={styles.tableFooterLabel}>Total Tax:</Text>
            <Text style={styles.tableFooterValue}>
              ₹{totalTax.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
      
      {/* Single Input Form */}
      {renderInputForm()}

      {grandTotal !== undefined && (
        <View style={styles.grandBox}>
          <Text style={styles.grandLabel}>Total After Tax:</Text>
          <Text style={styles.grandValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
      )}
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
  title: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(8),
    color: '#1e293b',
  },
  inputBox: { marginBottom: scale(8), position: 'relative' },
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scale(8),
    marginTop: scale(8),
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: 'transparent',
  },
  toggleSelected: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectedText: { color: '#000', fontWeight: '600', fontSize: scale(13) },
  unselectedText: { color: '#000', fontWeight: '500', fontSize: scale(13) },
  totalText: {
    textAlign: 'right',
    marginTop: scale(8),
    fontWeight: '700',
    fontSize: scale(15),
    color: '#000',
    marginRight: scale(10),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
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
  gstBtn: {
    backgroundColor: '#7c3aed', // Violet-600
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(6),
  },
  gstText: {
    color: '#fff',
    fontSize: scale(12),
    fontWeight: '600',
  },

  addBtn: {
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    marginTop: scale(12),
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
    borderWidth: 0,
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
    width: '8%',
  },
  tableCellName: {
    width: '35%',
    textAlign: 'left',
    paddingLeft: scale(4),
  },
  tableCellValue: {
    width: '17%',
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

export default TaxSection;
