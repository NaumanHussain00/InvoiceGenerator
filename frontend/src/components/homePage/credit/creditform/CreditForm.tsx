import React, { useState } from 'react';
import RNPrint from 'react-native-print';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import CustomerSection from '../../generateInvoice/invoice/customerSection/CustomerSection';
import { createCredit, generateCreditHtml } from '../../../../services/OfflineService';

interface CustomerData {
  name: string;
  phone: string;
  firm: string;
  balance: string;
}

const CreditForm: React.FC = () => {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    firm: '',
    balance: '',
  });

  const [customerId, setCustomerId] = useState<number | string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [creditId, setCreditId] = useState<number | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const handleCreateCredit = async () => {
    if (!customerId) {
      Alert.alert('Error', 'Please select a customer first');
      return;
    }

    if (!amountPaid || isNaN(Number(amountPaid))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setCreating(true);
      console.log('[Credit] Creating offline credit...');

      const response = await createCredit(Number(customerId), parseFloat(amountPaid));

      if (response && response.success && response.data) {
        setCreditId(response.data.id);
        Alert.alert('Success', response.message || 'Credit created successfully');
      } else {
        throw new Error(response?.message || 'Failed to create credit');
      }
    } catch (err: any) {
      console.error('Create error:', err);
      Alert.alert('Error', err.message || 'Failed to create credit');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadCredit = async () => {
    if (!creditId) {
      Alert.alert('Error', 'Please create credit first.');
      return;
    }

    try {
      setDownloading(true);
      console.log('[Credit] Generating offline HTML...');

      const response = await generateCreditHtml(creditId);

      if (response && response.success && response.data) {
        setHtmlContent(response.data);
      } else {
        throw new Error(response?.message || 'Failed to generate HTML');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      Alert.alert('Error', err.message || 'Failed to load credit HTML.');
    } finally {
      setDownloading(false);
    }
  };



// ... (inside component)

  if (htmlContent) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setHtmlContent(null)}
          >
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.printButton}
            onPress={async () => {
              try {
                await RNPrint.print({ html: htmlContent });
              } catch (error) {
                console.error('Print Error:', error);
                Alert.alert('Error', 'Failed to print credit note');
              }
            }}
          >
            <Text style={styles.printButtonText}>🖨️ Print</Text>
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CustomerSection
        customerData={customerData}
        setCustomerData={setCustomerData}
        onSelectCustomerId={setCustomerId}
      />

      <View style={styles.card}>
        <Text style={styles.header}>Credit Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount Paid by Customer *</Text>
          <TextInput
            style={styles.input}
            value={amountPaid}
            onChangeText={setAmountPaid}
            keyboardType="numeric"
            placeholder="Enter amount (e.g. 150)"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#4CAF50' }]}
            onPress={handleCreateCredit}
            activeOpacity={0.7}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Credit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#2196F3' }]}
            onPress={handleDownloadCredit}
            activeOpacity={0.7}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Download</Text>
            )}
          </TouchableOpacity>
        </View>

        {creditId && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Credit Created Successfully</Text>
            <Text style={styles.resultText}>Credit ID: {creditId}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FBFC',
  },
  card: {
    padding: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F9FBFC',
    fontSize: 15,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 8,
  },
  resultLabel: {
    color: '#2E7D32',
    fontWeight: '700',
    marginBottom: 4,
  },
  resultText: {
    color: '#1B5E20',
    fontWeight: '500',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  printButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default CreditForm;
