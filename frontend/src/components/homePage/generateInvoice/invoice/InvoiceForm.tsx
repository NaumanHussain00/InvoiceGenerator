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
} from 'react-native';
import axios from 'axios';
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

  const [products, setProducts] = useState<Product[]>([
    {
      id: '',
      name: '',
      price: '',
      quantity: '',
      discount: '',
      discountType: '%',
      total: 0,
    },
  ]);

  const [packingCharges, setPackingCharges] = useState<PackingItem[]>([
    { name: '', amount: '' },
  ]);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([
    { name: '', cost: '' },
  ]);
  const [taxes, setTaxes] = useState<Tax[]>([
    { name: '', value: '', type: '%' },
  ]);
  const [amountDiscount, setAmountDiscount] = useState<number>(0);
  const [percentDiscount, setPercentDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<string>('');

  // ---- Calculations ----
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
  );
  const transportTotal = transportOptions.reduce(
    (sum, t) => sum + Number(t.cost || 0),
    0,
  );
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

  const handleDownloadInvoice = async () => {
    if (!invoiceData.invoiceId) {
      Alert.alert('Error', 'Please save the invoice first.');
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE_URL}/invoices/invoice/generate/${invoiceData.invoiceId}`,
      );

      const html = res.data;
      if (!html || typeof html !== 'string') {
        Alert.alert('Error', 'Invalid HTML response.');
        return;
      }

      // ✅ just show the HTML in WebView
      setHtmlContent(html);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load invoice HTML.');
    }
  };

  // ---- Handle Save ----
  const handleSaveInvoice = async () => {
    if (!customerData.id) {
      Alert.alert('Error', 'No customer selected.');
      return;
    }

    const payload = {
      customerId: customerData.id,
      totalAmount: productsTotal,
      amountDiscount,
      percentDiscount,
      finalAmount: grandTotal,
      paidByCustomer: Number(amountPaid || 0),
      invoiceLineItems: products.map(p => ({
        productId: Number(p.id) || null,
        productQuantity: Number(p.quantity || 0),
        productAmountDiscount:
          p.discountType === '₹' ? Number(p.discount || 0) : 0,
        productPercentDiscount:
          p.discountType === '%' ? Number(p.discount || 0) : 0,
      })),
      taxLineItems: taxes.map(t => ({
        name: t.name,
        percent: t.type === '%' ? Number(t.value || 0) : 0,
        amount: t.type === '₹' ? Number(t.value || 0) : 0,
      })),
      packagingLineItems: packingCharges.map(p => ({
        name: p.name,
        amount: Number(p.amount || 0),
      })),
      transportationLineItems: transportOptions.map(t => ({
        name: t.name,
        amount: Number(t.cost || 0),
      })),
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/invoices`, payload);
      const invoiceIdFromBackend = res.data?.data?.id;

      if (invoiceIdFromBackend) {
        setInvoiceData(prev => ({
          ...prev,
          invoiceId: invoiceIdFromBackend, // store numeric invoice id
        }));
        Alert.alert('Success', `Invoice saved. ID: ${invoiceIdFromBackend}`);
        console.log('Saved Invoice ID:', invoiceIdFromBackend);
      } else {
        Alert.alert('Error', 'Invoice ID not found in response.');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save invoice.');
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
            <CustomerSection
              customerData={customerData}
              setCustomerData={setCustomerData}
              resetTrigger={false}
              onSelectCustomerId={handleSelectCustomerId}
            />
            <Divider />

            <ProductSection
              products={products}
              setProducts={setProducts}
              onLineItemsChange={() => {}}
            />
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
            />
            <Divider />

            <TransportSection
              transportOptions={transportOptions}
              setTransportOptions={setTransportOptions}
              previousTotal={afterTaxTotal + packingTotal}
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

            <View style={{ height: 50 }} />
          </ScrollView>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f7fa' },
  contentContainer: { padding: scale(20), paddingBottom: scale(50) },
  header: {
    backgroundColor: '#4A90E2',
    padding: scale(30),
    borderRadius: scale(15),
    marginBottom: scale(25),
    elevation: 5,
  },
  headerTitle: {
    fontSize: scale(28),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale(10),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: scale(14),
    color: '#E8F4FF',
    textAlign: 'center',
  },
  divider: {
    height: scale(2),
    backgroundColor: '#555',
    marginVertical: scale(15),
    borderRadius: scale(1),
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default InvoiceForm;
