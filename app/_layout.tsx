import { Ionicons } from '@expo/vector-icons';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DimensionsProvider } from '../context/DimensionsContext';
import { MarginProvider } from '../context/MarginContext';
import NetInfo from '@react-native-community/netinfo';
import { StrategyProvider } from '../context/StrategyContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SecurityProvider } from '../context/SecurityContext';
import { appUpdateInfo } from '../services/api';
import { isFirebaseInitialized } from '../services/notificationService';
import ErrorBoundary from '../components/ErrorBoundary';

// Prevent native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => { });

// Register background message handler
if (isFirebaseInitialized()) {
  try {
    setBackgroundMessageHandler(getMessaging(), async () => {
      // No-op: background data messages are handled by the OS notification tray.
    });
  } catch (error) {
    console.warn('Firebase background messaging failed to initialize:', error);
  }
}


function AppContent() {
  const { isDarkMode, theme, themeLoaded } = useTheme();
  const { appLoading, bootProgress } = useAuth();
  const [updateNeeded, setUpdateNeeded] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the native splash screen immediately when our custom JS component mounts
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: bootProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [bootProgress, progressAnim]);

  useEffect(() => {
    if (!appLoading && themeLoaded && isConnected !== false) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    } else if (isConnected === false && splashVisible === false) {
      // Re-show splash if internet disconnects? Optional, but let's just stick to the modal.
    }
  }, [appLoading, splashOpacity, themeLoaded, isConnected, splashVisible]);

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="calculator" options={{ headerShown: false }} />
        <Stack.Screen name="chartPage" options={{ headerShown: false }} />
      </Stack>
      <StyledStatusBar />

      {/* No Internet Connection Modal */}
      <Modal
        visible={isConnected === false && themeLoaded}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: theme.card, borderColor: theme.borderLight }]}>
            <View style={[modalStyles.iconCircle, { backgroundColor: theme.primaryBackground || 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="wifi-outline" size={32} color={theme.primary || '#3b82f6'} />
            </View>
            <Text style={[modalStyles.title, { color: theme.textPrimary }]}>
              No Internet Connection
            </Text>
            <Text style={[modalStyles.subtitle, { color: theme.textSecondary }]}>
              Please turn on your mobile data or connect to Wi-Fi to use 1Klik.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Unremovable App Update Modal */}
      <Modal
        visible={updateNeeded && themeLoaded}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }}
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
                const targetUrl = downloadUrl;
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

      {/* Custom Splash Screen with Progress Bar */}
      {splashVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: splashOpacity,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
            },
          ]}
        >
          <Image
            source={require('../assets/images/splash-icon.png')}
            contentFit="contain"
            style={{ width: 200, height: 200 }}
          />
          <View
            style={{
              width: 200,
              height: 4,
              backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
              borderRadius: 2,
              marginTop: 24,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                backgroundColor: theme.primary || '#3b82f6',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        </Animated.View>
      )}
    </NavigationThemeProvider>
  );
}

function StyledStatusBar() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ThemeProvider>
              <DimensionsProvider>
                <AlertProvider>
                  <SecurityProvider>
                    <MarginProvider>
                      <StrategyProvider>
                        <AppContent />
                      </StrategyProvider>
                    </MarginProvider>
                  </SecurityProvider>
                </AlertProvider>
              </DimensionsProvider>
            </ThemeProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
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

