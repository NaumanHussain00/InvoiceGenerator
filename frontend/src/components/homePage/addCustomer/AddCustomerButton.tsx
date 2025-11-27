import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../../theme/theme';

const AddCustomerButton: React.FC = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('AddCustomer' as never)}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>👤 Add Customer</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default AddCustomerButton;
