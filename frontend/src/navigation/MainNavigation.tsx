import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../components/homePage/HomePage';
import AddCustomerPage from '../components/homePage/addCustomer/addCustomerPage/AddCustomerPage';
import InvoiceForm from '../components/homePage/generateInvoice/invoice/InvoiceForm';
import AddProductPage from '../components/homePage/addProduct/addProductPage/AddProductPage';
import CreditForm from '../components/homePage/credit/creditform/CreditForm';
import LedgerPage from '../components/ledger/LedgerPage';
import EditInvoicePage from '../components/invoice/EditInvoicePage';
import EditProductPage from '../components/product/EditProductPage';
import EditCustomerPage from '../components/homePage/addCustomer/editCustomerPage/EditCustomerPage';
import InvoiceViewer from '../components/invoice/InvoiceViewer';
import CreditViewer from '../components/credit/CreditViewer';

const Stack = createNativeStackNavigator();
export type RootStackParamList = {
  Home: undefined;
  AddCustomer: undefined;
  InvoiceForm: undefined;
  CreditForm: undefined;
  AddProduct: undefined;
  Ledger: undefined;
  EditInvoice: undefined;
  EditProduct: undefined;
  EditCustomer: undefined;
  InvoiceViewer: { invoiceId: string };
  CreditViewer: { creditId: string };
};

const MainNavigation = () => {
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    firm: '',
    balance: '',
    address: '',
  });

  const [productData, setProductData] = useState({
    name: '',
    price: '',
  });

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddCustomer" options={{ title: 'Add Customer' }}>
        {props => (
          <AddCustomerPage
            {...props}
            customerData={customerData}
            setCustomerData={setCustomerData}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="InvoiceForm"
        component={InvoiceForm}
        options={{ title: 'Generate Invoice' }}
      />

      <Stack.Screen
        name="CreditForm"
        component={CreditForm}
        options={{ title: 'Generate Credit' }}
      />

      <Stack.Screen name="AddProduct" options={{ title: 'Add Product' }}>
        {props => (
          <AddProductPage
            {...props}
            productData={productData}
            setProductData={setProductData}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Ledger"
        component={LedgerPage}
        options={{ title: 'Customer Ledger' }}
      />
      <Stack.Screen
        name="EditInvoice"
        component={EditInvoicePage}
        options={{ title: 'Edit Invoice' }}
      />
      <Stack.Screen
        name="EditCustomer"
        component={EditCustomerPage}
        options={{ title: 'Edit Customer' }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductPage}
        options={{ title: 'Edit Product' }}
      />
      <Stack.Screen
        name="InvoiceViewer"
        component={InvoiceViewer}
        options={{ title: 'Invoice' }}
      />
      <Stack.Screen
        name="CreditViewer"
        component={CreditViewer}
        options={{ title: 'Credit Note' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigation;
