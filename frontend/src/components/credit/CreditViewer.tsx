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
import { generateCreditHtml, voidCredit } from '../../services/OfflineService';
import RNPrint from 'react-native-print';
import { colors, spacing, typography } from '../../theme/theme';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  CreditViewer: { creditId: string };
  CreditForm: { creditId: number; isEdit: boolean };
};

type CreditViewerRouteProp = RouteProp<RootStackParamList, 'CreditViewer'>;
type CreditViewerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreditViewer'
>;

interface CreditViewerProps {
  route: CreditViewerRouteProp;
  navigation: CreditViewerNavigationProp;
}

const CreditViewer: React.FC<CreditViewerProps> = ({ route, navigation }) => {
  const { creditId } = route.params;
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditHTML();
  }, [creditId]);

  const fetchCreditHTML = async () => {
    setLoading(true);

    try {
      console.log('[CreditViewer] Generating offline HTML for:', creditId);
      const response = await generateCreditHtml(Number(creditId));

      if (response && response.success && response.data) {
         setHtmlContent(response.data);
      } else {
         throw new Error(response?.message || 'Failed to generate HTML');
      }
    } catch (err: any) {
      console.error('[CreditViewer] Error:', err);
      Alert.alert('Error', 'Failed to load credit note. Please try again.', [
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Retry',
          onPress: () => fetchCreditHTML(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!htmlContent) return;
    try {
      await RNPrint.print({ html: htmlContent });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print credit note.');
    }
  };

  const handleEdit = () => {
      navigation.navigate('CreditForm', { creditId: Number(creditId), isEdit: true });
  };

  const handleVoid = () => {
    Alert.alert(
      'Void Credit Note',
      'Are you sure you want to void this credit note? This will reverse the transaction and update the customer balance. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void Credit',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await voidCredit(Number(creditId));
              if (result.success) {
                Alert.alert('Success', 'Credit note voided successfully.');
                fetchCreditHTML(); // Refresh to show VOID status
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to void credit note.');
              setLoading(false);
            }
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Credit #{creditId}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading credit note...</Text>
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
          <Text style={styles.headerTitle}>Credit #{creditId}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load credit note</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCreditHTML()}
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
        <Text style={styles.headerTitle}>Credit #{creditId}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            onPress={handleVoid} 
            style={[styles.printButton, { backgroundColor: '#ff4444', marginRight: 8 }]}
          >
            <Text style={styles.printButtonText}>Void</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleEdit} 
            style={[styles.printButton, { backgroundColor: '#4A90E2', marginRight: 8 }]}
          >
            <Text style={styles.printButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
            <Text style={styles.printButtonText}>🖨️ Print</Text>
          </TouchableOpacity>
        </View>
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

export default CreditViewer;
