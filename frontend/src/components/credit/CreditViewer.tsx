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
import axios from 'axios';
import { API_BASE_URL, API_FALLBACK_URLS } from '../../config/api';
import { colors, spacing, typography } from '../../theme/theme';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  CreditViewer: { creditId: string };
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

    const candidates = [API_BASE_URL, ...API_FALLBACK_URLS];
    let lastError: any = null;

    for (const baseUrl of candidates) {
      const url = `${baseUrl}/credits/credit/generate/${creditId}`;
      try {
        console.log('[CreditViewer] Trying URL:', url);
        const response = await axios.get(url, { timeout: 5000 });
        if (response && response.data && typeof response.data === 'string') {
          console.log('[CreditViewer] Success with:', url);
          setHtmlContent(response.data);
          lastError = null;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[CreditViewer] Failed for ${url}:`, err?.message || err);
      }
    }

    if (lastError) {
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
      console.error('[CreditViewer] All endpoints failed:', lastError);
    }

    setLoading(false);
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
        <View style={styles.placeholder} />
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
});

export default CreditViewer;
