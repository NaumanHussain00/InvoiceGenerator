import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, shadows, typography, commonStyles } from '../../theme/theme';

interface PasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  onResetConfirm: (code: string) => void;
  title?: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  visible,
  onClose,
  onResetConfirm,
  title = 'Reset Password',
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the recovery code');
      return;
    }
    onResetConfirm(code);
    setCode(''); // Reset field after submission
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={handleClose} // Close on background tap
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>
            Enter Master Recovery Code to reset password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Recovery Code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            secureTextEntry
            value={code}
            onChangeText={setCode}
            autoFocus={visible} // Autofocus when modal opens
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={handleSubmit}
            >
              <Text style={styles.confirmButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    elevation: shadows.elevation.lg,
    ...shadows.ios.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.lg,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },
  confirmButtonText: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },
});

export default PasswordResetModal;
