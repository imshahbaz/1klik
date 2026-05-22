import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Linking, DeviceEventEmitter, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { appUpdateInfo } from '../services/api';

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
  const { isDarkMode, theme, themeLoaded } = useTheme();
  const [updateNeeded, setUpdateNeeded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    if (appUpdateInfo.updateNeeded) {
      setUpdateNeeded(true);
      setDownloadUrl(appUpdateInfo.downloadUrl);
    }

    const subscription = DeviceEventEmitter.addListener('app-update-required', (info) => {
      setUpdateNeeded(info.updateNeeded);
      setDownloadUrl(info.downloadUrl);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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

      {/* Unremovable App Update Modal */}
      <Modal
        visible={updateNeeded && themeLoaded}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: theme.card, borderColor: theme.borderLight }]}>
            <View style={[modalStyles.iconCircle, { backgroundColor: theme.primaryBackground }]}>
              <Ionicons name="cloud-download-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[modalStyles.title, { color: theme.textPrimary }]}>
              Update Required
            </Text>
            <Text style={[modalStyles.subtitle, { color: theme.textSecondary }]}>
              A newer version of 1Klik is available. Please update to the latest version to continue using the application.
            </Text>
            <TouchableOpacity
              style={[modalStyles.button, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
              onPress={async () => {
                const targetUrl = downloadUrl || 'https://shahbaz-trades.onrender.com';
                try {
                  await Linking.openURL(targetUrl);
                } catch (err) {
                  console.error("Failed to open update URL:", err);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color="#ffffff" />
              <Text style={modalStyles.buttonText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});


