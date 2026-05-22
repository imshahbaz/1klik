import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider } from '../context/AuthContext';
import { DimensionsProvider } from '../context/DimensionsContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { isFirebaseInitialized } from '../services/notificationService';

// Register background message handler
if (isFirebaseInitialized()) {
  try {
    setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    });
  } catch (error) {
    console.warn('Firebase background messaging failed to initialize:', error);
  }
}


function AppContent() {
  const { isDarkMode, theme } = useTheme();

  const navTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.card,
      text: theme.textPrimary,
      border: theme.border,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="screener" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="zerodha" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="calculator" options={{ headerShown: false }} />
      </Stack>
      <StyledStatusBar />
    </NavigationThemeProvider>
  );
}

function StyledStatusBar() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <DimensionsProvider>
            <AlertProvider>
              <AppContent />
            </AlertProvider>
          </DimensionsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


