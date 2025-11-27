import React, { useState } from 'react';
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
import axios from 'axios';
import { API_BASE_URL, API_FALLBACK_URLS } from '../../../../config/api';

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

      const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
      let lastError: any = null;
      let success = false;

      for (const baseUrl of candidates) {
        try {
          const res = await fetch(`${baseUrl}/credits/customer/${customerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountPaidByCustomer: parseFloat(amountPaid),
            }),
          });

          const json = await res.json();

          if (res.status === 201 && json?.data) {
            setCreditId(json.data.id);
            Alert.alert(
              'Success',
              json.message || 'Credit created successfully',
            );
            success = true;
            break;
          } else {
            Alert.alert('Error', json.message || 'Failed to create credit');
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Failed to create credit on ${baseUrl}:`, err?.message);
        }
      }

      if (!success && lastError) {
        console.error('Failed to create credit', lastError);
        Alert.alert('Error', 'Something went wrong');
      }
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

      const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
      let lastError: any = null;

      for (const baseUrl of candidates) {
        try {
          const res = await axios.get(
            `${baseUrl}/credits/credit/generate/${creditId}`,
            { timeout: 5000 },
          );

          const html = res.data;
          if (!html || typeof html !== 'string') {
            Alert.alert('Error', 'Invalid HTML response.');
            return;
          }

          setHtmlContent(html);
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Failed to download from ${baseUrl}:`, err?.message);
        }
      }

      if (lastError) {
        console.error('Download error:', lastError);
        Alert.alert('Error', 'Failed to load credit HTML.');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (htmlContent) {
    return (
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
      />
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
});

export default CreditForm;
