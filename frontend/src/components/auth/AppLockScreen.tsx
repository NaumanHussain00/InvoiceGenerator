import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
} from '../../theme/theme';

const APP_PASSWORD_KEY = '@app_password';
const DEFAULT_APP_PASSWORD = '1234'; // Default password

interface AppLockScreenProps {
  onUnlock: () => void;
}

const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    checkPasswordExists();
  }, []);

  const checkPasswordExists = async () => {
    try {
      const savedPassword = await AsyncStorage.getItem(APP_PASSWORD_KEY);
      if (!savedPassword) {
        // Set default password on first launch
        await AsyncStorage.setItem(APP_PASSWORD_KEY, DEFAULT_APP_PASSWORD);
      }
    } catch (error) {
      console.error('Error checking password:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const savedPassword = await AsyncStorage.getItem(APP_PASSWORD_KEY);
      if (password === savedPassword) {
        onUnlock();
      } else {
        Alert.alert('Error', 'Incorrect password');
        setPassword('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify password');
    }
  };

  const handleSetNewPassword = async () => {
    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await AsyncStorage.setItem(APP_PASSWORD_KEY, password);
      Alert.alert('Success', 'Password changed successfully');
      setIsSettingPassword(false);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save password');
    }
  };

  const handleChangePasswordRequest = async () => {
    try {
      const savedPassword = await AsyncStorage.getItem(APP_PASSWORD_KEY);
      if (password === savedPassword) {
        setIsSettingPassword(true);
        setPassword('');
      } else {
        Alert.alert(
          'Authentication Required',
          'Please enter your current password in the field above to change it.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify password');
    }
  };

  if (isSettingPassword) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />
        <View style={styles.content}>
          <Text style={styles.title}>Set New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSetNewPassword}
          >
            <Text style={styles.buttonText}>Save Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setIsSettingPassword(false);
              setPassword('');
              setConfirmPassword('');
            }}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />
      <View style={styles.content}>
        <Text style={styles.title}>Invoice Manager</Text>
        <Text style={styles.subtitle}>Enter Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          autoFocus
        />



        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleChangePasswordRequest}
        >
          <Text style={styles.linkText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 400,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    elevation: shadows.elevation.lg,
    ...shadows.ios.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.base,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    marginBottom: spacing.md,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  linkButton: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  linkText: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
});

export default AppLockScreen;
