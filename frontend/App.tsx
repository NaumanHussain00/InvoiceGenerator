import { NavigationContainer } from '@react-navigation/native';
import MainNavigation from './src/navigation/MainNavigation';
import React, { useState } from 'react';
import AppLockScreen from './src/components/auth/AppLockScreen';

import { initDatabase } from './src/services/DatabaseService';

function App() {
  React.useEffect(() => {
    initDatabase();
  }, []);

  const [isUnlocked, setIsUnlocked] = useState(false);

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
