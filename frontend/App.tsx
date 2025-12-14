import { NavigationContainer } from '@react-navigation/native';
import MainNavigation from './src/navigation/MainNavigation';
import React, { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AppLockScreen from './src/components/auth/AppLockScreen';
import { getDatabase } from './src/services/database/db';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on app start
  useEffect(() => {
    try {
      console.log('[App] Initializing database, Platform:', Platform.OS);
      getDatabase();
      console.log('[App] Database initialized successfully');
      setDbInitialized(true);
    } catch (error: any) {
      console.error('[App] Failed to initialize database:', error);
      const errorMessage = error?.message || 'Unknown database error';
      
      if (Platform.OS === 'web') {
        Alert.alert(
          'Database Not Available',
          'SQLite is not available on web. Please use Android or iOS:\n\n' +
          '• Press "a" for Android emulator\n' +
          '• Press "i" for iOS simulator\n' +
          '• Or scan QR code with Expo Go app',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Database Error',
          `Failed to initialize database: ${errorMessage}`,
          [{ text: 'OK' }]
        );
      }
    }
  }, []);

  if (!isUnlocked) {
    return <AppLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <NavigationContainer>
      <MainNavigation />
    </NavigationContainer>
  );
}

export default App;
