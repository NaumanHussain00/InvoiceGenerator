import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import AddCustomerButton from './addCustomer/AddCustomerButton';
import GenerateInvoiceButton from './generateInvoice/GenerateInvoiceButton';
import AddProductButton from './addProduct/AddProductButton';
import GenerateCreditButton from './credit/GenerateCreditButton';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
} from '../../theme/theme';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invoice Manager</Text>
        <Text style={styles.headerSubtitle}>
          Manage your business operations
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <AddCustomerButton />
        <GenerateInvoiceButton />
        <AddProductButton />
        <GenerateCreditButton />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EditInvoice')}
        >
          <Text style={styles.buttonText}>📝 Edit Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EditProduct')}
        >
          <Text style={styles.buttonText}>📦 Edit Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.ledgerButton]}
          onPress={() => navigation.navigate('Ledger')}
        >
          <Text style={styles.buttonText}>📊 View Ledger</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    elevation: shadows.elevation.md,
    ...shadows.ios.md,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
    opacity: 0.9,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  button: {
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    marginVertical: spacing.sm,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  ledgerButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default HomeScreen;
