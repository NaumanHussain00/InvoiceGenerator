import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { generateInvoiceHtml, generatePrintHtml } from '../../services/OfflineService';
import RNPrint from 'react-native-print';
import { colors, spacing, typography } from '../../theme/theme';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  InvoiceViewer: { invoiceId: string };
};

type InvoiceViewerRouteProp = RouteProp<RootStackParamList, 'InvoiceViewer'>;
type InvoiceViewerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'InvoiceViewer'
>;

interface InvoiceViewerProps {
  route: InvoiceViewerRouteProp;
  navigation: InvoiceViewerNavigationProp;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ route, navigation }) => {
  const { invoiceId } = route.params;
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceHTML();
  }, [invoiceId]);

  const fetchInvoiceHTML = async () => {
    setLoading(true);

    try {
      console.log('[InvoiceViewer] Generating offline HTML for ID:', invoiceId);
      const result = await generateInvoiceHtml(Number(invoiceId));
      
      if (result.success && result.data) {
        setHtmlContent(result.data);
      } else {
        Alert.alert('Error', 'Failed to generate invoice. Please try again.', [
           {
             text: 'Go Back',
             onPress: () => navigation.goBack(),
           }
        ]);
      }
    } catch (err: any) {
      console.error('[InvoiceViewer] Error:', err);
      Alert.alert('Error', err.message || 'Failed to load invoice.', [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          }
      ]);
    }

    setLoading(false);
  };

  const handlePrint = async () => {
    if (!htmlContent) return;
    try {
      // Generate print-specific HTML (A4 landscape with A5 portrait pages)
      const printHtml = generatePrintHtml(htmlContent);
      await RNPrint.print({ html: printHtml });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print invoice.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice #{invoiceId}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading invoice...</Text>
        </View>
      </View>
    );
  }

  if (!htmlContent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice #{invoiceId}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load invoice</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchInvoiceHTML()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice #{invoiceId}</Text>
        <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
          <Text style={styles.printButtonText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  placeholder: {
    width: 60,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  webview: {
    flex: 1,
  },
  printButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  printButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default InvoiceViewer;
