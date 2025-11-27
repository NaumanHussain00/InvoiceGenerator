import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface InvoiceHeaderProps {
  invoiceData: { date: string; invoiceId: string };
  setInvoiceData: React.Dispatch<React.SetStateAction<{ date: string; invoiceId: string }>>;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ invoiceData, setInvoiceData }) => {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>📄</Text>
        <Text style={styles.sectionTitle}>Invoice Details</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Invoice Date *</Text>
          <TextInput
            style={styles.input}
            value={invoiceData.date}
            onChangeText={(text) => setInvoiceData(prev => ({ ...prev, date: text }))}
            placeholder="Select date"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Invoice ID</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={invoiceData.invoiceId}
            editable={false}
            placeholder="Auto-generated"
          />
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
    marginBottom: 20,
    // Shadow for both iOS and Android:
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
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  flex1: { flex: 1 },
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
    backgroundColor: '#F9FBFC',
    fontSize: 15,
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#E8F4FF',
    color: '#555',
  },
});

export default InvoiceHeader;
