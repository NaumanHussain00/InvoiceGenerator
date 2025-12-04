import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import apiClient from '../../../../config/apiClient';
import { API_BASE_URL } from '../../../../config/api';
import CustomerSection from './customerSection/CustomerSection';
import ProductSection from './productSection/ProductSection';
import { WebView } from 'react-native-webview';

import TaxSection from './taxSection/TaxSection';
import DiscountSection from './discountSection/DiscountSection';
import PackingSection from './packingSection/PackingSection';
import TransportSection from './transportSection/TransportSection';
import TotalSection from './totalSection/TotalSection';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
export type CustomerData = {
  id?: number | undefined;
  name: string;
  phone: string;
  firm: string;
  balance: string;
};
export type Product = {
  id: string;
  name: string;
  price: string;
  quantity: string;
  discount: string;
  discountType: '%' | '₹';
  total: number;
};
export type Tax = { name: string; value: string; type: '%' | '₹' };
export type PackingItem = { name: string; amount: string };
export type TransportOption = { name: string; cost: string };

const Divider = () => <View style={styles.divider} />;

const InvoiceForm: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<{
    date: string;
    invoiceId: number | string;
  }>({
    date: new Date().toISOString().split('T')[0],
    invoiceId: `INV-${Date.now()}`,
  });

  const [customerData, setCustomerData] = useState<CustomerData>({
    id: undefined,
    name: '',
    phone: '',
    firm: '',
    balance: '',
  });

  const [products, setProducts] = useState<Product[]>([]);

  const [packingCharges, setPackingCharges] = useState<PackingItem[]>([]);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [amountDiscount, setAmountDiscount] = useState<number>(0);
  const [percentDiscount, setPercentDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [numberOfCartons, setNumberOfCartons] = useState<string>('');

  // ---- Calculations ----
  const cartonCount = Number(numberOfCartons) || 0;
  const multiplier = cartonCount > 0 ? cartonCount : 1;

  const productsTotal = products.reduce((sum, p) => sum + (p.total || 0), 0);
  const discountValue =
    percentDiscount > 0
      ? (productsTotal * percentDiscount) / 100
      : amountDiscount;
  const afterDiscountTotal = productsTotal - discountValue;
  const taxAmount = taxes.reduce((sum, tax) => {
    const val = Number(tax.value) || 0;
    return sum + (tax.type === '%' ? (afterDiscountTotal * val) / 100 : val);
  }, 0);
  const afterTaxTotal = afterDiscountTotal + taxAmount;
  const packingTotal = packingCharges.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  ) * multiplier;
  const transportTotal = transportOptions.reduce(
    (sum, t) => sum + Number(t.cost || 0),
    0,
  ) * multiplier;
  const grandTotal = afterTaxTotal + packingTotal + transportTotal;
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const handleDiscountChange = (data: {
    amountDiscount: number;
    percentDiscount: number;
  }) => {
    setAmountDiscount(data.amountDiscount);
    setPercentDiscount(data.percentDiscount);
  };

  const handlePaidChange = (paidByCustomer: string) => {
    setAmountPaid(paidByCustomer);
  };

  // ✅ store customer id when selected
  const handleSelectCustomerId = (id: string | number) => {
    const parsedId =
      typeof id === 'number'
        ? id
        : id === '' || id === null || id === undefined
        ? NaN
        : Number(id);
    setCustomerData(prev => ({
      ...prev,
      id: !isNaN(parsedId) ? parsedId : undefined,
    }));
    console.log('Customer selected:', id);
  };

  // Test backend connectivity
  const handleTestConnection = async () => {
    try {
      console.log('Testing connection to:', API_BASE_URL);
      
      // Use the enhanced testConnection function
      const { testConnection } = await import('../../../../config/apiClient');
      const result = await testConnection();
      
      if (result.success) {
        Alert.alert(
          '✅ Connection Successful',
          `Backend is reachable!\n\nWorking URL: ${result.url}\n\nYou can now save invoices.`,
        );
      } else {
        Alert.alert(
          '❌ Connection Failed',
          `Cannot reach backend server.\n\n${result.error}\n\nTroubleshooting:\n1. Ensure backend is running: npm run dev\n2. For Android emulator, try: adb reverse tcp:3000 tcp:3000\n3. Check Windows Firewall allows port 3000\n4. Verify backend is listening on 0.0.0.0:3000`,
        );
      }
    } catch (err: any) {
      console.error('Connection test failed:', err);
      Alert.alert(
        '❌ Test Error',
        `Failed to test connection:\n${err.message}`,
      );
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceData.invoiceId) {
      Alert.alert('Error', 'Please save the invoice first.');
      return;
    }

    try {
      console.log(
        'Fetching invoice HTML from:',
        `${API_BASE_URL}/invoices/invoice/generate/${invoiceData.invoiceId}`,
      );
      const res = await apiClient.get(
        `/invoices/invoice/generate/${invoiceData.invoiceId}`,
      );

      const html = res.data;
      if (!html || typeof html !== 'string') {
        Alert.alert('Error', 'Invalid HTML response.');
        return;
      }

      // ✅ just show the HTML in WebView
      setHtmlContent(html);
    } catch (err: any) {
      console.error('Download Invoice Error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load invoice HTML';
      Alert.alert(
        'Error',
        `${errorMsg}\n\nMake sure backend is running at ${API_BASE_URL}`,
      );
    }
  };

  // ---- Handle Save ----
  const handleSaveInvoice = async () => {
    if (!customerData.id) {
      Alert.alert('Error', 'No customer selected.');
      return;
    }

    // Filter out empty products (those without a valid productId or name)
    const validProducts = products.filter(p => p.id && p.name.trim() !== '');
    
    if (validProducts.length === 0) {
      Alert.alert('Error', 'Please add at least one product to the invoice.');
      return;
    }

    // Filter out empty taxes, packaging, and transport items
    const validTaxes = taxes.filter(t => t.name.trim() !== '');
    const validPackaging = packingCharges.filter(p => p.name.trim() !== '');
    const validTransport = transportOptions.filter(t => t.name.trim() !== '');

    const payload = {
      customerId: customerData.id,
      totalAmount: productsTotal,
      amountDiscount,
      percentDiscount,
      finalAmount: grandTotal,
      paidByCustomer: Number(amountPaid || 0),
      invoiceLineItems: validProducts.map(p => ({
        productId: Number(p.id),
        productQuantity: Number(p.quantity || 0),
        productAmountDiscount:
          p.discountType === '₹' ? Number(p.discount || 0) : 0,
        productPercentDiscount:
          p.discountType === '%' ? Number(p.discount || 0) : 0,
      })),
      taxLineItems: validTaxes.map(t => ({
        name: t.name,
        percent: t.type === '%' ? Number(t.value || 0) : 0,
        amount: t.type === '₹' ? Number(t.value || 0) : 0,
      })),
      packagingLineItems: validPackaging.map(p => ({
        name: p.name,
        amount: Number(p.amount || 0),
      })),
      transportationLineItems: validTransport.map(t => ({
        name: t.name,
        amount: Number(t.cost || 0),
      })),
      numberOfCartons: cartonCount > 0 ? cartonCount : undefined,
    };

    try {
      console.log('Saving invoice to:', `${API_BASE_URL}/invoices`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Try with fallback support
      const { apiRequestWithFallback } = await import('../../../../config/apiClient');
      const data = await apiRequestWithFallback({
        method: 'POST',
        url: '/invoices',
        data: payload,
      });

      const invoiceIdFromBackend = data?.data?.id;

      if (invoiceIdFromBackend) {
        setInvoiceData(prev => ({
          ...prev,
          invoiceId: invoiceIdFromBackend, // store numeric invoice id
        }));
        Alert.alert('Success', `Invoice saved successfully!\n\nInvoice ID: ${invoiceIdFromBackend}`);
        console.log('Saved Invoice ID:', invoiceIdFromBackend);
      } else {
        Alert.alert('Error', 'Invoice ID not found in response.');
      }
    } catch (err: any) {
      console.error('Save Invoice Error:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to save invoice';
      
      // Provide more helpful error messages
      let troubleshootingTips = '';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        troubleshootingTips = '\n\nThe request timed out. Backend may be slow or unreachable.';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        troubleshootingTips = '\n\nNetwork error - cannot reach backend.\n\nQuick fix for Android emulator:\n1. Open a terminal\n2. Run: adb reverse tcp:3000 tcp:3000\n3. Try saving again';
      }
      
      Alert.alert(
        'Save Failed',
        `${errorMsg}${troubleshootingTips}\n\nBackend URL: ${API_BASE_URL}\n\nTip: Use "Test Backend Connection" button to diagnose the issue.`,
      );
    }
  };

  return (
    <>
      {htmlContent ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
        />
      ) : (
        <>
          <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
          <ScrollView
            style={styles.wrapper}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={{ zIndex: 2000 }}>
              <CustomerSection
                customerData={customerData}
                setCustomerData={setCustomerData}
                resetTrigger={false}
                onSelectCustomerId={handleSelectCustomerId}
              />
            </View>
            <Divider />

            <View style={{ zIndex: 1000 }}>
              <ProductSection
                products={products}
                setProducts={setProducts}
                onLineItemsChange={() => {}}
              />
            </View>
            <Divider />

            <View>
              <Text style={styles.sectionHeader}>Carton Details</Text>
              <View style={styles.cardContainer}>
                <View style={styles.card}>
                  <View style={styles.inputBox}>
                    <Text style={styles.label}>No. of Cartons</Text>
                    <Text style={styles.subLabel}>
                      (Optional - Multiplies Packing & Transport)
                    </Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Enter number of cartons"
                      placeholderTextColor="#94a3b8"
                      value={numberOfCartons}
                      onChangeText={setNumberOfCartons}
                    />
                  </View>
                </View>
              </View>
            </View>
            <Divider />

            <DiscountSection
              previousTotal={productsTotal}
              onDiscountChange={handleDiscountChange}
            />
            <Divider />

            <TaxSection
              taxLineItems={taxes}
              setTaxLineItems={setTaxes}
              productsTotal={afterDiscountTotal}
              grandTotal={afterTaxTotal}
              onTaxChange={({ taxLineItems, totalTax }) =>
                console.log(
                  'Updated Tax:',
                  taxLineItems,
                  'Total Tax:',
                  totalTax,
                )
              }
            />
            <Divider />

            <PackingSection
              packingCharges={packingCharges}
              setPackingCharges={setPackingCharges}
              previousTotal={afterTaxTotal}
              numberOfCartons={numberOfCartons}
            />
            <Divider />

            <TransportSection
              transportOptions={transportOptions}
              setTransportOptions={setTransportOptions}
              previousTotal={afterTaxTotal + packingTotal}
              numberOfCartons={numberOfCartons}
              onTransportChange={({ transportationLineItems, totalAmt }) =>
                console.log(
                  'Transport Data:',
                  transportationLineItems,
                  'Total:',
                  totalAmt,
                )
              }
            />
            <Divider />

            <TotalSection
              products={products}
              taxes={taxes}
              discounts={[
                {
                  value: String(
                    percentDiscount > 0 ? percentDiscount : amountDiscount,
                  ),
                  type: percentDiscount > 0 ? '%' : '₹',
                },
              ]}
              packingCharges={packingCharges}
              transportOptions={transportOptions}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
              onPaidChange={handlePaidChange}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#4CAF50' }]}
                onPress={handleSaveInvoice}
              >
                <Text style={styles.buttonText}>💾 Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#2196F3' }]}
                onPress={handleDownloadInvoice}
              >
                <Text style={styles.buttonText}>⬇️ Download</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.testButton]}
              onPress={handleTestConnection}
            >
              <Text style={styles.testButtonText}>
                🔌 Test Backend Connection
              </Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </ScrollView>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f7fa' },
  contentContainer: { padding: scale(12), paddingBottom: scale(40) },
  header: {
    backgroundColor: '#4A90E2',
    padding: scale(20),
    borderRadius: scale(12),
    marginBottom: scale(16),
    elevation: 5,
  },
  headerTitle: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: scale(13),
    color: '#E8F4FF',
    textAlign: 'center',
  },
  divider: {
    height: scale(1),
    backgroundColor: '#cbd5e1',
    marginVertical: scale(8),
    borderRadius: scale(1),
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  testButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  cartonContainer: {
    paddingHorizontal: scale(8),
    marginBottom: scale(8),
  },
  label: {
    fontSize: scale(13),
    fontWeight: '500',
    color: '#334155',
    marginBottom: scale(4),
  },
  subLabel: {
    fontSize: scale(11),
    color: '#64748b',
    marginBottom: scale(6),
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
  },
  sectionHeader: {
    fontSize: scale(18),
    fontWeight: '700',
    marginLeft: scale(12),
    marginBottom: scale(8),
    color: '#1e293b',
  },
  cardContainer: { paddingHorizontal: scale(8), marginBottom: scale(8) },
  card: {
    backgroundColor: '#ffffff',
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  inputBox: { marginBottom: scale(8) },
});

export default InvoiceForm;
